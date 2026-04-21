"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { generateRandomSeed } from "@/lib/shuffle";

interface UseStudySessionUrlStateOptions {
  cardCount: number;
  shuffleEnabled: boolean;
}

function parseNonNegativeInteger(value: string | null): number {
  if (value === null) return 0;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return 0;

  return parsed;
}

function parseSeed(value: string | null): number | null {
  if (value === null) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;

  return parsed >>> 0;
}

function clampIndex(index: number, cardCount: number): number {
  if (cardCount <= 0) return 0;
  return Math.min(index, cardCount - 1);
}

export function useStudySessionUrlState({
  cardCount,
  shuffleEnabled,
}: UseStudySessionUrlStateOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawIndex = searchParams.get("index");
  const rawSeed = searchParams.get("seed");
  const [fallbackSeed] = useState(generateRandomSeed);

  const updateQueryParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      const before = params.toString();

      mutate(params);

      const after = params.toString();
      if (after === before) return;

      router.replace(after ? `${pathname}?${after}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const currentIndex = useMemo(
    () => clampIndex(parseNonNegativeInteger(rawIndex), cardCount),
    [cardCount, rawIndex],
  );

  const setCurrentIndex = useCallback(
    (value: SetStateAction<number>) => {
      const baseIndex = clampIndex(
        parseNonNegativeInteger(searchParams.get("index")),
        cardCount,
      );
      const nextIndex = typeof value === "function" ? value(baseIndex) : value;

      updateQueryParams((params) => {
        params.set("index", String(clampIndex(nextIndex, cardCount)));
      });
    },
    [cardCount, searchParams, updateQueryParams],
  );

  const shuffleSeed = useMemo(() => {
    if (!shuffleEnabled) return null;
    return parseSeed(rawSeed) ?? fallbackSeed;
  }, [fallbackSeed, rawSeed, shuffleEnabled]);

  useEffect(() => {
    if (!shuffleEnabled) {
      if (rawSeed !== null) {
        updateQueryParams((params) => {
          params.delete("seed");
        });
      }

      return;
    }

    const existingSeed = parseSeed(rawSeed);
    if (existingSeed !== null) {
      return;
    }

    updateQueryParams((params) => {
      params.set("seed", String(fallbackSeed));
    });
  }, [fallbackSeed, rawSeed, shuffleEnabled, updateQueryParams]);

  return { currentIndex, setCurrentIndex, shuffleSeed };
}
