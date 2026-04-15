"use client";

interface ProgressBarProps {
  secondsRemaining: number;
  intervalSeconds: number;
  isPaused: boolean;
}

export function ProgressBar({
  secondsRemaining,
  intervalSeconds,
  isPaused,
}: ProgressBarProps) {
  const safeInterval = Math.max(intervalSeconds, 1);
  const progress = Math.min(Math.max(secondsRemaining / safeInterval, 0), 1);
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className={`progress-bar-container donut-timer${isPaused ? " paused" : ""}`}
      role="timer"
      aria-live="polite"
      aria-label={
        isPaused
          ? `Auto-advance paused with ${secondsRemaining} seconds remaining`
          : `${secondsRemaining} seconds remaining before auto-advance`
      }
    >
      <svg
        className="donut-timer-ring"
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <circle className="donut-timer-track" cx="20" cy="20" r={radius} />
        <circle
          className="donut-timer-fill"
          cx="20"
          cy="20"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>
      <span className="donut-timer-value">
        {secondsRemaining}
        <span className="donut-timer-unit">s</span>
      </span>
    </div>
  );
}
