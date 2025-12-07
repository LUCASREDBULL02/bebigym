import React from "react";
import BebiAvatar from "./BebiAvatar.jsx";

export default function ProfileCard({ profile }) {
  return (
    <div
      className="card"
      style={{
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <BebiAvatar size={80} />

      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {profile.name}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          {profile.height} cm • {profile.weight} kg • {profile.age} år
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            background: "#ec48991a",
            color: "#ec4899",
            padding: "4px 8px",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          Bebi-mode aktiv 💖
        </div>
      </div>
    </div>
  );
}
