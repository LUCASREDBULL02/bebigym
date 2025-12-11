import React, { useMemo, useState } from "react";
import { EXERCISES } from "../data/exercises";

/**
 * LiftTools
 * Props:
 * - logs: array of log entries { exerciseId, weight, reps, date, id }
 * - bodyStats: object { waist: [{...}], ... }
 * - onAddManual: function(entry) -> adds a manual log (App saves/persists)
 */

const FORMULAS = {
  Epley: (w, r) => Math.round(w * (1 + r / 30)),
  Brzycki: (w, r) => Math.round(w * (36 / (37 - r))),
  Lombardi: (w, r) => Math.round(w * Math.pow(r, 0.10)),
  Mayhew: (w, r) => Math.round((100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))),
  OConnor: (w, r) => Math.round(w * (1 + r / 40)),
  Wathan: (w, r) => Math.round((100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))),
  Schwartz: (w, r) => Math.round(w * (1 + r / 30)), // fallback similar to Epley
};

function sparkline(values = [], w = 120, h = 30) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline fill="none" stroke="#ff7ab6" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LiftTools({ logs = [], bodyStats = {}, onAddManual }) {
  const [tab, setTab] = useState("volume");
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState({ exerciseId: EXERCISES[0]?.id || "", weight: "", reps: "", date: new Date().toISOString().slice(0, 10) });
  const [formula, setFormula] = useState("Epley");
  const [oneRmFromInput, setOneRmFromInput] = useState("");
  const [percentInput, setPercentInput] = useState(65);

  // Volume tracker: sets per week per exercise
  const volumeData = useMemo(() => {
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const perEx = {};
    logs.forEach((l) => {
      const d = new Date(l.date || l.createdAt || new Date());
      if (d < last7) return;
      perEx[l.exerciseId] = perEx[l.exerciseId] || { sets: 0, volume: 0 };
      perEx[l.exerciseId].sets += 1;
      perEx[l.exerciseId].volume += (Number(l.weight) || 0) * (Number(l.reps) || 0);
    });
    // map to array
    return Object.entries(perEx).map(([id, v]) => ({ id, name: (EXERCISES.find(e => e.id === id)?.name) || id, ...v }));
  }, [logs]);

  // Search exercises for manual add
  const filteredExercises = useMemo(() => {
    if (!search.trim()) return EXERCISES.slice(0, 80);
    const q = search.toLowerCase();
    return EXERCISES.filter(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  function compute1RM() {
    const w = Number(manual.weight);
    const r = Number(manual.reps);
    if (!w || !r) return 0;
    const fn = FORMULAS[formula] || FORMULAS.Epley;
    return fn(w, r);
  }

  function handleAddManual() {
    if (!manual.exerciseId || !manual.weight || !manual.reps) {
      return alert("Fyll i övning, vikt och reps");
    }
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
      exerciseId: manual.exerciseId,
      weight: Number(manual.weight),
      reps: Number(manual.reps),
      date: manual.date || new Date().toISOString().slice(0, 10),
    };
    onAddManual?.(entry);
    setManual({ ...manual, weight: "", reps: "" });
  }

  function computePercentWeight() {
    const oneRm = Number(oneRmFromInput);
    const pct = Number(percentInput);
    if (!oneRm || !pct) return "";
    return Math.round((oneRm * pct) / 100);
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className={`btn ${tab === "volume" ? "active" : ""}`} onClick={() => setTab("volume")}>Volume</button>
          <button className={`btn ${tab === "1rm" ? "active" : ""}`} onClick={() => setTab("1rm")}>1RM Tools</button>
          <button className={`btn ${tab === "body" ? "active" : ""}`} onClick={() => setTab("body")}>Body Graphs</button>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <input placeholder="Sök övningar..." className="input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {tab === "volume" && (
        <div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Sets & Volume (senaste 7 dagarna)</div>
              {volumeData.length === 0 && <div className="small">Inga set registrerade senaste 7 dagarna</div>}
              {volumeData.slice(0, 12).map(item => (
                <div key={item.id} className="card small" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="small">{item.sets} sets • Volym ca {Math.round(item.volume)}</div>
                  </div>
                  <div style={{ width: 120 }}>{sparkline([item.sets, item.volume % 10 + 1, item.sets + 1])}</div>
                </div>
              ))}
            </div>

            <div style={{ width: 320 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Lägg till tidigare lyft</div>

              <div style={{ display: "grid", gap: 8 }}>
                <select className="input" value={manual.exerciseId} onChange={(e) => setManual({ ...manual, exerciseId: e.target.value })}>
                  {filteredExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>

                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" placeholder="Vikt kg" value={manual.weight} onChange={e => setManual({ ...manual, weight: e.target.value.replace(/[^\d.]/g, "") })} />
                  <input className="input" placeholder="Reps" value={manual.reps} onChange={e => setManual({ ...manual, reps: e.target.value.replace(/[^\d]/g, "") })} />
                </div>
                <input className="input" type="date" value={manual.date} onChange={e => setManual({ ...manual, date: e.target.value })} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={handleAddManual}>Spara tidigare lyft</button>
                  <div className="small" style={{ marginLeft: "auto", alignSelf: "center" }}>1RM ≈ {compute1RM() || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "1rm" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select className="input" value={formula} onChange={(e) => setFormula(e.target.value)} style={{ width: 160 }}>
              {Object.keys(FORMULAS).map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <input className="input" placeholder="Vikt (kg)" value={manual.weight} onChange={e => setManual({ ...manual, weight: e.target.value.replace(/[^\d.]/g, "") })} style={{ width: 120 }} />
            <input className="input" placeholder="Reps" value={manual.reps} onChange={e => setManual({ ...manual, reps: e.target.value.replace(/[^\d]/g, "") })} style={{ width: 100 }} />

            <div style={{ marginLeft: "auto", fontWeight: 700 }}>
              1RM ≈ {compute1RM() || "-"} kg
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Ange känt 1RM eller använd ovan</div>
              <input className="input" placeholder="1RM (kg)" value={oneRmFromInput} onChange={e => setOneRmFromInput(e.target.value.replace(/[^\d.]/g, ""))} />
            </div>

            <div style={{ width: 180 }}>
              <div className="small">Välj %</div>
              <input className="input" type="number" min={1} max={200} value={percentInput} onChange={e => setPercentInput(e.target.value.replace(/[^\d]/g, ""))} />
              <div className="small" style={{ marginTop: 6 }}>Vikt ≈ {computePercentWeight() || "-"} kg</div>
            </div>
          </div>

          <div className="card small" style={{ padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Formler — jämförelse</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {Object.entries(FORMULAS).map(([name, fn]) => {
                const w = Number(manual.weight);
                const r = Number(manual.reps);
                const res = w && r ? fn(w, r) : "-";
                return (
                  <div key={name} className="card tiny" style={{ padding: 8 }}>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div className="small">1RM ≈ {res}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "body" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(bodyStats).map(([key, arr]) => {
              const values = (arr || []).map(x => x.value).slice(-12);
              return (
                <div key={key} className="card small" style={{ padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{key}</div>
                    <div className="small">{(arr || []).length} datapunkter</div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>{sparkline(values)}</div>
                    <div style={{ width: 60, textAlign: "right", fontWeight: 700 }}>{values.length ? values[values.length - 1] : "-"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
