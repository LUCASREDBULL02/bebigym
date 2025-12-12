// src/components/Achievements.jsx
import React from "react";

export default function Achievements({ unlocked }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>🏅 Achievements</h2>

      {!unlocked.length && (
        <p className="small" style={{ opacity: 0.7 }}>
          Inga achievements än – du får dem genom att träna! 💖
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 12,
        }}
      >
        {unlocked.map((a) => (
          <div
            key={a.id}
            className="card"
            style={{
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 26 }}>{a.emoji}</div>

            <div>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              <div className="small" style={{ opacity: 0.8 }}>
                {a.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
