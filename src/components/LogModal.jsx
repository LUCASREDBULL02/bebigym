// src/components/LogModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const today = new Date().toISOString().slice(0,10);
  const [search, setSearch] = useState("");
  const [exerciseId, setExerciseId] = useState(EXERCISES[0]?.id || "");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [date, setDate] = useState(today);

  useEffect(()=>{
    if(open){
      setDate(today);
      if(lastSet){
        setExerciseId(lastSet.exerciseId);
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
      }
    }
  }, [open, lastSet, today]);

  const filtered = useMemo(()=> {
    const q = search.trim().toLowerCase();
    if(!q) return EXERCISES.slice(0,60);
    return EXERCISES.filter(e => e.name.toLowerCase().includes(q)).slice(0,60);
  }, [search]);

  if(!open) return null;

  function submit(e){
    e.preventDefault();
    if(!exerciseId || !weight || !reps) return;
    onSave({ exerciseId, weight: Number(weight), reps: Number(reps), rpe: rpe?Number(rpe):null, date });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Logga set</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit}>
          <div className="input-group">
            <label>Sök övning</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sök bänk, squat..." />
          </div>

          <div className="input-group">
            <label>Välj övning</label>
            <select value={exerciseId} onChange={e=>setExerciseId(e.target.value)}>
              {filtered.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Datum</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>

          <div className="profile-grid" style={{ marginTop:6 }}>
            <div className="input-group">
              <label>Vikt (kg)</label>
              <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Reps</label>
              <input type="number" value={reps} onChange={e=>setReps(e.target.value)} />
            </div>
            <div className="input-group">
              <label>RPE (valfritt)</label>
              <input type="number" value={rpe} onChange={e=>setRpe(e.target.value)} />
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:12 }}>
            <button type="button" className="btn" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn-pink">Spara set</button>
          </div>
        </form>
      </div>
    </div>
  );
}
