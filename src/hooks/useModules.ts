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
          .select("module_id, section, module, section_title, unit_title, module_title")
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

      const modules = (modulesRes.data ?? []).map((m) => ({
        ...m,
        flashcard_count: flashcardCounts.get(m.module_id) ?? 0,
        mcq_count: mcqCounts.get(m.module_id) ?? 0,
      }));

      setModules(modules);
      setLoading(false);
    }

    fetchModules();
  }, []);

  return { modules, loading, error };
}
