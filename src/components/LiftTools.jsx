// src/components/LiftTools.jsx
import React, { useState, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { EXERCISES } from "../data/exercises";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const ACCENT = "#ec4899"; // rosa

// 1RM-formler
function calcFormulas1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return null;
  const w = Number(weight);
  const r = Number(reps);

  const safe = (fn) => {
    try {
      const v = fn(w, r);
      if (!isFinite(v)) return null;
      return Math.round(v);
    } catch {
      return null;
    }
  };

  return {
    epley: safe((w, r) => w * (1 + r / 30)),
    brzycki: safe((w, r) => (w * 36) / (37 - r)),
    lander: safe((w, r) => w / (1.013 - 0.0267123 * r)),
    lombardi: safe((w, r) => w * Math.pow(r, 0.10)),
    mayhew: safe(
      (w, r) => (w * 100) / (52.2 + 41.9 * Math.exp(-0.055 * r))
    ),
    oconnor: safe((w, r) => w * (1 + 0.025 * r)),
    wathan: safe(
      (w, r) => (w * 100) / (48.8 + 53.8 * Math.exp(-0.075 * r))
    ),
  };
}

// Hämta namn på övning
function getExerciseName(id) {
  const ex = EXERCISES.find((e) => e.id === id);
  return ex ? ex.name : id;
}

// Grupp per vecka (YYYY-WW)
function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "okänd";
  const year = d.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const days = Math.floor((d - firstJan) / (1000 * 60 * 60 * 24));
  const week = Math.floor(days / 7) + 1;
  return `${year}-v${week}`;
}

// 1RM (Epley)
function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export default function LiftTools({ logs, bodyStats, onAddManual }) {
  const [tab, setTab] = useState("rm"); // "rm" | "volume" | "body"
  const [rmExerciseId, setRmExerciseId] = useState("bench");
  const [rmWeight, setRmWeight] = useState("");
  const [rmReps, setRmReps] = useState("");
  const [rmPercentBase, setRmPercentBase] = useState("");
  const [rmPercent, setRmPercent] = useState("65");

  const [manualExerciseId, setManualExerciseId] = useState("bench");
  const [manualWeight, setManualWeight] = useState("");
  const [manualReps, setManualReps] = useState("");
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [volumeExerciseId, setVolumeExerciseId] = useState("bench");
  const [bodyKey, setBodyKey] = useState("waist");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Unika övningar i loggarna (fallback till EXERCISES om tomt)
  const usedExerciseIds = useMemo(() => {
    const set = new Set();
    (logs || []).forEach((l) => l.exerciseId && set.add(l.exerciseId));
    if (set.size === 0) {
      EXERCISES.forEach((e) => set.add(e.id));
    }
    return Array.from(set);
  }, [logs]);

  // 1RM-formler
  const rmResults = useMemo(
    () => calcFormulas1RM(Number(rmWeight), Number(rmReps)),
    [rmWeight, rmReps]
  );

  const rmPercentResult = useMemo(() => {
    const base = Number(rmPercentBase);
    const p = Number(rmPercent);
    if (!base || !p) return "";
    return Math.round((base * p) / 100);
  }, [rmPercentBase, rmPercent]);

  // Volym per vecka + 1RM-historik
  const { volumeData, strengthData } = useMemo(() => {
    const filtered = (logs || []).filter(
      (l) => l.exerciseId === volumeExerciseId && l.weight && l.reps
    );

    const byWeek = {};
    const byDate = {};

    filtered.forEach((l) => {
      const vol = l.weight * l.reps;
      const wk = getWeekKey(l.date || todayStr);
      byWeek[wk] = (byWeek[wk] || 0) + vol;

      const d = l.date || todayStr;
      const oneRm = calc1RM(l.weight, l.reps);
      if (!byDate[d] || oneRm > byDate[d]) {
        byDate[d] = oneRm;
      }
    });

    const weekLabels = Object.keys(byWeek).sort();
    const weekValues = weekLabels.map((k) => byWeek[k]);

    const dateLabels = Object.keys(byDate).sort();
    const dateValues = dateLabels.map((d) => byDate[d]);

    return {
      volumeData: {
        labels: weekLabels,
        datasets: [
          {
            label: "Volym per vecka (kg x reps)",
            data: weekValues,
            backgroundColor: "rgba(236, 72, 153, 0.6)",
            borderRadius: 6,
          },
        ],
      },
      strengthData: {
        labels: dateLabels,
        datasets: [
          {
            label: "Bästa 1RM per datum (kg)",
            data: dateValues,
            borderColor: ACCENT,
            backgroundColor: "rgba(236, 72, 153, 0.15)",
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
    };
  }, [logs, volumeExerciseId, todayStr]);

  // Kroppsmått för vald nyckel
  const measurementSeries = useMemo(() => {
    const arr = (bodyStats && bodyStats[bodyKey]) || [];
    const sorted = [...arr].sort((a, b) =>
      (a.date || "").localeCompare(b.date || "")
    );
    const labels = sorted.map((m) => m.date || "");
    const values = sorted.map((m) => m.value || 0);

    return {
      labels,
      data: {
        labels,
        datasets: [
          {
            label: `Utveckling (${bodyKey})`,
            data: values,
            borderColor: ACCENT,
            backgroundColor: "rgba(236, 72, 153, 0.15)",
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      raw: sorted,
    };
  }, [bodyStats, bodyKey]);

  function handleAddManual() {
    if (!manualExerciseId || !manualWeight || !manualReps) return;

    const entry = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36),
      exerciseId: manualExerciseId,
      weight: Number(manualWeight),
      reps: Number(manualReps),
      date: manualDate || todayStr,
    };

    onAddManual && onAddManual(entry);

    setManualWeight("");
    setManualReps("");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        <button
          onClick={() => setTab("rm")}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${
              tab === "rm" ? ACCENT : "rgba(148,163,184,0.6)"
            }`,
            background:
              tab === "rm" ? ACCENT : "rgba(15,23,42,0.9)",
            color: tab === "rm" ? "#0b1120" : "#e5e7eb",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          🧠 1RM & %
        </button>
        <button
          onClick={() => setTab("volume")}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${
              tab === "volume" ? ACCENT : "rgba(148,163,184,0.6)"
            }`,
            background:
              tab === "volume" ? ACCENT : "rgba(15,23,42,0.9)",
            color: tab === "volume" ? "#0b1120" : "#e5e7eb",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          📊 Volym & styrka
        </button>
        <button
          onClick={() => setTab("body")}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${
              tab === "body" ? ACCENT : "rgba(148,163,184,0.6)"
            }`,
            background:
              tab === "body" ? ACCENT : "rgba(15,23,42,0.9)",
            color: tab === "body" ? "#0b1120" : "#e5e7eb",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          📐 Kroppsmått
        </button>
      </div>

      {/* === TAB 1: 1RM & % === */}
      {tab === "rm" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
          }}
        >
          {/* 1RM-kalkylator */}
          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              1RM-kalkylator (7 formler)
            </div>
            <p className="small" style={{ marginBottom: 8 }}>
              Välj övning, skriv in vikt & reps – så får du ett spann på ditt
              1RM med flera kända formler.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <select
                value={rmExerciseId}
                onChange={(e) => setRmExerciseId(e.target.value)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border:
                    "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 12,
                }}
              >
                {usedExerciseIds.map((id) => (
                  <option key={id} value={id}>
                    {getExerciseName(id)}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                  gap: 8,
                }}
              >
                <div>
                  <label
                    className="small"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Vikt (kg)
                  </label>
                  <input
                    type="number"
                    value={rmWeight}
                    onChange={(e) => setRmWeight(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border:
                        "1px solid rgba(148,163,184,0.6)",
                      background: "#020617",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="small"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Reps
                  </label>
                  <input
                    type="number"
                    value={rmReps}
                    onChange={(e) => setRmReps(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border:
                        "1px solid rgba(148,163,184,0.6)",
                      background: "#020617",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>
            </div>

            {rmResults ? (
              <div
                style={{
                  overflowX: "auto",
                  marginTop: 6,
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 11,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom:
                          "1px solid rgba(55,65,81,0.8)",
                      }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 2px",
                          fontWeight: 500,
                        }}
                      >
                        Formel
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "4px 2px",
                          fontWeight: 500,
                        }}
                      >
                        1RM (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(rmResults).map(
                      ([key, val]) => (
                        <tr key={key}>
                          <td
                            style={{
                              padding: "3px 2px",
                              opacity: 0.9,
                            }}
                          >
                            {key}
                          </td>
                          <td
                            style={{
                              padding: "3px 2px",
                              textAlign: "right",
                            }}
                          >
                            {val ? val : "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p
                className="small"
                style={{ marginTop: 6, opacity: 0.8 }}
              >
                Fyll i vikt & reps för att se 1RM-estimat.
              </p>
            )}
          </div>

          {/* 1RM% */}
          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              % av 1RM kalkylator
            </div>
            <p className="small" style={{ marginBottom: 8 }}>
              Perfekt när du fått fram ditt 1RM och vill veta t.ex. vad 65% är.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <div>
                <label
                  className="small"
                  style={{ display: "block", marginBottom: 2 }}
                >
                  1RM (kg)
                </label>
                <input
                  type="number"
                  value={rmPercentBase}
                  onChange={(e) =>
                    setRmPercentBase(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 8,
                    border:
                      "1px solid rgba(148,163,184,0.6)",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 12,
                  }}
                />
              </div>
              <div>
                <label
                  className="small"
                  style={{ display: "block", marginBottom: 2 }}
                >
                  Procent (%)
                </label>
                <input
                  type="number"
                  value={rmPercent}
                  onChange={(e) =>
                    setRmPercent(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 8,
                    border:
                      "1px solid rgba(148,163,184,0.6)",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 12,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {rmPercentBase && rmPercent ? (
                <>
                  {rmPercent}% av {rmPercentBase} kg ={" "}
                  <span style={{ color: ACCENT }}>
                    {rmPercentResult} kg
                  </span>
                </>
              ) : (
                <span className="small">
                  Fyll i 1RM + procent för att räkna ut.
                </span>
              )}
            </div>
          </div>

          {/* Lägg till tidigare set */}
          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Lägg till tidigare set 📆
            </div>
            <p className="small" style={{ marginBottom: 8 }}>
              Om du vill lägga in tidigare lyft (innan appen fanns), fyll i här
              så hamnar det i loggen.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 8,
              }}
            >
              <select
                value={manualExerciseId}
                onChange={(e) =>
                  setManualExerciseId(e.target.value)
                }
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border:
                    "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 12,
                }}
              >
                {usedExerciseIds.map((id) => (
                  <option key={id} value={id}>
                    {getExerciseName(id)}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 8,
                }}
              >
                <div>
                  <label
                    className="small"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Vikt (kg)
                  </label>
                  <input
                    type="number"
                    value={manualWeight}
                    onChange={(e) =>
                      setManualWeight(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border:
                        "1px solid rgba(148,163,184,0.6)",
                      background: "#020617",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="small"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Reps
                  </label>
                  <input
                    type="number"
                    value={manualReps}
                    onChange={(e) =>
                      setManualReps(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border:
                        "1px solid rgba(148,163,184,0.6)",
                      background: "#020617",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="small"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Datum
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) =>
                      setManualDate(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border:
                        "1px solid rgba(148,163,184,0.6)",
                      background: "#020617",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleAddManual}
                style={{
                  marginTop: 6,
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "none",
                  background: ACCENT,
                  color: "#0b1120",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Lägg till i loggen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === TAB 2: VOLYM & STYRKA === */}
      {tab === "volume" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
          }}
        >
          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Volym per vecka
                </div>
                <div className="small">
                  Total volym (kg × reps) per vecka för vald övning.
                </div>
              </div>
              <select
                value={volumeExerciseId}
                onChange={(e) =>
                  setVolumeExerciseId(e.target.value)
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border:
                    "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 11,
                }}
              >
                {usedExerciseIds.map((id) => (
                  <option key={id} value={id}>
                    {getExerciseName(id)}
                  </option>
                ))}
              </select>
            </div>

            {volumeData.labels.length ? (
              <div style={{ width: "100%", height: 220 }}>
                <Bar
                  data={volumeData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#9ca3af", font: { size: 10 } },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: "#9ca3af", font: { size: 10 } },
                        grid: {
                          color: "rgba(31,41,55,0.8)",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="small">
                Inga loggar ännu för den här övningen.
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Styrkeutveckling (1RM över tid)
            </div>
            <p className="small" style={{ marginBottom: 8 }}>
              Visar bästa uppskattade 1RM per datum för vald övning.
            </p>
            {strengthData.labels.length ? (
              <div style={{ width: "100%", height: 220 }}>
                <Line
                  data={strengthData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#9ca3af", font: { size: 10 } },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: "#9ca3af", font: { size: 10 } },
                        grid: {
                          color: "rgba(31,41,55,0.8)",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="small">
                Logga några pass först för att se grafen.
              </p>
            )}
          </div>
        </div>
      )}

      {/* === TAB 3: KROPPSMÅTT === */}
      {tab === "body" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
          }}
        >
          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Kroppsmått – graf
                </div>
                <div className="small">
                  Välj område så ser du utvecklingen som kurva.
                </div>
              </div>
              <select
                value={bodyKey}
                onChange={(e) => setBodyKey(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border:
                    "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 11,
                }}
              >
                <option value="waist">Midja</option>
                <option value="hips">Höft</option>
                <option value="thigh">Lår</option>
                <option value="glutes">Glutes</option>
                <option value="chest">Bröst</option>
                <option value="arm">Arm</option>
              </select>
            </div>

            {measurementSeries.labels.length ? (
              <div style={{ width: "100%", height: 220 }}>
                <Line
                  data={measurementSeries.data}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#9ca3af", font: { size: 10 } },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: "#9ca3af", font: { size: 10 } },
                        grid: {
                          color: "rgba(31,41,55,0.8)",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="small">
                Inga värden ännu för detta mått. Lägg in kroppsmått i
                Profil-sidan.
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Lista – {bodyKey}
            </div>
            {measurementSeries.raw.length ? (
              <ul
                style={{
                  listStyle: "none",
                  paddingLeft: 0,
                  margin: 0,
                  fontSize: 12,
                }}
              >
                {measurementSeries.raw.map((m) => (
                  <li
                    key={m.id || `${m.date}-${m.value}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                      borderBottom:
                        "1px solid rgba(31,41,55,0.9)",
                    }}
                  >
                    <span>{m.date}</span>
                    <span>{m.value} cm</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small">
                När du lagt in några värden syns de här.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
