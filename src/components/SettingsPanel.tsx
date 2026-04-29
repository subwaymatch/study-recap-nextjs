"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { RadioGroup } from "@base-ui-components/react/radio-group";
import { Radio } from "@base-ui-components/react/radio";
import { Switch } from "@base-ui-components/react/switch";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "study-recap:theme";
const ASK_AI_KEY = "study-recap:ask-ai-enabled";
const FONT_SCALE_KEY = "study-recap:card-font-scale";

const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.8;
const FONT_SCALE_STEP = 0.05;
const FONT_SCALE_DEFAULT = 1;

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore storage errors.
  }
  return "system";
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function getStoredAskAIEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(ASK_AI_KEY);
    if (stored === "false") return false;
  } catch {
    // Ignore storage errors.
  }
  return true;
}

function clampFontScale(value: number): number {
  if (!Number.isFinite(value)) return FONT_SCALE_DEFAULT;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value));
}

function getStoredFontScale(): number {
  if (typeof window === "undefined") return FONT_SCALE_DEFAULT;
  try {
    const stored = window.localStorage.getItem(FONT_SCALE_KEY);
    if (stored == null) return FONT_SCALE_DEFAULT;
    const parsed = parseFloat(stored);
    if (!Number.isFinite(parsed)) return FONT_SCALE_DEFAULT;
    return clampFontScale(parsed);
  } catch {
    return FONT_SCALE_DEFAULT;
  }
}

function applyFontScale(scale: number) {
  document.documentElement.style.setProperty(
    "--card-font-scale",
    String(scale),
  );
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  askAIEnabled: boolean;
  onAskAIEnabledChange: (enabled: boolean) => void;
}

const THEME_ICONS = {
  light: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  dark: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  system: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

export function SettingsPanel({
  isOpen,
  onClose,
  askAIEnabled,
  onAskAIEnabledChange,
}: SettingsPanelProps) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [fontScale, setFontScale] = useState<number>(getStoredFontScale);

  useEffect(() => {
    applyTheme(getResolvedTheme(theme));
  }, [theme]);

  useEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme(getResolvedTheme("system"));
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  // Capture-phase Escape so the study page's "go home" handler doesn't fire.
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  const selectTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    try {
      if (newTheme === "system") {
        window.localStorage.removeItem(THEME_KEY);
      } else {
        window.localStorage.setItem(THEME_KEY, newTheme);
      }
    } catch {
      // Ignore storage errors.
    }
    applyTheme(getResolvedTheme(newTheme));
  }, []);

  const setAskAI = useCallback(
    (next: boolean) => {
      onAskAIEnabledChange(next);
      try {
        if (next) {
          window.localStorage.removeItem(ASK_AI_KEY);
        } else {
          window.localStorage.setItem(ASK_AI_KEY, "false");
        }
      } catch {
        // Ignore storage errors.
      }
    },
    [onAskAIEnabledChange],
  );

  const handleFontScaleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = clampFontScale(parseFloat(e.target.value));
      setFontScale(next);
      try {
        if (next === FONT_SCALE_DEFAULT) {
          window.localStorage.removeItem(FONT_SCALE_KEY);
        } else {
          window.localStorage.setItem(FONT_SCALE_KEY, String(next));
        }
      } catch {
        // Ignore storage errors.
      }
    },
    [],
  );

  const resetFontScale = useCallback(() => {
    setFontScale(FONT_SCALE_DEFAULT);
    try {
      window.localStorage.removeItem(FONT_SCALE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="settings-overlay" />
        <Dialog.Popup className="settings-panel" aria-label="Settings">
          <div className="settings-header">
            <Dialog.Title render={<h2>Settings</h2>} />
            <Dialog.Close
              className="settings-close"
              aria-label="Close settings"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          </div>

          <div className="settings-body">
            <div className="settings-section">
              <span className="settings-label" id="theme-label">
                Theme
              </span>
              <RadioGroup
                value={theme}
                onValueChange={(v) => selectTheme(v as Theme)}
                aria-labelledby="theme-label"
                className="settings-theme-options"
              >
                {(["light", "dark", "system"] as const).map((t) => (
                  <Radio.Root
                    key={t}
                    value={t}
                    className="settings-theme-btn"
                  >
                    {THEME_ICONS[t]}
                    {t === "light" ? "Light" : t === "dark" ? "Dark" : "System"}
                  </Radio.Root>
                ))}
              </RadioGroup>
            </div>

            <div className="settings-section">
              <div className="settings-toggle-row">
                <label className="settings-label" htmlFor="card-font-scale">
                  Card font size
                </label>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={resetFontScale}
                  disabled={fontScale === FONT_SCALE_DEFAULT}
                >
                  Reset
                </button>
              </div>
              <div className="settings-slider-row">
                <span className="settings-slider-label-sm" aria-hidden="true">
                  A
                </span>
                <input
                  id="card-font-scale"
                  type="range"
                  className="settings-slider"
                  min={FONT_SCALE_MIN}
                  max={FONT_SCALE_MAX}
                  step={FONT_SCALE_STEP}
                  value={fontScale}
                  onChange={handleFontScaleChange}
                  aria-valuemin={FONT_SCALE_MIN}
                  aria-valuemax={FONT_SCALE_MAX}
                  aria-valuenow={fontScale}
                />
                <span className="settings-slider-label-lg" aria-hidden="true">
                  A
                </span>
                <span className="settings-slider-value">
                  {Math.round(fontScale * 100)}%
                </span>
              </div>
              <p className="settings-hint">
                Applies to flashcard and MCQ content only.
              </p>
            </div>

            <div className="settings-section">
              <div className="settings-toggle-row">
                <label className="settings-label" htmlFor="ask-ai-toggle">
                  Enable Ask AI
                </label>
                <Switch.Root
                  id="ask-ai-toggle"
                  checked={askAIEnabled}
                  onCheckedChange={setAskAI}
                  className="settings-switch"
                >
                  <Switch.Thumb className="settings-switch-thumb" />
                </Switch.Root>
              </div>
              <p className="settings-hint">
                When disabled, the Ask AI tab and button are hidden.
              </p>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
