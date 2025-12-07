import React from "react";
import avatar from "../assets/avatar.png";

export default function BebiAvatar({ size = 70 }) {
  return (
    <img
      src={avatar}
      alt="Avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #ec4899",
        boxShadow: "0 0 12px rgba(236,72,153,0.6)",
      }}
    />
  );
}
