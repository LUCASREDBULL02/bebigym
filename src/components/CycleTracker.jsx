import React, { useMemo } from "react";

export default function CycleTracker({ cycle, setCycle }) {
  const today = new Date().toISOString().slice(0, 10);

  function daysBetween(a, b) {
    return Math.floor((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
  }

  const phase = useMemo(() => {
    if (!cycle.lastPeriodStart) return null;
    const day = daysBetween(cycle.lastPeriodStart, today) % cycle.cycleLength;

    if (day <= 5) return { key: "menstruation", name: "Menstruation", color: "#fca5a5" };
    if (day <= 13) return { key: "follicular", name: "Follicular (Starkare)", color: "#fb7185" };
    if (day === 14) return { key: "ovulation", name: "Ovulation (Peak)", color: "#f472b6" };
    return { key: "luteal", name: "Luteal (Varierande)", color: "#f9a8d4" };
  }, [cycle, today]);

  const strengthAdvice = {
    menstruation: "Lugnare träning, fokus på form och rörlighet.",
    follicular: "Du är som starkast! Push tungt idag.",
    ovulation: "Peakstyrka – perfekt till PR!",
    luteal: "Stabil styrka, men energi varierar.",
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>🌸 Menstruationscykel & Styrkefaser</h2>

      <div className="card small" style={{ background: "#fff", marginTop: 10 }}>
        <label className="small">Senaste mensens startdatum</label>
        <input
          type="date"
          className="input"
          value={cycle.lastPeriodStart || ""}
          onChange={(e) => setCycle({ ...cycle, lastPeriodStart: e.target.value })}
        />
      </div>

      <div className="card small" style={{ marginTop: 10 }}>
        <label className="small">Genomsnittlig cykellängd (dagar)</label>
        <input
          type="number"
          className="input"
          min={20}
          max={40}
          value={cycle.cycleLength}
          onChange={(e) => setCycle({ ...cycle, cycleLength: Number(e.target.value) })}
        />
      </div>

      {phase && (
        <>
          <div className="card small" style={{ marginTop: 20, borderLeft: `6px solid ${phase.color}` }}>
            <h3 style={{ margin: 0 }}>{phase.name}</h3>
            <p className="small" style={{ margin: "6px 0" }}>
              {strengthAdvice[phase.key]}
            </p>
          </div>

          <Calendar cycle={cycle} />
        </>
      )}
    </div>
  );
}

// ------------------ CALENDAR ------------------

function Calendar({ cycle }) {
  const days = Array.from({ length: cycle.cycleLength }, (_, i) => i);

  function phaseOf(day) {
    if (day <= 5) return "menstruation";
    if (day <= 13) return "follicular";
    if (day === 14) return "ovulation";
    return "luteal";
  }

  const colors = {
    menstruation: "#fecaca",
    follicular: "#fbcfe8",
    ovulation: "#f472b6",
    luteal: "#f9a8d4",
  };

  return (
    <div className="card" style={{ marginTop: 20, padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>🌈 Cykelkarta</h3>
      <div className="cycle-grid">
        {days.map((d) => {
          const p = phaseOf(d);
          return (
            <div
              key={d}
              className="cycle-day"
              style={{ background: colors[p] }}
            >
              {d + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}
