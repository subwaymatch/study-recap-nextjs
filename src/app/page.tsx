"use client";

import { useState } from "react";
import { useModules } from "@/hooks/useModules";
import { ModuleCard } from "@/components/ModuleCard";

export default function ModuleSelectPage() {
  const { modules, loading, error } = useModules();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(15);
  const [randomizeMcq, setRandomizeMcq] = useState(false);

  if (loading) {
    return <div className="loading-screen">Loading modules...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="module-select">
      <h1>Study Recap</h1>

      <div className="timer-config">
        <label>
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
          />
          Auto-advance
        </label>
        {timerEnabled && (
          <label>
            every
            <input
              type="number"
              min={5}
              max={120}
              value={intervalSeconds}
              onChange={(e) =>
                setIntervalSeconds(Math.max(5, Number(e.target.value)))
              }
            />
            seconds
          </label>
        )}
      </div>

      <div className="timer-config">
        <label>
          <input
            type="checkbox"
            checked={randomizeMcq}
            onChange={(e) => setRandomizeMcq(e.target.checked)}
          />
          Randomize MCQ options
        </label>
      </div>

      <div className="module-grid">
        {modules.map((m) => (
          <ModuleCard
            key={m.module_id}
            module={m}
            timerEnabled={timerEnabled}
            intervalSeconds={intervalSeconds}
            randomizeMcq={randomizeMcq}
          />
        ))}
      </div>
    </div>
  );
}
