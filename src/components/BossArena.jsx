// src/components/BossArena.jsx
import React from "react";

export default function BossArena({ bosses }) {
  if (!bosses) return null;

  function bar(pct) {
    return (
      <div
        style={{
          height: 10,
          width: "100%",
          borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff6ea1, #ff2f7c)",
            transition: "0.3s",
          }}
        />
      </div>
    );
  }

  function BossCard({ boss }) {
    const pct = Math.round((1 - boss.currentHP / boss.maxHP) * 100);

    return (
      <div
        className="card"
        style={{
          padding: 18,
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {boss.label} {boss.emoji}
        </div>

        <div className="small">
          HP: {boss.currentHP} / {boss.maxHP}
        </div>

        {bar(pct)}

        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          {pct}% defeated
        </div>
      </div>
    );
  }

  return (
    <div className="boss-arena">
      <h3 style={{ marginTop: 0 }}>Boss Arena 🐲</h3>
      <p className="small" style={{ marginBottom: 12 }}>
        Logga tunga set för att skada bossarna!
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <BossCard boss={bosses.chest} />
        <BossCard boss={bosses.glute} />
        <BossCard boss={bosses.back} />
      </div>
    </div>
  );
}
