import React, { useState } from "react";

export default function ProfileView({ profile, setProfile, bodyStats = {}, onAddMeasurement, onDeleteMeasurement }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    nick: profile.nick || "",
    age: profile.age || "",
    height: profile.height || "",
    weight: profile.weight || "",
  });
  const todayStr = new Date().toISOString().slice(0,10);
  const [newMeasurement, setNewMeasurement] = useState({ key: "waist", value: "", date: todayStr });

  const labels = { waist: "Midja", hips:"Höfter", thigh:"Lår", glutes:"Glutes", chest:"Bröst", arm:"Arm" };

  function handleSave(){
    setProfile({...profile, name: form.name, nick: form.nick, age: Number(form.age), height: Number(form.height), weight: Number(form.weight)});
  }

  function addMeasurement(){
    if (!newMeasurement.value) return;
    const entry = { id: crypto?.randomUUID?.()||Math.random().toString(36).slice(2), date: newMeasurement.date || todayStr, value: Number(newMeasurement.value) };
    onAddMeasurement(newMeasurement.key, entry);
    setNewMeasurement({...newMeasurement, value: ""});
  }

  function MeasurementSparkline({list=[]}){
    if (!list || list.length < 2) return null;
    const sorted = [...list].sort((a,b)=>a.date.localeCompare(b.date));
    const vals = sorted.map(s => s.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = max - min || 1;
    const W = 120, H = 36;
    const points = sorted.map((m,i)=> {
      const x = (i/(sorted.length-1))*W;
      const y = H - ((m.value - min)/span)*H;
      return `${x},${y}`;
    }).join(" ");
    return <svg className="measure-sparkline" viewBox={`0 0 ${W} ${H}`}><polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} /></svg>;
  }

  function getSummary(list=[]){
    if (!list.length) return null;
    const sorted = [...list].sort((a,b)=>a.date.localeCompare(b.date));
    const first = sorted[0], last = sorted[sorted.length-1];
    return { first, last, diff: last.value - first.value };
  }

  return (
    <div className="profile-page">
      <h2 className="profile-header">👤 Din profil & kroppsmått</h2>

      <div className="profile-card">
        <h3 className="section-title">🧸 Grundinfo</h3>
        <div className="input-group"><label>Namn</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="input-group"><label>Smeknamn</label><input value={form.nick} onChange={e=>setForm({...form,nick:e.target.value})} /></div>
        <div className="profile-grid">
          <div className="input-group"><label>Ålder</label><input type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} /></div>
          <div className="input-group"><label>Längd (cm)</label><input type="number" value={form.height} onChange={e=>setForm({...form,height:e.target.value})} /></div>
          <div className="input-group"><label>Vikt (kg)</label><input type="number" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} /></div>
        </div>
        <div style={{marginTop:8}}><button className="btn-pink" onClick={handleSave}>💾 Spara profil</button></div>
      </div>

      <div className="profile-card">
        <h3 className="section-title">📏 Kroppsmått & utveckling</h3>

        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select value={newMeasurement.key} onChange={e=>setNewMeasurement({...newMeasurement,key:e.target.value})}>
            {Object.entries(labels).map(([k,v])=> <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="number" placeholder="cm" value={newMeasurement.value} onChange={e=>setNewMeasurement({...newMeasurement,value:e.target.value})}/>
          <input type="date" value={newMeasurement.date} onChange={e=>setNewMeasurement({...newMeasurement,date:e.target.value})}/>
          <button className="btn" onClick={addMeasurement}>➕</button>
        </div>

        <div style={{marginTop:12}}>
          {Object.entries(bodyStats).map(([k,list])=>{
            const summary = getSummary(list);
            return (
              <div key={k} className="measure-block">
                <div className="measure-header-row">
                  <div>
                    <h4 className="measure-title">{labels[k] || k}</h4>
                    {summary ? <div className="measure-meta small">Senast: <strong>{summary.last.value} cm</strong> ({summary.last.date}) • Förändring: <strong style={{color: summary.diff>0?"#ff9ec2":"#9ef2c8"}}>{summary.diff>0?"+":""}{summary.diff.toFixed(1)} cm</strong></div> : <div className="measure-meta small">Inga värden än</div>}
                  </div>

                  <MeasurementSparkline list={list} />
                </div>

                {(!list || list.length===0) ? <p className="empty-text">Inga registrerade värden.</p> :
                  <div className="measure-list">
                    {list.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=>(
                      <div key={m.id} className="measure-item">
                        <span>{m.date}: <strong>{m.value} cm</strong></span>
                        <button className="delete-btn" onClick={()=>onDeleteMeasurement(k,m.id)}>🗑️</button>
                      </div>
                    ))}
                  </div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
