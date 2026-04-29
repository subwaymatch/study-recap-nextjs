"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";

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
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger
        className="shortcuts-hint"
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
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="shortcuts-overlay" />
        <Dialog.Popup
          className="shortcuts-panel"
          aria-label="Keyboard shortcuts"
        >
          <div className="shortcuts-header">
            <Dialog.Title render={<h2>Keyboard Shortcuts</h2>} />
            <Dialog.Close
              className="shortcuts-close"
              aria-label="Close keyboard shortcuts"
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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
