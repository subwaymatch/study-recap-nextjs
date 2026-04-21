"use client";

/**
 * Animated skeleton loading state for the module grid page.
 */
export function ModuleGridSkeleton() {
  return (
    <div className="module-select">
      <div className="skeleton-title skeleton-shimmer" />
      <div className="skeleton-hero-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="skeleton-hero-card skeleton-shimmer"
          />
        ))}
      </div>
      <div className="skeleton-options skeleton-shimmer" />
      <div className="module-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line skeleton-line-xs skeleton-shimmer" style={{ width: "40%" }} />
            <div className="skeleton-line skeleton-line-md skeleton-shimmer" />
            <div className="skeleton-line skeleton-line-xs skeleton-shimmer" style={{ width: "60%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Animated skeleton loading state for a study card.
 */
export function StudyCardSkeleton() {
  return (
    <div className="study-page">
      <div className="study-header">
        <div className="skeleton-line skeleton-line-xs skeleton-shimmer" style={{ width: "60px" }} />
        <div className="skeleton-line skeleton-line-xs skeleton-shimmer" style={{ width: "200px" }} />
        <div className="skeleton-line skeleton-line-xs skeleton-shimmer" style={{ width: "60px" }} />
      </div>
      <div className="card-content">
        <div className="skeleton-study-content">
          <div className="skeleton-line skeleton-line-lg skeleton-shimmer" />
          <div className="skeleton-line skeleton-line-lg skeleton-shimmer" style={{ width: "85%" }} />
          <div className="skeleton-line skeleton-line-lg skeleton-shimmer" style={{ width: "60%" }} />
          <div className="skeleton-spacer" />
          <div className="skeleton-line skeleton-line-md skeleton-shimmer" />
          <div className="skeleton-line skeleton-line-md skeleton-shimmer" style={{ width: "90%" }} />
        </div>
      </div>
      <div className="nav-buttons">
        <div className="skeleton-btn skeleton-shimmer" />
        <div className="skeleton-btn skeleton-shimmer" />
        <div className="skeleton-btn skeleton-shimmer" />
      </div>
    </div>
  );
}
