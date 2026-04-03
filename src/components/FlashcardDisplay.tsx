"use client";

import type { Flashcard } from "@/types";

interface FlashcardDisplayProps {
  flashcard: Flashcard;
}

export function FlashcardDisplay({ flashcard }: FlashcardDisplayProps) {
  return (
    <div className="flashcard-display">
      <div className="flashcard-body">{flashcard.body}</div>
      {flashcard.explanation && (
        <div className="flashcard-explanation">{flashcard.explanation}</div>
      )}
    </div>
  );
}
