"use client";

import Link from "next/link";
import type { Module } from "@/types";

interface ModuleCardProps {
  module: Module;
  timerEnabled: boolean;
  intervalSeconds: number;
}

export function ModuleCard({
  module,
  timerEnabled,
  intervalSeconds,
}: ModuleCardProps) {
  const params = new URLSearchParams();
  if (timerEnabled) {
    params.set("timer", "true");
    params.set("interval", String(intervalSeconds));
  }
  const query = params.toString();
  const href = `/study/${module.module_id}${query ? `?${query}` : ""}`;
  const disabled = module.flashcard_count === 0 && module.mcq_count === 0;

  const content = (
    <>
      <div className="section-title">{module.section_title}</div>
      <div className="unit-title">{module.unit_title}</div>
      <div className="module-title">{module.module_title}</div>
      <div className="counts">
        <span>{module.flashcard_count} flashcards</span>
        <span>{module.mcq_count} MCQs</span>
      </div>
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
