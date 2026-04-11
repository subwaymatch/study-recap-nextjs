"use client";

import { useCallback, useEffect, useState } from "react";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["←"], description: "Previous card" },
  { keys: ["→"], description: "Next card" },
  { keys: ["Space"], description: "Pause / Resume timer" },
  { keys: ["Esc"], description: "Go home" },
  { keys: ["?"], description: "Toggle this help" },
];

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger while typing in form fields.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    },
    [isOpen],
  );

  useEffect(() => {
    // Capture phase so we can intercept Escape before the study page handler.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  if (!isOpen) {
    return (
      <button
        type="button"
        className="shortcuts-hint"
        onClick={() => setIsOpen(true)}
        title="Keyboard shortcuts (?)"
        aria-label="Show keyboard shortcuts"
      >
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
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001" />
          <path d="M8 12h.001M12 12h.001M16 12h.001" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="shortcuts-overlay"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="shortcuts-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            type="button"
            className="shortcuts-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="shortcuts-list">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={description} className="shortcut-row">
              <div className="shortcut-keys">
                {keys.map((k) => (
                  <kbd key={k} className="shortcut-key">
                    {k}
                  </kbd>
                ))}
              </div>
              <span className="shortcut-desc">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
