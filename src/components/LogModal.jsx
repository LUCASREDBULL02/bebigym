import React, { useState, useEffect } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [exercise, setExercise] = useState("bench");
  const [search, setSearch] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(todayStr);

  useEffect(() => {
    if (open) {
      setDate(todayStr);
      if (lastSet) {
        setExercise(lastSet.exerciseId);
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
      }
    }
  }, [open]);

  if (!open) return null;

  const filteredExercises = EXERCISES.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!exercise || !weight || !reps) return;
    onSave({ exerciseId: exercise, weight: Number(weight), reps: Number(reps), date });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          Logga set ✨
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="input-group">
          <label>Sök övning</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bänk, knäböj, row..." />
        </div>

        <div className="input-group">
          <label>Välj övning</label>
          <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
            {filteredExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Datum</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="profile-grid" style={{ marginTop: 14 }}>
          <div className="input-group">
            <label>Vikt (kg)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Reps</label>
            <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Avbryt</button>
          <button type="submit" className="btn-pink">Spara set 💪</button>
        </div>
      </form>
    </div>
  );
}
