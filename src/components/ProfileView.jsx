import React, { useState } from "react";

export default function ProfileView({
  profile,
  setProfile,
  bodyStats,
  onAddMeasurement,
  onDeleteMeasurement,
}) {
  const [form, setForm] = useState({
    name: profile.name,
    nick: profile.nick,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
  });

  const [newMeasurement, setNewMeasurement] = useState({
    key: "waist",
    value: "",
  });

  const measurementLabels = {
    waist: "Midja",
    hips: "Höfter",
    thigh: "Lår",
    glutes: "Glutes",
    chest: "Bröst",
    arm: "Arm",
  };

  function handleSaveProfile() {
    setProfile({
      ...profile,
      name: form.name,
      nick: form.nick,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
    });
  }

  function handleAddMeasurement() {
    if (!newMeasurement.value) return;

    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      value: Number(newMeasurement.value),
    };

    onAddMeasurement(newMeasurement.key, entry);

    setNewMeasurement({ ...newMeasurement, value: "" });
  }

  return (
    <div className="profile-container">

      {/* HEADER */}
      <h2 className="profile-header">👤 Din Profil</h2>

      {/* PROFILE CARD */}
      <div className="profile-card">
        <h3 className="section-title">🧸 Grundinfo</h3>

        <div className="input-group">
          <label>Namn</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label>Smeknamn</label>
          <input
            value={form.nick}
            onChange={(e) => setForm({ ...form, nick: e.target.value })}
          />
        </div>

        <div className="profile-grid">
          <div className="input-group">
            <label>Ålder</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Längd (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Vikt (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </div>
        </div>

        <button className="save-btn" onClick={handleSaveProfile}>
          💾 Spara profil
        </button>
      </div>

      {/* MEASUREMENTS */}
      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått</h3>

        <div className="measure-input">
          <select
            value={newMeasurement.key}
            onChange={(e) =>
              setNewMeasurement({ ...newMeasurement, key: e.target.value })
            }
          >
            {Object.keys(measurementLabels).map((k) => (
              <option key={k} value={k}>
                {measurementLabels[k]}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="cm"
            value={newMeasurement.value}
            onChange={(e) =>
              setNewMeasurement({ ...newMeasurement, value: e.target.value })
            }
          />

          <button className="add-btn" onClick={handleAddMeasurement}>
            ➕
          </button>
        </div>

        {/* LISTA FÖR VARJE KROPPSMÅTT */}
        {Object.keys(bodyStats).map((key) => (
          <div key={key} className="measurement-section">
            <h4 className="measurement-title">{measurementLabels[key]}</h4>

            {bodyStats[key].length === 0 && (
              <p className="empty-text">Inga mått ännu</p>
            )}

            {bodyStats[key].map((m) => (
              <div key={m.id} className="measurement-row">
                <div>
                  {m.date} – <strong>{m.value} cm</strong>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteMeasurement(key, m.id)}
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
