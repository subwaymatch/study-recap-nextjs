"use client";

import { useCallback, useEffect, useRef } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import type { StudyCard } from "@/types";
import { stripHtml } from "@/lib/html";

interface CardListOverlayProps {
  cards: StudyCard[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

const EXCERPT_LENGTH = 36;

function buildExcerpt(card: StudyCard): string {
  const raw = stripHtml(card.data.body);
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (collapsed.length <= EXCERPT_LENGTH) return collapsed;
  return `${collapsed.slice(0, EXCERPT_LENGTH)}…`;
}

export function CardListOverlay({
  cards,
  currentIndex,
  isOpen,
  onClose,
  onSelect,
}: CardListOverlayProps) {
  const activeItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    activeItemRef.current?.scrollIntoView({ block: "center" });
  }, [isOpen]);

  // Capture-phase Escape handler so we beat the study page's "go home" listener.
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

  const handleSelect = useCallback(
    (index: number) => {
      onSelect(index);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="card-list-overlay" />
        <Dialog.Popup className="card-list-panel" aria-label="All cards">
          <div className="card-list-header">
            <Dialog.Title render={<h2>All Cards ({cards.length})</h2>} />
            <Dialog.Close
              className="card-list-close"
              aria-label="Close card list"
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
          <ul className="card-list-items">
            {cards.map((card, index) => {
              const isActive = index === currentIndex;
              const excerpt = buildExcerpt(card) || "(empty)";
              return (
                <li key={card.data.card_id}>
                  <button
                    type="button"
                    ref={isActive ? activeItemRef : undefined}
                    className={`card-list-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelect(index)}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="card-list-index">{index + 1}</span>
                    <span
                      className={`card-list-type ${card.type}`}
                      aria-label={
                        card.type === "flashcard" ? "Flashcard" : "MCQ"
                      }
                    >
                      {card.type === "flashcard" ? "FC" : "MCQ"}
                    </span>
                    <span className="card-list-excerpt">{excerpt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
