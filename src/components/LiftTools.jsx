// src/components/LiftTools.jsx
import React, { useState, useMemo } from "react";

function Tabs({tabs, value, onChange}){
  return (
    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)} className={`btn ${value===t ? "active" : ""}`} style={{ padding:"6px 10px" }}>
          {t}
        </button>
      ))}
    </div>
  );
}

export default function LiftTools({ logs, bodyStats, cycleInfo, onAddManual }) {
  const [tab, setTab] = useState("1RM Estimator");

  // build history per exercise for simple sparkline
  const byExercise = useMemo(() => {
    const map = {};
    (logs||[]).forEach(l => {
      if (!map[l.exerciseId]) map[l.exerciseId] = [];
      const oneRm = Math.round(l.weight * (1 + l.reps/30));
      map[l.exerciseId].push({ date: l.date, oneRm, weight: l.weight, reps: l.reps });
    });
    return map;
  }, [logs]);

  return (
    <div>
      <Tabs tabs={["1RM Estimator","Volume Tracker","Progress Graphs","Body Progress"]} value={tab} onChange={setTab} />

      {tab === "1RM Estimator" && (
        <div>
          <h4>1RM Estimator (Epley)</h4>
          <p className="small">Räkna 1RM från sets eller mata in manuellt.</p>
          <div className="card" style={{ padding:12 }}>
            <Manual1RM onAddManual={onAddManual} />
          </div>
        </div>
      )}

      {tab === "Volume Tracker" && (
        <div>
          <h4>Volume Tracker (sets/week)</h4>
          <div className="card">
            <VolumeSummary logs={logs} />
          </div>
        </div>
      )}

      {tab === "Progress Graphs" && (
        <div>
          <h4>Styrkeutveckling per övning</h4>
          <div style={{ display:"grid", gap:10 }}>
            {Object.keys(byExercise).length === 0 && <p className="small">Inga lyft att visa.</p>}
            {Object.entries(byExercise).map(([id, arr]) => (
              <div key={id} className="card small" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontWeight:700 }}>{id}</div>
                <MiniSpark data={arr.map(x=>x.oneRm)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Body Progress" && (
        <div>
          <h4>Body Progress Dashboard</h4>
          <div className="card">
            <BodyProgressChart bodyStats={bodyStats} />
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper subcomponents */
function Manual1RM({ onAddManual }) {
  const [exerciseId, setExerciseId] = useState("");
  const [oneRm, setOneRm] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  function save(){
    if(!oneRm || !exerciseId) return;
    const entry = { id: Math.random().toString(36), exerciseId, weight: Math.round(oneRm), reps: 1, date };
    onAddManual && onAddManual(entry);
  }

  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <input placeholder="Övning id (ex: bench)" value={exerciseId} onChange={e=>setExerciseId(e.target.value)} />
      <input placeholder="1RM kg" value={oneRm} onChange={e=>setOneRm(e.target.value)} />
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      <button className="btn-pink" onClick={save}>Lägg in</button>
    </div>
  );
}

function MiniSpark({ data = [] }) {
  if(!data.length) return null;
  const width = 140, height = 40;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1))*width;
    const y = height - ((v-min)/span)*height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height}>
      <polyline fill="none" stroke="#ff6ea1" strokeWidth="2" points={pts} />
    </svg>
  );
}

function VolumeSummary({ logs=[] }) {
  // simple sets/week count: group by ISO week
  const weeks = {};
  logs.forEach(l => {
    const wk = l.date.slice(0,7); // crude month-week key
    weeks[wk] = (weeks[wk]||0) + 1;
  });
  return (
    <div>
      {Object.keys(weeks).length === 0 && <p className="small">Inga loggar än.</p>}
      {Object.entries(weeks).map(([wk,c]) => (
        <div key={wk} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px dashed rgba(255,255,255,0.02)" }}>
          <div>{wk}</div>
          <div>{c} sets</div>
        </div>
      ))}
    </div>
  );
}

function BodyProgressChart({ bodyStats={} }) {
  // plot all metrics on one chart with simple normalized scaling
  const keys = Object.keys(bodyStats);
  const allDates = {};
  keys.forEach(k => bodyStats[k].forEach(m => allDates[m.date] = true));
  const dates = Object.keys(allDates).sort();

  if(dates.length === 0) return <p className="small">Inga kroppsmått ännu</p>;

  // build dataset per metric
  const datasets = keys.map(k => {
    const map = {};
    bodyStats[k].forEach(m => map[m.date] = m.value);
    const values = dates.map(d => map[d] ?? null);
    return { key:k, values };
  });

  // normalize values to chart height
  const width = Math.min(720, Math.max(300, dates.length * 40));
  const height = 180;

  return (
    <div style={{ overflowX:"auto" }}>
      <svg width={width} height={height} style={{ display:"block" }}>
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
        {datasets.map((ds, idx) => {
          const color = idx===0 ? "#ff6ea1" : idx===1 ? "#ff9bbd" : idx%2===0 ? "#ffd6e0" : "#fbdcee";
          const vals = ds.values.map(v => v===null?null:v);
          const nums = vals.filter(v=>v!==null);
          if(nums.length===0) return null;
          const min = Math.min(...nums), max = Math.max(...nums);
          const span = max - min || 1;
          const pts = vals.map((v,i) => {
            const x = (i/(dates.length-1))*(width-20)+10;
            const y = v===null ? height : height - ((v-min)/span)*(height-20)-10;
            return `${x},${y}`;
          }).join(" ");
          return <polyline key={ds.key} points={pts} fill="none" stroke={color} strokeWidth="2" opacity={0.95} />;
        })}
      </svg>
      <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
        {datasets.map((d, i) => <div key={d.key} style={{ fontSize:12, color:"var(--muted)" }}>{d.key}</div>)}
      </div>
    </div>
  );
}
