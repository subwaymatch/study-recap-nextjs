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
