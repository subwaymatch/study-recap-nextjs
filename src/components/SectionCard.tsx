"use client";

import Link from "next/link";
import { PlayIcon } from "@/components/Icons";

interface SectionCardProps {
  code: string;
  name: string;
  moduleCount: number;
  flashcardCount: number;
  mcqCount: number;
  selected: boolean;
  studyHref: string | null;
  onToggle: () => void;
}

export function SectionCard({
  code,
  name,
  moduleCount,
  flashcardCount,
  mcqCount,
  selected,
  studyHref,
  onToggle,
}: SectionCardProps) {
  const empty = moduleCount === 0;
  return (
    <div
      className={`section-hero-card${selected ? " selected" : ""}${empty ? " empty" : ""}`}
      data-section={code}
    >
      <button
        type="button"
        className="section-hero-body"
        onClick={onToggle}
        disabled={empty}
        aria-pressed={selected}
        aria-label={`Filter by ${name}${selected ? " (selected)" : ""}`}
      >
        <div className="section-hero-head">
          <span className="section-hero-code">{code}</span>
          <span className="section-hero-check" aria-hidden="true">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>
        <span className="section-hero-name">{name}</span>
        <div className="section-hero-stats">
          <span>
            <strong>{moduleCount}</strong> modules
          </span>
          <span className="section-hero-dot" aria-hidden="true">
            ·
          </span>
          <span>
            <strong>{flashcardCount + mcqCount}</strong> cards
          </span>
        </div>
      </button>
      {studyHref && !empty && (
        <Link
          href={studyHref}
          className="section-hero-play"
          aria-label={`Study all ${code}`}
          onClick={(e) => e.stopPropagation()}
        >
          <PlayIcon size={12} />
          <span>Study all</span>
        </Link>
      )}
    </div>
  );
}
