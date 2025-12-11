import React, { useEffect, useState } from "react";

/**
 * Simple 28-day cycle calendar.
 * - Stores phases in localStorage "bebi_cycle_phases"
 * - Exposes onPhaseChange(phase) when user clicks a day to toggle phase
 *
 * Phase mapping: menses / follicular / ovulation / luteal
 */

const DEFAULT_PHASES = () => {
  // default: days 1-5 menses, 6-13 follicular, 14 ovulation, 15-28 luteal
  const arr = new Array(28).fill("follicular");
  for (let i = 0; i < 5; i++) arr[i] = "menses";
  arr[13] = "ovulation";
  for (let i = 14; i < 28; i++) arr[i] = "luteal";
  return arr;
};

export default function CycleCalendar({ onPhaseChange }) {
  const [phases, setPhases] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_cycle_phases");
      return s ? JSON.parse(s) : DEFAULT_PHASES();
    } catch {
      return DEFAULT_PHASES();
    }
  });

  useEffect(() => {
    localStorage.setItem("bebi_cycle_phases", JSON.stringify(phases));
  }, [phases]);

  function togglePhase(idx) {
    // cycle through phases
    const order = ["menses", "follicular", "ovulation", "luteal"];
    const cur = phases[idx] || "follicular";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    const copy = phases.slice();
    copy[idx] = next;
    setPhases(copy);
    if (onPhaseChange) onPhaseChange(next);
  }

  return (
    <div>
      <h4 style={{ marginTop: 0 }}>Menscykel (28 dagar)</h4>
      <div className="cycle-heatmap" aria-hidden>
        {phases.map((p, i) => (
          <button
            key={i}
            className={`cycle-day ${p === "menses" ? "low" : p === "ovulation" ? "high" : p === "luteal" ? "mid" : ""}`}
            title={`Dag ${i + 1}: ${p}`}
            onClick={() => togglePhase(i)}
            style={{ border: "none", cursor: "pointer" }}
          >
            <span style={{ display: "none" }}>{i + 1}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-dim)" }}>
        Klicka en dag för att ändra fas. Appen kan använda fas för att anpassa intensitet.
      </div>
    </div>
  );
}
