// src/components/ProfileView.jsx
import React, { useState } from "react";
import BodyMeasurementChart from "./BodyMeasurementChart.jsx";

export default function ProfileView({
  profile,
  setProfile,
  bodyStats,
  onAddMeasurement,
  onDeleteMeasurement
}) {
  const [edit, setEdit] = useState({ ...profile });

  function handleSave() {
    setProfile(edit);
  }

  const measurementFields = [
    ["waist", "Midja"],
    ["hips", "Höfter"],
    ["thigh", "Lår"],
    ["glutes", "Rumpa"],
    ["chest", "Bröst"],
    ["arm", "Arm"],
  ];

  return (
    <div className="card" style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Profil 💗</h2>

      {/* PROFILE INPUTS */}
      <div className="row" style={{ gap: 10 }}>
        <div className="col">
          <label className="small">Namn</label>
          <input
            className="input"
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
          />
        </div>
        <div className="col">
          <label className="small">Nick</label>
          <input
            className="input"
            value={edit.nick}
            onChange={(e) => setEdit({ ...edit, nick: e.target.value })}
          />
        </div>
      </div>

      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <div className="col">
          <label className="small">Ålder</label>
          <input
            type="number"
            className="input"
            value={edit.age}
            onChange={(e) => setEdit({ ...edit, age: Number(e.target.value) })}
          />
        </div>

        <div className="col">
          <label className="small">Längd (cm)</label>
          <input
            type="number"
            className="input"
            value={edit.height}
            onChange={(e) => setEdit({ ...edit, height: Number(e.target.value) })}
          />
        </div>

        <div className="col">
          <label className="small">Vikt (kg)</label>
          <input
            type="number"
            className="input"
            value={edit.weight}
            onChange={(e) => setEdit({ ...edit, weight: Number(e.target.value) })}
          />
        </div>
      </div>

      <button className="btn-pink" style={{ marginTop: 15 }} onClick={handleSave}>
        💾 Spara profil
      </button>

      {/* BODY MEASUREMENTS */}
      <div className="divider" style={{ margin: "25px 0" }} />

      <h2 style={{ marginBottom: 10 }}>Kroppsmått 📏</h2>

      {measurementFields.map(([key, label]) => {
        const list = bodyStats[key] || [];

        return (
          <div key={key} style={{ marginBottom: 25 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{label}</strong>

              <button
                className="btn-pink"
                style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => {
                  const value = prompt(`Ange nytt mått för ${label} (cm)`);
                  if (!value) return;

                  const date = new Date().toISOString().slice(0, 10);

                  onAddMeasurement(key, {
                    id: crypto.randomUUID(),
                    value: Number(value),
                    date,
                  });
                }}
              >
                + Lägg till
              </button>
            </div>

            {/* CHART */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 10 }}>
              <BodyMeasurementChart label={label} dataPoints={list} />
            </div>

            {/* MEASUREMENT LIST */}
            <ul style={{ paddingLeft: 0, listStyle: "none", marginTop: 8 }}>
              {list.length === 0 && (
                <div className="small" style={{ opacity: 0.6 }}>
                  Inga mått än
                </div>
              )}

              {list.map((m) => (
                <li
                  key={m.id}
                  style={{
                    fontSize: 12,
                    marginBottom: 6,
                    padding: "6px 8px",
                    background: "rgba(15,23,42,0.8)",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{m.value} cm</strong> —{" "}
                    <span style={{ opacity: 0.8 }}>{m.date}</span>
                  </div>

                  <button
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: "3px 8px",
                      background: "rgba(255,0,0,0.15)",
                      border: "1px solid rgba(255,0,0,0.4)",
                      color: "#ff8888",
                    }}
                    onClick={() => {
                      if (window.confirm(`Vill du ta bort detta mått?`)) {
                        onDeleteMeasurement(key, m.id);
                      }
                    }}
                  >
                    Ta bort
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
