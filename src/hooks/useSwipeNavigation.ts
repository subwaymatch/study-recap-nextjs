"use client";

import { useCallback, useRef } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";

interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal distance (px) to register as a swipe. */
  minSwipeDistance?: number;
  /** Maximum vertical deviation (px) before a gesture is treated as a scroll, not a swipe. */
  maxVerticalDeviation?: number;
}

/**
 * Touch gesture handler for navigating between cards by swiping horizontally.
 * Returns handlers to spread onto the element whose touches should trigger
 * navigation. Vertical scrolls and multi-touch gestures are ignored.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  maxVerticalDeviation = 75,
}: UseSwipeNavigationOptions) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // Treat as a vertical scroll if the finger moved more up/down than sideways.
      if (Math.abs(dy) > maxVerticalDeviation) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < minSwipeDistance) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [onSwipeLeft, onSwipeRight, minSwipeDistance, maxVerticalDeviation],
  );

  const onTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
