import React, { useState } from "react";
import BodyMeasurementChart from "./BodyMeasurementChart";

export default function ProfileView({
  profile,
  setProfile,
  bodyStats,
  onAddMeasurement,
  onDeleteMeasurement,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

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
      ...form,
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

  function getSummary(list) {
    if (!list || list.length < 2) return null;

    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      change: (last.value - first.value).toFixed(1),
      first,
      last,
    };
  }

  return (
    <div className="profile-page">

      {/* HEADER */}
      <h2 className="profile-header">👤 Din profil & utveckling</h2>

      {/* --- PROFILKORT --- */}
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

      {/* --- KROPPSMÅTT --- */}
      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått</h3>

        <div className="measurement-add">
          <select
            value={newMeasurement.key}
            onChange={(e) =>
              setNewMeasurement({ ...newMeasurement, key: e.target.value })
            }
          >
            {Object.entries(measurementLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
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

        {/* LOOPA ALLA MÅTT */}
        {Object.entries(bodyStats).map(([key, list]) => {
          const summary = getSummary(list);

          return (
            <div key={key} className="measure-block">
              <h4 className="measure-title">
                {measurementLabels[key]}
              </h4>

              {summary ? (
                <p className="measure-meta">
                  Senaste: <b>{summary.last.value} cm</b>  
                  ({summary.last.date})  
                  • Förändring: <b>{summary.change} cm</b>
                </p>
              ) : (
                <p className="measure-meta">Inga värden ännu ✨</p>
              )}

              {/* Full graf */}
              <BodyMeasurementChart
                list={list}
                label={measurementLabels[key]}
              />

              {/* Lista */}
              <div className="measure-list">
                {list
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <div key={m.id} className="measure-item">
                      <span>
                        {m.date}: <b>{m.value} cm</b>
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

            </div>
          );
        })}
      </div>

    </div>
  );
}
