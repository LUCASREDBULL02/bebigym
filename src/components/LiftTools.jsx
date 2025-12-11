import React, { useState, useMemo } from "react";

/**
 * Props:
 * - logs: array of existing logs (optional)
 * - bodyStats: object of measurements
 * - onAddManual(entry): callback when user adds a manual lift
 *
 * This component is standalone (no external libs) and uses inline SVG for sparklines.
 */

const FORMULAE = {
  epley: (w, r) => Math.round(w * (1 + r / 30)),
  lombardi: (w, r) => Math.round(w * Math.pow(r, 0.1)),
  brzycki: (w, r) => Math.round(w * (36 / (37 - r))),
  mayhew: (w, r) => Math.round((100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))),
  oconner: (w, r) => Math.round(w * (1 + r / 40)),
  wathen: (w, r) => Math.round(100 * w / (48.8 + 53.8 * Math.exp(-0.075 * r))),
  lombardi_alt: (w, r) => Math.round(w * Math.pow(r, 0.1)),
};

function Sparkline({ values = [] }) {
  if (!values || values.length === 0) return null;
  const width = 200;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}

export default function LiftTools({ logs = [], bodyStats = {}, onAddManual }) {
  const [tab, setTab] = useState("volume");
  const [ex, setEx] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [oneRmValue, setOneRmValue] = useState("");
  const [oneRmReps, setOneRmReps] = useState("");
  const [percentInput, setPercentInput] = useState(65);

  // Build a per-exercise history from logs
  const perExercise = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      if (!map[l.exerciseId]) map[l.exerciseId] = [];
      map[l.exerciseId].push(l);
    });
    Object.keys(map).forEach((k) => {
      map[k] = map[k].slice().sort((a, b) => b.date.localeCompare(a.date));
    });
    return map;
  }, [logs]);

  // Volume tracker (sets/week) — very simple: count sets per exercise
  const volumeSummary = useMemo(() => {
    const out = {};
    logs.forEach((l) => {
      const key = l.exerciseId;
      out[key] = out[key] || { sets: 0, totalVolume: 0 };
      out[key].sets += 1;
      out[key].totalVolume += (l.weight || 0) * (l.reps || 0);
    });
    return out;
  }, [logs]);

  function handleAddManual() {
    if (!ex || !weight || !reps) return;
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      exerciseId: ex,
      weight: Number(weight),
      reps: Number(reps),
      date: date || new Date().toISOString().slice(0, 10),
    };
    if (onAddManual) onAddManual(entry);
    setWeight("");
    setReps("");
  }

  function estimateAllFormulas(w, r) {
    if (!w || !r) return {};
    const results = {};
    Object.keys(FORMULAE).forEach((k) => {
      try {
        results[k] = Number(FORMULAE[k](w, r));
      } catch {
        results[k] = 0;
      }
    });
    return results;
  }

  function calcPercentOf1RM(oneRm, pct) {
    if (!oneRm || !pct) return 0;
    return Math.round((oneRm * pct) / 100);
  }

  const oneRmEstimates = estimateAllFormulas(Number(oneRmValue), Number(oneRmReps));
  const chosenOneRm = Object.values(oneRmEstimates).find(Boolean) || 0;
  const pctValue = calcPercentOf1RM(chosenOneRm, Number(percentInput));

  return (
    <div className="lift-tools">
      <div className="lift-tabs">
        <button className={`lift-tab ${tab === "volume" ? "active" : ""}`} onClick={() => setTab("volume")}>Volume Tracker</button>
        <button className={`lift-tab ${tab === "estimator" ? "active" : ""}`} onClick={() => setTab("estimator")}>1RM Estimator</button>
        <button className={`lift-tab ${tab === "body" ? "active" : ""}`} onClick={() => setTab("body")}>Body Stats</button>
      </div>

      {tab === "volume" && (
        <div>
          <h3 style={{ marginTop: 0 }}>Volume Tracker</h3>
          <p className="small">Snabb översikt över sets & total volym (kg×reps)</p>

          <div style={{ display: "grid", gap: 10 }}>
            {Object.keys(volumeSummary).length === 0 && <div className="card">Inga loggar ännu</div>}

            {Object.entries(volumeSummary).map(([k, v]) => (
              <div className="graph-card" key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{k}</div>
                  <div className="small">{v.sets} sets • {v.totalVolume} total volym</div>
                </div>
                <div style={{ width: 220 }}>
                  <Sparkline values={(perExercise[k] || []).slice(0, 12).map(x => (x.weight||0)*(x.reps||0)).reverse()} />
                </div>
              </div>
            ))}

            <div className="card">
              <h4 style={{ marginTop: 0 }}>Lägg till manuellt lyft</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input placeholder="Övning (id)" value={ex} onChange={(e) => setEx(e.target.value)} />
                <input placeholder="Vikt (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <input placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <div />
                <button className="btn-pink" onClick={handleAddManual}>Lägg till lyft</button>
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Tips: använd övnings-id från appen (t.ex. <code>bench</code>, <code>hipthrust</code>).
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "estimator" && (
        <div>
          <h3 style={{ marginTop: 0 }}>1RM Estimator</h3>
          <div className="card">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Vikt (kg)" value={oneRmValue} onChange={(e) => setOneRmValue(e.target.value)} />
                <input placeholder="Reps" value={oneRmReps} onChange={(e) => setOneRmReps(e.target.value)} />
                <input placeholder="% av 1RM" value={percentInput} onChange={(e) => setPercentInput(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(oneRmEstimates).map(([name, val]) => (
                  <div key={name} style={{ minWidth: 120, padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{name}</div>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>{val || "—"} kg</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8 }}>
                <div className="small">Vald 1RM (för handsamt värde): <strong>{chosenOneRm || 0} kg</strong></div>
                <div className="small"> {percentInput}% av 1RM → <strong>{pctValue} kg</strong></div>
              </div>

            </div>
          </div>
        </div>
      )}

      {tab === "body" && (
        <div>
          <h3 style={{ marginTop: 0 }}>Kroppsmått & utveckling</h3>
          <div className="card">
            <div style={{ display: "grid", gap: 12 }}>
              {Object.entries(bodyStats).length === 0 && <div className="small">Inga kroppsmått sparade ännu.</div>}
              {Object.entries(bodyStats).map(([k, list]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{k}</div>
                    <div className="small">{list.length} values</div>
                  </div>
                  <div style={{ width: 220 }}>
                    <Sparkline values={(list || []).slice(-12).map(v => v.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
