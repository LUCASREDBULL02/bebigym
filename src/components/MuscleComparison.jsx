// src/components/MuscleComparison.jsx
import React from "react";

export default function MuscleComparison({ data }) {
  if (!data) return null;

  return (
    <div className="card small">
      <h3 style={{ marginTop: 0 }}>Muskeljämförelse 📊</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map((row) => (
          <div key={row.label}>
            <div
              style={{
                fontSize: 13,
                marginBottom: 2,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{row.label}</span>
              <span>{row.value}%</span>
            </div>

            <div
              style={{
                height: 10,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${row.value}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#ff6ea1,#ff2f7c)",
                  transition: "0.25s",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
