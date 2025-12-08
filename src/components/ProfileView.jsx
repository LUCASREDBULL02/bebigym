// src/components/ProfileView.jsx
import React, { useState } from "react";
import BodyMeasurementChart from "./BodyMeasurementChart.jsx";

export default function ProfileView({ profile, setProfile, bodyStats, onAddMeasurement, onDeleteMeasurement }) {
  const [edit, setEdit] = useState({
    name: profile.name,
    nick: profile.nick,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
  });

  function handleSave() {
    setProfile(edit);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Profil 💗</h2>

      {/* PROFILE FIELDS */}
      <div className="row" style={{ gap: 10 }}>
        <div className="col" style={{ flex: 1 }}>
          <label className="small">Namn</label>
          <input
            className="input"
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
          />
        </div>
        <div className="col" style={{ flex: 1 }}>
          <label className="small">Nick</label>
          <input
            className="input"
            value={edit.nick}
            onChange={(e) => setEdit({ ...edit, nick: e.target.value })}
          />
        </div>
      </div>

      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <div className="col" style={{ flex: 1 }}>
          <label className="small">Ålder</label>
          <input
            type="number"
            className="input"
            value={edit.age}
            onChange={(e) => setEdit({ ...edit, age: Number(e.target.value) })}
          />
        </div>
        <div className="col" style={{ flex: 1 }}>
          <label className="small">Längd (cm)</label>
          <input
            type="number"
            className="input"
            value={edit.height}
            onChange={(e) =>
              setEdit({ ...edit, height: Number(e.target.value) })
            }
          />
        </div>
        <div className="col" style={{ flex: 1 }}>
          <label className="small">Vikt (kg)</label>
          <input
            type="number"
            className="input"
            value={edit.weight}
            onChange={(e) =>
              setEdit({ ...edit, weight: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <button className="btn-pink" style={{ marginTop: 15 }} onClick={handleSave}>
        Spara profil
      </button>

      {/* BODY MEASUREMENTS */}
      <div className="divider" style={{ margin: "20px 0" }} />

      <h2 style={{ marginTop: 0 }}>Kroppsmått 📏</h2>

      {[
        ["waist", "Midja"],
        ["hips", "Höfter"],
        ["thigh", "Lår"],
        ["glutes", "Rumpa"],
        ["chest", "Bröst"],
        ["arm", "Arm"],
      ].map(([key, label]) => {
        const list = bodyStats[key] || [];

        return (
          <div key={key} style={{ marginBottom: 25 }}>
            <div
              style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}
            >
              {label}
            </div>

            {/* LISTA */}
            <ul style={{ paddingLeft: 0, listStyle: "none", marginTop: 6 }}>
              {list.length === 0 && (
                <div className="small" style={{ opacity: 0.6 }}>
                  Inga registrerade mått än
                </div>
              )}

              {list.map((m) => (
                <li
                  key={m.id}
                  style={{
                    fontSize: 12,
                    marginBottom: 4,
                    padding: "4px 6px",
                    borderRadius: 8,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.5)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    {m.date} — {m.value} cm
                  </div>

                  <button
                    className="btn"
                    style={{ fontSize: 11, padding: "3px 7px" }}
                    onClick={() => {
                      if (window.confirm(`Ta bort detta ${label}-mått?`)) {
                        onDeleteMeasurement(key, m.id);
                      }
                    }}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>

            {/* GRAF */}
            <div style={{ marginTop: 10 }}>
              <BodyMeasurementChart label={label} dataPoints={list} />
            </div>

            {/* ADD BUTTON */}
            <button
              className="btn-pink"
              style={{ marginTop: 6, fontSize: 12 }}
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
              + Lägg till {label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
