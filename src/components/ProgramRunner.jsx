import React from "react";
import { EXERCISES } from "../data/exercises";

export default function ProgramRunner({ programs = [], activeProgramId, dayIndex = 0, onSelectProgram, onNextDay, logs=[] }) {
  const active = programs.find(p=>p.id===activeProgramId) || programs[0];
  const day = active?.days?.[dayIndex] || { name:"Day", exercises:[] };
  const today = new Date().toISOString().slice(0,10);
  function countLogged(exId){ return logs.filter(l=>l.date===today && l.exerciseId===exId).length; }

  return (
    <div className="card">
      <h3 style={{marginTop:0}}>Program Runner</h3>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <select value={active.id} onChange={e=>onSelectProgram(e.target.value)}>
          {programs.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="small">Dag {dayIndex+1}/{active.days.length}</div>
      </div>

      {!day.exercises.length && <div className="small">Ingen dag definierad.</div>}
      <div style={{display:"grid",gap:8}}>
        {day.exercises.map((exId,idx)=>{
          const ex = EXERCISES.find(e=>e.id===exId) || {name:exId};
          const logged = countLogged(exId);
          return (
            <div key={exId} className="card small" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>{ex.name}</div>
              <div className="small">{logged} sets logged</div>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
        <button className="btn" onClick={onNextDay}>Nästa dag ➜</button>
      </div>
    </div>
  );
}
