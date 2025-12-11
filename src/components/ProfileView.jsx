import React, { useState } from "react";
import BodyStatsChart from "./BodyStatsChart.jsx";

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

  const [measurement, setMeasurement] = useState({
    key: "waist",
    value: "",
    date: todayStr,
  });

  const labels = {
    waist: "Midja",
    hips: "Höfter",
    thigh: "Lår",
    glutes: "Glutes",
    chest: "Bröst",
    arm: "Arm",
  };

  const icons = {
    waist: "📏",
    hips: "🔹",
    thigh: "🦵",
    glutes: "🍑",
    chest: "💨",
    arm: "💪",
  };

  function saveProfile() {
    setProfile({
      ...profile,
      name: form.name,
      nick: form.nick,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
    });
  }

  function addMeasurement() {
    if (!measurement.value) return;

    const entry = {
      id: crypto.randomUUID(),
      date: measurement.date,
      value: Number(measurement.value),
    };

    onAddMeasurement(measurement.key, entry);

    setMeasurement((p) => ({ ...p, value: "" }));
  }

  function Sparkline({ list }) {
  <BodyStatsChart label={labels[key]} list={list} />

    if (!list || list.length < 2) return null;

    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const values = sorted.map((m) => m.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    return (
      <svg width="120" height="38" viewBox="0 0 120 38" className="spark">
        <polyline
          fill="none"
          stroke="#ff8aba"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={sorted
            .map((m, i) => {
              const x =
                sorted.length === 1 ? 60 : (i / (sorted.length - 1)) * 120;
              const y = 38 - ((m.value - min) / span) * 38;
              return `${x},${y}`;
            })
            .join(" ")}
        />
      </svg>
    );
  }

  return (
    <div className="profile-page">
      <h2 className="profile-title">👤 Din profil & kroppsmått</h2>

      {/* ----------- PROFILE CARD ----------- */}
      <div className="profile-card">
        <h3 className="section-title">🧸 Grundinfo</h3>

        <div className="input-block">
          <label>Namn</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="input-block">
          <label>Smeknamn</label>
          <input
            value={form.nick}
            onChange={(e) => setForm({ ...form, nick: e.target.value })}
          />
        </div>

        <div className="grid-3">
          <div className="input-block">
            <label>Ålder</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>

          <div className="input-block">
            <label>Längd (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
          </div>

          <div className="input-block">
            <label>Vikt (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </div>
        </div>

        <button className="btn-save" onClick={saveProfile}>
          💾 Spara profil
        </button>
      </div>

      {/* ----------- MEASUREMENTS CARD ----------- */}
      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått & utveckling</h3>

        {/* Add new measurement */}
        <div className="measure-add">
          <select
            value={measurement.key}
            onChange={(e) =>
              setMeasurement((prev) => ({ ...prev, key: e.target.value }))
            }
          >
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="cm"
            value={measurement.value}
            onChange={(e) =>
              setMeasurement((prev) => ({ ...prev, value: e.target.value }))
            }
          />

          <input
            type="date"
            value={measurement.date}
            onChange={(e) =>
              setMeasurement((prev) => ({ ...prev, date: e.target.value }))
            }
          />

          <button className="btn-add" onClick={addMeasurement}>
            ➕
          </button>
        </div>

        {/* Display measurement blocks */}
        {Object.entries(bodyStats).map(([key, list]) => (
          <div key={key} className="measure-block">
            <div className="measure-header">
              <div>
                <h4 className="measure-title">
                  {icons[key]} {labels[key]}
                </h4>
                {list.length > 0 ? (
                  <div className="measure-info">
                    Senast:{" "}
                    <strong>
                      {list[list.length - 1].value} cm
                    </strong>{" "}
                    ({list[list.length - 1].date})
                  </div>
                ) : (
                  <div className="measure-info">Inga värden ännu ✨</div>
                )}
              </div>

              <Sparkline list={list} />
            </div>

            {/* List items */}
            {list.length > 0 && (
              <div className="measure-list">
                {list
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <div key={m.id} className="measure-item">
                      <span>
                        {m.date} — <strong>{m.value} cm</strong>
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
