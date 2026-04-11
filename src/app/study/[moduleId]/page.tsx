"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCards } from "@/hooks/useCards";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { FlashcardDisplay } from "@/components/FlashcardDisplay";
import { MCQDisplay } from "@/components/MCQDisplay";
import { NavButtons } from "@/components/NavButtons";
import { ProgressBar } from "@/components/ProgressBar";
import { AskAITab } from "@/components/AskAITab";
import { CardProgressTrack } from "@/components/CardProgressTrack";
import { KeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StudyCardSkeleton } from "@/components/LoadingSkeleton";
import { buildCardContext } from "@/lib/cardContext";

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleId = Number(params.moduleId);
  const timerEnabled = searchParams.get("timer") === "true";
  const intervalSeconds = Number(searchParams.get("interval")) || 20;
  const randomizeMcq = searchParams.get("randomize") === "true";

  const { cards, moduleInfo, loading, error } = useCards(moduleId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentCard = cards[currentIndex];
  const askAiContext = useMemo(
    () => (currentCard ? buildCardContext(currentCard) : ""),
    [currentCard],
  );
  const cardId = currentCard ? currentCard.data.card_id : "";

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
      // Ignore shortcuts while typing in form fields (e.g. Ask AI input).
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
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
    return (
      <div className="study-layout">
        <StudyCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-screen-content">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.6 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button className="nav-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0 || !currentCard) {
    return (
      <div className="empty-screen">
        <div className="empty-screen-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4 }}>
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 9h20"/>
          </svg>
          <p>No cards found for this module.</p>
          <button className="nav-btn" onClick={goHome}>← Back to modules</button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-layout">
      <div className="study-page">
      <div className="study-header">
        <span className="card-counter">
          {currentIndex + 1} / {cards.length}
        </span>
        <div className="study-header-center">
          {moduleInfo && (
            <span className="module-info-badge">
              {moduleInfo.section} · {moduleInfo.module} · {moduleInfo.module_title}
            </span>
          )}
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
        <div className="study-header-right">
          <ThemeToggle />
          {timerEnabled && (
            <span className="timer-display">
              {isPaused ? "Paused" : `${secondsRemaining}s`}
            </span>
          )}
        </div>
      </div>

      <CardProgressTrack currentIndex={currentIndex} totalCards={cards.length} />

      {timerEnabled && (
        <ProgressBar
          secondsRemaining={secondsRemaining}
          intervalSeconds={intervalSeconds}
          isPaused={isPaused}
        />
      )}

      <div className="card-content" key={currentIndex}>
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
      <AskAITab
        contextText={askAiContext}
        cardId={cardId}
        cardType={currentCard.type}
      />
      <KeyboardShortcutsOverlay />
    </div>
  );
}
