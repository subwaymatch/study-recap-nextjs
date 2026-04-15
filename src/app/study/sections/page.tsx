"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSectionCards } from "@/hooks/useSectionCards";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { FlashcardDisplay } from "@/components/FlashcardDisplay";
import { MCQDisplay } from "@/components/MCQDisplay";
import { NavButtons } from "@/components/NavButtons";
import { ProgressBar } from "@/components/ProgressBar";
import { AskAITab } from "@/components/AskAITab";
import { CardProgressTrack } from "@/components/CardProgressTrack";
import { KeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import { CardListOverlay } from "@/components/CardListOverlay";
import { SettingsPanel, getStoredAskAIEnabled } from "@/components/SettingsPanel";
import { StudyCardSkeleton } from "@/components/LoadingSkeleton";
import { AlertCircleIcon, CardIcon } from "@/components/Icons";
import { buildCardContext } from "@/lib/cardContext";

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
  const shuffleCards = searchParams.get("shuffle") === "true";
  const typesParam = searchParams.get("types");
  const showFlashcards = typesParam === null || typesParam.split(",").includes("flashcard");
  const showMcqs = typesParam === null || typesParam.split(",").includes("mcq");

  const { cards, loading, error } = useSectionCards(sections);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isCardListOpen, setIsCardListOpen] = useState(false);
  const [isAskAIExpanded, setIsAskAIExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [askAIEnabled, setAskAIEnabled] = useState(true);

  useEffect(() => {
    setAskAIEnabled(getStoredAskAIEnabled());
  }, []);

  const displayCards = useMemo(() => {
    let result = cards;
    if (!showFlashcards || !showMcqs) {
      result = result.filter((card) => {
        if (card.type === "flashcard") return showFlashcards;
        if (card.type === "mcq") return showMcqs;
        return true;
      });
    }
    if (shuffleCards && result.length > 0) {
      result = [...result];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }
    return result;
  // shuffleCards intentionally excluded: shuffle is seeded once per card load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, showFlashcards, showMcqs]);

  const currentCardForContext = displayCards[currentIndex];
  const askAiContext = useMemo(
    () =>
      currentCardForContext ? buildCardContext(currentCardForContext) : "",
    [currentCardForContext],
  );
  const cardId = currentCardForContext
    ? currentCardForContext.data.card_id
    : "";

  const goNext = useCallback(() => {
    setSlideDirection("next");
    setCurrentIndex((prev) => Math.min(prev + 1, displayCards.length - 1));
  }, [displayCards.length]);

  const goPrev = useCallback(() => {
    setSlideDirection("prev");
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const { secondsRemaining, isPaused, resetTimer, togglePause } =
    useAutoAdvance({
      intervalSeconds,
      enabled: timerEnabled && displayCards.length > 0,
      onAdvance: useCallback(() => {
        setSlideDirection("next");
        setCurrentIndex((prev) => {
          if (prev >= displayCards.length - 1) return 0;
          return prev + 1;
        });
      }, [displayCards.length]),
    });

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: useCallback(() => {
      goNext();
      resetTimer();
    }, [goNext, resetTimer]),
    onSwipeRight: useCallback(() => {
      goPrev();
      resetTimer();
    }, [goPrev, resetTimer]),
  });

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
          <AlertCircleIcon style={{ opacity: 0.6 }} />
          <p>{error}</p>
          <button className="nav-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (displayCards.length === 0) {
    return (
      <div className="empty-screen">
        <div className="empty-screen-content">
          <CardIcon style={{ opacity: 0.4 }} />
          <p>No cards found for the selected sections.</p>
          <button className="nav-btn" onClick={goHome}>← Back to modules</button>
        </div>
      </div>
    );
  }

  const currentCard = displayCards[currentIndex];

  return (
    <div className="study-layout">
      <div className="study-page">
      <div className="study-header">
        <div className="study-header-left">
          <button className="header-icon-btn" onClick={goHome} title="Home (Esc)" aria-label="Go home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
        </div>
        <div className="study-header-center">
          <span className="module-info-badge">
            {sections.join(", ")}
          </span>
        </div>
        <div className="study-header-right">
          <span className="card-counter">
            {currentIndex + 1}
            <span className="card-counter-total">/{displayCards.length}</span>
          </span>
          <button className="header-icon-btn" onClick={() => setIsCardListOpen(true)} title="Card list" aria-label="Show list of all cards">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button className="header-icon-btn" onClick={() => setIsSettingsOpen(true)} title="Settings" aria-label="Open settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          {timerEnabled && (
            <span className="timer-display">
              {isPaused ? "Paused" : `${secondsRemaining}s`}
            </span>
          )}
        </div>
      </div>

      <CardProgressTrack currentIndex={currentIndex} totalCards={displayCards.length} />

      {timerEnabled && (
        <ProgressBar
          secondsRemaining={secondsRemaining}
          intervalSeconds={intervalSeconds}
          isPaused={isPaused}
        />
      )}

      <div
        className={`card-content slide-${slideDirection}`}
        key={currentIndex}
        {...swipeHandlers}
      >
        <div className="card-content-inner">
          <span
            className={`card-type-badge card-type-badge-inline ${currentCard.type === "flashcard" ? "flashcard" : "mcq"}`}
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
          {currentCard.type === "flashcard" ? (
            <FlashcardDisplay flashcard={currentCard.data} />
          ) : (
            <MCQDisplay mcq={currentCard.data} randomize={randomizeMcq} />
          )}
        </div>
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
        onToggleAskAI={() => setIsAskAIExpanded((prev) => !prev)}
        isPaused={isPaused}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < displayCards.length - 1}
        timerEnabled={timerEnabled}
        isAskAIExpanded={isAskAIExpanded}
        showAskAI={askAIEnabled}
      />
      </div>
      {askAIEnabled && (
        <AskAITab
          contextText={askAiContext}
          cardId={cardId}
          cardType={currentCard.type}
          isExpanded={isAskAIExpanded}
          onExpandedChange={setIsAskAIExpanded}
        />
      )}
      <CardListOverlay
        cards={displayCards}
        currentIndex={currentIndex}
        isOpen={isCardListOpen}
        onClose={() => setIsCardListOpen(false)}
        onSelect={(index) => {
          setSlideDirection(index >= currentIndex ? "next" : "prev");
          setCurrentIndex(index);
          resetTimer();
        }}
      />
      <KeyboardShortcutsOverlay />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        askAIEnabled={askAIEnabled}
        onAskAIEnabledChange={(enabled) => {
          setAskAIEnabled(enabled);
          if (!enabled) setIsAskAIExpanded(false);
        }}
      />
    </div>
  );
}
