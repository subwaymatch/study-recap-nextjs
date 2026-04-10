"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSectionCards } from "@/hooks/useSectionCards";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { FlashcardDisplay } from "@/components/FlashcardDisplay";
import { MCQDisplay } from "@/components/MCQDisplay";
import { NavButtons } from "@/components/NavButtons";
import { ProgressBar } from "@/components/ProgressBar";

export default function SectionStudyPage() {
  return (
    <Suspense fallback={<div className="loading-screen">Loading...</div>}>
      <SectionStudyContent />
    </Suspense>
  );
}

function SectionStudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sections = useMemo(() => {
    const raw = searchParams.get("sections") ?? "";
    return raw ? raw.split(",") : [];
  }, [searchParams]);

  const timerEnabled = searchParams.get("timer") === "true";
  const intervalSeconds = Number(searchParams.get("interval")) || 20;
  const randomizeMcq = searchParams.get("randomize") === "true";

  const { cards, loading, error } = useSectionCards(sections);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const { secondsRemaining, isPaused, resetTimer, togglePause } =
    useAutoAdvance({
      intervalSeconds,
      enabled: timerEnabled && cards.length > 0,
      onAdvance: useCallback(() => {
        setCurrentIndex((prev) => {
          if (prev >= cards.length - 1) return 0;
          return prev + 1;
        });
      }, [cards.length]),
    });

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
          goNext();
          resetTimer();
          break;
        case "ArrowLeft":
          goPrev();
          resetTimer();
          break;
        case " ":
          e.preventDefault();
          togglePause();
          break;
        case "Escape":
          goHome();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, resetTimer, togglePause, goHome]);

  if (loading) {
    return <div className="loading-screen">Loading cards...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="loading-screen">
        No cards found for the selected sections.
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="study-page">
      <div className="study-header">
        <span className="card-counter">
          {currentIndex + 1} / {cards.length}
        </span>
        <div className="study-header-center">
          <span className="module-info-badge">
            {sections.join(", ")}
          </span>
          <span
            className={`card-type-badge ${currentCard.type === "flashcard" ? "flashcard" : "mcq"}`}
          >
            <span className="badge-icon" aria-hidden="true">
              {currentCard.type === "flashcard" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 9h20"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="7" r="2"/><circle cx="6" cy="13" r="2"/><circle cx="6" cy="19" r="2"/>
                  <line x1="11" y1="7" x2="21" y2="7"/><line x1="11" y1="13" x2="21" y2="13"/><line x1="11" y1="19" x2="21" y2="19"/>
                </svg>
              )}
            </span>
            <span className="badge-label">
              {currentCard.type === "flashcard" ? "Flashcard" : "MCQ"}
            </span>
          </span>
        </div>
        {timerEnabled && (
          <span className="timer-display">
            {isPaused ? "Paused" : `${secondsRemaining}s`}
          </span>
        )}
      </div>

      {timerEnabled && (
        <ProgressBar
          secondsRemaining={secondsRemaining}
          intervalSeconds={intervalSeconds}
          isPaused={isPaused}
        />
      )}

      <div className="card-content">
        {currentCard.type === "flashcard" ? (
          <FlashcardDisplay flashcard={currentCard.data} />
        ) : (
          <MCQDisplay mcq={currentCard.data} randomize={randomizeMcq} />
        )}
      </div>

      <NavButtons
        onPrev={() => {
          goPrev();
          resetTimer();
        }}
        onNext={() => {
          goNext();
          resetTimer();
        }}
        onTogglePause={togglePause}
        onHome={goHome}
        isPaused={isPaused}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < cards.length - 1}
        timerEnabled={timerEnabled}
      />
    </div>
  );
}
