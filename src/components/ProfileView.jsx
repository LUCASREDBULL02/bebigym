import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

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

  const measurementLabels = {
    waist: "Midja",
    hips: "Höfter",
    thigh: "Lår",
    glutes: "Glutes",
    chest: "Bröst",
    arm: "Arm",
  };

  const [newMeasurement, setNewMeasurement] = useState({
    key: "waist",
    value: "",
    date: todayStr,
  });

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

    onAddMeasurement(newMeasurement.key, {
      id: crypto.randomUUID(),
      value: Number(newMeasurement.value),
      date: newMeasurement.date,
    });

    setNewMeasurement((prev) => ({ ...prev, value: "" }));
  }

  // ------------------------------
  // BODY PROGRESS MULTI-LINE GRAPH
  // ------------------------------

  const mergedChart = useMemo(() => {
    const datasets = Object.entries(bodyStats).map(([key, list]) => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      return {
        label: measurementLabels[key],
        data: sorted.map((m) => ({ x: m.date, y: m.value })),
        borderColor: {
          waist: "#ff75b5",
          hips: "#ffd18c",
          thigh: "#b58cff",
          glutes: "#ff8ccf",
          chest: "#ff9f9f",
          arm: "#8cd1ff",
        }[key],
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      };
    });

    return {
      datasets,
    };
  }, [bodyStats]);

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: { unit: "day" },
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.07)" },
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.07)" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#fff", boxWidth: 14 },
      },
    },
  };

  // ------------------------------

  return (
    <div className="profile-page">

      {/* --------- PROFILE CARD --------- */}
      <div className="profile-card">
        <h3 className="section-title">👤 Profil</h3>

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

        <button className="btn-pink" style={{ marginTop: 12 }} onClick={handleSaveProfile}>
          💾 Spara profil
        </button>
      </div>

      {/* --------- BODY PROGRESS GRAPH --------- */}
      <div className="profile-card">
        <h3 className="section-title">📊 Kroppsutveckling – Allt i en graf</h3>

        <div style={{ width: "100%", height: 300 }}>
          <Line data={mergedChart} options={chartOptions} />
        </div>
      </div>

      {/* --------- ADD MEASUREMENT --------- */}
      <div className="profile-card">
        <h3 className="section-title">📏 Lägg till kroppsmått</h3>

        <div className="profile-grid">
          <div className="input-group">
            <label>Typ</label>
            <select
              value={newMeasurement.key}
              onChange={(e) =>
                setNewMeasurement((p) => ({ ...p, key: e.target.value }))
              }
            >
              {Object.entries(measurementLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Värde (cm)</label>
            <input
              type="number"
              value={newMeasurement.value}
              onChange={(e) =>
                setNewMeasurement((p) => ({ ...p, value: e.target.value }))
              }
            />
          </div>

          <div className="input-group">
            <label>Datum</label>
            <input
              type="date"
              value={newMeasurement.date}
              onChange={(e) =>
                setNewMeasurement((p) => ({ ...p, date: e.target.value }))
              }
            />
          </div>
        </div>

        <button className="btn" style={{ marginTop: 10 }} onClick={handleAddMeasurement}>
          ➕ Lägg till
        </button>
      </div>

      {/* --------- INDIVIDUAL LISTS --------- */}
      <div className="profile-card">
        <h3 className="section-title">📚 Historik per mått</h3>

        {Object.entries(bodyStats).map(([key, list]) => (
          <div key={key} className="measure-block">
            <h4 style={{ marginBottom: 6, fontSize: 15 }}>
              {measurementLabels[key]}
            </h4>

            {!list.length && <div className="small">Inga värden ännu.</div>}

            {list.length > 0 && (
              <div className="measure-list">
                {list
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <span>
                        {m.date} — <strong>{m.value} cm</strong>
                      </span>
                      <button
                        className="btn"
                        style={{ padding: "3px 6px", fontSize: 11 }}
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
