import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  context: string;
}

// Allow 20 requests per minute per IP.
const RATE_LIMIT = { maxRequests: 20, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(ip, RATE_LIMIT);
  if (!allowed) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { messages, context } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages must be a non-empty array", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      "Server is missing OPENAI_API_KEY environment variable.",
      { status: 500 },
    );
  }

  const baseUrl = (
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const systemPrompt =
    "You are a concise, helpful study assistant. The user is studying the " +
    "following card. Use it as the primary context when answering their " +
    "questions. If a question is unrelated, answer briefly but note it is " +
    "outside the card's scope.\n\n--- STUDY CARD CONTEXT ---\n" +
    (context || "(no context provided)") +
    "\n--- END CONTEXT ---";

  const upstreamMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content ?? "") })),
  ];

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: upstreamMessages,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown fetch error";
    return new Response(`Failed to reach model endpoint: ${msg}`, {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(
      `Upstream error (${upstream.status}): ${text || upstream.statusText}`,
      { status: upstream.status || 502 },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by blank lines; handle both \n\n and \r\n\r\n.
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            for (const rawLine of part.split(/\r?\n/)) {
              const line = rawLine.trim();
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta: string | undefined =
                  parsed?.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Ignore malformed SSE chunks.
              }
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream error";
        controller.enqueue(encoder.encode(`\n[stream error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
