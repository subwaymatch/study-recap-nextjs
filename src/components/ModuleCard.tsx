"use client";

import Link from "next/link";
import type { Module } from "@/types";

interface ModuleCardProps {
  module: Module;
  timerEnabled: boolean;
  intervalSeconds: number;
  randomizeMcq: boolean;
  shuffleCards: boolean;
  showFlashcards: boolean;
  showMcqs: boolean;
}

export function ModuleCard({
  module,
  timerEnabled,
  intervalSeconds,
  randomizeMcq,
  shuffleCards,
  showFlashcards,
  showMcqs,
}: ModuleCardProps) {
  const params = new URLSearchParams();
  if (timerEnabled) {
    params.set("timer", "true");
    params.set("interval", String(intervalSeconds));
  }
  if (randomizeMcq) {
    params.set("randomize", "true");
  }
  if (shuffleCards) {
    params.set("shuffle", "true");
  }
  if (!showFlashcards || !showMcqs) {
    const typesList = [
      showFlashcards && "flashcard",
      showMcqs && "mcq",
    ].filter(Boolean).join(",");
    params.set("types", typesList);
  }
  const query = params.toString();
  const href = `/study/${module.module_id}${query ? `?${query}` : ""}`;
  const disabled = module.flashcard_count === 0 && module.mcq_count === 0;

  const content = (
    <>
      <div className="module-card-body">
        <div className="section-title">{module.section}</div>
        <div className="module-title">{module.module} {module.module_title}</div>
        <div className="counts">
          <span>{module.flashcard_count} flashcards</span>
          <span>{module.mcq_count} MCQs</span>
        </div>
      </div>
      {!disabled && (
        <span className="module-card-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <div className="module-card module-card-disabled">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="module-card">
      {content}
    </Link>
  );
}
