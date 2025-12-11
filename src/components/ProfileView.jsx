import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function ProfileView({ profile, setProfile, bodyStats, onAddMeasurement, onDeleteMeasurement }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(profile);

  function save() {
    setProfile(local);
    setEditing(false);
  }

  function addMeasurement(key) {
    const value = prompt("Mått i cm:");
    if (!value) return;
    onAddMeasurement(key, { id: Math.random(), value: Number(value), date: new Date().toISOString().slice(0, 10) });
  }

  return (
    <div className="card profile-card">

      <img src={profile.avatar} alt="" className="profile-avatar" />

      <h2>{profile.name}</h2>
      <div className="small">{profile.height} cm • {profile.weight} kg • {profile.age} år</div>

      {!editing ? (
        <button className="btn-pink" style={{ marginTop: 14 }} onClick={() => setEditing(true)}>Redigera profil</button>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div className="input-group">
            <label>Namn</label>
            <input value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
          </div>
          <div className="profile-grid">
            <div className="input-group">
              <label>Längd</label>
              <input type="number" value={local.height} onChange={(e) => setLocal({ ...local, height: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Vikt</label>
              <input type="number" value={local.weight} onChange={(e) => setLocal({ ...local, weight: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Ålder</label>
              <input type="number" value={local.age} onChange={(e) => setLocal({ ...local, age: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Smeknamn</label>
              <input value={local.nick} onChange={(e) => setLocal({ ...local, nick: e.target.value })} />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn" onClick={() => setEditing(false)}>Avbryt</button>
            <button className="btn-pink" onClick={save}>Spara</button>
          </div>
        </div>
      )}

      {/* BODY PROGRESS GRAPH */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Kroppsmått — Progress</h3>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mergeBodyStats(bodyStats)}>
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="waist" stroke="#ff7ebd" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="hips" stroke="#ff93cc" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="glutes" stroke="#ffb2df" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>

        <div className="profile-grid" style={{ marginTop: 14 }}>
          {["waist", "hips", "glutes"].map((key) => (
            <button key={key} className="btn" onClick={() => addMeasurement(key)}>
              + Lägg till {key}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

function mergeBodyStats(stats) {
  const dates = new Set();
  Object.values(stats).forEach(arr => arr.forEach(m => dates.add(m.date)));
  const sorted = Array.from(dates).sort();

  return sorted.map(date => ({
    date,
    waist: stats.waist.find(m => m.date === date)?.value,
    hips: stats.hips.find(m => m.date === date)?.value,
    glutes: stats.glutes.find(m => m.date === date)?.value
  }));
}
