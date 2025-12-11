// src/components/Toast.jsx
import React from "react";

export default function Toast({ title, subtitle }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255, 110, 161, 0.22)",
        backdropFilter: "blur(12px) saturate(140%)",
        padding: "12px 20px",
        borderRadius: "14px",
        boxShadow: "0 8px 26px rgba(0,0,0,0.35)",
        zIndex: 200,
        color: "white",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        animation: "fadeIn .25s ease",
      }}
    >
      <strong style={{ fontSize: 15 }}>{title}</strong>
      {subtitle && <span style={{ opacity: 0.8 }}>{subtitle}</span>}
    </div>
  );
}
