"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import type { Flashcard, MCQ, StudyCard } from "@/types";

export interface ModuleInfo {
  section: string;
  module: string;
  module_title: string;
}

export function useCards(moduleId: number) {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();
      const [flashcardsRes, mcqsRes, moduleRes] = await Promise.all([
        supabase
          .from("b_flashcards")
          .select("*")
          .eq("module_id", moduleId)
          .order("flashcard_number", { ascending: true }),
        supabase
          .from("b_mcqs")
          .select("*")
          .eq("module_id", moduleId)
          .order("question_number", { ascending: true }),
        supabase
          .from("b_modules")
          .select("section, module, module_title")
          .eq("module_id", moduleId)
          .single(),
      ]);

      if (flashcardsRes.error) {
        setError(flashcardsRes.error.message);
        setLoading(false);
        return;
      }
      if (mcqsRes.error) {
        setError(mcqsRes.error.message);
        setLoading(false);
        return;
      }

      if (moduleRes.data) {
        setModuleInfo(moduleRes.data as ModuleInfo);
      }

      const flashcards: StudyCard[] = (flashcardsRes.data as Flashcard[]).map(
        (f) => ({ type: "flashcard" as const, data: { ...f, card_id: `flashcard-${f.id}` } })
      );
      const mcqs: StudyCard[] = (mcqsRes.data as MCQ[]).map((m) => ({
        type: "mcq" as const,
        data: { ...m, card_id: `mcq-${m.id}` },
      }));

      setCards([...flashcards, ...mcqs]);
      setLoading(false);
    }

    fetchCards();
  }, [moduleId]);

  return { cards, moduleInfo, loading, error };
}
