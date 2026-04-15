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
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const SUGGESTIONS: Record<"flashcard" | "mcq", string[]> = {
  flashcard: [
    "Explain like I'm five.",
    "Explain in more detail.",
    "Give me an example.",
  ],
  mcq: [
    "Explain like I'm five.",
    "Explain in more detail.",
    "Give me an example.",
  ],
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

// Pixels of movement needed before a touch gesture locks to horizontal or vertical.
const SWIPE_DIRECTION_LOCK = 10;
// Horizontal distance at which a swipe commits to opening or closing the panel.
const SWIPE_THRESHOLD = 60;
const MOBILE_PANEL_MEDIA_QUERY =
  "(max-width: 900px), (hover: none) and (pointer: coarse)";

export function AskAITab({
  contextText,
  cardId,
  cardType,
  isExpanded,
  onExpandedChange,
}: AskAITabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Offset applied during an in-progress swipe-to-close for visual drag feedback.
  const [dragDx, setDragDx] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  // Tracks whether the current messages state came from a load (not a user action).
  // Prevents saving the just-loaded history back to localStorage on the first render.
  const isLoadingRef = useRef(false);
  // Active touch-gesture state; null when no gesture is in progress.
  const touchRef = useRef<{
    startX: number;
    startY: number;
    lock: "h" | "v" | null;
  } | null>(null);
  // Set when a swipe commits an open/close, so the trailing simulated click on
  // the toggle button is ignored.
  const swipeHandledRef = useRef(false);

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

  // Track whether we're on a mobile viewport so swipe gestures only apply there.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_PANEL_MEDIA_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // When the panel is expanded, intercept Escape in the capture phase so it
  // closes the panel instead of triggering the study page's "go home" handler.
  useEffect(() => {
    if (!isExpanded) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        onExpandedChange(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isExpanded, onExpandedChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      // Only track swipe-to-close while the panel is expanded. When
      // collapsed, the aside is off-screen and we don't want to compete
      // with the study page's swipe-to-navigate gesture on the card.
      if (!isMobile || !isExpanded) return;
      // Don't start a swipe when the user is interacting with the textarea —
      // text selection and caret moves should take precedence.
      const target = e.target as HTMLElement | null;
      if (target?.closest("textarea, input")) return;
      const t = e.touches[0];
      if (!t) return;
      touchRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        lock: null,
      };
      // Clear any stale swipe-handled flag from a prior gesture.
      swipeHandledRef.current = false;
    },
    [isMobile, isExpanded],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const state = touchRef.current;
      if (!state) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;
      if (state.lock === null) {
        if (
          Math.abs(dx) >= SWIPE_DIRECTION_LOCK ||
          Math.abs(dy) >= SWIPE_DIRECTION_LOCK
        ) {
          state.lock = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
      }
      if (state.lock !== "h") return;
      // Visual follow: rightward drag closes the expanded panel.
      setDragDx(Math.max(0, dx));
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const state = touchRef.current;
      touchRef.current = null;
      setDragDx(0);
      if (!state || state.lock !== "h") return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - state.startX;
      if (isExpanded && dx > SWIPE_THRESHOLD) {
        swipeHandledRef.current = true;
        onExpandedChange(false);
      }
    },
    [isExpanded, onExpandedChange],
  );

  const handleTouchCancel = useCallback(() => {
    touchRef.current = null;
    setDragDx(0);
  }, []);

  const handleToggleClick = useCallback(() => {
    // Suppress the click that the browser synthesizes after a committed swipe.
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false;
      return;
    }
    onExpandedChange(!isExpanded);
  }, [isExpanded, onExpandedChange]);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
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
    },
    [input, isStreaming, messages, contextText],
  );

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

  const isDraggingClose = isMobile && isExpanded && dragDx > 0;
  const asideStyle: React.CSSProperties | undefined = isDraggingClose
    ? { transform: `translateX(${dragDx}px)`, transition: "none" }
    : undefined;

  return (
    <aside
      className={`ask-ai-tab ${isExpanded ? "expanded" : "collapsed"}`}
      aria-label="Ask AI panel"
      // On mobile, the collapsed aside slides off-screen. Mark it inert so its
      // (visually hidden) toggle button isn't reachable by keyboard or AT.
      // On desktop the toggle stays focusable so users can expand via keyboard.
      inert={isMobile && !isExpanded}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={asideStyle}
    >
      <button
        type="button"
        className="ask-ai-toggle"
        onClick={handleToggleClick}
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? "Collapse Ask AI panel" : "Expand Ask AI panel"
        }
        title={isExpanded ? "Collapse Ask AI" : "Expand Ask AI"}
      >
        <span className="ask-ai-toggle-chevron" aria-hidden="true">
          {isExpanded ? "›" : "‹"}
        </span>
        {!isExpanded && <span className="ask-ai-toggle-label">Ask AI</span>}
      </button>

      <div className="ask-ai-panel" inert={!isExpanded}>
          <div className="ask-ai-header">
            <div className="ask-ai-title">
              <strong>Ask AI</strong>
            </div>
            <div className="ask-ai-header-actions">
              <button
                type="button"
                className="ask-ai-clear-btn"
                onClick={clearHistory}
                disabled={messages.length === 0 && !isStreaming}
                title="Clear AI Chat History for this Card"
                aria-label="Clear AI Chat History for this Card"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                type="button"
                className="ask-ai-close-btn"
                onClick={() => onExpandedChange(false)}
                title="Close Ask AI panel"
                aria-label="Close Ask AI panel"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="ask-ai-messages" ref={messagesRef}>
            {messages.length === 0 && !isStreaming && (
              <div className="ask-ai-empty">
                Ask anything about the current flashcard or question. The card
                contents are sent along as context.
              </div>
            )}
            {messages.length === 0 && !isStreaming && (
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
            {messages.length > 0 && !isStreaming && (
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
              placeholder="Ask about this card…"
              rows={2}
              disabled={isStreaming}
            />
            <button
              type="button"
              className="ask-ai-send-btn"
              onClick={() => void sendMessage()}
              disabled={isStreaming || !input.trim()}
              title="Send message"
              aria-label="Send message"
            >
              {isStreaming ? (
                <span className="ask-ai-thinking-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
    </aside>
  );
}
