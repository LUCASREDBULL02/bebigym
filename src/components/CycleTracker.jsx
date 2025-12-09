import React, { useState, useEffect, useMemo } from "react";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDiffInDays(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getPhaseForDay(cycleDay, cycleLength) {
  if (!cycleDay || !cycleLength) {
    return {
      phase: "Okänd",
      strength: "Normal",
      emoji: "❓",
      advice: "Fyll i din cykelinfo för att se rekommendationer.",
      score: 50,
      color: "rgba(148,163,184,0.25)",
    };
  }

  const m = cycleLength;
  const menstruationEnd = Math.round((5 / 28) * m);
  const follicularEnd = Math.round((12 / 28) * m);
  const ovulationEnd = Math.round((15 / 28) * m);

  if (cycleDay <= menstruationEnd)
    return {
      phase: "Menstruation",
      strength: "Lägre styrka",
      emoji: "🩸",
      advice: "Lättare pass, fokus på teknik.",
      score: 35,
      color: "rgba(248,113,113,0.25)",
    };

  if (cycleDay <= follicularEnd)
    return {
      phase: "Follikulär fas",
      strength: "Stigande styrka",
      emoji: "🌱",
      advice: "Progressa! Bra fas för utveckling.",
      score: 70,
      color: "rgba(74,222,128,0.25)",
    };

  if (cycleDay <= ovulationEnd)
    return {
      phase: "Ägglossning – Peak",
      strength: "Topprestations-fas",
      emoji: "💛",
      advice: "Magisk fas för tunga PR-försök.",
      score: 90,
      color: "rgba(250,204,21,0.3)",
    };

  return {
    phase: "Luteal fas",
    strength: "Mellan styrka",
    emoji: "🌙",
    advice: "Pump, högt reps, mer kontroll.",
    score: 55,
    color: "rgba(129,140,248,0.3)",
  };
}

export default function CycleTracker() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("bebi_cycle");
    return saved
      ? JSON.parse(saved)
      : { lastPeriodDate: "", cycleLength: 28 };
  });

  useEffect(() => {
    localStorage.setItem("bebi_cycle", JSON.stringify(settings));
  }, [settings]);

  const today = new Date();
  const todayStr = formatDate(today);

  const todayInfo = useMemo(() => {
    if (!settings.lastPeriodDate) return getPhaseForDay(null, null);

    const diff = getDiffInDays(settings.lastPeriodDate, todayStr);
    if (diff < 0) return getPhaseForDay(null, null);

    const cycleDay = (diff % settings.cycleLength) + 1;
    return getPhaseForDay(cycleDay, settings.cycleLength);
  }, [settings, todayStr]);

  const calendarDays = useMemo(() => {
    const arr = [];
    const len = Number(settings.cycleLength) || 28;

    for (let i = 0; i < 28; i++) {
      const d = addDays(today, i);
      const ds = formatDate(d);

      if (!settings.lastPeriodDate) {
        arr.push({
          dateStr: ds,
          label: ds.slice(5),
          cycleDay: null,
          phaseInfo: getPhaseForDay(null, null),
        });
        continue;
      }

      const diff = getDiffInDays(settings.lastPeriodDate, ds);
      const cycleDay = diff >= 0 ? (diff % len) + 1 : null;

      arr.push({
        dateStr: ds,
        label: ds.slice(5),
        cycleDay,
        phaseInfo: getPhaseForDay(cycleDay, len),
      });
    }
    return arr;
  }, [settings, today]);

  return (
    <div className="cycle-root">
      <div className="card">
        <div style={{ fontSize: 14, opacity: 0.8 }}>Dagens fas</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {todayInfo.emoji} {todayInfo.phase}
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          {todayInfo.strength} – {todayInfo.advice}
        </div>
        <div
          style={{
            marginTop: 8,
            padding: "4px 10px",
            borderRadius: 12,
            background: todayInfo.color,
            width: "fit-content",
            fontSize: 12,
          }}
        >
          PR-läge: {todayInfo.score}/100 🔥
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600 }}>Cykelinställningar</div>

        <label className="small">Senaste mensen (1:a dagen):</label>
        <input
          type="date"
          className="input"
          value={settings.lastPeriodDate}
          onChange={(e) =>
            setSettings((p) => ({ ...p, lastPeriodDate: e.target.value }))
          }
        />

        <label className="small" style={{ marginTop: 6 }}>
          Cykellängd:
        </label>
        <input
          className="input"
          type="number"
          min="21"
          max="40"
          value={settings.cycleLength}
          onChange={(e) =>
            setSettings((p) => ({ ...p, cycleLength: Number(e.target.value) }))
          }
        />
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          28 dagar framåt
        </div>

        <div className="cycle-grid">
          {calendarDays.map((d) => (
            <div
              key={d.dateStr}
              className={`cycle-day ${d.dateStr === todayStr ? "today" : ""}`}
              style={{ background: d.phaseInfo.color }}
            >
              <div className="cycle-day-date">{d.label}</div>
              <div className="cycle-day-emoji">{d.phaseInfo.emoji}</div>
              <div className="cycle-day-phase">
                {d.cycleDay ? `Dag ${d.cycleDay}` : "–"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
