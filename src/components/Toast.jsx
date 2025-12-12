// src/components/Toast.jsx
import React, { useEffect } from "react";

export default function Toast({ title, subtitle }) {
  useEffect(() => {
    const t = setTimeout(() => {}, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed",
      right: 20,
      bottom: 20,
      zIndex: 120,
      minWidth: 220,
    }}>
      <div style={{
        background: "linear-gradient(90deg,#ff6ea1,#ff2f7c)",
        color: "white",
        padding: "10px 14px",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(255,46,122,0.14)"
      }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, opacity: 0.95 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
