"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useModules } from "@/hooks/useModules";
import { ModuleCard } from "@/components/ModuleCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ModuleGridSkeleton } from "@/components/LoadingSkeleton";
import { AlertCircleIcon } from "@/components/Icons";

const SECTIONS = ["FAR", "AUD", "REG", "ISC"] as const;

export default function ModuleSelectPage() {
  const { modules, loading, error } = useModules();
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(20);
  const [randomizeMcq, setRandomizeMcq] = useState(false);
  const [shuffleCards, setShuffleCards] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(true);
  const [showMcqs, setShowMcqs] = useState(true);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(),
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
      result = result.filter((m) => m.flashcard_count > 0 || m.mcq_count > 0);
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
    return `/study/sections?${params.toString()}`;
  }, [selectedSections, timerEnabled, intervalSeconds, randomizeMcq, shuffleCards, showFlashcards, showMcqs]);

  const viewAllCounts = useMemo(() => {
    if (selectedSections.size === 0) return null;
    const sectionModules = modules.filter((m) =>
      selectedSections.has(m.section),
    );
    return {
      flashcards: sectionModules.reduce((sum, m) => sum + m.flashcard_count, 0),
      mcqs: sectionModules.reduce((sum, m) => sum + m.mcq_count, 0),
    };
  }, [modules, selectedSections]);

  if (loading) {
    return <ModuleGridSkeleton />;
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-screen-content">
          <AlertCircleIcon style={{ opacity: 0.6 }} />
          <p>{error}</p>
          <button className="nav-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-select">
      <div className="module-select-header">
        <h1>Study Recap</h1>
        <ThemeToggle />
      </div>

      <div className="options-bar">
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
              checked={shuffleCards}
              onChange={(e) => setShuffleCards(e.target.checked)}
            />
            Shuffle card order
          </label>
        </div>

        <div className="timer-config">
          <label>
            <input
              type="checkbox"
              checked={showFlashcards}
              onChange={(e) => setShowFlashcards(e.target.checked)}
            />
            Flashcards
          </label>
          <label>
            <input
              type="checkbox"
              checked={showMcqs}
              onChange={(e) => setShowMcqs(e.target.checked)}
            />
            MCQs
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
            View All ({viewAllCounts.flashcards} flashcards,{" "}
            {viewAllCounts.mcqs} MCQs)
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
            shuffleCards={shuffleCards}
            showFlashcards={showFlashcards}
            showMcqs={showMcqs}
          />
        ))}
      </div>
    </div>
  );
}
