import React from "react";

export default function ProfileView({ profile, setProfile }) {
  function update(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="card" style={{ padding: 16, maxWidth: 420 }}>
      <h2 style={{ marginTop: 0 }}>Din Profil 💖</h2>

      <label className="small">Vikt (kg)</label>
      <input
        type="number"
        className="input"
        value={profile.weight}
        onChange={(e) => update("weight", Number(e.target.value))}
      />

      <label className="small" style={{ marginTop: 12 }}>Ålder</label>
      <input
        type="number"
        className="input"
        value={profile.age}
        onChange={(e) => update("age", Number(e.target.value))}
      />

      <label className="small" style={{ marginTop: 12 }}>Längd (cm)</label>
      <input
        type="number"
        className="input"
        value={profile.height}
        onChange={(e) => update("height", Number(e.target.value))}
      />

      <p className="small" style={{ marginTop: 14, opacity: 0.7 }}>
        Alla ändringar sparas automatiskt 💖
      </p>
    </div>
  );
}
