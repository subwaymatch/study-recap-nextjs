"use client";

interface CardProgressTrackProps {
  currentIndex: number;
  totalCards: number;
}

export function CardProgressTrack({
  currentIndex,
  totalCards,
}: CardProgressTrackProps) {
  const pct = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  return (
    <div
      className="card-progress-track"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={totalCards}
      aria-label={`Card ${currentIndex + 1} of ${totalCards}`}
    >
      <div className="card-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
