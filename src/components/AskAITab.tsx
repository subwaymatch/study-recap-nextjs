"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskAITabProps {
  contextText: string;
}

const STORAGE_KEY = "study-recap:ask-ai:history";

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is ChatMessage =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content }));
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore quota errors.
  }
}

export function AskAITab({ contextText }: AskAITabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Hydrate chat history from localStorage on mount.
  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
  }, []);

  // Persist history whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    saveHistory(messages);
  }, [messages, hydrated]);

  // Auto-scroll messages area to the bottom on new content.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isExpanded]);

  // Cancel any in-flight request on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const baseMessages: ChatMessage[] = [...messages, userMsg];

    // Add the user message + an empty assistant placeholder that we stream into.
    setMessages([...baseMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: baseMessages,
          context: contextText,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = prev.slice();
          next[next.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return next;
        });
      }
      // Flush any remaining decoder bytes.
      accumulated += decoder.decode();
      setMessages((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { role: "assistant", content: accumulated };
        return next;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User aborted (e.g. cleared history); silently drop the placeholder.
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && last.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        // Remove the empty assistant placeholder on failure.
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && last.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, contextText]);

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore.
      }
    }
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent global study shortcuts (arrows, space, escape) from firing
    // while typing in the textarea.
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <aside
      className={`ask-ai-tab ${isExpanded ? "expanded" : "collapsed"}`}
      aria-label="Ask AI panel"
    >
      <button
        type="button"
        className="ask-ai-toggle"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse Ask AI panel" : "Expand Ask AI panel"}
        title={isExpanded ? "Collapse Ask AI" : "Expand Ask AI"}
      >
        <span className="ask-ai-toggle-chevron" aria-hidden="true">
          {isExpanded ? "›" : "‹"}
        </span>
        {!isExpanded && (
          <span className="ask-ai-toggle-label">Ask AI</span>
        )}
      </button>

      {isExpanded && (
        <div className="ask-ai-panel">
          <div className="ask-ai-header">
            <div className="ask-ai-title">
              <strong>Ask AI</strong>
              <span className="ask-ai-subtitle">about this card</span>
            </div>
            <button
              type="button"
              className="ask-ai-clear-btn"
              onClick={clearHistory}
              disabled={messages.length === 0 && !isStreaming}
              title="Clear chat history"
            >
              Clear
            </button>
          </div>

          <div className="ask-ai-messages" ref={messagesRef}>
            {messages.length === 0 && !isStreaming && (
              <div className="ask-ai-empty">
                Ask anything about the current flashcard or question. The card
                contents are sent along as context.
              </div>
            )}
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const showThinking =
                isStreaming &&
                isLast &&
                m.role === "assistant" &&
                m.content === "";
              return (
                <div
                  key={i}
                  className={`ask-ai-message ask-ai-message-${m.role}`}
                >
                  <div className="ask-ai-message-role">
                    {m.role === "user" ? "You" : "AI"}
                  </div>
                  <div className="ask-ai-message-content">
                    {showThinking ? (
                      <span className="ask-ai-thinking">Thinking…</span>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              );
            })}
            {error && (
              <div className="ask-ai-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="ask-ai-input-area">
            <textarea
              className="ask-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask about this card… (Enter to send)"
              rows={2}
              disabled={isStreaming}
            />
            <button
              type="button"
              className="ask-ai-send-btn"
              onClick={() => void sendMessage()}
              disabled={isStreaming || !input.trim()}
            >
              {isStreaming ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
