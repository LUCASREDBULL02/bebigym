import React, { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { EXERCISES } from "../data/exercises";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend);

/**
 * LiftTools.jsx
 *
 * Props:
 *  - logs: array of lift logs ({ id, date (YYYY-MM-DD), exerciseId, weight, reps, rpe? })
 *  - bodyStats: object { waist: [{id,date,value}, ...], ... }
 *  - cycleInfo: optional object with phase etc (for intensity hints)
 *  - onAddManual(entry) -> called when user adds a manual lift
 */

const FORMULAS = {
  Epley: (w, r) => Math.round(w * (1 + r / 30)),
  Brzycki: (w, r) => Math.round(w * (36 / (37 - r))),
  Lander: (w, r) => Math.round((100 * w) / (101.3 - 2.67123 * r)),
  Lombardi: (w, r) => Math.round(w * Math.pow(r, 0.10)),
  Mayhew: (w, r) => Math.round((100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))),
  OConnor: (w, r) => Math.round(w * (1 + r / 40)),
  Wathan: (w, r) => Math.round((100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))),
};

function calc1RMWith(formula, weight, reps) {
  if (!weight || !reps) return 0;
  try {
    return FORMULAS[formula](weight, reps);
  } catch {
    return 0;
  }
}

function getExerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || { id, name: id };
}

function toISODate(d) {
  if (!d) return new Date().toISOString().slice(0, 10);
  if (typeof d === "string") return d;
  return new Date(d).toISOString().slice(0, 10);
}

export default function LiftTools({ logs = [], bodyStats = {}, cycleInfo = null, onAddManual }) {
  const [tab, setTab] = useState("volume");
  const [search, setSearch] = useState("");
  const [selectedEx, setSelectedEx] = useState("bench");
  const [manual, setManual] = useState({ exerciseId: "bench", weight: "", reps: "", date: toISODate() });

  // 1RM estimator state
  const [estWeight, setEstWeight] = useState("");
  const [estReps, setEstReps] = useState("");
  const [estFormula, setEstFormula] = useState("Epley");
  const [pct, setPct] = useState(65); // percent of 1RM

  useEffect(() => {
    // keep selectedEx valid if user searches etc
    if (!getExerciseById(selectedEx)) {
      setSelectedEx(EXERCISES[0]?.id || "");
    }
  }, []);

  // ------- Volume tracker (sets/week) -------
  const volumeStats = useMemo(() => {
    // We'll compute sets per exercise for the last 28 days, then average per 7-day week
    const now = new Date();
    const msDay = 24 * 60 * 60 * 1000;
    const windowDays = 28;
    const start = new Date(now.getTime() - (windowDays - 1) * msDay);
    const byEx = {};

    logs.forEach((l) => {
      if (!l.date) return;
      const d = new Date(l.date + "T00:00:00");
      if (d < start) return;
      const ex = l.exerciseId;
      byEx[ex] = byEx[ex] || { sets: 0, totalReps: 0, lastDate: null };
      byEx[ex].sets += 1;
      byEx[ex].totalReps += (l.reps || 0);
      byEx[ex].lastDate = (!byEx[ex].lastDate || l.date > byEx[ex].lastDate) ? l.date : byEx[ex].lastDate;
    });

    // convert to array & sets/week (avg over last 4 weeks)
    const arr = Object.entries(byEx).map(([exId, v]) => ({
      exerciseId: exId,
      name: getExerciseById(exId).name,
      setsLast28: v.sets,
      avgSetsPerWeek: +(v.sets / (windowDays / 7)).toFixed(2),
      avgReps: v.sets ? +(v.totalReps / v.sets).toFixed(1) : 0,
      lastDate: v.lastDate,
    }));

    arr.sort((a, b) => b.avgSetsPerWeek - a.avgSetsPerWeek);
    return arr;
  }, [logs]);

  // ------- Strength history (best 1RM per date for selected exercise) -------
  const strengthHistory = useMemo(() => {
    if (!selectedEx) return [];
    // Build map date->best1RM
    const map = {};
    logs.forEach((l) => {
      if (l.exerciseId !== selectedEx) return;
      if (!l.weight || !l.reps) return;
      const oneRm = Math.round(l.weight * (1 + l.reps / 30)); // Epley as baseline for history
      const date = l.date || toISODate();
      if (!map[date] || oneRm > map[date]) map[date] = oneRm;
    });

    const arr = Object.entries(map)
      .map(([date, oneRm]) => ({ date, oneRm }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return arr;
  }, [logs, selectedEx]);

  // data object for strength graph
  const strengthChartData = useMemo(() => {
    const labels = strengthHistory.map((s) => s.date);
    const data = strengthHistory.map((s) => s.oneRm);
    return {
      labels,
      datasets: [
        {
          label: `${getExerciseById(selectedEx).name} — est. 1RM`,
          data,
          borderColor: "#ff75b5",
          tension: 0.35,
          pointRadius: 3,
          fill: false,
        },
      ],
    };
  }, [strengthHistory, selectedEx]);

  // ------- Body progress chart for selected measurement -------
  const [bodyKey, setBodyKey] = useState(Object.keys(bodyStats)[0] || "waist");
  const bodyChartData = useMemo(() => {
    const list = (bodyStats[bodyKey] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    return {
      labels: list.map((m) => m.date),
      datasets: [
        {
          label: bodyKey,
          data: list.map((m) => m.value),
          borderColor: "#ff9f9f",
          tension: 0.35,
          pointRadius: 3,
          fill: false,
        },
      ],
    };
  }, [bodyStats, bodyKey]);

  // ------- 1RM estimator results -------
  const estimated1RM = useMemo(() => {
    const w = Number(estWeight);
    const r = Number(estReps);
    if (!w || !r) return 0;
    return calc1RMWith(estFormula, w, r);
  }, [estWeight, estReps, estFormula]);

  const percentValue = useMemo(() => {
    const v = Number(pct);
    if (!estimated1RM || !v) return 0;
    return Math.round((estimated1RM * v) / 100);
  }, [estimated1RM, pct]);

  // ------- Helpers for exercise search & select -------
  const exerciseOptions = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return EXERCISES.slice(0, 200);
    return EXERCISES.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)).slice(0, 200);
  }, [search]);

  // ------- Add manual lift handler -------
  function handleAddManualSubmit(e) {
    e.preventDefault();
    if (!manual.exerciseId || !manual.weight || !manual.reps) return;
    const entry = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      exerciseId: manual.exerciseId,
      weight: Number(manual.weight),
      reps: Number(manual.reps),
      date: manual.date || toISODate(),
    };
    if (typeof onAddManual === "function") {
      onAddManual(entry);
      setManual((m) => ({ ...m, weight: "", reps: "", date: toISODate() }));
    }
  }

  // Chart options common
  const commonOptions = {
    responsive: true,
    plugins: { legend: { position: "top", labels: { color: "#111827" } } },
    scales: {
      x: { ticks: { color: "#374151" }, grid: { color: "rgba(0,0,0,0.05)" } },
      y: { ticks: { color: "#374151" }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  // ------- Render -------
  return (
    <div className="lifttools-page">
      <div className="tabs">
        <button className={`tab ${tab === "volume" ? "active" : ""}`} onClick={() => setTab("volume")}>
          Volume Tracker
        </button>
        <button className={`tab ${tab === "estimator" ? "active" : ""}`} onClick={() => setTab("estimator")}>
          1RM Estimator
        </button>
        <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
          Strength History
        </button>
        <button className={`tab ${tab === "body" ? "active" : ""}`} onClick={() => setTab("body")}>
          Body Progress
        </button>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280", alignSelf: "center" }}>
          Tip: använd sök i formulär för snabb övningsval
        </div>
      </div>

      <div className="tab-content">
        {/* ===== VOLUME TRACKER ===== */}
        {tab === "volume" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Volume Tracker — sets/week (sista 28 dagarna)</h3>
            <p className="small">Automatisk analys av vilka övningar som får mest sets/vecka.</p>

            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Top övningar</div>
                    <div className="small" style={{ color: "#6b7280" }}>Avg sets / vecka</div>
                  </div>

                  {volumeStats.length === 0 && <div className="small">Inga loggar i fönstret — logga några set för analys.</div>}

                  {volumeStats.slice(0, 12).map((v) => (
                    <div key={v.exerciseId} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{v.name}</div>
                        <div className="small">{v.lastDate ? `Senast: ${v.lastDate}` : "—"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700 }}>{v.avgSetsPerWeek}</div>
                        <div className="small">{v.setsLast28} sets (28d)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 300 }}>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Volume summary</div>
                  <div className="small">Här ser du genomsnittlig volym (sets/vecka) för dina vanligaste övningar.</div>
                  <div style={{ marginTop: 12 }}>
                    {volumeStats.length === 0 && <div className="small">Inga data</div>}
                    {volumeStats.length > 0 && (
                      <div style={{ display: "grid", gap: 6 }}>
                        {volumeStats.slice(0, 8).map((v) => (
                          <div key={v.exerciseId} style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="small">{v.name}</div>
                            <div style={{ fontWeight: 700 }}>{v.avgSetsPerWeek} s/w</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 1RM Estimator ===== */}
        {tab === "estimator" && (
          <div>
            <h3 style={{ marginTop: 0 }}>1RM Estimator — flera formler</h3>
            <p className="small">Testa olika formler och räkna ut procent av 1RM.</p>

            <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <div className="input-group">
                  <label>Välj övning (sök)</label>
                  <input placeholder="Sök..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <select value={manual.exerciseId} onChange={(e) => setManual((m) => ({ ...m, exerciseId: e.target.value }))}>
                    {exerciseOptions.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleAddManualSubmit(e); }} style={{ marginTop: 8 }}>
                  <div className="input-group">
                    <label>Vikt (kg)</label>
                    <input type="number" value={manual.weight} onChange={(e) => setManual((m) => ({ ...m, weight: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Reps</label>
                    <input type="number" value={manual.reps} onChange={(e) => setManual((m) => ({ ...m, reps: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Datum</label>
                    <input type="date" value={manual.date} onChange={(e) => setManual((m) => ({ ...m, date: e.target.value }))} />
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn" type="submit">➕ Lägg till lyft</button>
                    <button type="button" className="btn" onClick={() => { setManual({ exerciseId: manual.exerciseId, weight: "", reps: "", date: toISODate() }); }}>
                      Rensa
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ flex: "1 1 300px" }}>
                <div className="input-group">
                  <label>Formel</label>
                  <select value={estFormula} onChange={(e) => setEstFormula(e.target.value)}>
                    {Object.keys(FORMULAS).map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="profile-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div className="input-group">
                    <label>Vikt (kg)</label>
                    <input type="number" value={estWeight} onChange={(e) => setEstWeight(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Reps</label>
                    <input type="number" value={estReps} onChange={(e) => setEstReps(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Estimerad 1RM ({estFormula}):</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#ff4d8a" }}>{estimated1RM || "—"} kg</div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div className="input-group">
                    <label>Procent av 1RM (%)</label>
                    <input type="range" min="30" max="100" value={pct} onChange={(e) => setPct(e.target.value)} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div className="small">30%</div>
                      <div className="small">100%</div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <div className="small">Resultat: <strong>{pct}% av {estimated1RM || 0} kg = {percentValue || 0} kg</strong></div>
                    </div>
                  </div>
                </div>

                {cycleInfo && (
                  <div style={{ marginTop: 12 }} className="small">
                    Aktuell cykelfas: <strong>{cycleInfo.phase}</strong> — rekommenderad intensitet: <strong>{Math.round((cycleInfo.phase === "Ovulation" ? 1.05 : cycleInfo.phase === "Follicular" ? 1.0 : cycleInfo.phase === "Luteal" ? 0.95 : 0.85) * 100)}%</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== STRENGTH HISTORY ===== */}
        {tab === "history" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Strength History — välj övning</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ minWidth: 220 }}>
                <input placeholder="Sök övning..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select style={{ width: "100%", marginTop: 6 }} value={selectedEx} onChange={(e) => setSelectedEx(e.target.value)}>
                  {exerciseOptions.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 300 }}>
                {strengthHistory.length === 0 ? (
                  <div className="card">
                    <div className="small">Inga loggade set för den valda övningen ännu.</div>
                  </div>
                ) : (
                  <div className="card">
                    <Line data={strengthChartData} options={commonOptions} />
                  </div>
                )}
              </div>

              <div style={{ minWidth: 220 }}>
                <div className="card">
                  <div style={{ fontWeight: 700 }}>Senaste 1RM (est.)</div>
                  <div style={{ marginTop: 8 }}>
                    {strengthHistory.length ? `${strengthHistory[strengthHistory.length - 1].oneRm} kg (${strengthHistory[strengthHistory.length - 1].date})` : "—"}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div className="small">Tips: Lägg in tidigare tunga set i '1RM Estimator' för att fylla historiken.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== BODY PROGRESS ===== */}
        {tab === "body" && (
          <div>
            <h3 style={{ marginTop: 0 }}>Body Progress — välj mått</h3>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 180 }}>
                <label className="small">Mått</label>
                <select value={bodyKey} onChange={(e) => setBodyKey(e.target.value)} style={{ width: "100%" }}>
                  {Object.keys(bodyStats).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>

                <div style={{ marginTop: 8 }}>
                  <div className="small">Senaste</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>
                    {bodyStats[bodyKey] && bodyStats[bodyKey].length ? `${bodyStats[bodyKey].slice().sort((a,b)=>b.date.localeCompare(a.date))[0].value} cm (${bodyStats[bodyKey].slice().sort((a,b)=>b.date.localeCompare(a.date))[0].date})` : "—"}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 320 }}>
                <div className="card">
                  <Line data={bodyChartData} options={commonOptions} />
                </div>
              </div>

              <div style={{ minWidth: 200 }}>
                <div className="card">
                  <div style={{ fontWeight: 700 }}>Snabbanalys</div>
                  <div style={{ marginTop: 8 }} className="small">
                    {bodyStats[bodyKey] && bodyStats[bodyKey].length
                      ? (() => {
                          const sorted = bodyStats[bodyKey].slice().sort((a,b) => a.date.localeCompare(b.date));
                          const first = sorted[0], last = sorted[sorted.length-1];
                          const diff = last.value - first.value;
                          return `${sorted.length} mätningar • Förändring: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} cm`;
                        })()
                      : "Inga mätningar ännu."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .lifttools-page { display: flex; flex-direction: column; gap: 12; }
        .tabs { display:flex; gap:8px; align-items:center; padding:6px 0; }
        .tab { padding:8px 12px; border-radius:10px; background:#fff; border:1px solid rgba(0,0,0,0.04); cursor:pointer; font-weight:600; }
        .tab.active { background: linear-gradient(90deg,#ffe6f0,#fff0f6); color:#b91c6b; box-shadow:0 4px 12px rgba(200,50,120,0.08); }
        .tab-content { margin-top:8px; display:block; }
        .card { background: #fff; border-radius:14px; padding: 12px; box-shadow: 0 6px 18px rgba(12,12,12,0.04); }
        .input-group { display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }
        input[type="number"], input[type="date"], select, input { padding:8px 10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06); background:#fff; }
        .profile-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; }
        .small { color:#6b7280; font-size:13px; }
        .btn { background: #fff; border: 1px solid rgba(0,0,0,0.06); padding:8px 10px; border-radius:10px; cursor:pointer; }
        .btn-pink { background: linear-gradient(90deg,#ff8ccf,#ff75b5); color:#fff; padding:8px 12px; border-radius:12px; border: none; cursor:pointer; }
      `}</style>
    </div>
  );
}
