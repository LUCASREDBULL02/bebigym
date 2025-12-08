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
      date: newMeasurement.date || todayStr,
      value: Number(newMeasurement.value),
    };

    onAddMeasurement(newMeasurement.key, entry);

    setNewMeasurement((prev) => ({
      ...prev,
      value: "",
    }));
  }

  function MeasurementSparkline({ list }) {
    if (!list || list.length < 2) return null;

    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const values = sorted.map((m) => m.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const width = 120;
    const height = 36;

    const points = sorted
      .map((m, idx) => {
        const x =
          sorted.length === 1
            ? width / 2
            : (idx / (sorted.length - 1)) * width;
        const y = height - ((m.value - min) / span) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg className="measure-sparkline" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  }

  function getSummary(list) {
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const diff = last.value - first.value;
    return { first, last, diff };
  }

  return (
    <div className="profile-page">
      <h2 className="profile-header">👤 Din profil & kroppsmått</h2>

      {/* GRUNDINFO */}
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
              onChange={(e) =>
                setForm({ ...form, height: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Vikt (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: e.target.value })
              }
            />
          </div>
        </div>

        <button className="btn-save" onClick={handleSaveProfile}>
          💾 Spara profil
        </button>
      </div>

      {/* KROPPSMÅTT */}
      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått & utveckling</h3>

        {/* Lägg till nytt mått */}
        <div className="measurement-add">
          <select
            value={newMeasurement.key}
            onChange={(e) =>
              setNewMeasurement((prev) => ({
                ...prev,
                key: e.target.value,
              }))
            }
          >
            {Object.entries(measurementLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="cm"
            value={newMeasurement.value}
            onChange={(e) =>
              setNewMeasurement((prev) => ({
                ...prev,
                value: e.target.value,
              }))
            }
          />

          <input
            type="date"
            value={newMeasurement.date}
            onChange={(e) =>
              setNewMeasurement((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
          />

          <button className="btn-add" onClick={handleAddMeasurement}>
            ➕
          </button>
        </div>

        {/* Lista + grafer */}
        {Object.entries(bodyStats).map(([key, list]) => {
          const summary = getSummary(list);

          return (
            <div key={key} className="measure-block">
              <div className="measure-header-row">
                <div>
                  <h4 className="measure-title">
                    {measurementLabels[key]}
                  </h4>
                  {summary ? (
                    <div className="measure-meta">
                      Senast: <strong>{summary.last.value} cm</strong> (
                      {summary.last.date}) • Förändring:{" "}
                      <strong>
                        {summary.diff > 0 ? "+" : ""}
                        {summary.diff.toFixed(1)} cm
                      </strong>
                    </div>
                  ) : (
                    <div className="measure-meta">
                      Inga värden ännu – lägg till första måttet ✨
                    </div>
                  )}
                </div>

                <MeasurementSparkline list={list} />
              </div>

              {list.length === 0 && (
                <p className="empty-text">Inga registrerade värden.</p>
              )}

              {list.length > 0 && (
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
          );
        })}
      </div>
    </div>
  );
}
