// src/components/ProgramRunner.jsx
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
  const active = programs.find((p) => p.id === activeProgramId);

  if (!active)
    return <div className="card">Inga program hittades.</div>;

  const days = active.days || [];
  const day = days[dayIndex] || { name: "Dag", exercises: [] };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>📅 {active.name}</h2>

      {/* program selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {programs.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectProgram(p.id)}
            className={`btn ${p.id === activeProgramId ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background:
                p.id === activeProgramId
                  ? "rgba(255,110,161,0.2)"
                  : "rgba(255,255,255,0.02)",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* day selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => onNextDay(i)}
            className={`btn ${i === dayIndex ? "active" : ""}`}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              background:
                i === dayIndex
                  ? "rgba(255,110,161,0.2)"
                  : "rgba(255,255,255,0.02)",
              fontSize: 12,
            }}
          >
            {d.name || `Dag ${i + 1}`}
          </button>
        ))}
      </div>

      <h3 style={{ marginTop: 0 }}>{day.name}</h3>
      <div className="small" style={{ marginBottom: 10 }}>
        {day.exercises.length} övningar
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {day.exercises.map((ex, idx) => {
          const ref = EXERCISES.find((e) => e.id === ex.id);
          const name = ref?.name || ex.id;

          const history = logs.filter((l) => l.exerciseId === ex.id);
          const last = history[0];

          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{name}</div>
                <div className="small" style={{ color: "var(--muted)" }}>
                  {ex.sets}×{ex.reps}
                </div>
              </div>

              {last ? (
                <div className="small" style={{ marginTop: 4 }}>
                  Senast: {last.weight} kg × {last.reps} ({last.date})
                </div>
              ) : (
                <div className="small" style={{ marginTop: 4, opacity: 0.5 }}>
                  Ingen tidigare logg
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <button className="btn-pink" onClick={() => onNextDay()}>
          Nästa dag →
        </button>
      </div>
    </div>
  );
}
