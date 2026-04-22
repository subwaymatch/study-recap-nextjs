"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCards } from "@/hooks/useCards";
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
import { shuffleWithSeed } from "@/lib/shuffle";
import { useStudySessionUrlState } from "@/hooks/useStudySessionUrlState";

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleId = Number(params.moduleId);
  const timerEnabled = searchParams.get("timer") === "true";
  const intervalSeconds = Number(searchParams.get("interval")) || 20;
  const randomizeMcq = searchParams.get("randomize") === "true";
  const shuffleCards = searchParams.get("shuffle") === "true";
  const typesParam = searchParams.get("types");
  const showFlashcards = typesParam === null || typesParam.split(",").includes("flashcard");
  const showMcqs = typesParam === null || typesParam.split(",").includes("mcq");

  const { cards, moduleInfo, loading, error } = useCards(moduleId);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isCardListOpen, setIsCardListOpen] = useState(false);
  const [isAskAIExpanded, setIsAskAIExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [askAIEnabled, setAskAIEnabled] = useState(() => getStoredAskAIEnabled());

  // When the Ask AI panel opens, push a history entry so the browser's back
  // button closes the panel instead of navigating to the previous page.
  // On cleanup, if the pushed state is still current (panel was closed
  // programmatically rather than via back), pop it to keep history clean.
  useEffect(() => {
    if (!isAskAIExpanded) return;

    history.pushState({ __askAIOpen: true }, "");

    function handlePopState() {
      setIsAskAIExpanded(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if ((history.state as { __askAIOpen?: boolean } | null)?.__askAIOpen) {
        history.go(-1);
      }
    };
  }, [isAskAIExpanded]);

  const filteredCards = useMemo(() => {
    let result = cards;
    if (!showFlashcards || !showMcqs) {
      result = result.filter((card) => {
        if (card.type === "flashcard") return showFlashcards;
        if (card.type === "mcq") return showMcqs;
        return true;
      });
    }
    return result;
  }, [cards, showFlashcards, showMcqs]);

  const { currentIndex, setCurrentIndex, shuffleSeed } = useStudySessionUrlState({
    cardCount: filteredCards.length,
    shuffleEnabled: shuffleCards,
  });

  const displayCards = useMemo(() => {
    if (!shuffleCards || shuffleSeed === null || filteredCards.length === 0) {
      return filteredCards;
    }

    return shuffleWithSeed(filteredCards, shuffleSeed);
  }, [filteredCards, shuffleCards, shuffleSeed]);

  const currentCard = displayCards[currentIndex];
  const askAiContext = useMemo(
    () => (currentCard ? buildCardContext(currentCard) : ""),
    [currentCard],
  );
  const cardId = currentCard ? currentCard.data.card_id : "";

  const goNext = useCallback(() => {
    setSlideDirection("next");
    setCurrentIndex((prev) => Math.min(prev + 1, displayCards.length - 1));
  }, [displayCards.length, setCurrentIndex]);

  const goPrev = useCallback(() => {
    setSlideDirection("prev");
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [setCurrentIndex]);

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
      }, [displayCards.length, setCurrentIndex]),
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

  if (displayCards.length === 0 || !currentCard) {
    return (
      <div className="empty-screen">
        <div className="empty-screen-content">
          <CardIcon style={{ opacity: 0.4 }} />
          <p>No cards found for this module.</p>
          <button className="nav-btn" onClick={goHome}>← Back to modules</button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-layout" data-section={moduleInfo?.section ?? undefined}>
      <div className="study-page">
        <CardProgressTrack currentIndex={currentIndex} totalCards={displayCards.length} />
        <div className="study-header">
          <div className="study-header-left">
            <button className="header-icon-btn" onClick={goHome} title="Home (Esc)" aria-label="Go home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
          </div>
          <div className="study-header-center">
            {moduleInfo && (
              <span className="module-info-badge">
                <span className="module-info-dot" aria-hidden="true" />
                <span className="module-info-section">{moduleInfo.section}</span>
                <span className="module-info-sep" aria-hidden="true">·</span>
                <span className="module-info-module">{moduleInfo.module}</span>
                <span className="module-info-sep" aria-hidden="true">·</span>
                <span className="module-info-title">{moduleInfo.module_title}</span>
              </span>
            )}
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
          </div>
        </div>

        <div
          className={`card-content slide-${slideDirection}`}
          key={currentIndex}
          {...swipeHandlers}
        >
          <div className="card-content-inner">
            <div className="card-top-bar">
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
              {timerEnabled && (
                <ProgressBar
                  secondsRemaining={secondsRemaining}
                  intervalSeconds={intervalSeconds}
                  isPaused={isPaused}
                />
              )}
            </div>
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
