import React, { useState, useMemo } from "react";
import { EXERCISES } from "../data/exercises";

/**
 * LiftTools.jsx
 *
 * Props:
 *  - logs: array of logged sets { id, date: 'YYYY-MM-DD', exerciseId, weight, reps, rpe? }
 *  - bodyStats: { waist: [...], hips: [...], ... }
 *  - cycleInfo: optional cycle info object
 *  - onAddManual(entry) -> called with new entry to be saved by parent
 *
 * Self-contained: renders tabs, charts (SVG) and calculators.
 */

// --- 1RM formulas ---
function epley(w, r) {
  return Math.round(w * (1 + r / 30));
}
function brzycki(w, r) {
  return Math.round(w * (36 / (37 - r)));
}
function lombardi(w, r) {
  return Math.round(w * Math.pow(r, 0.10));
}
function mayhew(w, r) {
  // Mayhew et al 1992 (approx)
  const est = (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r));
  return Math.round(est);
}
function oconner(w, r) {
  return Math.round(w * (1 + r / 40));
}
function wathan(w, r) {
  const est = (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r));
  return Math.round(est);
}
function lander(w, r) {
  const est = (100 * w) / (101.3 - 2.67123 * r);
  return Math.round(est);
}

function calcAll1RM(w, r) {
  if (!w || !r) return {};
  return {
    Epley: epley(w, r),
    Brzycki: brzycki(w, r),
    Lombardi: lombardi(w, r),
    Mayhew: mayhew(w, r),
    OConner: oconner(w, r),
    Wathan: wathan(w, r),
    Lander: lander(w, r),
  };
}

// --- helpers for charts ---
function buildLinePath(points, width = 280, height = 80) {
  if (!points || points.length === 0) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((v, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function groupByWeek(logs) {
  // returns map weekkey => { sets: n, exercises: {exId: sets} }
  const map = {};
  logs.forEach((l) => {
    if (!l.date) return;
    const d = new Date(l.date + "T00:00:00");
    // compute ISO week-year key simple: yyyy-Ww using first day of week (Mon)
    const year = d.getFullYear();
    // get week number
    const onejan = new Date(year, 0, 1);
    const days = Math.floor((d - onejan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + onejan.getDay() + 1) / 7);
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    if (!map[key]) map[key] = { sets: 0, exercises: {} };
    map[key].sets += 1;
    map[key].exercises[l.exerciseId] = (map[key].exercises[l.exerciseId] || 0) + 1;
  });
  return map;
}

// --- component ---
export default function LiftTools({ logs = [], bodyStats = {}, cycleInfo = null, onAddManual }) {
  const [tab, setTab] = useState("manual");
  const [manual, setManual] = useState({
    date: new Date().toISOString().slice(0, 10),
    exerciseId: EXERCISES[0]?.id || "",
    weight: "",
    reps: "",
    note: "",
    oneRmInput: "", // optional 1RM manual
    percent: "", // if user inputs percent of 1RM they want weight for
  });

  // For graphs:
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]?.id || "");
  const [selectedMeasures, setSelectedMeasures] = useState(Object.keys(bodyStats || {}).slice(0, 3));

  // 1RM estimator inputs:
  const [est, setEst] = useState({ weight: "", reps: "" });

  // ADD manual lift -> validate then call parent
  function handleSaveManual(e) {
    e.preventDefault();
    const weight = Number(manual.weight);
    const reps = Number(manual.reps);
    if (!manual.exerciseId || !weight || !reps) {
      alert("Välj övning + ange vikt och reps");
      return;
    }
    const entry = {
      id: crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
      date: manual.date,
      exerciseId: manual.exerciseId,
      weight: weight,
      reps: reps,
      note: manual.note || "",
    };
    if (onAddManual) onAddManual(entry);
    // reset small fields
    setManual((m) => ({ ...m, weight: "", reps: "", note: "" }));
  }

  // Volume tracker data:
  const weekMap = useMemo(() => groupByWeek(logs), [logs]);
  const lastWeeks = useMemo(() => {
    // pick last 4 week keys sorted descending
    const keys = Object.keys(weekMap).sort().slice(-8); // up to last 8
    return keys.map((k) => ({ key: k, ...weekMap[k] }));
  }, [weekMap]);

  // 1RM estimator results:
  const estResults = useMemo(() => {
    const w = Number(est.weight);
    const r = Number(est.reps);
    if (!w || !r) return null;
    return calcAll1RM(w, r);
  }, [est]);

  // Exercise graph data:
  const exerciseHistory = useMemo(() => {
    if (!selectedExercise) return [];
    // collect best 1RM per date for that exercise
    const byDate = {};
    logs.forEach((l) => {
      if (l.exerciseId !== selectedExercise) return;
      if (!l.date) return;
      const key = l.date;
      const oneRm = Math.round(l.weight * (1 + l.reps / 30));
      if (!byDate[key] || oneRm > byDate[key]) byDate[key] = oneRm;
    });
    const sortedDates = Object.keys(byDate).sort();
    return sortedDates.map((d) => ({ date: d, oneRm: byDate[d] }));
  }, [logs, selectedExercise]);

  // Body progress multi-line series:
  const bodySeries = useMemo(() => {
    // returns { dates: [...], series: {key: [values aligned by dates]} }
    const keys = Object.keys(bodyStats || {});
    const allDatesSet = new Set();
    keys.forEach((k) => (bodyStats[k] || []).forEach((m) => allDatesSet.add(m.date)));
    const dates = Array.from(allDatesSet).sort();
    if (dates.length === 0) return { dates: [], series: {} };
    const series = {};
    keys.forEach((k) => {
      series[k] = dates.map((d) => {
        const found = (bodyStats[k] || []).find((x) => x.date === d);
        return found ? found.value : null;
      });
    });
    return { dates, series };
  }, [bodyStats]);

  // helper to compute percent-of-1RM weight
  function computePercentWeight(oneRm, pct) {
    if (!oneRm || !pct) return null;
    return Math.round((oneRm * Number(pct)) / 100);
  }

  // UI small helpers
  function renderManualTab() {
    return (
      <form className="lift-form" onSubmit={handleSaveManual}>
        <div className="input-row">
          <div className="input-group">
            <label>Övning</label>
            <select value={manual.exerciseId} onChange={(e) => setManual({ ...manual, exerciseId: e.target.value })}>
              {EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Datum</label>
            <input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Vikt (kg)</label>
            <input type="number" value={manual.weight} onChange={(e) => setManual({ ...manual, weight: e.target.value })} />
          </div>

          <div className="input-group">
            <label>Reps</label>
            <input type="number" value={manual.reps} onChange={(e) => setManual({ ...manual, reps: e.target.value })} />
          </div>

          <div className="input-group">
            <label>RPE (valfritt)</label>
            <input type="number" value={manual.rpe || ""} onChange={(e) => setManual({ ...manual, rpe: e.target.value })} />
          </div>
        </div>

        <div className="input-group">
          <label>Notering</label>
          <input value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} placeholder="Valfritt" />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
          <button type="button" className="btn" onClick={() => {
            // quick fill: if last log exists for exercise -> prefill
            const last = logs.find((l) => l.exerciseId === manual.exerciseId);
            if (last) {
              setManual({ ...manual, weight: last.weight, reps: last.reps });
            } else {
              alert("Ingen tidigare logg för denna övning");
            }
          }}>
            Autofyll senaste
          </button>
          <button type="submit" className="btn-pink">Spara lyft</button>
        </div>
      </form>
    );
  }

  function renderVolumeTab() {
    return (
      <div>
        <h4>Sets per vecka (sista upp till 8 veckor)</h4>
        <div className="volume-grid">
          {lastWeeks.length === 0 && <div className="empty-text">Inga set loggade än.</div>}
          {lastWeeks.map((w) => (
            <div key={w.key} className="volume-card">
              <div style={{ fontWeight: 700 }}>{w.key}</div>
              <div style={{ fontSize: 12 }}>{w.sets} sets</div>
              <div style={{ marginTop: 6 }}>
                {Object.entries(w.exercises)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([exId, c]) => {
                    const name = EXERCISES.find((x) => x.id === exId)?.name || exId;
                    return <div key={exId} style={{ fontSize: 12 }}>{name}: {c}</div>;
                  })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>Enkel analys</h4>
          <p className="small">Genomsnittlig sets/vecka: <strong>{lastWeeks.length ? Math.round(lastWeeks.reduce((s, w) => s + w.sets, 0) / lastWeeks.length) : 0}</strong></p>
          <p className="small">Top övningar senaste veckorna: <strong>{
            (() => {
              const totals = {};
              lastWeeks.forEach((w) => {
                Object.entries(w.exercises).forEach(([k, v]) => totals[k] = (totals[k] || 0) + v);
              });
              const ordered = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0,3).map(x => EXERCISES.find(e => e.id === x[0])?.name || x[0]);
              return ordered.join(", ") || "—";
            })()
          }</strong></p>
        </div>
      </div>
    );
  }

  function renderEstimatorTab() {
    const results = estResults;
    const best = results ? Math.round(Object.values(results).reduce((s, v) => s + v, 0) / Object.values(results).length) : null;
    const oneRmFromInput = manual.oneRmInput ? Number(manual.oneRmInput) : null;
    const pct = manual.percent ? Number(manual.percent) : null;
    const pctWeight = (oneRmFromInput && pct) ? computePercentWeight(oneRmFromInput, pct) : null;

    return (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div className="input-group" style={{ minWidth: 160 }}>
            <label>Vikt</label>
            <input value={est.weight} onChange={(e) => setEst({ ...est, weight: e.target.value })} placeholder="kg" />
          </div>
          <div className="input-group" style={{ minWidth: 120 }}>
            <label>Reps</label>
            <input value={est.reps} onChange={(e) => setEst({ ...est, reps: e.target.value })} />
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <button className="btn" onClick={() => {
              setEst({ weight: "", reps: "" });
            }}>Rensa</button>
          </div>
        </div>

        {results ? (
          <div style={{ marginTop: 12 }}>
            <h4>Estimerade 1RM</h4>
            <div className="est-grid">
              {Object.entries(results).map(([k, v]) => (
                <div key={k} className="est-card">
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{k}</div>
                  <div style={{ fontSize: 16 }}>{v} kg</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }} className="small">Medel: <strong>{best} kg</strong></div>
          </div>
        ) : (
          <div className="small" style={{ marginTop: 8 }}>Fyll i vikt + reps för att räkna 1RM</div>
        )}

        <hr style={{ margin: "14px 0" }} />

        <h4>Beräkna vikt från 1RM (ex: 65%)</h4>
        <div className="input-row">
          <div className="input-group">
            <label>1RM (manuellt)</label>
            <input value={manual.oneRmInput} onChange={(e) => setManual({ ...manual, oneRmInput: e.target.value })} placeholder="kg" />
          </div>
          <div className="input-group">
            <label>Procent (%)</label>
            <input value={manual.percent} onChange={(e) => setManual({ ...manual, percent: e.target.value })} placeholder="65" />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <div style={{ fontSize: 13 }}>
              {pctWeight ? <>⟶ {pctWeight} kg</> : "Sätt 1RM + %"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderExerciseGraphTab() {
    const points = exerciseHistory.map((p) => p.oneRm);
    const dates = exerciseHistory.map((p) => p.date);
    return (
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ minWidth: 220 }}>
            <label>Välj övning</label>
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
              {EXERCISES.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 13 }}>
            Data points: {points.length}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {points.length === 0 && <div className="empty-text">Ingen historik för vald övning.</div>}
          {points.length > 0 && (
            <div>
              <svg viewBox="0 0 300 120" style={{ width: "100%", height: 120 }} preserveAspectRatio="none">
                <polyline fill="none" stroke="var(--pink)" strokeWidth="3" points={buildLinePath(points, 300, 100)} />
              </svg>

              <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto" }}>
                {exerciseHistory.map((p) => (
                  <div key={p.date} className="small stat-pill">
                    {p.date}<br /><strong>{p.oneRm} kg</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderBodyProgressTab() {
    const { dates, series } = bodySeries;
    const availableKeys = Object.keys(series);
    const chosen = selectedMeasures.length ? selectedMeasures : availableKeys.slice(0, 3);

    return (
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 200 }}>
            <label>Välj mått (flera)</label>
            <select multiple value={selectedMeasures} onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map(o => o.value);
              setSelectedMeasures(opts);
            }} style={{ minHeight: 80 }}>
              {Object.keys(bodyStats).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <div className="small">Datum: {dates.length ? `${dates[0]} → ${dates[dates.length - 1]}` : "ingen data"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {dates.length === 0 && <div className="empty-text">Inga kroppsmått registrerade än.</div>}
          {dates.length > 0 && (
            <svg viewBox="0 0 600 220" style={{ width: "100%", height: 220 }} preserveAspectRatio="none">
              <rect x="0" y="0" width="600" height="220" fill="transparent" />
              {/* compute scale per selected series */}
              {chosen.map((k, idx) => {
                const values = series[k].map(v => v === null ? null : v);
                const nums = values.filter(v => v !== null);
                if (nums.length === 0) return null;
                const min = Math.min(...nums);
                const max = Math.max(...nums);
                const colorIdx = idx % 6;
                const palette = ["#ff8faa", "#ffd28a", "#c7b7ff", "#8bd3ff", "#ffd6f0", "#c3f0c6"];
                // build points normalized across global min/max for all chosen to align axis nicely
                const globalValues = chosen.flatMap(ch => (series[ch] || []).filter(v => v !== null));
                const gmin = Math.min(...globalValues);
                const gmax = Math.max(...globalValues);
                const gSpan = gmax - gmin || 1;
                const pathPoints = values.map((v, i) => {
                  const x = (i / (dates.length - 1)) * 580 + 10;
                  const y = 200 - ((v === null ? gmin : v) - gmin) / gSpan * 180 + 10;
                  return `${x},${y}`;
                }).join(" ");
                return <polyline key={k} fill="none" stroke={palette[colorIdx]} strokeWidth="3" points={pathPoints} />;
              })}
            </svg>
          )}

          {dates.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {chosen.map((k, i) => (
                <div key={k} className="stat-pill" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: ["#ff8faa","#ffd28a","#c7b7ff","#8bd3ff","#ffd6f0","#c3f0c6"][i % 6] }} />
                  <div style={{ fontWeight: 700 }}>{k}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lift-tools">
      <div className="tabs">
        <button className={`tab ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>Manual Lift</button>
        <button className={`tab ${tab === "volume" ? "active" : ""}`} onClick={() => setTab("volume")}>Volume</button>
        <button className={`tab ${tab === "estimator" ? "active" : ""}`} onClick={() => setTab("estimator")}>1RM Estimator</button>
        <button className={`tab ${tab === "exercise" ? "active" : ""}`} onClick={() => setTab("exercise")}>Exercise Graph</button>
        <button className={`tab ${tab === "body" ? "active" : ""}`} onClick={() => setTab("body")}>Body Progress</button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        {tab === "manual" && renderManualTab()}
        {tab === "volume" && renderVolumeTab()}
        {tab === "estimator" && renderEstimatorTab()}
        {tab === "exercise" && renderExerciseGraphTab()}
        {tab === "body" && renderBodyProgressTab()}
      </div>
    </div>
  );
}
