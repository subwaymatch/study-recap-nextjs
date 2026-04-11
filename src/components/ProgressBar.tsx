"use client";

import { useRef } from "react";

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
  const prevSecondsRef = useRef(secondsRemaining);
  const isResettingRef = useRef(false);

  // Detect reset: seconds jumped up (e.g., from 3 to 15).
  // This is derived state — no need for useState + useEffect.
  const isResetting = secondsRemaining > prevSecondsRef.current;
  prevSecondsRef.current = secondsRemaining;

  // When resetting, schedule a re-render after a paint to remove the reset class.
  if (isResetting && !isResettingRef.current) {
    isResettingRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isResettingRef.current = false;
      });
    });
  }

  const widthPercent = (secondsRemaining / intervalSeconds) * 100;

  return (
    <div className="progress-bar-container">
      <div
        className={`progress-bar-fill${isResetting ? " reset" : ""}${isPaused ? " paused" : ""}`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
