"use client";

interface NavButtonsProps {
  onPrev: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onToggleAskAI: () => void;
  isPaused: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  timerEnabled: boolean;
  isAskAIExpanded: boolean;
  showAskAI?: boolean;
}

export function NavButtons({
  onPrev,
  onNext,
  onTogglePause,
  onToggleAskAI,
  isPaused,
  hasPrev,
  hasNext,
  timerEnabled,
  isAskAIExpanded,
  showAskAI = true,
}: NavButtonsProps) {
  return (
    <div className="nav-buttons">
      <button className="nav-btn" onClick={onPrev} disabled={!hasPrev}>
        <kbd className="nav-shortcut-key">←</kbd>
        <span className="nav-btn-text">Prev</span>
        <svg
          className="nav-btn-svg"
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      {timerEnabled && (
        <button className="nav-btn nav-btn-pause" onClick={onTogglePause}>
          {isPaused ? (
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
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
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
          <span className="nav-btn-text">{isPaused ? "Resume" : "Pause"}</span>
        </button>
      )}
      {showAskAI && (
        <button
          className={`nav-btn nav-btn-ask-ai${isAskAIExpanded ? " active" : ""}`}
          onClick={onToggleAskAI}
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="nav-btn-text">Ask AI</span>
        </button>
      )}
      <button className="nav-btn" onClick={onNext} disabled={!hasNext}>
        <kbd className="nav-shortcut-key">→</kbd>
        <span className="nav-btn-text">Next</span>
        <svg
          className="nav-btn-svg"
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
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
