"use client";

interface NavButtonsProps {
  onPrev: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onHome: () => void;
  isPaused: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  timerEnabled: boolean;
}

export function NavButtons({
  onPrev,
  onNext,
  onTogglePause,
  onHome,
  isPaused,
  hasPrev,
  hasNext,
  timerEnabled,
}: NavButtonsProps) {
  return (
    <div className="nav-buttons">
      <button className="nav-btn home-btn" onClick={onHome}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "-2px", marginRight: "0.3em" }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Home
      </button>
      <button className="nav-btn" onClick={onPrev} disabled={!hasPrev}>
        ← Prev
      </button>
      {timerEnabled && (
        <button className="nav-btn pause-btn" onClick={onTogglePause}>
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
      )}
      <button className="nav-btn" onClick={onNext} disabled={!hasNext}>
        Next →
      </button>
    </div>
  );
}
