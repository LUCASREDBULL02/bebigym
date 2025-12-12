// src/components/CycleCalendar.jsx
import React, { useState, useEffect } from "react";

function getCycleInfoLocal(cycleStartISO, cycleLength = 28, todays = new Date()) {
  if (!cycleStartISO) return null;
  const start = new Date(cycleStartISO + "T00:00:00");
  const diffMs = todays - start;
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const idx = ((daysSince % cycleLength) + cycleLength) % cycleLength;
  const menstrualDays = Math.max(3, Math.round(cycleLength * 0.18));
  const follicularDays = Math.max(6, Math.round(cycleLength * 0.32));
  const ovulationDays = Math.max(1, Math.round(cycleLength * 0.07));
  const lutealDays = cycleLength - (menstrualDays + follicularDays + ovulationDays);
  if (idx < menstrualDays) return { phase: "Menstrual", dayInPhase: idx + 1, menstrualDays, follicularDays, ovulationDays, lutealDays, cycleIndex: idx };
  if (idx < menstrualDays + follicularDays) return { phase: "Follicular", dayInPhase: idx - menstrualDays + 1, menstrualDays, follicularDays, ovulationDays, lutealDays, cycleIndex: idx };
  if (idx < menstrualDays + follicularDays + ovulationDays) return { phase: "Ovulation", dayInPhase: idx - menstrualDays - follicularDays + 1, menstrualDays, follicularDays, ovulationDays, lutealDays, cycleIndex: idx };
  return { phase: "Luteal", dayInPhase: idx - menstrualDays - follicularDays - ovulationDays + 1, menstrualDays, follicularDays, ovulationDays, lutealDays, cycleIndex: idx };
}

export default function CycleCalendar({ cycleStart, setCycleStart, cycleLength, setCycleLength }) {
  const [start, setStart] = useState(cycleStart || "");
  const [length, setLength] = useState(cycleLength || 28);

  useEffect(() => setStart(cycleStart || ""), [cycleStart]);
  useEffect(() => setLength(cycleLength || 28), [cycleLength]);

  const today = new Date();
  const info = getCycleInfoLocal(start, Number(length || 28), today);

  const days = [];
  const clen = Number(length || 28);
  for (let d = 0; d < clen; d++) {
    let phase = "Luteal";
    const menstrualDays = Math.max(3, Math.round(clen * 0.18));
    const follicularDays = Math.max(6, Math.round(clen * 0.32));
    const ovDays = Math.max(1, Math.round(clen * 0.07));
    if (d < menstrualDays) phase = "Menstrual";
    else if (d < menstrualDays + follicularDays) phase = "Follicular";
    else if (d < menstrualDays + follicularDays + ovDays) phase = "Ovulation";
    days.push({ day: d + 1, phase });
  }

  function save() {
    setCycleStart(start);
    setCycleLength(Number(length) || 28);
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="h4">Cycle Calendar</div>
        <div className="muted small">Visualisera din menscykel och få träningstips</div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <div>
          <label className="muted small">Första dag</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="muted small">Längd (d)</label>
          <input type="number" min={20} max={40} value={length} onChange={(e) => setLength(e.target.value)} style={{ width: 80 }} />
        </div>
        <div style={{ alignSelf: "flex-end" }}>
          <button className="btn" onClick={save}>Spara</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="calendar-grid">
          {days.map((d) => (
            <div className={`cal-day ${d.phase.toLowerCase()}`} key={d.day}>
              <div className="cal-num">{d.day}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="muted small">Dagens fas: <strong>{info ? `${info.phase} (dag ${info.dayInPhase})` : "Ingen cykel satt"}</strong></div>
        </div>

        <div style={{ marginTop: 10 }} className="legend">
          <div><span className="legend-pill menstrual" /> Menstrual (lättare)</div>
          <div><span className="legend-pill follicular" /> Follicular (bygg)</div>
          <div><span className="legend-pill ovulation" /> Ovulation (peak)</div>
          <div><span className="legend-pill luteal" /> Luteal (återhämtning)</div>
        </div>
      </div>
    </div>
  );
}
