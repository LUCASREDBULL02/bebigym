import React, { useState, useEffect } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [exerciseId, setExerciseId] = useState("bench");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [date, setDate] = useState(todayStr);

  useEffect(() => {
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!exerciseId || !weight || !reps) return;

    onSave({
      exerciseId,
      weight: Number(weight),
      reps: Number(reps),
      rpe: rpe ? Number(rpe) : null,
      date,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">Logga set ✨</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Övning</label>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              {EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="profile-grid">
            <div className="input-group">
              <label>Vikt (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>RPE (valfritt)</label>
              <input
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn-pink">
              Spara set 💪
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
