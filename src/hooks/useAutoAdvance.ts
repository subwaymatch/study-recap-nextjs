"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseAutoAdvanceOptions {
  intervalSeconds: number;
  enabled: boolean;
  onAdvance: () => void;
}

export function useAutoAdvance({
  intervalSeconds,
  enabled,
  onAdvance,
}: UseAutoAdvanceOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAdvanceRef = useRef(onAdvance);

  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  });

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          onAdvanceRef.current();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, intervalSeconds]);

  useEffect(() => {
    if (enabled && !isPaused) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [enabled, isPaused, startTimer, clearTimer]);

  const resetTimer = useCallback(() => {
    setSecondsRemaining(intervalSeconds);
  }, [intervalSeconds]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  return { secondsRemaining, isPaused, resetTimer, togglePause };
}
