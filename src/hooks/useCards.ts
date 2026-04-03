"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import type { Flashcard, MCQ, StudyCard } from "@/types";

export function useCards(moduleId: number) {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();
      const [flashcardsRes, mcqsRes] = await Promise.all([
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
        (f) => ({ type: "flashcard" as const, data: f })
      );
      const mcqs: StudyCard[] = (mcqsRes.data as MCQ[]).map((m) => ({
        type: "mcq" as const,
        data: m,
      }));

      setCards([...flashcards, ...mcqs]);
      setLoading(false);
    }

    fetchCards();
  }, [moduleId]);

  return { cards, loading, error };
}
