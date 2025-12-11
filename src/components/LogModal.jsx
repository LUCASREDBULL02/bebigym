import React, { useState, useEffect } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const todayStr = new Date().toISOString().slice(0,10);
  const [exerciseId,setExerciseId] = useState(EXERCISES?.[0]?.id || "");
  const [weight,setWeight] = useState("");
  const [reps,setReps] = useState("");
  const [rpe,setRpe] = useState("");
  const [date,setDate] = useState(todayStr);
  const [q,setQ] = useState("");

  useEffect(()=> {
    if (open) {
      setDate(todayStr);
      if (lastSet) {
        setExerciseId(lastSet.exerciseId);
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
      }
    }
  }, [open, lastSet, todayStr]);

  if (!open) return null;

  function submit(e){
    e.preventDefault();
    if (!exerciseId || !weight || !reps) return;
    onSave({ exerciseId, weight: Number(weight), reps: Number(reps), rpe: rpe?Number(rpe):null, date });
  }

  const choices = EXERCISES.filter(ex => ex.name.toLowerCase().includes(q.toLowerCase())).slice(0,40);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div className="modal-card card" onClick={e=>e.stopPropagation()} style={{width:420,maxWidth:"92%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:700}}>Logga set ✨</div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit}>
          <div className="input-group">
            <label>Sök övning</label>
            <input placeholder="Sök..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Övning</label>
            <select value={exerciseId} onChange={e=>setExerciseId(e.target.value)}>
              {choices.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}} className="input-group"><label>Datum</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div style={{flex:1}} className="input-group"><label>RPE (valfritt)</label><input type="number" value={rpe} onChange={e=>setRpe(e.target.value)} /></div>
          </div>

          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}} className="input-group"><label>Vikt (kg)</label><input type="number" value={weight} onChange={e=>setWeight(e.target.value)} /></div>
            <div style={{width:120}} className="input-group"><label>Reps</label><input type="number" value={reps} onChange={e=>setReps(e.target.value)} /></div>
          </div>

          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
            <button type="button" className="btn" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn-pink">Spara set</button>
          </div>
        </form>
      </div>
    </div>
  );
}
