import React, { useState, useMemo, useEffect } from "react";
import "./index.css";

import ProfileView from "./components/ProfileView.jsx";
import LiftTools from "./components/LiftTools.jsx";
import LogModal from "./components/LogModal.jsx";
import ProgramRunner from "./components/ProgramRunner.jsx";

/* simple stubs so app runs — replace with your full components later */
import BossArena from "./components/simple-stubs/BossArena.jsx";
import MuscleMap from "./components/simple-stubs/MuscleMap.jsx";
import Achievements from "./components/simple-stubs/Achievements.jsx";
import PRList from "./components/simple-stubs/PRList.jsx";
import MuscleComparison from "./components/simple-stubs/MuscleComparison.jsx";
import BattlePass from "./components/simple-stubs/BattlePass.jsx";
import Toast from "./components/simple-stubs/Toast.jsx";

import { EXERCISES } from "./data/exercises";
import { MUSCLES } from "./data/muscles";
import { STRENGTH_STANDARDS } from "./data/strengthStandards";
import { PROGRAMS } from "./data/programs";
import { initialBosses } from "./data/bosses";

function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

/* recompute helpers (lightweight) */
function recomputeFromLogs(logs, profile) {
  let xp = 0, battleTier = 1, bosses = initialBosses(), prMap = {};
  logs.slice().reverse().forEach((entry) => {
    const oneRm = calc1RM(entry.weight, entry.reps);
    xp += Math.max(5, Math.round(oneRm / 10));
    battleTier = 1 + Math.floor(xp / 200);
    const cur = prMap[entry.exerciseId] || { best1RM: 0, history: [] };
    const isPR = oneRm > (cur.best1RM || 0);
    const history = [...cur.history, {...entry, oneRm}];
    prMap[entry.exerciseId] = { best1RM: isPR ? oneRm : cur.best1RM, history };
  });
  return { xp, battleTier, bosses, prMap };
}

/* muscle computations simplified */
function computeMuscleStatsFromLogs(logs, profile) {
  const stats = {};
  MUSCLES.forEach(m => stats[m.id] = { score:0, levelKey:"Beginner", percent:0 });
  if (!logs || logs.length === 0) return stats;
  const bw = profile?.weight || 60;
  const best = {};
  logs.forEach(l => {
    if (!l.weight || !l.reps) return;
    const oneRm = calc1RM(l.weight, l.reps);
    if (!best[l.exerciseId] || oneRm > best[l.exerciseId]) best[l.exerciseId] = oneRm;
  });
  Object.entries(best).forEach(([exId, oneRm]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std) return;
    const target = bw * std.coeff; if (!target) return;
    const ratio = oneRm / target;
    std.muscles.forEach(m => { if (stats[m]) stats[m].score += ratio; });
  });
  Object.keys(stats).forEach(m => {
    const val = stats[m].score;
    let level = "Beginner";
    if (val >= 0.55) level = "Novice";
    if (val >= 0.75) level = "Intermediate";
    if (val >= 1.0) level = "Advanced";
    if (val >= 1.25) level = "Elite";
    const pct = Math.min(150, Math.round((val / 1.25) * 100));
    stats[m] = { score: val, levelKey: level, percent: pct };
  });
  return stats;
}

/* simple cycle helpers */
function getCycleInfo(cycleStartISO, cycleLength = 28, today = new Date()) {
  if (!cycleStartISO) return null;
  const start = new Date(cycleStartISO + "T00:00:00");
  const days = Math.floor((today - start)/(1000*60*60*24));
  const idx = ((days % cycleLength) + cycleLength) % cycleLength;
  const menstrual = Math.max(3, Math.round(cycleLength * 0.18));
  const follicular = Math.max(6, Math.round(cycleLength * 0.32));
  const ov = Math.max(1, Math.round(cycleLength * 0.07));
  if (idx < menstrual) return { phase: "Menstrual", dayInPhase: idx+1, idx };
  if (idx < menstrual + follicular) return { phase: "Follicular", dayInPhase: idx - menstrual + 1, idx };
  if (idx < menstrual + follicular + ov) return { phase: "Ovulation", dayInPhase: idx - menstrual - follicular + 1, idx };
  return { phase: "Luteal", dayInPhase: idx - menstrual - follicular - ov + 1, idx };
}
function phaseIntensityFactor(phase) {
  switch (phase) {
    case "Menstrual": return 0.85;
    case "Follicular": return 1.00;
    case "Ovulation": return 1.05;
    case "Luteal": return 0.95;
    default: return 1.0;
  }
}

/* ---------------- App ---------------- */
export default function App(){
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [logs, setLogs] = useState(()=> {
    try { return JSON.parse(localStorage.getItem("bebi_logs")||"[]"); }
    catch { return []; }
  });
  useEffect(()=> localStorage.setItem("bebi_logs", JSON.stringify(logs)), [logs]);

  const [profile, setProfile] = useState(()=> {
    try { return JSON.parse(localStorage.getItem("bebi_profile")||"null") || { name:"Maria Kristina", nick:"Bebi", age:21, height:170, weight:68 }; }
    catch { return { name:"Maria Kristina", nick:"Bebi", age:21, height:170, weight:68 }; }
  });
  useEffect(()=> localStorage.setItem("bebi_profile", JSON.stringify(profile)), [profile]);

  const [bodyStats, setBodyStats] = useState(()=> {
    try { return JSON.parse(localStorage.getItem("bebi_bodyStats")||"null") || { waist:[], hips:[], thigh:[], glutes:[], chest:[], arm:[] }; }
    catch { return { waist:[], hips:[], thigh:[], glutes:[], chest:[], arm:[] }; }
  });
  useEffect(()=> localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)), [bodyStats]);

  const [cycleStart, setCycleStart] = useState(()=> localStorage.getItem("bebi_cycle_start")||"");
  const [cycleLength, setCycleLength] = useState(()=> Number(localStorage.getItem("bebi_cycle_length")||28));
  useEffect(()=> localStorage.setItem("bebi_cycle_start", cycleStart), [cycleStart]);
  useEffect(()=> localStorage.setItem("bebi_cycle_length", String(cycleLength)), [cycleLength]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS?.[0]?.id || null);
  const [dayIndex, setDayIndex] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);

  function showToast(title, subtitle){
    setToast({title, subtitle});
    setTimeout(()=> setToast(null), 2600);
  }

  const { xp, battleTier, bosses, prMap } = useMemo(()=> recomputeFromLogs(logs, profile), [logs, profile.weight]);
  const muscleStats = useMemo(()=> computeMuscleStatsFromLogs(logs, profile), [logs, profile.weight]);

  const cycleInfo = useMemo(()=> getCycleInfo(cycleStart, Number(cycleLength||28), new Date()), [cycleStart, cycleLength]);
  const todayFactor = cycleInfo ? phaseIntensityFactor(cycleInfo.phase) : 1.0;

  const nextTierXp = battleTier*200;

  function handleSaveSet(entry){
    const todayStr = new Date().toISOString().slice(0,10);
    const final = {...entry, id: crypto?.randomUUID?.()||Math.random().toString(36).slice(2), date: entry.date || todayStr };
    setLogs(prev => [final, ...prev]);
    setLastSet(final);
    showToast("Set sparat", "Bra jobbat! ✨");
    setShowModal(false);
  }

  function handleDeleteLog(id){
    setLogs(prev => prev.filter(l => l.id !== id));
    showToast("Logg borttagen", "Raderat.");
  }

  function addMeasurement(key, entry){
    setBodyStats(prev => {
      const arr = prev[key] || [];
      return {...prev, [key]: [...arr, entry]};
    });
  }
  function deleteMeasurement(key, id){
    setBodyStats(prev => {
      const arr = prev[key] || [];
      return {...prev, [key]: arr.filter(m => m.id !== id)};
    });
  }

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div><div className="sidebar-title">Bebi Gym</div><div className="sidebar-sub">För {profile.name} 💗</div></div>
        </div>

        <div className="sidebar-nav">
          <button className={`sidebar-link ${view==="dashboard"?"active":""}`} onClick={()=>setView("dashboard")}>🏠 Dashboard</button>
          <button className={`sidebar-link ${view==="log"?"active":""}`} onClick={()=>setView("log")}>📓 Log</button>
          <button className={`sidebar-link ${view==="program"?"active":""}`} onClick={()=>setView("program")}>📅 Program</button>
          <button className={`sidebar-link ${view==="boss"?"active":""}`} onClick={()=>setView("boss")}>🐲 Boss</button>
          <button className={`sidebar-link ${view==="ach"?"active":""}`} onClick={()=>setView("ach")}>🏅 Achievements</button>
          <button className={`sidebar-link ${view==="pr"?"active":""}`} onClick={()=>setView("pr")}>🏆 PR</button>
          <button className={`sidebar-link ${view==="lift"?"active":""}`} onClick={()=>setView("lift")}>📈 LiftTools</button>
          <button className={`sidebar-link ${view==="cycle"?"active":""}`} onClick={()=>setView("cycle")}>📅 Cycle</button>
          <button className={`sidebar-link ${view==="profile"?"active":""}`} onClick={()=>setView("profile")}>👤 Profil</button>
        </div>

        <div style={{marginTop:"auto", fontSize:11, color:"#9ca3af"}}>
          <div>{profile.name} ({profile.nick})</div>
          <div>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
        </div>
      </aside>

      <div className={`mobile-drawer ${mobileMenuOpen? "open":""}`}>
        <div className="drawer-header">
          <span style={{fontWeight:600}}>Bebi Gym 💗</span>
          <button className="close-btn" onClick={()=>setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="drawer-links">
          {["dashboard","log","program","boss","ach","pr","lift","cycle","profile"].map(v=>(
            <button key={v} onClick={()=>{ setView(v); setMobileMenuOpen(false); }}>{v.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <main className="main">
        <div className="main-header">
          <button className="hamburger-btn" onClick={()=>setMobileMenuOpen(true)}>☰</button>
          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">Idag: {cycleInfo ? `${cycleInfo.phase} (intensity ${Math.round(todayFactor*100)}%)` : "Ingen cykel satt"}</div>
          </div>

          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <button className="btn-pink" onClick={()=>setShowModal(true)}>+ Logga set</button>
          </div>
        </div>

        {/* VIEWS */}
        {view==="dashboard" && (
          <div className="row" style={{alignItems:"flex-start"}}>
            <div className="col" style={{flex:1, gap:10}}>
              <div className="card small">
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:13, fontWeight:600}}>XP & Level</div>
                    <div className="small">Du får XP för tunga set</div>
                  </div>
                  <div style={{textAlign:"right"}}>{xp} XP<br/>Tier {battleTier}</div>
                </div>
                <div className="progress-wrap" style={{marginTop:8}}>
                  <div className="progress-fill" style={{width:`${Math.min(100, Math.round((xp/(nextTierXp||1))*100))}%`}}/>
                </div>
              </div>

              <MuscleMap muscleStats={muscleStats}/>
              <MuscleComparison data={muscleStats}/>
            </div>

            <div className="col" style={{flex:1, gap:10}}>
              <BossArena bosses={bosses}/>
              <BattlePass tier={battleTier} xp={xp} nextTierXp={nextTierXp} rewards={[]} claimedRewards={claimedRewards} onClaimReward={()=>{}} />
            </div>
          </div>
        )}

        {view==="log" && (
          <div className="card">
            <h3 style={{marginTop:0}}>Loggade set</h3>
            {!logs.length && <p className="small">Inga set ännu — logga ditt första.</p>}
            <ul style={{paddingLeft:0, listStyle:"none", margin:0}}>
              {logs.map(l=>{
                const ex = EXERCISES.find(e=>e.id===l.exerciseId);
                return <li key={l.id} style={{display:"flex", justifyContent:"space-between", padding:"8px", borderRadius:8, background:"rgba(255,255,255,0.03)", marginBottom:6}}>
                  <div>{l.date} • {ex?.name||l.exerciseId} • {l.weight}kg × {l.reps} (1RM {calc1RM(l.weight,l.reps)}kg)</div>
                  <div style={{display:"flex", gap:8}}>
                    <button className="btn" onClick={()=>handleDeleteLog(l.id)}>🗑️</button>
                  </div>
                </li>;
              })}
            </ul>
          </div>
        )}

        {view==="program" && (
          <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={(id)=>{setActiveProgramId(id); setDayIndex(0);}} onNextDay={()=> setDayIndex(i=> (i+1)% (PROGRAMS.find(p=>p.id===activeProgramId)?.days.length||1))} logs={logs}/>
        )}

        {view==="boss" && <BossArena bosses={bosses}/>}

        {view==="ach" && <Achievements unlocked={[]} />}

        {view==="pr" && <PRList prMap={prMap} />}

        {view==="lift" && <LiftTools logs={logs} bodyStats={bodyStats} onAddManual={(e)=>{ setLogs(prev=> [e, ...prev]); showToast("Tillagd","Lyft sparat"); }} />}

        {view==="cycle" && (
          <div className="card">
            <h3 style={{marginTop:0}}>Cycle Calendar</h3>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div>
                <label style={{display:"block",fontSize:12}}>Första dag (ISO)</label>
                <input type="date" value={cycleStart} onChange={(e)=>setCycleStart(e.target.value)} />
              </div>
              <div>
                <label style={{display:"block",fontSize:12}}>Längd</label>
                <input type="number" min={20} max={40} value={cycleLength} onChange={(e)=>setCycleLength(Number(e.target.value))} style={{width:80}} />
              </div>
              <div>
                <button className="btn" onClick={()=>showToast("Sparad","Cykel sparad")}>Spara</button>
              </div>
            </div>
            <div style={{marginTop:12}}>
              {cycleInfo ? <div>Dagens fas: <strong>{cycleInfo.phase}</strong> — rekommenderad intensitet: <strong>{Math.round(todayFactor*100)}%</strong></div> : <div>Ingen cykel satt</div>}
            </div>
          </div>
        )}

        {view==="profile" && (
          <ProfileView profile={profile} setProfile={setProfile} bodyStats={bodyStats} onAddMeasurement={addMeasurement} onDeleteMeasurement={deleteMeasurement} />
        )}

      </main>

      <LogModal open={showModal} onClose={()=>setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} />
    </div>
  );
}
