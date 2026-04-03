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
      const { data, error: err } = await getSupabase()
        .from("b_modules")
        .select("module_id, section_title, unit_title, module_title, flashcard_count, homework_mcq_count")
        .order("module_id", { ascending: true });

      if (err) {
        setError(err.message);
      } else {
        setModules(data ?? []);
      }
      setLoading(false);
    }

    fetchModules();
  }, []);

  return { modules, loading, error };
}
