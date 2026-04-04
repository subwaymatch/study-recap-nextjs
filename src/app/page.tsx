"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useModules } from "@/hooks/useModules";
import { ModuleCard } from "@/components/ModuleCard";

const SECTIONS = ["FAR", "AUD", "REG", "ISC"] as const;

export default function ModuleSelectPage() {
  const { modules, loading, error } = useModules();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(15);
  const [randomizeMcq, setRandomizeMcq] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (section: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const filteredModules = useMemo(() => {
    let result = modules;
    if (selectedSections.size > 0) {
      result = result.filter((m) => selectedSections.has(m.section));
    }
    if (hideEmpty) {
      result = result.filter(
        (m) => m.flashcard_count > 0 || m.mcq_count > 0
      );
    }
    return result;
  }, [modules, selectedSections, hideEmpty]);

  const viewAllHref = useMemo(() => {
    if (selectedSections.size === 0) return null;
    const params = new URLSearchParams();
    params.set("sections", Array.from(selectedSections).join(","));
    if (timerEnabled) {
      params.set("timer", "true");
      params.set("interval", String(intervalSeconds));
    }
    if (randomizeMcq) {
      params.set("randomize", "true");
    }
    return `/study/sections?${params.toString()}`;
  }, [selectedSections, timerEnabled, intervalSeconds, randomizeMcq]);

  const viewAllCounts = useMemo(() => {
    if (selectedSections.size === 0) return null;
    const sectionModules = modules.filter((m) => selectedSections.has(m.section));
    return {
      flashcards: sectionModules.reduce((sum, m) => sum + m.flashcard_count, 0),
      mcqs: sectionModules.reduce((sum, m) => sum + m.mcq_count, 0),
    };
  }, [modules, selectedSections]);

  if (loading) {
    return <div className="loading-screen">Loading modules...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="module-select">
      <h1>Study Recap</h1>

      <div className="timer-config">
        <label>
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
          />
          Auto-advance
        </label>
        {timerEnabled && (
          <label>
            every
            <input
              type="number"
              min={5}
              max={120}
              value={intervalSeconds}
              onChange={(e) =>
                setIntervalSeconds(Math.max(5, Number(e.target.value)))
              }
            />
            seconds
          </label>
        )}
      </div>

      <div className="timer-config">
        <label>
          <input
            type="checkbox"
            checked={randomizeMcq}
            onChange={(e) => setRandomizeMcq(e.target.checked)}
          />
          Randomize MCQ options
        </label>
      </div>

      <div className="timer-config">
        <label>
          <input
            type="checkbox"
            checked={hideEmpty}
            onChange={(e) => setHideEmpty(e.target.checked)}
          />
          Hide empty modules
        </label>
      </div>

      <div className="section-filter">
        {SECTIONS.map((section) => (
          <button
            key={section}
            className={`section-filter-btn${selectedSections.has(section) ? " active" : ""}`}
            onClick={() => toggleSection(section)}
          >
            {section}
          </button>
        ))}

        {viewAllHref && viewAllCounts && (
          <Link href={viewAllHref} className="section-filter-btn view-all-btn">
            View All ({viewAllCounts.flashcards} flashcards, {viewAllCounts.mcqs} MCQs)
          </Link>
        )}
      </div>

      <div className="module-grid">
        {filteredModules.map((m) => (
          <ModuleCard
            key={m.module_id}
            module={m}
            timerEnabled={timerEnabled}
            intervalSeconds={intervalSeconds}
            randomizeMcq={randomizeMcq}
          />
        ))}
      </div>
    </div>
  );
}
