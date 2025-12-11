// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

import ProfileView from "./components/ProfileView.jsx";
import LogModal from "./components/LogModal.jsx";
import LiftTools from "./components/LiftTools.jsx";
import Toast from "./components/Toast.jsx";

import MuscleMap from "./components/MuscleMap.jsx";
import BossArena from "./components/BossArena.jsx";
import Achievements from "./components/Achievements.jsx";
import BattlePass from "./components/BattlePass.jsx";
import ProgramRunner from "./components/ProgramRunner.jsx";
import PRList from "./components/PRList.jsx";
import MuscleComparison from "./components/MuscleComparison.jsx";

import { EXERCISES } from "./data/exercises";
import { PROGRAMS } from "./data/programs";
import { initialBosses } from "./data/bosses";
import { buildComparisonChartData } from "./utils/comparisonData.js";
import { useBebiMood } from "./hooks/useBebiMood.js";
import { MUSCLES } from "./data/muscles";
import { STRENGTH_STANDARDS } from "./data/strengthStandards";

// helper 1RM
function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

// recompute from logs (XP, tier, bosses, PRmap)
function cloneBosses(b) {
  return { chest: { ...b.chest }, glute: { ...b.glute }, back: { ...b.back } };
}
function applyBossDamageToState(stateBosses, entry, oneRm, isPR) {
  const copy = cloneBosses(stateBosses);
  let dmgBase = oneRm;
  if (isPR) dmgBase *= 1.5;
  if (entry.exerciseId === "bench") copy.chest.currentHP = Math.max(0, copy.chest.currentHP - Math.round(dmgBase * 0.6));
  else if (["hipthrust", "legpress", "squat"].includes(entry.exerciseId)) copy.glute.currentHP = Math.max(0, copy.glute.currentHP - Math.round(dmgBase * 0.7));
  else if (["row", "deadlift", "latpulldown"].includes(entry.exerciseId)) copy.back.currentHP = Math.max(0, copy.back.currentHP - Math.round(dmgBase * 0.65));
  return copy;
}
function recomputeFromLogs(logs) {
  let xp = 0, battleTier = 1, bosses = initialBosses(), prMap = {};
  const chrono = [...logs].reverse();
  chrono.forEach((entry) => {
    const oneRm = calc1RM(entry.weight, entry.reps);
    xp += Math.max(5, Math.round(oneRm / 10));
    battleTier = 1 + Math.floor(xp / 200);
    const current = prMap[entry.exerciseId] || { best1RM: 0, history: [] };
    const isPR = oneRm > (current.best1RM || 0);
    const history = [...current.history, { ...entry, oneRm }];
    const best1RM = isPR ? oneRm : current.best1RM;
    prMap[entry.exerciseId] = { best1RM, history };
    bosses = applyBossDamageToState(bosses, entry, oneRm, isPR);
  });
  return { xp, battleTier, bosses, prMap };
}

// muscleStats minimal (based on prMap)
function computeMuscleStatsFromLogs(logs, profile) {
  const stats = {};
  MUSCLES.forEach(m => stats[m.id] = { score:0, levelKey: "Beginner", percent:0 });
  if (!logs || !logs.length) return stats;
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
    const target = bw * std.coeff;
    if (!target) return;
    const ratio = oneRm / target;
    std.muscles.forEach(mid => { if (stats[mid]) stats[mid].score += ratio; });
  });
  Object.keys(stats).forEach(k => {
    const v = stats[k].score;
    let level="Beginner";
    if (v>=0.55) level="Novice";
    if (v>=0.75) level="Intermediate";
    if (v>=1.0) level="Advanced";
    if (v>=1.25) level="Elite";
    stats[k] = { score: v, levelKey: level, percent: Math.min(150, Math.round((v/1.25)*100)) };
  });
  return stats;
}

// Cycle helpers (kept simple)
function getCycleInfo(cycleStartISO, cycleLength = 28, today = new Date()) {
  if (!cycleStartISO) return null;
  const start = new Date(cycleStartISO + "T00:00:00");
  const diff = Math.floor((today - start) / (1000*60*60*24));
  const idx = ((diff % cycleLength) + cycleLength) % cycleLength;
  const menstrualDays = Math.max(3, Math.round(cycleLength * 0.18));
  const follicularDays = Math.max(6, Math.round(cycleLength * 0.32));
  const ovDays = Math.max(1, Math.round(cycleLength * 0.07));
  if (idx < menstrualDays) return { phase: "Menstrual", dayInPhase: idx+1, cycleIndex: idx };
  if (idx < menstrualDays + follicularDays) return { phase: "Follicular", dayInPhase: idx - menstrualDays + 1, cycleIndex: idx };
  if (idx < menstrualDays + follicularDays + ovDays) return { phase: "Ovulation", dayInPhase: idx - menstrualDays - follicularDays + 1, cycleIndex: idx };
  return { phase: "Luteal", dayInPhase: idx - menstrualDays - follicularDays - ovDays + 1, cycleIndex: idx };
}
function phaseIntensityFactor(phase){ if (phase==="Menstrual") return 0.85; if (phase==="Follicular") return 1.0; if (phase==="Ovulation") return 1.05; if (phase==="Luteal") return 0.95; return 1; }

export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // persistence
  const [logs, setLogs] = useState(()=> { const s = localStorage.getItem("bebi_logs"); return s ? JSON.parse(s) : []; });
  useEffect(()=> localStorage.setItem("bebi_logs", JSON.stringify(logs)), [logs]);

  const [profile, setProfile] = useState(()=> { const s = localStorage.getItem("bebi_profile"); return s ? JSON.parse(s) : { name:"Maria Kristina", nick:"Bebi", age:21, height:170, weight:68, avatar:"/avatar.png" }; });
  useEffect(()=> localStorage.setItem("bebi_profile", JSON.stringify(profile)), [profile]);

  const [bodyStats, setBodyStats] = useState(()=> { const s = localStorage.getItem("bebi_bodyStats"); return s ? JSON.parse(s) : { waist:[], hips:[], thigh:[], glutes:[], chest:[], arm:[] }; });
  useEffect(()=> localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)), [bodyStats]);

  const [cycleStart, setCycleStart] = useState(()=> localStorage.getItem("bebi_cycle_start") || "");
  const [cycleLength, setCycleLength] = useState(()=> Number(localStorage.getItem("bebi_cycle_length") || 28));
  useEffect(()=> localStorage.setItem("bebi_cycle_start", cycleStart), [cycleStart]);
  useEffect(()=> localStorage.setItem("bebi_cycle_length", String(cycleLength)), [cycleLength]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0]?.id || null);
  const [dayIndex, setDayIndex] = useState(0);

  const { mood, bumpMood } = useBebiMood ? useBebiMood() : { mood:null, bumpMood: ()=>{} };

  function showToast(title, subtitle){ setToast({title, subtitle}); setTimeout(()=> setToast(null), 2600); }

  // recompute
  const { xp, battleTier, bosses, prMap } = useMemo(()=> recomputeFromLogs(logs), [logs]);
  const muscleStats = useMemo(()=> computeMuscleStatsFromLogs(logs, profile), [logs, profile.weight]);
  const comparisonData = useMemo(()=> buildComparisonChartData(muscleStats), [muscleStats]);

  // cycle info
  const today = new Date();
  const cycleInfo = useMemo(()=> getCycleInfo(cycleStart, Number(cycleLength || 28), today), [cycleStart, cycleLength, today]);
  const todayFactor = cycleInfo ? phaseIntensityFactor(cycleInfo.phase) : 1.0;

  // achievements simplified
  const unlocked = useMemo(()=> {
    const arr = [];
    if (logs.length >= 1) arr.push({id:'ach_first', title:'Första passet!', desc:'Du loggade ditt första pass', emoji:'🎉'});
    if (logs.length >= 5) arr.push({id:'ach_5', title:'Consistency', desc:'Minst 5 pass', emoji:'📅'});
    if (battleTier >= 3) arr.push({id:'ach_t3', title:'Tier 3', desc:'Nått tier 3', emoji:'🎟️'});
    return arr;
  }, [logs, battleTier]);

  const nextTierXp = battleTier * 200;

  function handleSaveSet(entry) {
    const todayStr = new Date().toISOString().slice(0,10);
    const finalEntry = { ...entry, id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), date: entry.date || todayStr };
    const prev = logs.filter(l => l.exerciseId === finalEntry.exerciseId);
    const prevBest = prev.length ? Math.max(...prev.map(l => calc1RM(l.weight, l.reps))) : 0;
    const thisOne = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = thisOne > prevBest;
    setLogs((p) => [finalEntry, ...p]);
    setLastSet(finalEntry);
    if (isPR) { bumpMood && bumpMood('pr'); showToast('Nytt PR! 🔥', 'Fantastiskt!'); }
    else showToast('Set sparat', 'Bra jobbat!');
    setShowModal(false);
  }

  function handleDeleteLog(id) { setLogs((p) => p.filter(l => l.id !== id)); showToast('Logg borttagen','Stat uppdaterad'); }

  // body stats handlers
  function handleAddMeasurement(key, entry) {
    setBodyStats(prev => ({ ...prev, [key]: [...(prev[key]||[]), entry] }));
  }
  function handleDeleteMeasurement(key, id) {
    setBodyStats(prev => ({ ...prev, [key]: (prev[key]||[]).filter(x => x.id !== id) }));
  }

  function handleSelectProgram(id) { setActiveProgramId(id); setDayIndex(0); bumpMood && bumpMood('start_program'); }
  function handleNextDay() { const prog = PROGRAMS.find(p => p.id === activeProgramId); if (!prog) return; setDayIndex((i) => (i+1) % prog.days.length); }
  function handleClaimReward(id){ if (claimedRewards.includes(id)) return; setClaimedRewards(p => [...p, id]); showToast('Reward klaimad','Nice!'); }

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* Sidebar - desktop */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-title">Bebi Gym v17</div>
            <div className="sidebar-sub">För {profile.name} 💗</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <button className={`sidebar-link ${view==='dashboard'?'active':''}`} onClick={()=>setView('dashboard')}><span className="icon">🏠</span><span>Dashboard</span></button>
          <button className={`sidebar-link ${view==='log'?'active':''}`} onClick={()=>setView('log')}><span className="icon">📓</span><span>Log</span></button>
          <button className={`sidebar-link ${view==='program'?'active':''}`} onClick={()=>setView('program')}><span className="icon">📅</span><span>Program</span></button>
          <button className={`sidebar-link ${view==='boss'?'active':''}`} onClick={()=>setView('boss')}><span className="icon">🐲</span><span>Boss</span></button>
          <button className={`sidebar-link ${view==='ach'?'active':''}`} onClick={()=>setView('ach')}><span className="icon">🏅</span><span>Achievements</span></button>
          <button className={`sidebar-link ${view==='pr'?'active':''}`} onClick={()=>setView('pr')}><span className="icon">🏆</span><span>PR</span></button>
          <button className={`sidebar-link ${view==='profile'?'active':''}`} onClick={()=>setView('profile')}><span className="icon">👤</span><span>Profil</span></button>
          <button className={`sidebar-link ${view==='lift'?'active':''}`} onClick={()=>setView('lift')}><span className="icon">📈</span><span>LiftTools</span></button>
          <button className={`sidebar-link ${view==='cycle'?'active':''}`} onClick={()=>setView('cycle')}><span className="icon">📅</span><span>Cycle</span></button>
        </div>

        <div style={{ marginTop: "auto", fontSize:11, color: "var(--muted)" }}>
          <div>{profile.name} ({profile.nick})</div>
          <div>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
        </div>
      </aside>

      {/* mobile drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open":""}`}>
        <div className="drawer-header">
          <span style={{fontWeight:600}}>Bebi Gym 💗</span>
          <button className="close-btn" onClick={()=>setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="drawer-links">
          <button onClick={()=>{ setView('dashboard'); setMobileMenuOpen(false); }}>🏠 Dashboard</button>
          <button onClick={()=>{ setView('log'); setMobileMenuOpen(false); }}>📓 Log</button>
          <button onClick={()=>{ setView('program'); setMobileMenuOpen(false); }}>📅 Program</button>
          <button onClick={()=>{ setView('boss'); setMobileMenuOpen(false); }}>🐲 Boss</button>
          <button onClick={()=>{ setView('ach'); setMobileMenuOpen(false); }}>🏅 Achievements</button>
          <button onClick={()=>{ setView('pr'); setMobileMenuOpen(false); }}>🏆 PR</button>
          <button onClick={()=>{ setView('profile'); setMobileMenuOpen(false); }}>👤 Profil</button>
          <button onClick={()=>{ setView('lift'); setMobileMenuOpen(false); }}>📈 LiftTools</button>
          <button onClick={()=>{ setView('cycle'); setMobileMenuOpen(false); }}>📅 Cycle</button>
        </div>
      </div>

      {/* MAIN */}
      <main className="main">
        <div className="main-header">
          <button className="hamburger-btn" onClick={()=>setMobileMenuOpen(true)}>☰</button>
          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">Idag är en perfekt dag att bli starkare. Varje set ger XP & bygger PR.</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ padding:"6px 10px", borderRadius:10, background: cycleInfo ? "#fff1f2":"#eef2ff", color: cycleInfo ? "#8b2b35":"#3730a3", fontSize:13 }}>
              {cycleInfo ? `${cycleInfo.phase} • ${Math.round(phaseIntensityFactor(cycleInfo.phase)*100)}%` : "Ingen cykel satt"}
            </div>
            <button className="btn-pink" onClick={()=> setShowModal(true)}>+ Logga set</button>
          </div>
        </div>

        {/* views */}
        {view==='dashboard' && (
          <div className="row" style={{ alignItems:"flex-start" }}>
            <div className="col" style={{ flex:1, gap:10 }}>
              <div className="card small">
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>XP & Level</div>
                    <div className="small">Du får XP för varje tungt set</div>
                  </div>
                  <div style={{ textAlign:"right"}}>
                    <div>{xp} XP</div>
                    <div>Tier {battleTier}</div>
                  </div>
                </div>
                <div className="progress-wrap" style={{ marginTop:6 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xp/nextTierXp)*100))}%` }} />
                </div>
                <div className="small" style={{ marginTop:4 }}>Nästa tier vid {nextTierXp} XP</div>
              </div>

              <MuscleMap muscleStats={muscleStats} />

              <div style={{ marginTop:10 }}>
                <MuscleComparison data={comparisonData} />
              </div>
            </div>

            <div className="col" style={{ flex:1, gap:10 }}>
              <BossArena bosses={bosses} />
              <BattlePass tier={battleTier} xp={xp} nextTierXp={nextTierXp} rewards={[]} claimedRewards={claimedRewards} onClaimReward={handleClaimReward} />
            </div>
          </div>
        )}

        {view==='log' && (
          <div className="card">
            <h3 style={{ marginTop:0 }}>Loggade set 📓</h3>
            {!logs.length && <p className="small">Inga set än. Klicka på “Logga set”.</p>}
            <ul style={{ paddingLeft:0, listStyle:"none", margin:0, marginTop:6 }}>
              {logs.map(l => {
                const ex = EXERCISES.find(e => e.id === l.exerciseId);
                return (
                  <li key={l.id} style={{ fontSize:12, marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px", borderRadius:10, background:"rgba(255,255,255,0.02)" }}>
                    <div>{l.date} • {ex?.name || l.exerciseId} • {l.weight} kg × {l.reps} reps (1RM ca {calc1RM(l.weight, l.reps)} kg)</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn" onClick={()=> handleDeleteLog(l.id)}>🗑️</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {view==='program' && <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={handleSelectProgram} onNextDay={handleNextDay} logs={logs} />}

        {view==='boss' && <div className="row"><div className="col" style={{flex:1}}><BossArena bosses={bosses} /></div></div>}

        {view==='ach' && <Achievements unlocked={unlocked} />}

        {view==='pr' && <PRList prMap={prMap} />}

        {view==='lift' && <LiftTools logs={logs} bodyStats={bodyStats} onAddManual={(entry)=>{ setLogs(prev=> [entry, ...prev]); showToast("Lyft tillagt","Lyftet sparat.") }} />}

        {view==='cycle' && (
          <div className="card">
            <h3 style={{ marginTop:0 }}>Cycle Calendar 🌸</h3>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
              <div>
                <label style={{ display:"block", fontSize:12 }}>Första dag</label>
                <input type="date" value={cycleStart||""} onChange={(e)=> setCycleStart(e.target.value)} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:12 }}>Cykellängd</label>
                <input type="number" min={20} max={40} value={cycleLength} onChange={(e)=> setCycleLength(Number(e.target.value))} style={{ width:80 }} />
              </div>
              <div style={{ alignSelf:"flex-end" }}><button className="btn" onClick={()=> showToast("Cykel sparad","Din cykel är uppdaterad")}>Spara</button></div>
            </div>

            <div style={{ marginTop:12 }}>
              {cycleInfo ? <div className="small">Dagens fas: <strong>{cycleInfo.phase}</strong> (Dag {cycleInfo.dayInPhase}) — rekommenderad intensitet {Math.round(phaseIntensityFactor(cycleInfo.phase)*100)}%</div> : <div className="small">Ingen cykel satt</div>}
            </div>
          </div>
        )}

        {view==='profile' && <ProfileView profile={profile} setProfile={setProfile} bodyStats={bodyStats} onAddMeasurement={handleAddMeasurement} onDeleteMeasurement={handleDeleteMeasurement} />}

      </main>

      <LogModal open={showModal} onClose={()=> setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} />
    </div>
  );
}
