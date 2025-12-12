// src/components/ProfileView.jsx
import React, { useState, useEffect } from "react";

export default function ProfileView({ profile, setProfile, bodyStats, onAddMeasurement, onDeleteMeasurement }) {
  const [form, setForm] = useState({ name: profile.name, nick: profile.nick, age:profile.age, height:profile.height, weight:profile.weight });
  useEffect(()=> setForm({ name: profile.name, nick: profile.nick, age:profile.age, height:profile.height, weight:profile.weight }), [profile]);

  const today = new Date().toISOString().slice(0,10);
  const [measurement, setMeasurement] = useState({ key:"waist", value:"", date:today });

  const labels = { waist:"Midja", hips:"Höfter", thigh:"Lår", glutes:"Glutes", chest:"Bröst", arm:"Arm" };

  function saveProfile(){
    setProfile({ ...profile, name: form.name, nick: form.nick, age: Number(form.age), height: Number(form.height), weight: Number(form.weight) });
  }

  function addMeasurement(){
    if(!measurement.value) return;
    const entry = { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), date: measurement.date, value: Number(measurement.value) };
    onAddMeasurement(measurement.key, entry);
    setMeasurement(prev=>({...prev, value:""}));
  }

  function MeasurementSpark({list}) {
    if(!list || list.length < 2) return <div style={{opacity:0.7}}>För få datapunkter</div>;
    const sorted = [...list].sort((a,b)=>a.date.localeCompare(b.date));
    const vals = sorted.map(s=>s.value);
    const min = Math.min(...vals), max = Math.max(...vals), span = max-min || 1;
    const w=160,h=40;
    const pts = sorted.map((m,i)=> {
      const x = (i/(sorted.length-1))*w;
      const y = h - ((m.value-min)/span)*h;
      return `${x},${y}`;
    }).join(" ");
    return <svg width={w} height={h}><polyline points={pts} fill="none" stroke="#ff6ea1" strokeWidth="2" /></svg>
  }

  return (
    <div className="profile-page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 className="profile-header">👤 Din profil</h2>
        <div style={{ fontSize:12, color:"var(--muted)" }}>Senast sparad: {profile.name}</div>
      </div>

      <div className="profile-card">
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ width:86, height:86, borderRadius:18, background:"linear-gradient(90deg,#ffd6e0,#ff9bbd)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:28 }}>
            {profile.nick?.[0] || "B"}
          </div>

          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{profile.name}</div>
            <div className="small" style={{ marginTop:6 }}>Ålder {profile.age} • {profile.height} cm • {profile.weight} kg</div>
          </div>
        </div>

        <div style={{ marginTop:10 }}>
          <div className="input-group">
            <label>Namn</label>
            <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Smeknamn</label>
            <input value={form.nick} onChange={e=>setForm({...form, nick: e.target.value})} />
          </div>

          <div className="profile-grid" style={{ marginTop:8 }}>
            <div className="input-group"><label>Ålder</label><input type="number" value={form.age} onChange={e=>setForm({...form, age:e.target.value})} /></div>
            <div className="input-group"><label>Längd (cm)</label><input type="number" value={form.height} onChange={e=>setForm({...form, height:e.target.value})} /></div>
            <div className="input-group"><label>Vikt (kg)</label><input type="number" value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} /></div>
          </div>

          <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn" onClick={()=> setForm({ name:profile.name, nick:profile.nick, age:profile.age, height:profile.height, weight:profile.weight })}>Ångra</button>
            <button className="btn-save" onClick={saveProfile}>💾 Spara profil</button>
          </div>
        </div>
      </div>

      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått</h3>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
          <select value={measurement.key} onChange={e=>setMeasurement(prev=>({...prev, key:e.target.value}))}>
            {Object.entries(labels).map(([k,v])=> <option key={k} value={k}>{v}</option>)}
          </select>
          <input placeholder="cm" type="number" value={measurement.value} onChange={e=>setMeasurement(prev=>({...prev, value:e.target.value}))} />
          <input type="date" value={measurement.date} onChange={e=>setMeasurement(prev=>({...prev, date:e.target.value}))} />
          <button className="btn-add" onClick={addMeasurement}>➕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {Object.entries(bodyStats).map(([k,arr])=>(
            <div key={k} style={{ borderRadius:12, padding:10, background:"rgba(255,255,255,0.02)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontWeight:700 }}>{labels[k] || k}</div>
                <div className="small">{arr.length>0 ? arr.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].value+" cm" : "—"}</div>
              </div>
              <MeasurementSpark list={arr} />
              <div style={{ marginTop:8 }}>
                {arr.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=>(
                  <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginTop:6 }}>
                    <div className="small">{m.date}</div>
                    <div style={{ fontWeight:700 }}>{m.value} cm</div>
                    <button className="delete-btn" onClick={()=>onDeleteMeasurement(k,m.id)}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeasurementSpark({list=[]}) {
  if(!list || list.length < 2) return <div style={{ marginTop:8, fontSize:12, color:"var(--muted)" }}>För få datapunkter för graf</div>;
  const sorted = [...list].sort((a,b)=>a.date.localeCompare(b.date));
  const vals = sorted.map(s=>s.value);
  const min = Math.min(...vals), max = Math.max(...vals), span = max-min || 1;
  const w=220,h=48;
  const pts = sorted.map((m,i)=> {
    const x = (i/(sorted.length-1))*w;
    const y = h - ((m.value-min)/span)*h;
    return `${x},${y}`;
  }).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke="#ff6ea1" strokeWidth="2" /></svg>
}
