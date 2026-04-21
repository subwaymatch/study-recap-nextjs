"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useModules } from "@/hooks/useModules";
import { ModuleCard } from "@/components/ModuleCard";
import { SectionCard } from "@/components/SectionCard";
import { StudySettings } from "@/components/StudySettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ModuleGridSkeleton } from "@/components/LoadingSkeleton";
import {
  AlertCircleIcon,
  SettingsIcon,
  SearchIcon,
  SparklesIcon,
  CloseIcon,
} from "@/components/Icons";
import type { Module } from "@/types";

const SECTIONS = ["FAR", "AUD", "REG", "ISC"] as const;
type SectionCode = (typeof SECTIONS)[number];

const SECTION_NAMES: Record<SectionCode, string> = {
  FAR: "Financial Accounting & Reporting",
  AUD: "Auditing & Attestation",
  REG: "Regulation",
  ISC: "Information Systems & Controls",
};

const STORAGE_KEY = "studyRecap_prefs";

function buildStudyParams(opts: {
  timerEnabled: boolean;
  intervalSeconds: number;
  randomizeMcq: boolean;
  shuffleCards: boolean;
  showFlashcards: boolean;
  showMcqs: boolean;
  sections?: string[];
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("index", "0");
  if (opts.sections && opts.sections.length > 0) {
    params.set("sections", opts.sections.join(","));
  }
  if (opts.timerEnabled) {
    params.set("timer", "true");
    params.set("interval", String(opts.intervalSeconds));
  }
  if (opts.randomizeMcq) {
    params.set("randomize", "true");
  }
  if (opts.shuffleCards) {
    params.set("shuffle", "true");
  }
  if (!opts.showFlashcards || !opts.showMcqs) {
    const typesList = [
      opts.showFlashcards && "flashcard",
      opts.showMcqs && "mcq",
    ]
      .filter(Boolean)
      .join(",");
    params.set("types", typesList);
  }
  return params;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (typeof prefs.timerEnabled === "boolean") setTimerEnabled(prefs.timerEnabled);
      if (typeof prefs.intervalSeconds === "number") setIntervalSeconds(prefs.intervalSeconds);
      if (typeof prefs.randomizeMcq === "boolean") setRandomizeMcq(prefs.randomizeMcq);
      if (typeof prefs.shuffleCards === "boolean") setShuffleCards(prefs.shuffleCards);
      if (typeof prefs.showFlashcards === "boolean") setShowFlashcards(prefs.showFlashcards);
      if (typeof prefs.showMcqs === "boolean") setShowMcqs(prefs.showMcqs);
      if (typeof prefs.hideEmpty === "boolean") setHideEmpty(prefs.hideEmpty);
      if (Array.isArray(prefs.selectedSections)) {
        setSelectedSections(new Set(prefs.selectedSections.filter((s: unknown) => SECTIONS.includes(s as SectionCode))));
      }
    } catch {
      // ignore malformed data
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          timerEnabled,
          intervalSeconds,
          randomizeMcq,
          shuffleCards,
          showFlashcards,
          showMcqs,
          hideEmpty,
          selectedSections: Array.from(selectedSections),
        }),
      );
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [timerEnabled, intervalSeconds, randomizeMcq, shuffleCards, showFlashcards, showMcqs, hideEmpty, selectedSections]);

  // Keyboard shortcut: "/" focuses the search input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const sectionStats = useMemo(() => {
    const stats: Record<string, { modules: number; flashcards: number; mcqs: number }> = {};
    for (const s of SECTIONS) {
      stats[s] = { modules: 0, flashcards: 0, mcqs: 0 };
    }
    for (const m of modules) {
      const s = stats[m.section];
      if (!s) continue;
      const nonEmpty = m.flashcard_count > 0 || m.mcq_count > 0;
      if (nonEmpty) s.modules += 1;
      s.flashcards += m.flashcard_count;
      s.mcqs += m.mcq_count;
    }
    return stats;
  }, [modules]);

  const totals = useMemo(() => {
    return SECTIONS.reduce(
      (acc, s) => {
        const st = sectionStats[s];
        return {
          modules: acc.modules + st.modules,
          flashcards: acc.flashcards + st.flashcards,
          mcqs: acc.mcqs + st.mcqs,
        };
      },
      { modules: 0, flashcards: 0, mcqs: 0 },
    );
  }, [sectionStats]);

  const filteredModules = useMemo(() => {
    let result = modules;
    if (selectedSections.size > 0) {
      result = result.filter((m) => selectedSections.has(m.section));
    }
    if (hideEmpty) {
      result = result.filter((m) => m.flashcard_count > 0 || m.mcq_count > 0);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((m) => {
        const hay = `${m.module} ${m.module_title} ${m.unit ?? ""} ${m.unit_title ?? ""} ${m.section}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return result;
  }, [modules, selectedSections, hideEmpty, searchQuery]);

  // Group filtered modules by section for display.
  const groupedModules = useMemo(() => {
    const groups: Record<string, Module[]> = {};
    for (const m of filteredModules) {
      (groups[m.section] ??= []).push(m);
    }
    return SECTIONS.map((s) => ({ section: s, modules: groups[s] ?? [] })).filter(
      (g) => g.modules.length > 0,
    );
  }, [filteredModules]);

  const sectionStudyHref = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of SECTIONS) {
      const params = buildStudyParams({
        timerEnabled,
        intervalSeconds,
        randomizeMcq,
        shuffleCards,
        showFlashcards,
        showMcqs,
        sections: [s],
      });
      map[s] = `/study/sections?${params.toString()}`;
    }
    return map;
  }, [timerEnabled, intervalSeconds, randomizeMcq, shuffleCards, showFlashcards, showMcqs]);

  const viewAllHref = useMemo(() => {
    if (selectedSections.size === 0) return null;
    const params = buildStudyParams({
      timerEnabled,
      intervalSeconds,
      randomizeMcq,
      shuffleCards,
      showFlashcards,
      showMcqs,
      sections: Array.from(selectedSections),
    });
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

  const activeFiltersCount =
    selectedSections.size +
    (searchQuery.trim() ? 1 : 0);

  const clearFilters = () => {
    setSelectedSections(new Set());
    setSearchQuery("");
  };

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
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark" aria-hidden="true">
            <SparklesIcon size={18} />
          </span>
          <div className="home-brand-text">
            <h1>Study Recap</h1>
            <span className="home-brand-tagline">
              {totals.modules} modules · {totals.flashcards.toLocaleString()} flashcards · {totals.mcqs.toLocaleString()} MCQs
            </span>
          </div>
        </div>
        <div className="home-header-actions">
          <button
            type="button"
            className="home-icon-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open study settings"
            title="Study settings"
          >
            <SettingsIcon size={18} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <section className="section-hero-grid" aria-label="Sections">
        {SECTIONS.map((code) => (
          <SectionCard
            key={code}
            code={code}
            name={SECTION_NAMES[code]}
            moduleCount={sectionStats[code].modules}
            flashcardCount={sectionStats[code].flashcards}
            mcqCount={sectionStats[code].mcqs}
            selected={selectedSections.has(code)}
            studyHref={sectionStats[code].modules > 0 ? sectionStudyHref[code] : null}
            onToggle={() => toggleSection(code)}
          />
        ))}
      </section>

      <div className="home-toolbar">
        <div className="home-search">
          <SearchIcon size={14} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search modules, units, titles…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search modules"
          />
          {searchQuery && (
            <button
              type="button"
              className="home-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <CloseIcon size={14} />
            </button>
          )}
          <kbd className="home-search-kbd" aria-hidden="true">
            /
          </kbd>
        </div>

        <div className="home-toolbar-actions">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="home-chip home-chip-clear"
              onClick={clearFilters}
              title="Clear filters"
            >
              Clear filters
              <CloseIcon size={12} />
            </button>
          )}
          {viewAllHref && viewAllCounts && (
            <Link href={viewAllHref} className="home-study-btn">
              <span className="home-study-btn-text">
                Study {selectedSections.size} section
                {selectedSections.size > 1 ? "s" : ""}
              </span>
              <span className="home-study-btn-counts">
                {viewAllCounts.flashcards + viewAllCounts.mcqs} cards
              </span>
            </Link>
          )}
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div className="home-empty">
          <span className="home-empty-icon" aria-hidden="true">
            <SearchIcon size={22} />
          </span>
          <p>No modules match your filters.</p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="nav-btn"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="module-groups">
          {groupedModules.map(({ section, modules: groupModules }) => (
            <section key={section} className="module-group" aria-label={`${SECTION_NAMES[section as SectionCode]} modules`}>
              <header className="module-group-header">
                <div className="module-group-title">
                  <span
                    className="module-group-badge"
                    data-section={section}
                  >
                    {section}
                  </span>
                  <span className="module-group-name">
                    {SECTION_NAMES[section as SectionCode]}
                  </span>
                </div>
                <span className="module-group-count">
                  {groupModules.length}{" "}
                  {groupModules.length === 1 ? "module" : "modules"}
                </span>
              </header>
              <div className="module-grid">
                {groupModules.map((m) => (
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
            </section>
          ))}
        </div>
      )}

      <StudySettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        timerEnabled={timerEnabled}
        onTimerEnabledChange={setTimerEnabled}
        intervalSeconds={intervalSeconds}
        onIntervalSecondsChange={setIntervalSeconds}
        randomizeMcq={randomizeMcq}
        onRandomizeMcqChange={setRandomizeMcq}
        shuffleCards={shuffleCards}
        onShuffleCardsChange={setShuffleCards}
        showFlashcards={showFlashcards}
        onShowFlashcardsChange={setShowFlashcards}
        showMcqs={showMcqs}
        onShowMcqsChange={setShowMcqs}
        hideEmpty={hideEmpty}
        onHideEmptyChange={setHideEmpty}
      />
    </div>
  );
}
