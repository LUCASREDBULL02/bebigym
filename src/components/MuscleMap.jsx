// src/components/MuscleMap.jsx
import React from "react";

export default function MuscleMap({ muscleStats }) {
  if (!muscleStats) return null;

  function getColor(pct) {
    if (pct < 40) return "#ffb6d5"; // light pink
    if (pct < 80) return "#ff6ea1"; // normal
    return "#ff2f7c"; // strong pink
  }

  const groups = [
    { id: "chest", label: "Bröst" },
    { id: "glutes", label: "Glutes" },
    { id: "back", label: "Rygg" },
  ];

  return (
    <div className="card small" style={{ textAlign: "center" }}>
      <h3 style={{ marginTop: 0 }}>Muscle Map 💪</h3>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
        {groups.map((m) => {
          const stat = muscleStats[m.id];
          const pct = stat?.percent || 0;
          const color = getColor(pct);

          return (
            <div
              key={m.id}
              style={{
                width: 90,
                height: 140,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                padding: 10,
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(6px)",
              }}
            >
              {/* Simple stylized silhouette */}
              <svg width="100%" height="80" viewBox="0 0 40 60">
                <rect
                  x="10"
                  y="10"
                  width="20"
                  height="40"
                  rx="10"
                  fill={color}
                  opacity="0.7"
                />
              </svg>

              <div style={{ fontWeight: 700, marginTop: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{pct}%</div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  color: color,
                  fontWeight: 600,
                }}
              >
                {stat?.levelKey}
              </div>
            </div>
          );
        })}
      </div>

      <div className="small" style={{ marginTop: 8 }}>
        Procent = styrka relativt “Advanced”-nivå
      </div>
    </div>
  );
}
