import React from "react";
import avatarImg from "../assets/avatar.png";

export default function BebiAvatar({ size = 60, mood = "neutral" }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        overflow: "hidden",
        border: "2px solid #ec4899",
        boxShadow: "0 4px 12px rgba(236, 72, 153, 0.5)",
      }}
    >
      <img
        src={avatarImg}
        alt="Bebi Avatar"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
