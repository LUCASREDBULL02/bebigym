import React, { useState, useEffect } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [exerciseId, setExerciseId] = useState("bench");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [date, setDate] = useState(todayStr);

  const [search, setSearch] = useState("");

  // Filtered exercise list based on search input
  const filteredExercises = EXERCISES.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  // Autofill when modal opens
  useEffect(() => {
    if (open) {
      setDate(todayStr);
      setSearch("");

      if (lastSet) {
        setExerciseId(lastSet.exerciseId);
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
        setRpe(lastSet.rpe || "");
      }
    }
  }, [open, lastSet]);

  // ESC closes modal
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        style={{
          animation: "popIn 0.25s ease",
        }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-title">✨ Logga nytt set</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>


          {/* SEARCH FIELD */}
          <div className="input-group">
            <label>Sök övning</label>
            <input
              type="text"
              placeholder="Bänkpress, knäböj, hip thrust..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>


          {/* EXERCISE SELECT */}
          <div className="input-group">
            <label>Välj övning</label>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              {filteredExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}

              {/* If search gives 0 results */}
              {filteredExercises.length === 0 && (
                <option disabled>(Inga övningar matchar sökningen)</option>
              )}
            </select>
          </div>


          {/* DATE */}
          <div className="input-group">
            <label>Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>


          {/* WEIGHT / REPS / RPE GRID */}
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


          {/* FOOTER BUTTONS */}
          <div
            className="modal-footer"
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{
                background: "#eee",
                padding: "10px 16px",
                borderRadius: "12px",
              }}
            >
              Avbryt
            </button>

            <button
              type="submit"
              className="btn-pink"
              style={{
                padding: "10px 18px",
                borderRadius: "14px",
                fontSize: 15,
              }}
            >
              💖 Spara set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
