"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import type { Flashcard, MCQ, StudyCard } from "@/types";

export function useSectionCards(sections: string[]) {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sections.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }

    async function fetchCards() {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();

      // First get all module_ids for the selected sections
      const modulesRes = await supabase
        .from("b_modules")
        .select("module_id")
        .in("section", sections);

      if (modulesRes.error) {
        setError(modulesRes.error.message);
        setLoading(false);
        return;
      }

      const moduleIds = (modulesRes.data ?? []).map((m) => m.module_id);

      if (moduleIds.length === 0) {
        setCards([]);
        setLoading(false);
        return;
      }

      const [flashcardsRes, mcqsRes] = await Promise.all([
        supabase
          .from("b_flashcards")
          .select("*")
          .in("module_id", moduleIds)
          .order("module_id", { ascending: true })
          .order("flashcard_number", { ascending: true }),
        supabase
          .from("b_mcqs")
          .select("*")
          .in("module_id", moduleIds)
          .order("module_id", { ascending: true })
          .order("question_number", { ascending: true }),
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
  }, [sections.join(",")]);

  return { cards, loading, error };
}
