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
  const activeProgram =
    programs.find((p) => p.id === activeProgramId) || programs[0];
  const day = activeProgram?.days?.[dayIndex] || [];
  const today = new Date().toISOString().slice(0, 10);

  function countLoggedSets(exId) {
    return logs.filter((l) => l.date === today && l.exerciseId === exId).length;
  }

  return (
    <div className="card" style={{ width: "100%", overflowX: "hidden" }}>
      <h3 style={{ marginTop: 0 }}>Program Runner 📅</h3>
      <p className="small" style={{ marginBottom: 8 }}>
        Välj program, följ dagens pass och logga dina set. När allt är klart
        kan du gå vidare till nästa dag.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <select
          value={activeProgram.id}
          onChange={(e) => onSelectProgram(e.target.value)}
          style={{
            padding: "6px 8px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.8)",
            background: "rgba(15,23,42,0.9)",
            color: "#e5e7eb",
            fontSize: 13,
          }}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="small" style={{ alignSelf: "center" }}>
          Dag {dayIndex + 1} / {activeProgram.days.length} —{" "}
          <span style={{ fontWeight: 500 }}>{day?.name}</span>
        </div>
      </div>

      {!day.length && (
        <p className="small">Ingen dag definierad för detta program.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {day.exercises &&
          day.exercises.map((exId, idx) => {
            const ex = EXERCISES.find((e) => e.id === exId);
            const logged = countLoggedSets(exId);
            const targetSets = 3; // om du vill, kan du senare lägga per-övnings-set
            const done = logged >= targetSets;

            return (
              <div
                key={idx}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.5)",
                  background: done
                    ? "rgba(34,197,94,0.22)"
                    : "rgba(15,23,42,0.95)",
                  fontSize: 12,
                }}
              >
                <div style={{ marginBottom: 3 }}>
                  {ex?.name || exId}
                </div>
                <div className="small">
                  Loggade set idag: {logged}/{targetSets} {done ? "✅" : ""}
                </div>
              </div>
            );
          })}
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <button className="btn" style={{ flex: 1 }} onClick={onNextDay}>
          Nästa dag ➜
        </button>
      </div>
    </div>
  );
}
