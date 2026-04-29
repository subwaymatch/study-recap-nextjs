"use client";

import { useEffect } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { Switch } from "@base-ui-components/react/switch";
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
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="settings-switch"
      >
        <Switch.Thumb className="settings-switch-thumb" />
      </Switch.Root>
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
  // Capture-phase Escape so we beat any global listeners.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

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
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="study-settings-overlay" />
        <Dialog.Popup
          className="study-settings-panel"
          aria-label="Study settings"
        >
          <div className="study-settings-header">
            <Dialog.Title render={<h2>Study settings</h2>} />
            <Dialog.Close
              className="study-settings-close"
              aria-label="Close settings"
            >
              <CloseIcon size={18} />
            </Dialog.Close>
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
                      onIntervalSecondsChange(
                        Math.max(5, Number(e.target.value)),
                      )
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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
