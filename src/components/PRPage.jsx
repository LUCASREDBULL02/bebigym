// src/components/PRPage.jsx
import React, { useMemo } from "react";
import { EXERCISES } from "../data/exercises";

function SmallLine({ points = [], height = 48, width = 180 }) {
  if (!points || points.length < 2) {
    return <div className="small-line empty">—</div>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pts = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="small-line">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PRPage({ prMap, logs }) {
  // Build time series per exercise from logs (by date asc)
  const series = useMemo(() => {
    const byEx = {};
    (logs || []).forEach((l) => {
      if (!byEx[l.exerciseId]) byEx[l.exerciseId] = [];
      byEx[l.exerciseId].push({ date: l.date, oneRm: Math.round(l.weight * (1 + l.reps / 30)) });
    });
    Object.keys(byEx).forEach((k) => {
      byEx[k] = [...byEx[k]].sort((a, b) => a.date.localeCompare(b.date));
    });
    return byEx;
  }, [logs]);

  // list of exercises to show (top PRs first)
  const rows = Object.keys(prMap || {}).map((exId) => {
    const e = EXERCISES.find((x) => x.id === exId);
    const best = prMap[exId]?.best1RM || 0;
    const hist = series[exId] ? series[exId].map((h) => h.oneRm) : [];
    return { exId, name: e?.name || exId, best, hist };
  }).sort((a,b) => b.best - a.best);

  return (
    <div className="card">
      <div className="card-header">
        <div className="h4">PR & styrkehistorik</div>
        <div className="muted small">Topp-PR och utveckling per övning</div>
      </div>

      {!rows.length && <p className="small">Inga PR:er än — logga set för att börja bygga historik.</p>}

      <div className="pr-list">
        {rows.map((r) => (
          <div className="pr-row" key={r.exId}>
            <div style={{ flex: 1 }}>
              <div className="pr-name">{r.name}</div>
              <div className="muted small">Topp-PR: <strong>{r.best} kg</strong></div>
            </div>
            <div style={{ width: 220, display: "flex", alignItems: "center", gap: 12 }}>
              <SmallLine points={r.hist} />
              <div className="pr-badge">{r.best} kg</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
