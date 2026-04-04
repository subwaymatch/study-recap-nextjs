"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCards } from "@/hooks/useCards";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { FlashcardDisplay } from "@/components/FlashcardDisplay";
import { MCQDisplay } from "@/components/MCQDisplay";
import { NavButtons } from "@/components/NavButtons";
import { ProgressBar } from "@/components/ProgressBar";

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleId = Number(params.moduleId);
  const timerEnabled = searchParams.get("timer") === "true";
  const intervalSeconds = Number(searchParams.get("interval")) || 15;
  const randomizeMcq = searchParams.get("randomize") === "true";

  const { cards, loading, error } = useCards(moduleId);
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
    return <div className="loading-screen">No cards found for this module.</div>;
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="study-page">
      <div className="study-header">
        <span className="card-counter">
          {currentIndex + 1} / {cards.length}
        </span>
        <span
          className={`card-type-badge ${currentCard.type === "flashcard" ? "flashcard" : "mcq"}`}
        >
          {currentCard.type === "flashcard" ? "Flashcard" : "MCQ"}
        </span>
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
