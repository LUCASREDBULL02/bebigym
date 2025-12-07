import React from "react";
import { EXERCISES } from "../data/exercises";

export default function ProgramRunner({
  programs,
  activeProgramId,
  dayIndex,
  onSelectProgram,
  onNextDay,
  logs,
}) {
  const activeProgram = programs.find((p) => p.id === activeProgramId) || programs[0];
  const today = new Date().toISOString().slice(0, 10);

  // Get today’s day block
  const dayBlock = activeProgram?.days?.[dayIndex] || null;

  // Normalize exercises to a uniform shape:
  // ["bench", "row"] → [{ exerciseId:"bench", sets:3, reps:8 }, ...]
  const exercises =
    dayBlock?.exercises?.map((ex) => {
      if (typeof ex === "string") {
        return { exerciseId: ex, sets: 3, reps: 8 }; // DEFAULT
      }
      // If someone uses full object format
      return {
        exerciseId: ex.exerciseId,
        sets: ex.sets || 3,
        reps: ex.reps || 8,
      };
    }) || [];

  function countLoggedSets(exId) {
    return logs.filter((l) => l.date === today && l.exerciseId === exId).length;
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Program Runner 📅</h3>

      <p className="small">
        Välj program och följ dagens pass. Set loggas automatiskt i loggboken.
      </p>

      {/* Program selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <select
          value={activeProgram.id}
          onChange={(e) => onSelectProgram(e.target.value)}
          style={{
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.7)",
            background: "rgba(15,23,42,0.9)",
            color: "#e5e7eb",
          }}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="small" style={{ alignSelf: "center" }}>
          Dag {dayIndex + 1} / {activeProgram.days.length}
        </div>
      </div>

      {/* Missing day */}
      {!dayBlock && <p className="small">Ingen dag definierad.</p>}

      {/* List exercises */}
      {exercises.map((d, i) => {
        const ex = EXERCISES.find((e) => e.id === d.exerciseId) || { name: d.exerciseId };

        const logged = countLoggedSets(d.exerciseId);
        const done = logged >= d.sets;

        return (
          <div
            key={i}
            style={{
              padding: "6px 8px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.4)",
              background: done ? "rgba(34,197,94,0.25)" : "rgba(15,23,42,0.9)",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            <div>
              {ex.name} — {d.sets} x {d.reps}
            </div>
            <div className="small">
              Loggade set idag: {logged}/{d.sets} {done ? "✅" : ""}
            </div>
          </div>
        );
      })}

      {/* Next day */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" onClick={onNextDay}>
          Nästa dag ➜
        </button>
      </div>
    </div>
  );
}
