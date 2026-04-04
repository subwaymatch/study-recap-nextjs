"use client";

import type { Flashcard } from "@/types";
import { sanitizeHtml } from "@/lib/html";

interface FlashcardDisplayProps {
  flashcard: Flashcard;
}

export function FlashcardDisplay({ flashcard }: FlashcardDisplayProps) {
  return (
    <div className="flashcard-display">
      <div
        className="flashcard-body html-content"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(flashcard.body) }}
      />
      {flashcard.explanation && (
        <div
          className="flashcard-explanation html-content"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(flashcard.explanation),
          }}
        />
      )}
    </div>
  );
}
