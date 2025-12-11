// src/components/ProgramRunner.jsx
import React from "react";
import { EXERCISES } from "../data/exercises";

export default function ProgramRunner({ programs, activeProgramId, dayIndex, onSelectProgram, onNextDay, logs }) {
  const active = programs.find(p => p.id === activeProgramId) || programs[0];
  const day = active?.days?.[dayIndex] || { exercises: [] };
  const today = new Date().toISOString().slice(0,10);

  function countLoggedSets(exId){
    return logs.filter(l => l.date === today && l.exerciseId === exId).length;
  }

  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>Program Runner</h3>
      <div style={{ display:"flex", gap:10, marginBottom:8 }}>
        <select value={active.id} onChange={(e)=> onSelectProgram(e.target.value)} style={{padding:8, borderRadius:10}}>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="small" style={{ alignSelf:"center" }}>Dag {dayIndex+1} / {active.days.length}</div>
      </div>

      {!day.exercises.length && <p className="small">Ingen dag definierad.</p>}

      {day.exercises.map((exId, i) => {
        const e = EXERCISES.find(x => x.id === exId) || {name:exId};
        const logged = countLoggedSets(exId);
        const done = logged >= 3; // default
        return (
          <div key={i} style={{ padding:10, borderRadius:10, background: done ? "linear-gradient(90deg,#d4fbd9,#b8f6ca)" : "rgba(255,255,255,0.02)", marginBottom:8 }}>
            <div style={{ fontWeight:700 }}>{e.name}</div>
            <div className="small">Loggade set idag: {logged} / 3 {done ? "✅" : ""}</div>
          </div>
        )
      })}

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button className="btn" onClick={onNextDay}>Nästa dag ➜</button>
      </div>
    </div>
  );
}
