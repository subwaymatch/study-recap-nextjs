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
        <div className="study-header-left">
          <div className="skeleton-icon-btn skeleton-shimmer" />
        </div>
        <div className="study-header-center">
          <div className="skeleton-module-badge skeleton-shimmer" />
        </div>
        <div className="study-header-right">
          <div className="skeleton-counter skeleton-shimmer" />
          <div className="skeleton-icon-btn skeleton-shimmer" />
          <div className="skeleton-icon-btn skeleton-shimmer" />
        </div>
      </div>
      <div className="card-content">
        <div className="card-content-inner">
          <div className="card-top-bar">
            <div className="skeleton-type-badge skeleton-shimmer" />
          </div>
          <div className="skeleton-study-content">
            <div className="skeleton-line skeleton-line-lg skeleton-shimmer" />
            <div className="skeleton-line skeleton-line-lg skeleton-shimmer" style={{ width: "85%" }} />
            <div className="skeleton-line skeleton-line-lg skeleton-shimmer" style={{ width: "60%" }} />
            <div className="skeleton-spacer" />
            <div className="skeleton-line skeleton-line-md skeleton-shimmer" />
            <div className="skeleton-line skeleton-line-md skeleton-shimmer" style={{ width: "90%" }} />
          </div>
        </div>
      </div>
      <div className="nav-buttons">
        <div className="skeleton-nav-btn skeleton-shimmer" />
        <div className="skeleton-nav-btn skeleton-shimmer" />
        <div className="skeleton-nav-btn skeleton-shimmer" />
      </div>
    </div>
  );
}
