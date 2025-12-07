import React from "react";

export default function MuscleTooltip({ muscle, stat }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "-10px",
        right: "-10px",
        padding: "8px 10px",
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(148,163,184,0.4)",
        borderRadius: 10,
        fontSize: 12,
        zIndex: 50,
        width: 190,
        color: "#e5e7eb",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{muscle.name}</div>

      <div style={{ fontSize: 11, marginBottom: 3 }}>
        <b>Nivå:</b> {stat.levelKey}
      </div>
      <div style={{ fontSize: 11, marginBottom: 3 }}>
        <b>Score:</b> {stat.score.toFixed(2)}
      </div>
      <div style={{ fontSize: 11, marginBottom: 3 }}>
        <b>Percent:</b> {stat.percent}%
      </div>

      <div
        style={{
          height: 4,
          width: "100%",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 3,
          marginTop: 6,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${stat.percent}%`,
            background:
              stat.levelKey === "Elite"
                ? "#4d79ff"
                : stat.levelKey === "Advanced"
                ? "#66cc66"
                : stat.levelKey === "Intermediate"
                ? "#ffd24d"
                : stat.levelKey === "Novice"
                ? "#ff994d"
                : "#ff4d4d",
            borderRadius: 3,
            transition: "width 0.25s",
          }}
        ></div>
      </div>
    </div>
  );
}
