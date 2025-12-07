import React from "react";
import avatar from "../assets/avatar.png"; // fungerar på desktop + mobil + Vercel

export default function BebiAvatar({ size = 70 }) {
  return (
    <img
      src={avatar}
      alt="Bebi Avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #EC4899",
        boxShadow: "0 0 12px #ec4899aa",
      }}
    />
  );
}

