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

// Marker that separates the streamed answer text from the trailing JSON
// payload of follow-up suggestions. Uses the ASCII Unit Separator control
// character so it cannot collide with normal markdown content.
export const FOLLOWUPS_DELIMITER = "\u001F";

const FOLLOWUPS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

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
    "outside the card's scope. When including mathematical expressions, " +
    "formulas, or equations, format them with LaTeX: wrap inline math in " +
    "single dollar signs (e.g. $x^2 + 1$) and display math in double dollar " +
    "signs (e.g. $$\\int_0^1 x\\,dx = \\tfrac{1}{2}$$). The UI renders these " +
    "with KaTeX.\n\n--- STUDY CARD CONTEXT ---\n" +
    (context || "(no context provided)") +
    "\n--- END CONTEXT ---";

  const conversationMessages: ChatMessage[] = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: String(m.content ?? "") }));

  const upstreamMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationMessages,
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
      let answerText = "";
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
                  answerText += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Ignore malformed SSE chunks.
              }
            }
          }
        }

        if (answerText.trim()) {
          // Signal the client that the answer is complete and follow-up
          // generation is starting, so it can show a loader during the gap
          // between the answer ending and the suggestions arriving.
          controller.enqueue(encoder.encode(FOLLOWUPS_DELIMITER));
          const followups = await fetchFollowups({
            baseUrl,
            model,
            apiKey,
            context,
            conversation: [
              ...conversationMessages,
              { role: "assistant", content: answerText },
            ],
          });
          if (followups.length > 0) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ questions: followups })),
            );
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

async function fetchFollowups(params: {
  baseUrl: string;
  model: string;
  apiKey: string;
  context: string;
  conversation: ChatMessage[];
}): Promise<string[]> {
  const { baseUrl, model, apiKey, context, conversation } = params;
  const systemPrompt =
    "You generate short follow-up questions a student might ask next while " +
    "studying a flashcard or multiple-choice question. Return exactly three " +
    "distinct, concise follow-up questions phrased from the student's " +
    "perspective. Each question must be under 70 characters, written in " +
    "plain language, and grounded in the study card context and recent " +
    "conversation. Avoid repeating questions the student has already asked." +
    "\n\n--- STUDY CARD CONTEXT ---\n" +
    (context || "(no context provided)") +
    "\n--- END CONTEXT ---";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversation,
          {
            role: "user",
            content:
              "Suggest exactly three short follow-up questions I could ask " +
              "next to deepen my understanding.",
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "follow_up_suggestions",
            strict: true,
            schema: FOLLOWUPS_SCHEMA,
          },
        },
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return [];
    const parsed: unknown = JSON.parse(content);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { questions?: unknown }).questions)
    ) {
      return [];
    }
    const rawQuestions = (parsed as { questions: unknown[] }).questions;
    return rawQuestions
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 3);
  } catch {
    return [];
  }
}
