import React, { useState, useEffect } from "react";

/**
 * ProfileView.jsx
 *
 * Props:
 * - profile: object
 * - setProfile: fn(updatedProfile)
 * - bodyStats: { waist: [], hips: [], ... }
 * - onAddMeasurement(key, entry)
 * - onDeleteMeasurement(key, id)
 *
 * Denna komponent hanterar även inline-redigering av mått.
 */

export default function ProfileView({
  profile,
  setProfile,
  bodyStats,
  onAddMeasurement,
  onDeleteMeasurement,
}) {
  const [form, setForm] = useState({
    name: profile.name || "",
    nick: profile.nick || "",
    age: profile.age || "",
    height: profile.height || "",
    weight: profile.weight || "",
  });

  // sync form när prop ändras (t.ex. från persistent storage)
  useEffect(() => {
    setForm({
      name: profile.name || "",
      nick: profile.nick || "",
      age: profile.age || "",
      height: profile.height || "",
      weight: profile.weight || "",
    });
  }, [profile]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const [newMeasurement, setNewMeasurement] = useState({
    key: "waist",
    value: "",
    date: todayStr,
  });

  const [editing, setEditing] = useState({
    // struktur: { key: { id: { value, date, editing } } }
  });

  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    key: null,
    id: null,
  });

  const measurementLabels = {
    waist: "Midja",
    hips: "Höfter",
    thigh: "Lår",
    glutes: "Glutes",
    chest: "Bröst",
    arm: "Arm",
  };

  function uid() {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).slice(2, 9);
    }
  }

  function handleSaveProfile() {
    setProfile({
      ...profile,
      name: form.name,
      nick: form.nick,
      age: Number(form.age || 0),
      height: Number(form.height || 0),
      weight: Number(form.weight || 0),
    });
  }

  function handleAddMeasurement() {
    if (!newMeasurement.value) return;
    const entry = {
      id: uid(),
      date: newMeasurement.date || todayStr,
      value: Number(newMeasurement.value),
    };
    onAddMeasurement(newMeasurement.key, entry);
    setNewMeasurement((p) => ({ ...p, value: "" }));
  }

  // Inline-edit functions
  function startEdit(key, m) {
    setEditing((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [m.id]: { value: m.value, date: m.date, editing: true },
      },
    }));
  }

  function cancelEdit(key, id) {
    setEditing((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev[key] };
      delete copy[id];
      return { ...prev, [key]: copy };
    });
  }

  function saveEdit(key, id) {
    const data = editing?.[key]?.[id];
    if (!data) return;
    // Delete old + add new with same id (we call onDelete + onAdd for simplicity)
    // Better to expose a dedicated onUpdateMeasurement from parent — but we'll implement here:
    // Remove old entry and create new with same id/date/value via onAddMeasurement
    onDeleteMeasurement(key, id);
    const entry = { id, date: data.date, value: Number(data.value) };
    onAddMeasurement(key, entry);
    cancelEdit(key, id);
  }

  function handleDeleteRequest(key, id) {
    setConfirmDelete({ open: true, key, id });
  }

  function confirmDeleteNow() {
    const { key, id } = confirmDelete;
    if (key && id) onDeleteMeasurement(key, id);
    setConfirmDelete({ open: false, key: null, id: null });
  }

  // Small sparkline renderer (svg)
  function MeasurementSparkline({ list }) {
    if (!list || list.length < 2) return null;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const vals = sorted.map((s) => s.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const w = 120;
    const h = 36;
    const pts = sorted
      .map((m, i) => {
        const x = sorted.length === 1 ? w / 2 : (i / (sorted.length - 1)) * w;
        const y = h - ((m.value - min) / span) * h;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg className="measure-sparkline" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* --- Grundinfo --- */}
      <div className="profile-card">
        <h3 className="section-title">🧸 Grundinfo</h3>

        <div className="input-group">
          <label>Namn</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="input-group">
          <label>Smeknamn</label>
          <input value={form.nick} onChange={(e) => setForm({ ...form, nick: e.target.value })} />
        </div>

        <div className="profile-grid">
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

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn-save" onClick={handleSaveProfile}>
            💾 Spara profil
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              setForm({
                name: profile.name || "",
                nick: profile.nick || "",
                age: profile.age || "",
                height: profile.height || "",
                weight: profile.weight || "",
              });
            }}
          >
            Återställ
          </button>
        </div>
      </div>

      {/* --- Kroppsmått --- */}
      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått & utveckling</h3>

        <div className="measurement-add">
          <select
            value={newMeasurement.key}
            onChange={(e) => setNewMeasurement((p) => ({ ...p, key: e.target.value }))}
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
            onChange={(e) => setNewMeasurement((p) => ({ ...p, value: e.target.value }))}
          />

          <input type="date" value={newMeasurement.date} onChange={(e) => setNewMeasurement((p) => ({ ...p, date: e.target.value }))} />

          <button className="btn-add" onClick={handleAddMeasurement} aria-label="Lägg till mått">
            ➕
          </button>
        </div>

        {/* Lista per mått */}
        <div className="measurements-grid">
          {Object.entries(measurementLabels).map(([key, label]) => {
            const list = (bodyStats && bodyStats[key]) || [];
            const summary = getSummary(list);
            return (
              <div key={key} className="measure-block">
                <div className="measure-header-row">
                  <div style={{ flex: 1 }}>
                    <h4 className="measure-title">{label}</h4>
                    {summary ? (
                      <div className="measure-meta">
                        Senast: <strong>{summary.last.value} cm</strong> ({summary.last.date}) • Förändring:{" "}
                        <strong>
                          {summary.diff > 0 ? "+" : ""}
                          {summary.diff.toFixed(1)} cm
                        </strong>
                      </div>
                    ) : (
                      <div className="measure-meta">Inga värden ännu – lägg till första måttet ✨</div>
                    )}
                  </div>

                  <div style={{ width: 140, display: "flex", justifyContent: "flex-end" }}>
                    <MeasurementSparkline list={list} />
                  </div>
                </div>

                {list.length === 0 ? (
                  <p className="empty-text">Inga registrerade värden.</p>
                ) : (
                  <div className="measure-list">
                    {list
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((m) => {
                        const editState = editing?.[key]?.[m.id];
                        return (
                          <div key={m.id} className="measure-item">
                            {!editState?.editing ? (
                              <>
                                <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                                  <div style={{ minWidth: 160 }}>
                                    {m.date}: <strong>{m.value} cm</strong>
                                  </div>

                                  <div className="measure-actions" style={{ marginLeft: "auto" }}>
                                    <button className="btn-sm" onClick={() => startEdit(key, m)}>
                                      ✏️
                                    </button>
                                    <button className="btn-sm danger" onClick={() => handleDeleteRequest(key, m.id)}>
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                                  <input
                                    type="date"
                                    value={editState.date}
                                    onChange={(e) =>
                                      setEditing((prev) => ({
                                        ...prev,
                                        [key]: { ...(prev[key] || {}), [m.id]: { ...prev[key][m.id], date: e.target.value } },
                                      }))
                                    }
                                  />
                                  <input
                                    type="number"
                                    value={editState.value}
                                    onChange={(e) =>
                                      setEditing((prev) => ({
                                        ...prev,
                                        [key]: { ...(prev[key] || {}), [m.id]: { ...prev[key][m.id], value: e.target.value } },
                                      }))
                                    }
                                  />
                                  <button className="btn-sm" onClick={() => saveEdit(key, m.id)}>
                                    💾
                                  </button>
                                  <button className="btn-sm" onClick={() => cancelEdit(key, m.id)}>
                                    ✖
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bekräftelse modal för radering */} 
      {confirmDelete.open && (
        <div className="modal-backdrop small" onClick={() => setConfirmDelete({ open: false, key: null, id: null })}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Radera mått?</div>
            <div style={{ marginBottom: 12 }}>Är du säker på att du vill radera detta mått? Detta går inte att ångra.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setConfirmDelete({ open: false, key: null, id: null })}>
                Avbryt
              </button>
              <button className="btn-danger" onClick={confirmDeleteNow}>
                Radera permanent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
