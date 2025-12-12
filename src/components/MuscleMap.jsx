// src/components/MuscleMap.jsx
import React from "react";

export default function MuscleMap({ muscleStats }) {
  if (!muscleStats) return null;

  const groups = [
    { id: "glutes", label: "Glutes" },
    { id: "legs", label: "Legs" },
    { id: "back", label: "Back" },
    { id: "chest", label: "Chest" },
    { id: "shoulders", label: "Shoulders" },
    { id: "arms", label: "Arms" },
    { id: "core", label: "Core" },
  ];

  function colorForPct(p) {
    if (p >= 100) return "linear-gradient(90deg,#ffd6e0,#ff6ea1)";
    if (p >= 75) return "linear-gradient(90deg,#ffe4b5,#ffb2c7)";
    if (p >= 50) return "linear-gradient(90deg,#fce7f3,#ffd6e0)";
    return "rgba(255,255,255,0.02)";
  }

  return (
    <div className="card small">
      <h3 style={{ marginTop: 0 }}>Muskelkarta</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {groups.map((g) => {
          const s = muscleStats[g.id] || { percent: 0, levelKey: "Beginner" };
          return (
            <div key={g.id} style={{ padding: 10, borderRadius: 10, background: colorForPct(s.percent), border: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{g.label}</div>
              <div className="small">{s.levelKey}</div>
              <div style={{ marginTop: 6, height: 8, background: "rgba(0,0,0,0.15)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100,s.percent)}%`, height: "100%", background: "linear-gradient(90deg,#ff6ea1,#ff2f7c)" }} />
              </div>
              <div style={{ fontSize: 12, marginTop:6 }}>{s.percent}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
