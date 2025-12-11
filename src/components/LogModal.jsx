// src/components/LogModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [query, setQuery] = useState("");
  const [exerciseId, setExerciseId] = useState(EXERCISES[0]?.id || "");
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

  useEffect(() => {
    setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return EXERCISES.slice(0, 60);
    return EXERCISES.filter(
      (e) => e.name.toLowerCase().includes(q) || (e.id || "").toLowerCase().includes(q)
    ).slice(0, 100);
  }, [query]);

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
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Logga set ✨</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div className="input-group">
            <label>Sök övning</label>
            <input
              placeholder="Sök (t.ex. bänk, squat, kelso)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
            {filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExerciseId(ex.id)}
                className={`btn ${exerciseId === ex.id ? "active" : ""}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: 6,
                  borderRadius: 8,
                }}
              >
                <span>{ex.name}</span>
                <span style={{ opacity: 0.7 }}>{ex.muscleGroup}</span>
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="profile-grid" style={{ marginTop: 6 }}>
            <div className="input-group">
              <label>Vikt (kg)</label>
              <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Reps</label>
              <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
            <div className="input-group">
              <label>RPE (valfritt)</label>
              <input type="number" step="0.5" value={rpe} onChange={(e) => setRpe(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button type="button" className="btn" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn-pink">Spara set 💪</button>
          </div>
        </form>
      </div>
    </div>
  );
}
