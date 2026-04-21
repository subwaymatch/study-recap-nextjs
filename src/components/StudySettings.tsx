"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/Icons";

interface StudySettingsProps {
  open: boolean;
  onClose: () => void;
  timerEnabled: boolean;
  onTimerEnabledChange: (value: boolean) => void;
  intervalSeconds: number;
  onIntervalSecondsChange: (value: number) => void;
  randomizeMcq: boolean;
  onRandomizeMcqChange: (value: boolean) => void;
  shuffleCards: boolean;
  onShuffleCardsChange: (value: boolean) => void;
  showFlashcards: boolean;
  onShowFlashcardsChange: (value: boolean) => void;
  showMcqs: boolean;
  onShowMcqsChange: (value: boolean) => void;
  hideEmpty: boolean;
  onHideEmptyChange: (value: boolean) => void;
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="study-settings-row">
      <div className="study-settings-label-group">
        <span className="study-settings-label">{label}</span>
        {hint && <span className="study-settings-hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`settings-switch${checked ? " on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-switch-thumb" />
      </button>
    </div>
  );
}

export function StudySettings({
  open,
  onClose,
  timerEnabled,
  onTimerEnabledChange,
  intervalSeconds,
  onIntervalSecondsChange,
  randomizeMcq,
  onRandomizeMcqChange,
  shuffleCards,
  onShuffleCardsChange,
  showFlashcards,
  onShowFlashcardsChange,
  showMcqs,
  onShowMcqsChange,
  hideEmpty,
  onHideEmptyChange,
}: StudySettingsProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Guard: don't let both card types be disabled.
  const onToggleFlashcards = (v: boolean) => {
    if (!v && !showMcqs) return;
    onShowFlashcardsChange(v);
  };
  const onToggleMcqs = (v: boolean) => {
    if (!v && !showFlashcards) return;
    onShowMcqsChange(v);
  };

  return (
    <div
      className="study-settings-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Study settings"
    >
      <div
        className="study-settings-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="study-settings-header">
          <h2>Study settings</h2>
          <button
            ref={closeRef}
            type="button"
            className="study-settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="study-settings-body">
          <section className="study-settings-group">
            <div className="study-settings-group-title">Pace</div>
            <Toggle
              label="Auto-advance"
              checked={timerEnabled}
              onChange={onTimerEnabledChange}
              hint="Move to the next card automatically"
            />
            {timerEnabled && (
              <div className="study-settings-slider-row">
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={intervalSeconds}
                  onChange={(e) =>
                    onIntervalSecondsChange(Math.max(5, Number(e.target.value)))
                  }
                  className="settings-slider"
                  aria-label="Seconds per card"
                />
                <span className="study-settings-slider-value">
                  {intervalSeconds}s
                </span>
              </div>
            )}
          </section>

          <section className="study-settings-group">
            <div className="study-settings-group-title">Order</div>
            <Toggle
              label="Shuffle cards"
              checked={shuffleCards}
              onChange={onShuffleCardsChange}
              hint="Randomize the card sequence each session"
            />
            <Toggle
              label="Randomize MCQ options"
              checked={randomizeMcq}
              onChange={onRandomizeMcqChange}
              hint="Shuffle answer choices for each question"
            />
          </section>

          <section className="study-settings-group">
            <div className="study-settings-group-title">Include</div>
            <Toggle
              label="Flashcards"
              checked={showFlashcards}
              onChange={onToggleFlashcards}
            />
            <Toggle
              label="Multiple choice"
              checked={showMcqs}
              onChange={onToggleMcqs}
            />
            <Toggle
              label="Hide empty modules"
              checked={hideEmpty}
              onChange={onHideEmptyChange}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
