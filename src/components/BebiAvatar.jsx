import React, { useState } from "react";
import avatarFile from "../assets/avatar.png";

// Absolut säker fallback (inlines SVG avatar if file fails)
const fallbackAvatar =
  "data:image/svg+xml;base64," +
  btoa(`
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="#ec4899"/>
  <text x="50%" y="55%" font-size="60" text-anchor="middle" fill="white" dy=".3em">💖</text>
</svg>
`);

export default function BebiAvatar({ size = 70 }) {
  const [src, setSrc] = useState(avatarFile + "?v=" + Date.now());

  return (
    <img
      src={src}
      onError={() => setSrc(fallbackAvatar)}
      alt="Bebi Avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #ec4899",
        boxShadow: "0 0 12px rgba(236,72,153,0.7)",
      }}
    />
  );
}
