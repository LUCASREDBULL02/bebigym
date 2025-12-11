// src/components/ProfileView.jsx
import React, { useMemo, useState } from "react";

function SparklineAll({ bodyStats }) {
  // Combine keys into same timeline (simple overlay)
  const keys = Object.keys(bodyStats);
  const allPoints = {};
  keys.forEach((k) => {
    (bodyStats[k] || []).forEach((m) => {
      allPoints[m.date] = allPoints[m.date] || {};
      allPoints[m.date][k] = m.value;
    });
  });

  const dates = Object.keys(allPoints).sort();
  if (dates.length < 2) return null;

  // Normalize values per metric to fit same chart area
  const width = 720;
  const height = 180;
  const padding = 20;

  const series = keys.map((k) => {
    const values = dates.map((d) => (allPoints[d][k] !== undefined ? allPoints[d][k] : null));
    const numeric = values.filter((v) => v !== null);
    const min = numeric.length ? Math.min(...numeric) : 0;
    const max = numeric.length ? Math.max(...numeric) : min + 1;
    return { key: k, values, min, max };
  });

  const colors = ["#ff6ea1", "#ffb6d5", "#ffd6e0", "#f9c2ff", "#ffd7a8", "#bfe7ff"];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 200 }}>
      <rect fill="transparent" x="0" y="0" width={width} height={height} rx="12" />
      {series.map((s, idx) => {
        const points = s.values.map((v, i) => {
          const x = padding + (i / Math.max(1, dates.length - 1)) * (width - padding * 2);
          const y = v === null ? height - padding : padding + ((s.max - v) / (s.max - s.min || 1)) * (height - padding * 2);
          return `${x},${y}`;
        });
        return (
          <polyline
            key={s.key}
            fill="none"
            stroke={colors[idx % colors.length]}
            strokeWidth={2.2}
            points={points.join(" ")}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.95}
          />
        );
      })}
    </svg>
  );
}

export default function ProfileView({ profile, setProfile, bodyStats, onAddMeasurement, onDeleteMeasurement }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    nick: profile.nick || "",
    age: profile.age || "",
    height: profile.height || "",
    weight: profile.weight || "",
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const [newMeasurement, setNewMeasurement] = useState({ key: "waist", value: "", date: todayStr });

  const labels = { waist: "Midja", hips: "Höfter", thigh: "Lår", glutes: "Glutes", chest: "Bröst", arm: "Arm" };

  function handleSaveProfile() {
    setProfile({ ...profile, name: form.name, nick: form.nick, age: Number(form.age), height: Number(form.height), weight: Number(form.weight) });
  }

  function handleAddMeasurement() {
    if (!newMeasurement.value) return;
    const entry = { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), date: newMeasurement.date || todayStr, value: Number(newMeasurement.value) };
    onAddMeasurement(newMeasurement.key, entry);
    setNewMeasurement((p) => ({ ...p, value: "" }));
  }

  const hasAnyMeasurements = Object.values(bodyStats).some((arr) => (arr || []).length > 0);

  return (
    <div className="profile-page">
      <h2 className="profile-header">👤 Din profil & kroppsmått</h2>

      <div className="profile-card">
        <h3 className="section-title">🧸 Grundinfo</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div className="input-group">
              <label>Namn</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Smeknamn</label>
              <input value={form.nick} onChange={(e) => setForm({ ...form, nick: e.target.value })} />
            </div>
          </div>

          <div style={{ width: 160, textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Profil</div>
            <div style={{ fontWeight: 700 }}>{profile.nick}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{profile.height} cm • {profile.weight} kg</div>
          </div>
        </div>

        <div className="profile-grid" style={{ marginTop: 8 }}>
          <div className="input-group">
            <label>Ålder</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Längd (cm)</label>
            <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Vikt (kg)</label>
            <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-save" onClick={handleSaveProfile}>💾 Spara profil</button>
        </div>
      </div>

      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått & utveckling</h3>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <select value={newMeasurement.key} onChange={(e) => setNewMeasurement((p) => ({ ...p, key: e.target.value }))}>
            {Object.entries(labels).map(([k, l]) => <option value={k} key={k}>{l}</option>)}
          </select>
          <input type="number" placeholder="cm" value={newMeasurement.value} onChange={(e) => setNewMeasurement((p) => ({ ...p, value: e.target.value }))} />
          <input type="date" value={newMeasurement.date} onChange={(e) => setNewMeasurement((p) => ({ ...p, date: e.target.value }))} />
          <button className="btn-add btn-pink" style={{ padding: "8px 12px" }} onClick={handleAddMeasurement}>➕ Lägg till</button>
        </div>

        {hasAnyMeasurements ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <strong>Body Progress Dashboard</strong>
              <div className="small">Alla mått över tid — jämför och följ utvecklingen.</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <SparklineAll bodyStats={bodyStats} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
              {Object.entries(labels).map(([key, label]) => {
                const list = (bodyStats[key] || []).slice().sort((a,b) => b.date.localeCompare(a.date));
                const latest = list[0];
                return (
                  <div key={key} className="measure-block card small">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                        <div className="small">{list.length} mätningar</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{latest ? `${latest.value} cm` : "—"}</div>
                        <div className="small">{latest ? latest.date : ""}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {list.length === 0 ? <div className="empty-text">Inga värden ännu</div> : (
                        <div className="measure-list">
                          {list.map((m) => (
                            <div key={m.id} className="measure-item">
                              <div>{m.date}: <strong>{m.value} cm</strong></div>
                              <div>
                                <button className="delete-btn" onClick={() => onDeleteMeasurement(key, m.id)}>🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-text">Inga registrerade kroppsmått ännu — lägg till ett ovan.</div>
        )}
      </div>
    </div>
  );
}
