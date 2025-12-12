// src/components/PRList.jsx
import React from "react";
import { EXERCISES } from "../data/exercises";

export default function PRList({ prMap }) {
  function Spark({ history }) {
    if (!history || history.length < 2) return null;

    const sorted = [...history].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const vals = sorted.map((h) => h.oneRm);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;

    const width = 120;
    const height = 40;

    const pts = sorted
      .map((h, i) => {
        const x =
          sorted.length === 1 ? width / 2 : (i / (sorted.length - 1)) * width;
        const y = height - ((h.oneRm - min) / span) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} style={{ opacity: 0.9 }}>
        <polyline
          fill="none"
          stroke="#ff6ea1"
          strokeWidth="2"
          points={pts}
        />
      </svg>
    );
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>🏆 PR-historik</h2>

      {Object.keys(prMap).length === 0 && (
        <p className="small">Inga PR än – logga tunga set!</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.entries(prMap).map(([id, data]) => {
          const ex = EXERCISES.find((e) => e.id === id);
          return (
            <div
              key={id}
              className="card"
              style={{
                padding: 12,
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {ex?.name || id}
                </div>
                <div className="small" style={{ opacity: 0.8 }}>
                  Bästa 1RM: <strong>{data.best1RM} kg</strong>
                </div>
              </div>

              <Spark history={data.history} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
