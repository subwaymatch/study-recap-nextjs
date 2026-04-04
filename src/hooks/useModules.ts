"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import type { Module } from "@/types";

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      const supabase = getSupabase();

      const [modulesRes, flashcardsRes, mcqsRes] = await Promise.all([
        supabase
          .from("b_modules")
          .select("module_id, section, module, unit, section_title, unit_title, module_title, module_order")
          .order("module_id", { ascending: true }),
        supabase.from("b_flashcards").select("module_id"),
        supabase.from("b_mcqs").select("module_id"),
      ]);

      if (modulesRes.error) {
        setError(modulesRes.error.message);
        setLoading(false);
        return;
      }

      // Count flashcards per module
      const flashcardCounts = new Map<number, number>();
      for (const row of flashcardsRes.data ?? []) {
        flashcardCounts.set(row.module_id, (flashcardCounts.get(row.module_id) ?? 0) + 1);
      }

      // Count MCQs per module
      const mcqCounts = new Map<number, number>();
      for (const row of mcqsRes.data ?? []) {
        mcqCounts.set(row.module_id, (mcqCounts.get(row.module_id) ?? 0) + 1);
      }

      const SECTION_ORDER: Record<string, number> = { FAR: 0, AUD: 1, REG: 2, ISC: 3 };

      const modules = (modulesRes.data ?? []).map((m) => ({
        ...m,
        module_order: m.module_order ?? null,
        flashcard_count: flashcardCounts.get(m.module_id) ?? 0,
        mcq_count: mcqCounts.get(m.module_id) ?? 0,
      }));

      modules.sort((a, b) => {
        const sectionDiff = (SECTION_ORDER[a.section] ?? 99) - (SECTION_ORDER[b.section] ?? 99);
        if (sectionDiff !== 0) return sectionDiff;
        return (a.module_order ?? Infinity) - (b.module_order ?? Infinity);
      });

      setModules(modules);
      setLoading(false);
    }

    fetchModules();
  }, []);

  return { modules, loading, error };
}
