"use client";

import { useMemo } from "react";
import type { MCQ } from "@/types";
import { sanitizeHtml, extractOptionHtml } from "@/lib/html";

interface MCQDisplayProps {
  mcq: MCQ;
  randomize?: boolean;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Replace placeholder values like #1#, "#2#", or &quot;#3#&quot; in explanation HTML
 * with the actual option labels based on the current display order.
 * originalIndexToLabel maps original 0-based index to the display label (e.g., "A", "B").
 */
function replaceExplanationPlaceholders(
  html: string,
  originalIndexToLabel: Map<number, string>
): string {
  return html.replace(/(?:&quot;|")?#(\d+)#(?:&quot;|")?/g, (_, num) => {
    const originalIndex = parseInt(num, 10) - 1;
    const label = originalIndexToLabel.get(originalIndex);
    return label ?? `"#${num}#"`;
  });
}

export function MCQDisplay({ mcq, randomize = false }: MCQDisplayProps) {
  const originalOptions = [
    mcq.option_text1,
    mcq.option_text2,
    mcq.option_text3,
    mcq.option_text4,
  ];
  const originalExplanations = [
    mcq.explanation1,
    mcq.explanation2,
    mcq.explanation3,
    mcq.explanation4,
  ];
  const correctOriginalIndex = mcq.correct_option_number - 1;

  // Each entry is the original index (0-3), potentially shuffled
  const displayOrder = useMemo(() => {
    const indices = [0, 1, 2, 3];
    if (!randomize) return indices;
    // Use mcq.id as seed for stable randomization per question
    return shuffleWithSeed(indices, mcq.id);
  }, [randomize, mcq.id]);

  // Map from original index to displayed label
  const originalIndexToLabel = useMemo(() => {
    const map = new Map<number, string>();
    displayOrder.forEach((origIdx, displayIdx) => {
      map.set(origIdx, OPTION_LABELS[displayIdx]);
    });
    return map;
  }, [displayOrder]);

  // Build correct answer's display index
  const correctDisplayIndex = displayOrder.indexOf(correctOriginalIndex);

  // Order explanations: correct first, then incorrect in display order
  const orderedExplanations = useMemo(() => {
    const result: { explanation: string; label: string; isCorrect: boolean }[] =
      [];

    // Correct explanation first
    const correctExpl = originalExplanations[correctOriginalIndex];
    if (correctExpl) {
      result.push({
        explanation: correctExpl,
        label: OPTION_LABELS[correctDisplayIndex],
        isCorrect: true,
      });
    }

    // Incorrect explanations in display order
    displayOrder.forEach((origIdx, displayIdx) => {
      if (origIdx === correctOriginalIndex) return;
      const expl = originalExplanations[origIdx];
      if (expl) {
        result.push({
          explanation: expl,
          label: OPTION_LABELS[displayIdx],
          isCorrect: false,
        });
      }
    });

    return result;
  }, [
    displayOrder,
    correctOriginalIndex,
    correctDisplayIndex,
    originalExplanations,
  ]);

  return (
    <div className="mcq-display">
      <div
        className="mcq-body html-content"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(mcq.body) }}
      />
      <div className="mcq-options">
        {displayOrder.map((origIdx, displayIdx) => (
          <div
            key={origIdx}
            className={`mcq-option${origIdx === correctOriginalIndex ? " correct" : ""}`}
          >
            <span className="option-label">
              {OPTION_LABELS[displayIdx]}.
            </span>
            <span
              dangerouslySetInnerHTML={{
                __html: extractOptionHtml(originalOptions[origIdx]),
              }}
            />
          </div>
        ))}
      </div>
      {orderedExplanations.length > 0 && (
        <div className="mcq-explanation">
          {orderedExplanations.map(({ explanation, label, isCorrect }) => (
            <div key={label} className="mcq-explanation-item">
              <strong>
                {isCorrect
                  ? `Explanation (${label} — Correct):`
                  : `Explanation (${label}):`}
              </strong>
              <div
                className="html-content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    replaceExplanationPlaceholders(
                      explanation,
                      originalIndexToLabel
                    )
                  ),
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
