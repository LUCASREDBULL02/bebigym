import React, { useState, useEffect } from "react";

export default function ProfileView({ profile, setProfile }) {
  const [temp, setTemp] = useState(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTemp(profile);
  }, [profile]);

  function handleChange(field, value) {
    setTemp((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    setProfile(temp);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "20px",
        width: "100%",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* TOP CARD */}
      <div
        style={{
          background:
            "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
          padding: 25,
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.15)",
          textAlign: "center",
          marginBottom: 22,
          boxShadow: "0 0 22px rgba(0,0,0,0.35)",
        }}
      >
        <img
          src={temp.avatar || "/avatar.png"}
          alt="avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid rgba(255,255,255,0.08)",
            marginBottom: 14,
          }}
        />

        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
          {temp.name}
        </div>

        <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
          @{temp.nick || "no_nickname"}
        </div>
      </div>

      {/* SETTINGS CARD */}
      <div
        style={{
          background: "rgba(15,23,42,0.9)",
          padding: 22,
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.2)",
          boxShadow: "0 0 14px rgba(0,0,0,0.25)",
        }}
      >
        <div style={sectionTitle}>Personlig info</div>

        <Field
          label="Namn"
          value={temp.name}
          onChange={(v) => handleChange("name", v)}
        />

        <Field
          label="Smeknamn"
          value={temp.nick}
          onChange={(v) => handleChange("nick", v)}
        />

        <Field
          label="Ålder"
          type="number"
          value={temp.age}
          onChange={(v) => handleChange("age", Number(v))}
        />

        <div style={{ height: 14 }} />

        <div style={sectionTitle}>Kroppsmått</div>

        <Field
          label="Längd (cm)"
          type="number"
          value={temp.height}
          onChange={(v) => handleChange("height", Number(v))}
        />

        <Field
          label="Vikt (kg)"
          type="number"
          value={temp.weight}
          onChange={(v) => handleChange("weight", Number(v))}
        />

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "12px 0",
            borderRadius: 14,
            background: saved
              ? "rgba(34,197,94,0.4)"
              : "linear-gradient(135deg, #ec4899, #db2777)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "0.25s",
          }}
        >
          {saved ? "✔ Sparad!" : "Spara ändringar"}
        </button>
      </div>
    </div>
  );
}

/* Subcomponent for inputs (cleaner code) */
function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginBottom: 6,
          display: "block",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.4)",
          background: "rgba(255,255,255,0.06)",
          color: "#f1f5f9",
          fontSize: 15,
          outline: "none",
          transition: "0.2s",
        }}
      />
    </div>
  );
}

const sectionTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#e2e8f0",
  marginBottom: 10,
  marginTop: 4,
};
