"use client";

import Link from "next/link";
import type { Module } from "@/types";
import { CardIcon, CheckSquareIcon } from "@/components/Icons";

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
  params.set("index", "0");
  params.set("section", module.section);
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
      <span
        className="module-card-stripe"
        aria-hidden="true"
        data-section={module.section}
      />
      <div className="module-card-body">
        <div className="module-card-meta">
          <span className="module-card-section" data-section={module.section}>
            {module.section}
          </span>
          {module.unit && (
            <span className="module-card-unit">
              Unit {module.unit}
            </span>
          )}
        </div>
        <div className="module-card-title">
          <span className="module-card-num">{module.module}</span>
          <span>{module.module_title}</span>
        </div>
        <div className="module-card-counts">
          <span className="module-card-count">
            <CardIcon size={13} />
            {module.flashcard_count}
            <span className="module-card-count-label">flashcards</span>
          </span>
          <span className="module-card-count">
            <CheckSquareIcon size={13} />
            {module.mcq_count}
            <span className="module-card-count-label">MCQs</span>
          </span>
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
