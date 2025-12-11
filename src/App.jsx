// src/App.jsx
import React, { useState, useMemo, useEffect } from "react";
import "./index.css";

import ProfileView from "./components/ProfileView.jsx";
import Toast from "./components/Toast.jsx";
import LogModal from "./components/LogModal.jsx";
import MuscleMap from "./components/MuscleMap.jsx";
import BossArena from "./components/BossArena.jsx";
import Achievements from "./components/Achievements.jsx";
import BattlePass from "./components/BattlePass.jsx";
import ProgramRunner from "./components/ProgramRunner.jsx";
import PRList from "./components/PRList.jsx";
import MuscleComparison from "./components/MuscleComparison.jsx";
import LiftTools from "./components/LiftTools.jsx";

import { buildComparisonChartData } from "./utils/comparisonData.js";
import { useBebiMood } from "./hooks/useBebiMood.js";
import { EXERCISES } from "./data/exercises";
import { MUSCLES } from "./data/muscles";
import { STRENGTH_STANDARDS } from "./data/strengthStandards";
import { PROGRAMS } from "./data/programs";
import { initialBosses } from "./data/bosses";

// ------------------ KONSTANTER ------------------
const BATTLE_REWARDS = [
  { id: "r_50xp", xpRequired: 50, label: "Warmup Queen", desc: "Första 50 XP insamlade", emoji: "💖" },
  { id: "r_200xp", xpRequired: 200, label: "Tier 2 Gift", desc: "Du har grindat till minst tier 2", emoji: "🎁" },
  { id: "r_500xp", xpRequired: 500, label: "Boss Slayer", desc: "Massor av XP – du är farlig nu", emoji: "🐲" },
  { id: "r_1000xp", xpRequired: 1000, label: "Legendary Bebi", desc: "När du nått 1000+ XP", emoji: "🌟" },
];

function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

function cloneBosses(b) {
  return { chest: { ...b.chest }, glute: { ...b.glute }, back: { ...b.back } };
}

function applyBossDamageToState(stateBosses, entry, oneRm, isPR) {
  const copy = cloneBosses(stateBosses);
  let dmgBase = oneRm;
  if (isPR) dmgBase *= 1.5;

  if (entry.exerciseId === "bench") {
    copy.chest.currentHP = Math.max(0, copy.chest.currentHP - Math.round(dmgBase * 0.6));
  } else if (["hipthrust", "legpress", "squat"].includes(entry.exerciseId)) {
    copy.glute.currentHP = Math.max(0, copy.glute.currentHP - Math.round(dmgBase * 0.7));
  } else if (["row", "deadlift", "latpulldown"].includes(entry.exerciseId)) {
    copy.back.currentHP = Math.max(0, copy.back.currentHP - Math.round(dmgBase * 0.65));
  }
  return copy;
}

// Räkna allt baserat på loggar + profil
function recomputeFromLogs(logs, profile) {
  let xp = 0;
  let battleTier = 1;
  let bosses = initialBosses();
  let prMap = {};

  function updatePRLocal(entry, new1RM) {
    const current = prMap[entry.exerciseId] || { best1RM: 0, history: [] };
    const isPR = new1RM > (current.best1RM || 0);
    const history = [...current.history, { ...entry, oneRm: new1RM }];
    const best1RM = isPR ? new1RM : current.best1RM;
    prMap = { ...prMap, [entry.exerciseId]: { best1RM, history } };
    return isPR;
  }

  const chronological = [...logs].reverse();
  chronological.forEach((entry) => {
    if (!entry.weight || !entry.reps) return;
    const oneRm = calc1RM(entry.weight, entry.reps);
    const gainedXp = Math.max(5, Math.round(oneRm / 10));
    xp += gainedXp;
    battleTier = 1 + Math.floor(xp / 200);

    const currentPR = prMap[entry.exerciseId]?.best1RM || 0;
    const isPR = oneRm > currentPR;

    updatePRLocal(entry, oneRm);
    bosses = applyBossDamageToState(bosses, entry, oneRm, isPR);
  });

  return { xp, battleTier, bosses, prMap };
}

// Muskelstats baserat direkt på loggar (StrengthLevel-style)
function computeMuscleStatsFromLogs(logs, profile) {
  const stats = {};
  MUSCLES.forEach((m) => { stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 }; });
  if (!logs || logs.length === 0) return stats;

  const bw = profile?.weight || profile?.weight_kg || 60;

  // Bästa 1RM per övning
  const best = {};
  logs.forEach((l) => {
    if (!l.weight || !l.reps) return;
    const oneRm = calc1RM(l.weight, l.reps);
    if (!best[l.exerciseId] || oneRm > best[l.exerciseId]) best[l.exerciseId] = oneRm;
  });

  Object.entries(best).forEach(([exId, oneRm]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std) return;
    const advTarget = bw * std.coeff;
    if (!advTarget) return;
    const ratio = oneRm / advTarget;
    std.muscles.forEach((mId) => { if (stats[mId]) stats[mId].score += ratio; });
  });

  Object.keys(stats).forEach((mId) => {
    const val = stats[mId].score;
    let level = "Beginner";
    if (val >= 0.55) level = "Novice";
    if (val >= 0.75) level = "Intermediate";
    if (val >= 1.0) level = "Advanced";
    if (val >= 1.25) level = "Elite";
    const pct = Math.min(150, Math.round((val / 1.25) * 100));
    stats[mId] = { score: val, levelKey: level, percent: pct };
  });

  return stats;
}

// CYCLE helpers
function getCycleInfo(cycleStartISO, cycleLength = 28, todays = new Date()) {
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
function phaseIntensityFactor(phase) {
  switch (phase) {
    case "Menstrual": return 0.85;
    case "Follicular": return 1.00;
    case "Ovulation": return 1.05;
    case "Luteal": return 0.95;
    default: return 1.0;
  }
}

// ------------------ HUVUD ------------------
export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // logs (persist)
  const [logs, setLogs] = useState(() => {
    try { const s = localStorage.getItem("bebi_logs"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("bebi_logs", JSON.stringify(logs)); } catch {} }, [logs]);

  // profile (persist)
  const [profile, setProfile] = useState(() => {
    try { const s = localStorage.getItem("bebi_profile"); return s ? JSON.parse(s) : { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" }; } catch { return { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" }; }
  });
  useEffect(() => { try { localStorage.setItem("bebi_profile", JSON.stringify(profile)); } catch {} }, [profile]);

  // body stats (persist)
  const [bodyStats, setBodyStats] = useState(() => {
    try { const s = localStorage.getItem("bebi_bodyStats"); return s ? JSON.parse(s) : { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] }; } catch { return { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] }; }
  });
  useEffect(() => { try { localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)); } catch {} }, [bodyStats]);

  // cycle settings (persist)
  const [cycleStart, setCycleStart] = useState(() => localStorage.getItem("bebi_cycle_start") || "");
  const [cycleLength, setCycleLength] = useState(() => Number(localStorage.getItem("bebi_cycle_length") || 28));
  useEffect(() => { try { localStorage.setItem("bebi_cycle_start", cycleStart); } catch {} }, [cycleStart]);
  useEffect(() => { try { localStorage.setItem("bebi_cycle_length", String(cycleLength)); } catch {} }, [cycleLength]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS?.[0]?.id || null);
  const [dayIndex, setDayIndex] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);

  const { mood, bumpMood } = useBebiMood();

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
  }

  // recompute derived stats
  const { xp, battleTier, bosses, prMap } = useMemo(() => recomputeFromLogs(logs, profile), [logs, profile.weight]);
  const muscleStats = useMemo(() => computeMuscleStatsFromLogs(logs, profile), [logs, profile.weight]);
  const comparisonData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats]);

  // cycle info
  const today = new Date();
  const cycleInfo = useMemo(() => getCycleInfo(cycleStart, Number(cycleLength || 28), today), [cycleStart, cycleLength, today]);
  const todayFactor = cycleInfo ? phaseIntensityFactor(cycleInfo.phase) : 1.0;

  // achievements
  const unlockedAchievements = useMemo(() => {
    const arr = [];
    if (logs.length >= 1) arr.push({ id: "ach_first", title: "Första passet! 💖", desc: "Du loggade ditt första pass.", emoji: "🎉" });
    if (logs.length >= 5) arr.push({ id: "ach_5_logs", title: "Consistency Bebi", desc: "Minst 5 loggade pass.", emoji: "📅" });
    if (logs.length >= 20) arr.push({ id: "ach_20_sets", title: "Set Machine", desc: "20+ loggade set.", emoji: "🛠️" });
    const glute = muscleStats.glutes;
    if (glute && glute.levelKey === "Elite") arr.push({ id: "ach_glute_elite", title: "Glute Queen", desc: "Elite på glutes.", emoji: "🍑" });
    const anyPR = Object.values(prMap).some((p) => p.best1RM > 0);
    if (anyPR) arr.push({ id: "ach_pr_any", title: "PR Era", desc: "Minst ett registrerat PR.", emoji: "🔥" });
    const bossesArray = Object.values(bosses);
    const totalMax = bossesArray.reduce((s, b) => s + b.maxHP, 0);
    const totalCurrent = bossesArray.reduce((s, b) => s + b.currentHP, 0);
    const totalPct = totalMax ? Math.round(100 * (1 - totalCurrent / totalMax)) : 0;
    if (totalPct >= 50) arr.push({ id: "ach_raid_50", title: "Raid 50%", desc: "Minst 50% av bossarnas HP nerslaget.", emoji: "🐉" });
    if (battleTier >= 3) arr.push({ id: "ach_battle_tier3", title: "Battle Pass Tier 3", desc: "Nått minst tier 3.", emoji: "🎟️" });
    return arr;
  }, [logs, muscleStats, prMap, bosses, battleTier]);

  const nextTierXp = battleTier * 200;

  // handle save set
  function handleSaveSet(entry) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const finalEntry = { ...entry, id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2), date: entry.date || todayStr };

    const prevForExercise = logs.filter((l) => l.exerciseId === finalEntry.exerciseId);
    const prevBest = prevForExercise.length ? Math.max(...prevForExercise.map((l) => calc1RM(l.weight, l.reps))) : 0;
    const this1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = this1RM > prevBest;

    setLogs((prev) => [finalEntry, ...prev]);
    setLastSet(finalEntry);

    if (isPR) {
      bumpMood("pr");
      showToastMsg("Nytt PR! 💖🔥", "Bebi — så jäkla stark!");
    } else {
      showToastMsg("Set sparat 💪", "Bra jobbat!");
    }

    setShowModal(false);
  }

  function handleDeleteLog(id) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    showToastMsg("Logg borttagen 🗑️", "Din data uppdaterades.");
  }

  function handleSelectProgram(id) {
    setActiveProgramId(id);
    setDayIndex(0);
    bumpMood("start_program");
  }

  function handleNextDay() {
    const prog = PROGRAMS.find((p) => p.id === activeProgramId);
    if (!prog) return;
    setDayIndex((idx) => (idx + 1) % prog.days.length);
  }

  function handleClaimReward(id) {
    if (claimedRewards.includes(id)) return;
    setClaimedRewards((prev) => [...prev, id]);
    bumpMood("achievement");
    const r = BATTLE_REWARDS.find((x) => x.id === id);
    showToastMsg("Reward klaimad 🎁", r?.label || "");
  }

  // Inline Cycle page (simple)
  function CyclePage() {
    const [startLocal, setStartLocal] = useState(cycleStart || "");
    const [lengthLocal, setLengthLocal] = useState(cycleLength || 28);

    useEffect(() => { setStartLocal(cycleStart || ""); }, [cycleStart]);
    useEffect(() => { setLengthLocal(cycleLength || 28); }, [cycleLength]);

    function saveCycle() {
      setCycleStart(startLocal);
      setCycleLength(Number(lengthLocal) || 28);
      showToastMsg("Cykel sparad", `${startLocal || "ej satt"} • ${lengthLocal} dagar`);
    }

    const days = [];
    const clen = Number(lengthLocal) || 28;
    for (let d = 0; d < clen; d += 1) {
      let phase = "—";
      if (startLocal) {
        const info = getCycleInfo(startLocal, clen, new Date(new Date(startLocal + "T00:00:00").getTime() + d * 24 * 60 * 60 * 1000));
        if (info) {
          phase = info.phase;
        }
      }
      days.push({ day: d + 1, phase });
    }

    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Cycle Calendar 🌸</h3>
        <div className="small">Sätt första dag i senaste mens och cykellängd. Appen ger rekommendationer baserat på fas.</div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <div>
            <label className="muted">Första dag</label>
            <input type="date" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
          </div>
          <div>
            <label className="muted">Längd</label>
            <input type="number" min={20} max={40} value={lengthLocal} onChange={(e) => setLengthLocal(e.target.value)} style={{ width: 88 }} />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button className="btn" onClick={saveCycle}>Spara</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {days.map((d) => (
              <div key={d.day} className="cycle-day" title={d.phase}>
                {d.day}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Dagens fas:</strong> {cycleInfo ? `${cycleInfo.phase} (dag ${cycleInfo.dayInPhase})` : "Ingen cykel satt"} — intensity {Math.round(todayFactor * 100)}%
          </div>
        </div>
      </div>
    );
  }

  // Layout render
  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-title">Bebi Gym</div>
            <div className="sidebar-sub">För {profile.name} 💗</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <button className={`sidebar-link ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}><span className="icon">🏠</span><span>Dashboard</span></button>
          <button className={`sidebar-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}><span className="icon">📓</span><span>Log</span></button>
          <button className={`sidebar-link ${view === "program" ? "active" : ""}`} onClick={() => setView("program")}><span className="icon">📅</span><span>Program</span></button>
          <button className={`sidebar-link ${view === "boss" ? "active" : ""}`} onClick={() => setView("boss")}><span className="icon">🐲</span><span>Boss</span></button>
          <button className={`sidebar-link ${view === "ach" ? "active" : ""}`} onClick={() => setView("ach")}><span className="icon">🏅</span><span>Achievements</span></button>
          <button className={`sidebar-link ${view === "pr" ? "active" : ""}`} onClick={() => setView("pr")}><span className="icon">🏆</span><span>PR</span></button>
          <button className={`sidebar-link ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}><span className="icon">👤</span><span>Profil</span></button>
          <button className={`sidebar-link ${view === "lift" ? "active" : ""}`} onClick={() => setView("lift")}><span className="icon">📈</span><span>LiftTools</span></button>
          <button className={`sidebar-link ${view === "cycle" ? "active" : ""}`} onClick={() => setView("cycle")}><span className="icon">📅</span><span>Cycle</span></button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 12, color: "#9ca3af", padding: 12 }}>
          <div style={{ fontWeight: 700 }}>{profile.nick} ({profile.name})</div>
          <div style={{ marginTop: 4 }}>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
        </div>
      </aside>

      {/* Mobile drawer (hidden on desktop via CSS) */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <strong>Bebi Gym</strong>
          <button className="close-btn" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="drawer-links">
          <button onClick={() => { setView("dashboard"); setMobileMenuOpen(false); }}>🏠 Dashboard</button>
          <button onClick={() => { setView("log"); setMobileMenuOpen(false); }}>📓 Log</button>
          <button onClick={() => { setView("program"); setMobileMenuOpen(false); }}>📅 Program</button>
          <button onClick={() => { setView("boss"); setMobileMenuOpen(false); }}>🐲 Boss</button>
          <button onClick={() => { setView("ach"); setMobileMenuOpen(false); }}>🏅 Achievements</button>
          <button onClick={() => { setView("pr"); setMobileMenuOpen(false); }}>🏆 PR</button>
          <button onClick={() => { setView("profile"); setMobileMenuOpen(false); }}>👤 Profil</button>
          <button onClick={() => { setView("lift"); setMobileMenuOpen(false); }}>📈 LiftTools</button>
          <button onClick={() => { setView("cycle"); setMobileMenuOpen(false); }}>📅 Cycle</button>
        </div>
      </div>

      {/* Main */}
      <main className="main">
        <div className="main-header">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>

          <div style={{ flex: 1 }}>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">Idag är en perfekt dag att bli starkare. Varje set bygger din historia.</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {cycleInfo ? (
              <div className="cycle-badge">{cycleInfo.phase} • {Math.round(todayFactor * 100)}%</div>
            ) : (
              <div className="muted-badge">Ingen cykel satt</div>
            )}
            <button className="btn-pink" onClick={() => setShowModal(true)}>+ Logga set</button>
          </div>
        </div>

        {/* Views */}
        {view === "dashboard" && (
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card small">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>XP & Level</div>
                    <div className="small">Du får XP för varje tungt set</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{xp} XP</div>
                    <div className="small">Tier {battleTier}</div>
                  </div>
                </div>
                <div className="progress-wrap" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xp / nextTierXp) * 100))}%` }} />
                </div>
                <div className="small" style={{ marginTop: 6 }}>Nästa tier vid {nextTierXp} XP</div>
              </div>

              <MuscleMap muscleStats={muscleStats} />

              <div className="card">
                <h3 style={{ marginTop: 0 }}>Body Progress</h3>
                <MuscleComparison data={comparisonData} />
              </div>
            </div>

            <div className="col" style={{ flex: 1, gap: 10 }}>
              <BossArena bosses={bosses} />
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Dagens rekommendation</h3>
                <div className="small">
                  {cycleInfo ? (
                    cycleInfo.phase === "Menstrual" ? "Fokusera teknik & lätt volym." :
                      cycleInfo.phase === "Follicular" ? "Bra för volym & progressivt tunga set." :
                        cycleInfo.phase === "Ovulation" ? "Top performance — satsa på tunga set." :
                          "Sänk volym och prioritera kvalitet."
                  ) : "Sätt din cykel på Cycle-sidan för personliga tips."}
                </div>
              </div>
              <BattlePass tier={battleTier} xp={xp} nextTierXp={nextTierXp} rewards={BATTLE_REWARDS} claimedRewards={claimedRewards} onClaimReward={handleClaimReward} />
            </div>
          </div>
        )}

        {view === "log" && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Loggade set</h3>
            {!logs.length && <p className="small">Inga set än — klicka + Logga set för att börja.</p>}
            <ul className="log-list">
              {logs.map((l) => {
                const ex = EXERCISES.find((e) => e.id === l.exerciseId);
                return (
                  <li key={l.id} className="log-item">
                    <div>
                      <div className="log-title">{ex?.name || l.exerciseId}</div>
                      <div className="small muted">{l.date} • {l.weight} kg × {l.reps} reps • 1RM ≈ {calc1RM(l.weight, l.reps)} kg</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" onClick={() => handleDeleteLog(l.id)}>🗑️</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {view === "program" && <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={handleSelectProgram} onNextDay={handleNextDay} logs={logs} />}

        {view === "boss" && (
          <div className="row">
            <div className="col"><BossArena bosses={bosses} /></div>
            <div className="col">
              <div className="card"><h3 style={{ marginTop: 0 }}>Hur funkar raid?</h3><div className="small">Bänk → Chest Beast, Hip Thrust/Knäböj → Glute Dragon, Row/Marklyft → Row Titan.</div></div>
            </div>
          </div>
        )}

        {view === "lift" && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Lift Tools</h3>
            <LiftTools logs={logs} bodyStats={bodyStats} cycleInfo={cycleInfo} onAddManual={(entry) => { setLogs((prev) => [entry, ...prev]); showToastMsg("Lyft lagt till", "Tillagd i historiken."); }} />
          </div>
        )}

        {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

        {view === "pr" && <PRList prMap={prMap} />}

        {view === "cycle" && <CyclePage />}

        {view === "profile" && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            bodyStats={bodyStats}
            onAddMeasurement={(key, entry) => setBodyStats((prev) => {
              const arr = prev[key] || [];
              return { ...prev, [key]: [...arr, entry] };
            })}
            onDeleteMeasurement={(key, id) => setBodyStats((prev) => {
              const arr = prev[key] || [];
              return { ...prev, [key]: arr.filter((m) => m.id !== id) };
            })}
          />
        )}
      </main>

      <LogModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} />
    </div>
  );
}
