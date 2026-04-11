import { stripHtml } from "@/lib/html";
import type { StudyCard } from "@/types";

/**
 * Build a plain-text description of a study card suitable for sending
 * to the Ask AI endpoint as context.
 */
export function buildCardContext(card: StudyCard): string {
  if (card.type === "flashcard") {
    const body = stripHtml(card.data.body);
    const explanation = card.data.explanation
      ? stripHtml(card.data.explanation)
      : "";
    return (
      `Card type: Flashcard\n` +
      `Front:\n${body}` +
      (explanation ? `\n\nExplanation:\n${explanation}` : "")
    );
  }

  const mcq = card.data;
  const labels = ["A", "B", "C", "D"];
  const options = [
    mcq.option_text1,
    mcq.option_text2,
    mcq.option_text3,
    mcq.option_text4,
  ]
    .map((opt, i) => `${labels[i]}. ${stripHtml(opt)}`)
    .join("\n");
  const explanations = [
    mcq.explanation1,
    mcq.explanation2,
    mcq.explanation3,
    mcq.explanation4,
  ]
    .map((expl, i) => (expl ? `${labels[i]}: ${stripHtml(expl)}` : null))
    .filter((s): s is string => Boolean(s))
    .join("\n");
  const correctLabel = labels[mcq.correct_option_number - 1] ?? "?";

  return (
    `Card type: Multiple Choice Question\n` +
    `Question:\n${stripHtml(mcq.body)}\n\n` +
    `Options:\n${options}\n\n` +
    `Correct answer: ${correctLabel}` +
    (explanations ? `\n\nExplanations:\n${explanations}` : "")
  );
}
