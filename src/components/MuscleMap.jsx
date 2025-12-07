import React from "react";
import { MUSCLES } from "../data/muscles";

const LEVEL_COLORS = {
  Beginner: "#4b5563",       // grå
  Novice: "#2563eb",         // blå
  Intermediate: "#10b981",   // grön
  Advanced: "#f59e0b",       // orange
  Elite: "#e11d48",          // röd/violett
};

export default function MuscleMap({ muscleStats = {} }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Muskelkarta 💪</h3>
      <div className="small" style={{ marginBottom: 10 }}>
        Färger och procent baseras på dina bästa lyft jämfört med StrengthLevel-style standarder.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
        }}
      >
        {MUSCLES.map((m) => {
          const s = muscleStats[m.id] || { percent: 0, levelKey: "Beginner" };
          const color = LEVEL_COLORS[s.levelKey] || LEVEL_COLORS.Beginner;

          return (
            <div
              key={m.id}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                background: "rgba(15,23,42,0.9)",
                border: `1px solid ${color}88`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color, fontWeight: 500 }}>{s.levelKey}</span>
              </div>

              <div className="progress-wrap">
                <div
                  className="progress-fill"
                  style={{
                    width: `${s.percent}%`,
                    background: color,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 11,
                  marginTop: 4,
                  textAlign: "right",
                  color: "#9ca3af",
                }}
              >
                {s.percent}% mot Elite
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
