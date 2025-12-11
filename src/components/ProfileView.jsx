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

  const todayStr = new Date().toISOString().slice(0, 10);

  const [newMeasurement, setNewMeasurement] = useState({
    key: "waist",
    value: "",
    date: todayStr,
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
      date: newMeasurement.date,
      value: Number(newMeasurement.value),
    };

    onAddMeasurement(newMeasurement.key, entry);
    setNewMeasurement((prev) => ({ ...prev, value: "" }));
  }

  function MeasurementSparkline({ list }) {
    if (!list || list.length < 2) return null;

    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const values = sorted.map((m) => m.value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const width = 150;
    const height = 40;

    const points = sorted
      .map((m, i) => {
        const x =
          sorted.length === 1 ? width / 2 : (i / (sorted.length - 1)) * width;
        const y = height - ((m.value - min) / span) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <div className="profile-page">

      <h2 className="profile-header">👤 Din profil</h2>

      {/* ------- Profil kort -------- */}
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

        <button className="btn-save" onClick={handleSaveProfile}>
          💾 Spara profil
        </button>
      </div>

      {/* ------- Kroppsmått -------- */}
      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått</h3>

        <div className="measurement-add">
          <select
            value={newMeasurement.key}
            onChange={(e) =>
              setNewMeasurement({ ...newMeasurement, key: e.target.value })
            }
          >
            {Object.entries(measurementLabels).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
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

          <input
            type="date"
            value={newMeasurement.date}
            onChange={(e) =>
              setNewMeasurement({ ...newMeasurement, date: e.target.value })
            }
          />

          <button className="btn-add" onClick={handleAddMeasurement}>
            ➕
          </button>
        </div>

        {/* Lista över mått */}
        {Object.entries(bodyStats).map(([key, list]) => (
          <div key={key} className="measure-block">
            <div className="measure-header-row">
              <h4 className="measure-title">{measurementLabels[key]}</h4>
              <MeasurementSparkline list={list} />
            </div>

            {/* Lista */}
            {list.length === 0 ? (
              <p className="empty-text">Inga mått registrerade än.</p>
            ) : (
              <div className="measure-list">
                {list
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <div key={m.id} className="measure-item">
                      <span>
                        {m.date}: <strong>{m.value} cm</strong>
                      </span>

                      <button
                        className="delete-btn"
                        onClick={() => onDeleteMeasurement(key, m.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
