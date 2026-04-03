"use client";

import type { MCQ } from "@/types";

interface MCQDisplayProps {
  mcq: MCQ;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function MCQDisplay({ mcq }: MCQDisplayProps) {
  const options = [
    mcq.option_text1,
    mcq.option_text2,
    mcq.option_text3,
    mcq.option_text4,
  ];
  const explanations = [
    mcq.explanation1,
    mcq.explanation2,
    mcq.explanation3,
    mcq.explanation4,
  ];
  const correctIndex = mcq.correct_option_number - 1;
  const correctExplanation = explanations[correctIndex];

  return (
    <div className="mcq-display">
      <div className="mcq-body">{mcq.body}</div>
      <div className="mcq-options">
        {options.map((text, i) => (
          <div
            key={i}
            className={`mcq-option${i === correctIndex ? " correct" : ""}`}
          >
            <span className="option-label">{OPTION_LABELS[i]}.</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
      {correctExplanation && (
        <div className="mcq-explanation">
          <strong>Explanation:</strong> {correctExplanation}
        </div>
      )}
    </div>
  );
}
