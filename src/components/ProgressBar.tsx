"use client";

import { useEffect, useRef, useState } from "react";

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
  const [isResetting, setIsResetting] = useState(false);
  const prevSecondsRef = useRef(secondsRemaining);

  useEffect(() => {
    // Detect reset: seconds jumped up (e.g., from 3 to 15)
    if (secondsRemaining > prevSecondsRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- required: must render without transition before re-enabling it
      setIsResetting(true);
      // Remove the reset class after a frame so the browser paints without transition
      let innerFrameId: number;
      const outerFrameId = requestAnimationFrame(() => {
        innerFrameId = requestAnimationFrame(() => {
          setIsResetting(false);
        });
      });
      prevSecondsRef.current = secondsRemaining;
      return () => {
        cancelAnimationFrame(outerFrameId);
        cancelAnimationFrame(innerFrameId);
      };
    }
    prevSecondsRef.current = secondsRemaining;
  }, [secondsRemaining]);

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
