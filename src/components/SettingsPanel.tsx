"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "study-recap:theme";
const ASK_AI_KEY = "study-recap:ask-ai-enabled";

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

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  askAIEnabled: boolean;
  onAskAIEnabledChange: (enabled: boolean) => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  askAIEnabled,
  onAskAIEnabledChange,
}: SettingsPanelProps) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(getResolvedTheme(theme));
  }, [theme]);

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

  const toggleAskAI = useCallback(() => {
    const next = !askAIEnabled;
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
  }, [askAIEnabled, onAskAIEnabledChange]);

  if (!isOpen) return null;

  const resolved = getResolvedTheme(theme);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Settings"
      >
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            className="settings-close"
            onClick={onClose}
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
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <label className="settings-label">Theme</label>
            <div className="settings-theme-options">
              <button
                className={`settings-theme-btn${theme === "light" ? " active" : ""}`}
                onClick={() => selectTheme("light")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                Light
              </button>
              <button
                className={`settings-theme-btn${theme === "dark" ? " active" : ""}`}
                onClick={() => selectTheme("dark")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                Dark
              </button>
              <button
                className={`settings-theme-btn${theme === "system" ? " active" : ""}`}
                onClick={() => selectTheme("system")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                System{resolved ? ` (${resolved})` : ""}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-toggle-row">
              <label className="settings-label" htmlFor="ask-ai-toggle">
                Enable Ask AI
              </label>
              <button
                id="ask-ai-toggle"
                type="button"
                role="switch"
                aria-checked={askAIEnabled}
                className={`settings-switch${askAIEnabled ? " on" : ""}`}
                onClick={toggleAskAI}
              >
                <span className="settings-switch-thumb" />
              </button>
            </div>
            <p className="settings-hint">
              When disabled, the Ask AI tab and button are hidden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
