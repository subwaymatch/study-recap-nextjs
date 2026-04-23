"use client";

import Link from "next/link";

interface SectionCardProps {
  code: string;
  name: string;
  moduleCount: number;
  flashcardCount: number;
  mcqCount: number;
  studyHref: string | null;
}

export function SectionCard({
  code,
  name,
  moduleCount,
  flashcardCount,
  mcqCount,
  studyHref,
}: SectionCardProps) {
  const empty = moduleCount === 0;
  const className = `section-hero-card${empty ? " empty" : ""}`;

  const content = (
    <div className="section-hero-body">
      <div className="section-hero-head">
        <span className="section-hero-code">{code}</span>
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
    </div>
  );

  if (empty || !studyHref) {
    return (
      <div
        className={className}
        data-section={code}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={studyHref}
      className={className}
      data-section={code}
      aria-label={`Study all ${name}`}
    >
      {content}
    </Link>
  );
}
