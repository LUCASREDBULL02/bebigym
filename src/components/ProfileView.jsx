import React, { useState } from "react";
import BebiAvatar from "./BebiAvatar.jsx";

const MEASUREMENT_FIELDS = [
  { key: "waist", label: "Midja (cm)" },
  { key: "hips", label: "Höft (cm)" },
  { key: "thigh", label: "Lår (cm)" },
  { key: "glutes", label: "Rumpa (cm)" },
  { key: "chest", label: "Bröst (cm)" },
  { key: "arm", label: "Arm (cm)" },
];

export default function ProfileView({
  profile,
  setProfile,
  bodyStats,
  onAddMeasurement,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);

  const [mField, setMField] = useState("waist");
  const [mValue, setMValue] = useState("");
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));

  function handleSaveProfile() {
    setProfile(form);
    setEditing(false);
  }

  function handleAddMeasurement() {
    if (!mValue) return;
    onAddMeasurement(mField, {
      date: mDate,
      value: Number(mValue),
    });
    setMValue("");
  }

  function latestMeasurement(key) {
    const arr = bodyStats?.[key] || [];
    if (!arr.length) return null;
    const sorted = [...arr].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sorted[0];
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Profil 💗</h2>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <BebiAvatar size={70} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {profile.name}{" "}
            <span style={{ fontSize: 14, opacity: 0.8 }}>
              ({profile.nick})
            </span>
          </div>
          <div className="small">
            {profile.height} cm • {profile.weight} kg • {profile.age} år
          </div>
          {!editing && (
            <button
              className="btn"
              style={{ marginTop: 6, fontSize: 11, padding: "4px 8px" }}
              onClick={() => setEditing(true)}
            >
              ✏️ Redigera profil
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div>
            <label className="small">Namn</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="small">Smeknamn</label>
            <input
              className="input"
              value={form.nick}
              onChange={(e) => setForm({ ...form, nick: e.target.value })}
            />
          </div>
          <div>
            <label className="small">Ålder</label>
            <input
              className="input"
              type="number"
              value={form.age}
              onChange={(e) =>
                setForm({ ...form, age: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="small">Längd (cm)</label>
            <input
              className="input"
              type="number"
              value={form.height}
              onChange={(e) =>
                setForm({ ...form, height: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="small">Vikt (kg)</label>
            <input
              className="input"
              type="number"
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: Number(e.target.value) })
              }
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 8,
              marginTop: 6,
            }}
          >
            <button className="btn-pink" onClick={handleSaveProfile}>
              💾 Spara
            </button>
            <button
              className="btn"
              onClick={() => {
                setForm(profile);
                setEditing(false);
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Kroppsmått */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid rgba(148,163,184,0.3)",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14 }}>
          Kroppsmått 📏
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 6,
            alignItems: "center",
          }}
        >
          <select
            className="input"
            value={mField}
            onChange={(e) => setMField(e.target.value)}
          >
            {MEASUREMENT_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          <input
            className="input"
            type="number"
            placeholder="cm"
            value={mValue}
            onChange={(e) => setMValue(e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={mDate}
            onChange={(e) => setMDate(e.target.value)}
          />

          <button
            className="btn-pink"
            style={{ fontSize: 11, padding: "6px 8px" }}
            onClick={handleAddMeasurement}
          >
            ➕
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
            gap: 6,
          }}
        >
          {MEASUREMENT_FIELDS.map((f) => {
            const last = latestMeasurement(f.key);
            return (
              <div key={f.key} className="card small">
                <div style={{ fontSize: 12, opacity: 0.8 }}>{f.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {last ? `${last.value} cm` : "-"}
                </div>
                {last && (
                  <div className="small" style={{ opacity: 0.7 }}>
                    Senast: {last.date}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
