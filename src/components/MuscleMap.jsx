// src/components/MuscleMap.jsx
import React from "react";
import { MUSCLES } from "../data/muscles";

const LEVEL_COLORS = {
  Beginner: "#4b5563",       // grå
  Novice: "#2563eb",         // blå
  Intermediate: "#10b981",   // grön
  Advanced: "#f59e0b",       // orange
  Elite: "#e11d48",          // röd/violett
};

export default function MuscleMap({ muscleStats }) {
  if (!muscleStats) return null;

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Muskelkarta 💪</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {MUSCLES.map((m) => {
          const s = muscleStats[m.id] || { percent: 0, levelKey: "Beginner" };
          const bg = LEVEL_COLORS[s.levelKey] || LEVEL_COLORS["Beginner"];
          return (
            <div
              key={m.id}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: `rgba(30, 41, 59, 0.85)`,
                border: `2px solid ${bg}`,
                color: "#e5e7eb",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                {m.name}
              </div>
              <div
                style={{
                  height: 8,
                  background: "#1e293b",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${s.percent}%`,
                    background: bg,
                    height: "100%",
                    transition: "width 0.4s ease-in-out",
                  }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                {s.percent}% — {s.levelKey}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
