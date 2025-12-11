import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { EXERCISES } from "../data/exercises";

export default function LiftTools({ logs, bodyStats, cycleInfo, onAddManual }) {
  const [tab, setTab] = useState("1rm");

  const logsByDate = useMemo(() => {
    return logs.map(l => ({
      date: l.date,
      oneRm: Math.round(l.weight * (1 + l.reps / 30))
    })).reverse();
  }, [logs]);

  return (
    <div>
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "1rm" ? "active" : ""}`} onClick={() => setTab("1rm")}>1RM utveckling</button>
        <button className={`tab-btn ${tab === "volume" ? "active" : ""}`} onClick={() => setTab("volume")}>Volym</button>
        <button className={`tab-btn ${tab === "body" ? "active" : ""}`} onClick={() => setTab("body")}>Kroppsmått</button>
      </div>

      {/* 1RM CHART */}
      {tab === "1rm" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>1RM över tid</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={logsByDate}>
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="oneRm" stroke="#ff7ebd" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* VOLUME CHART */}
      {tab === "volume" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Total träningsvolym (kg × reps)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={logs.map(l => ({ date: l.date, vol: l.weight * l.reps }))}>
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="vol" fill="#ff8fcf" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BODY MEASUREMENTS */}
      {tab === "body" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Kroppsmått Progress</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={combineStats(bodyStats)}>
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="waist" stroke="#ff7ebd" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="hips" stroke="#ffaedd" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="glutes" stroke="#ff93cc" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function combineStats(stats) {
  const dates = new Set();
  Object.values(stats).forEach(arr => arr.forEach(m => dates.add(m.date)));
  const sorted = Array.from(dates).sort();

  return sorted.map(date => ({
    date,
    waist: stats.waist.find(m => m.date === date)?.value,
    hips: stats.hips.find(m => m.date === date)?.value,
    glutes: stats.glutes.find(m => m.date === date)?.value,
  }));
}
