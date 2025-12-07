import React from "react";
import avatar from "../assets/avatar.png";

export default function BebiAvatar({ size = 60 }) {
  return (
    <img
      src={avatar}
      alt="Avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid #ec4899",
        objectFit: "cover",
      }}
    />
  );
}
