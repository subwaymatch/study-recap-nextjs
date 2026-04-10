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
import { stripHtml } from "@/lib/html";
import type { StudyCard } from "@/types";

function buildCardContext(card: StudyCard): string {
  if (card.type === "flashcard") {
    const body = stripHtml(card.data.body);
    const explanation = card.data.explanation
      ? stripHtml(card.data.explanation)
      : "";
    return (
      `Card type: Flashcard\n` +
      `Front:\n${body}` +
      (explanation ? `\n\nExplanation:\n${explanation}` : "")
    );
  }

  const mcq = card.data;
  const labels = ["A", "B", "C", "D"];
  const options = [
    mcq.option_text1,
    mcq.option_text2,
    mcq.option_text3,
    mcq.option_text4,
  ]
    .map((opt, i) => `${labels[i]}. ${stripHtml(opt)}`)
    .join("\n");
  const explanations = [
    mcq.explanation1,
    mcq.explanation2,
    mcq.explanation3,
    mcq.explanation4,
  ]
    .map((expl, i) =>
      expl ? `${labels[i]}: ${stripHtml(expl)}` : null,
    )
    .filter((s): s is string => Boolean(s))
    .join("\n");
  const correctLabel = labels[mcq.correct_option_number - 1] ?? "?";

  return (
    `Card type: Multiple Choice Question\n` +
    `Question:\n${stripHtml(mcq.body)}\n\n` +
    `Options:\n${options}\n\n` +
    `Correct answer: ${correctLabel}` +
    (explanations ? `\n\nExplanations:\n${explanations}` : "")
  );
}

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
    return <div className="loading-screen">Loading cards...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  if (cards.length === 0 || !currentCard) {
    return <div className="loading-screen">No cards found for this module.</div>;
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
      <AskAITab contextText={askAiContext} />
    </div>
  );
}
