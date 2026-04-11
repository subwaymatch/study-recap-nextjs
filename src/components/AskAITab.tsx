"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskAITabProps {
  contextText: string;
  cardId: string;
  cardType: "flashcard" | "mcq";
}

const SUGGESTIONS: Record<"flashcard" | "mcq", string[]> = {
  flashcard: ["Explain in more detail", "Give me an example"],
  mcq: ["Explain in more detail", "Give me an example"],
};

const STORAGE_PREFIX = "study-recap:ask-ai:history";

function loadHistory(cardId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${cardId}`);
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

function saveHistory(cardId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}:${cardId}`,
      JSON.stringify(messages),
    );
  } catch {
    // Ignore quota errors.
  }
}

export function AskAITab({ contextText, cardId, cardType }: AskAITabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  // Tracks whether the current messages state came from a load (not a user action).
  // Prevents saving the just-loaded history back to localStorage on the first render.
  const isLoadingRef = useRef(false);

  // Load history for the current card; abort any in-flight request on card change.
  useEffect(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setError(null);
    isLoadingRef.current = true;
    setMessages(loadHistory(cardId));
  }, [cardId]);

  // Persist history whenever messages change, skipping the post-load update.
  useEffect(() => {
    if (isLoadingRef.current) {
      isLoadingRef.current = false;
      return;
    }
    saveHistory(cardId, messages);
  }, [messages, cardId]);

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

  const sendMessage = useCallback(async (overrideText?: string) => {
    const source = overrideText ?? input;
    const trimmed = source.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const baseMessages: ChatMessage[] = [...messages, userMsg];

    // Add the user message + an empty assistant placeholder that we stream into.
    setMessages([...baseMessages, { role: "assistant", content: "" }]);
    if (overrideText === undefined) {
      setInput("");
    }
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
        // User aborted (e.g. cleared history or changed card); silently drop the placeholder.
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
        window.localStorage.removeItem(`${STORAGE_PREFIX}:${cardId}`);
      } catch {
        // Ignore.
      }
    }
  }, [cardId]);

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
            {!isStreaming && (
              <div
                className="ask-ai-suggestions"
                role="group"
                aria-label="Suggested prompts"
              >
                {SUGGESTIONS[cardType].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="ask-ai-suggestion-btn"
                    onClick={() => void sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const showThinking =
                isStreaming &&
                isLast &&
                m.role === "assistant" &&
                m.content === "";
              const isBeingStreamed =
                isStreaming && isLast && m.role === "assistant";
              const showDisclaimer =
                m.role === "assistant" && m.content && !isBeingStreamed;
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
                      <span
                        className="ask-ai-thinking-dots"
                        aria-label="Waiting for response"
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : m.role === "assistant" ? (
                      <div className="ask-ai-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                  {showDisclaimer && (
                    <p className="ask-ai-disclaimer">
                      AI responses may be inaccurate. Verify important
                      information.
                    </p>
                  )}
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
