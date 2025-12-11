import React, { useState, useMemo, useEffect } from "react";
import BebiAvatar from "./components/BebiAvatar.jsx";
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

/* =========================
   Small helpers & constants
   ========================= */
const BATTLE_REWARDS = [
  { id: "r_50xp", xpRequired: 50, label: "Warmup Queen", emoji: "💖" },
  { id: "r_200xp", xpRequired: 200, label: "Tier 2 Gift", emoji: "🎁" },
  { id: "r_500xp", xpRequired: 500, label: "Boss Slayer", emoji: "🐲" },
  { id: "r_1000xp", xpRequired: 1000, label: "Legendary Bebi", emoji: "🌟" },
];

function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}
function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ===== Cycle components inlined (so App.jsx is self-contained) ===== */

/**
 * CycleStrengthChart (simple sparkline-like chart using SVG)
 * Shows a rough "relative strength potential" curve across a 28-day cycle.
 */
function CycleStrengthChart({ cycle }) {
  if (!cycle || !cycle.length) return null;
  // cycle is array of {dayIndex: 0..len-1, value: 0..1}
  const width = 300;
  const height = 56;
  const points = cycle
    .map((p, i) => {
      const x = (i / (cycle.length - 1)) * width;
      const y = height - p.value * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ borderRadius: 8 }}>
      <polyline
        fill="none"
        stroke="#ff7abf"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

/**
 * CycleTracker - stores start date & length, computes phase & daily strength
 * Exposes: cycleData {startDate, length}, computed cycle array and todayPhase
 */
function CycleTracker({ cycleData, setCycleData }) {
  const length = Number(cycleData?.length || 28);
  const start = cycleData?.startDate || new Date().toISOString().slice(0, 10);

  // Build cycle array (0..length-1) => value 0..1 representing strength potential
  const cycleArr = [];
  for (let i = 0; i < length; i++) {
    // Simple shape: follicular rise -> peak at ovulation (~day 12-14), luteal slight dip
    // Normalize based on length
    const relative = i / (length - 1);
    // gaussian-ish peak near 0.45
    const peakCenter = 0.45;
    const dist = Math.abs(relative - peakCenter);
    const base = Math.max(0, 1 - dist * 2.6); // scale
    // small baseline
    const val = 0.5 * (0.5 + base);
    cycleArr.push({ dayIndex: i, value: Math.max(0.12, Math.min(1, val)) });
  }

  // compute today index
  const daysSince = (() => {
    try {
      const s = new Date(start);
      const t = new Date();
      const d = Math.floor((t - s) / (1000 * 60 * 60 * 24));
      return ((d % length) + length) % length;
    } catch (e) {
      return 0;
    }
  })();

  // phase labeling helper
  function phaseForIndex(idx) {
    const pct = idx / length;
    if (pct < 0.15) return "Menstruation";
    if (pct < 0.45) return "Follikulär";
    if (pct < 0.55) return "Ägglossning";
    return "Luteal";
  }

  const todayPhase = phaseForIndex(daysSince);

  return (
    <div className="cycle-card card small" style={{ gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Cykel & styrka</div>
          <div className="small">Din fas idag: <strong>{todayPhase}</strong></div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div>Dag {daysSince + 1}/{length}</div>
        </div>
      </div>

      <div style={{ marginTop: 6 }}>
        <CycleStrengthChart cycle={cycleArr} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <label style={{ flex: 1 }}>
          Startdatum
          <input
            type="date"
            value={start}
            onChange={(e) => setCycleData({ ...cycleData, startDate: e.target.value })}
            style={{ width: "100%", padding: 6, borderRadius: 6, marginTop: 6 }}
          />
        </label>

        <label style={{ width: 110 }}>
          Längd (dgr)
          <input
            type="number"
            value={length}
            min={21}
            max={35}
            onChange={(e) => setCycleData({ ...cycleData, length: Math.max(21, Math.min(35, Number(e.target.value || 28))) })}
            style={{ width: "100%", padding: 6, borderRadius: 6, marginTop: 6 }}
          />
        </label>
      </div>

      <div className="small" style={{ marginTop: 6, color: "#d1d5db" }}>
        Träningsförslag: <strong>
          {todayPhase === "Follikulär" || todayPhase === "Ägglossning" ? "Tunga set / låg volym" : "Högre volym, lättare belastning"}
        </strong>
      </div>
    </div>
  );
}

/* =========================
   Core app logic (clean)
   ========================= */

function cloneBosses(b) {
  return {
    chest: { ...b.chest },
    glute: { ...b.glute },
    back: { ...b.back },
  };
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

function recomputeFromLogs(logs, profile) {
  let xp = 0; let battleTier = 1; let bosses = initialBosses(); let prMap = {};
  const chronological = [...logs].reverse();
  chronological.forEach((entry) => {
    const oneRm = calc1RM(entry.weight, entry.reps);
    const gainedXp = Math.max(5, Math.round(oneRm / 10));
    xp += gainedXp;
    battleTier = 1 + Math.floor(xp / 200);
    const currentPR = prMap[entry.exerciseId]?.best1RM || 0;
    const isPR = oneRm > currentPR;
    const history = [...(prMap[entry.exerciseId]?.history || []), { ...entry, oneRm }];
    const best1RM = isPR ? oneRm : Math.max(currentPR, oneRm);
    prMap[entry.exerciseId] = { best1RM, history };
    bosses = applyBossDamageToState(bosses, entry, oneRm, isPR);
  });
  return { xp, battleTier, bosses, prMap };
}

// Strength-level style per-muscle from PR map
function computeMuscleStatsFromPRMap(prMap, profile) {
  const stats = {};
  MUSCLES.forEach((m) => (stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 }));
  if (!prMap || typeof prMap !== "object") return stats;
  const bw = profile?.weight || 60;
  Object.entries(prMap).forEach(([exId, data]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std || !data?.best1RM) return;
    const target = bw * std.coeff;
    if (!target) return;
    const ratio = data.best1RM / target;
    std.muscles.forEach((mId) => { if (stats[mId]) stats[mId].score += ratio; });
  });
  Object.keys(stats).forEach((mId) => {
    const sc = stats[mId].score || 0;
    let level = "Beginner";
    if (sc >= 0.55) level = "Novice";
    if (sc >= 0.75) level = "Intermediate";
    if (sc >= 1.0) level = "Advanced";
    if (sc >= 1.25) level = "Elite";
    const pct = Math.min(150, Math.max(0, Math.round((sc / 1.25) * 100)));
    stats[mId] = { score: sc, levelKey: level, percent: pct };
  });
  return stats;
}

/* =========================
   Main App
   ========================= */
export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // logs (persist)
  const [logs, setLogs] = useState(() => {
    try { const s = localStorage.getItem("bebi_logs"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => localStorage.setItem("bebi_logs", JSON.stringify(logs)), [logs]);

  // profile (persist)
  const [profile, setProfile] = useState(() => {
    try { const s = localStorage.getItem("bebi_profile"); return s ? JSON.parse(s) : { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" }; } catch { return { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" }; }
  });
  useEffect(() => localStorage.setItem("bebi_profile", JSON.stringify(profile)), [profile]);

  // body stats (persist)
  const [bodyStats, setBodyStats] = useState(() => {
    try { const s = localStorage.getItem("bebi_bodyStats"); return s ? JSON.parse(s) : { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] }; } catch { return { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] }; }
  });
  useEffect(() => localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)), [bodyStats]);

  // cycle system (persist)
  const [cycleData, setCycleData] = useState(() => {
    try { const s = localStorage.getItem("bebi_cycle"); return s ? JSON.parse(s) : { startDate: new Date().toISOString().slice(0,10), length: 28 }; } catch { return { startDate: new Date().toISOString().slice(0,10), length: 28 }; }
  });
  useEffect(() => localStorage.setItem("bebi_cycle", JSON.stringify(cycleData)), [cycleData]);

  const [bosses, setBosses] = useState(() => {
    try { const s = localStorage.getItem("bebi_bosses"); return s ? JSON.parse(s) : initialBosses(); } catch { return initialBosses(); }
  });
  useEffect(() => localStorage.setItem("bebi_bosses", JSON.stringify(bosses)), [bosses]);

  const [xpState, setXpState] = useState(() => { try { const s = localStorage.getItem("bebi_xp"); return s ? JSON.parse(s) : 0; } catch { return 0; } });
  useEffect(() => localStorage.setItem("bebi_xp", JSON.stringify(xpState)), [xpState]);

  const [claimedRewards, setClaimedRewards] = useState(() => { try { const s = localStorage.getItem("bebi_claims"); return s ? JSON.parse(s) : []; } catch { return []; } });
  useEffect(() => localStorage.setItem("bebi_claims", JSON.stringify(claimedRewards)), [claimedRewards]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0].id);
  const [dayIndex, setDayIndex] = useState(0);

  const { mood, bumpMood } = useBebiMood();

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
  }

  // Derived: recompute xp/pr/bosses from logs (pure recompute for safety)
  const recomputed = useMemo(() => recomputeFromLogs(logs, profile), [logs, profile.weight]);
  const { xp, battleTier, prMap } = recomputed;
  // We keep xpState separate only to persist manual xp adjustments; sync here so UI uses recomputed xp
  useEffect(() => setXpState(xp), [xp]);

  // muscle stats built from PR map
  const muscleStats = useMemo(() => computeMuscleStatsFromPRMap(prMap, profile), [prMap, profile.weight]);
  const comparisonData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats]);

  // Achievements (simple)
  const unlockedAchievements = useMemo(() => {
    const arr = [];
    if (logs.length >= 1) arr.push({ id: "ach_first", title: "Första passet!", desc: "Du loggade ditt första pass.", emoji: "🎉" });
    if (logs.length >= 5) arr.push({ id: "ach_5_logs", title: "Consistency Bebi", desc: "Minst 5 loggade pass.", emoji: "📅" });
    const glute = muscleStats.glutes; if (glute && glute.levelKey === "Elite") arr.push({ id: "ach_glute_elite", title: "Glute Queen", desc: "Elite på glutes", emoji: "🍑" });
    return arr;
  }, [logs, muscleStats]);

  const nextTierXp = battleTier * 200;

  function handleSaveSet(entry) {
    const today = new Date().toISOString().slice(0, 10);
    const finalEntry = { ...entry, id: uid(), date: entry.date || today };
    const previousForExercise = logs.filter((l) => l.exerciseId === finalEntry.exerciseId);
    const prevBest = previousForExercise.length ? Math.max(...previousForExercise.map((l) => calc1RM(l.weight, l.reps))) : 0;
    const this1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = this1RM > prevBest;

    setLogs((prev) => [finalEntry, ...prev]);
    setLastSet(finalEntry);

    // Apply boss damage persistently
    setBosses((prev) => applyBossDamageToState(prev, finalEntry, this1RM, isPR));

    if (isPR) {
      bumpMood("pr");
      showToastMsg("OMG BEBI!! NYTT PR!!! 🔥💖", "Du är helt magisk.");
    } else if (lastSet && finalEntry.exerciseId === lastSet.exerciseId && finalEntry.weight >= (lastSet.weight || 0) * 1.1) {
      bumpMood("heavy_set");
      showToastMsg("Starkiii set! 💪", "Du tog i extra hårt nyss!");
    } else {
      showToastMsg("Set sparat 💪", "Bebi, du blev precis lite starkare.");
    }

    setShowModal(false);
  }

  function handleDeleteLog(id) {
    if (!confirm("Är du säker? Vill du ta bort detta set permanent?")) return;
    const newLogs = logs.filter((l) => l.id !== id);
    setLogs(newLogs);
    // recompute bosses & xp by recomputeFromLogs
    const recalced = recomputeFromLogs(newLogs, profile);
    setBosses(recalced.bosses);
    setXpState(recalced.xp);
    showToastMsg("Logg borttagen 🗑️", "Statistik uppdaterad.");
  }

  function handleDeleteMeasurement(key, id) {
    if (!confirm("Ta bort detta mätvärde?")) return;
    setBodyStats((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.filter((m) => m.id !== id) };
    });
    showToastMsg("Mätvärde borttaget", "");
  }

  function handleAddMeasurement(key, entry) {
    setBodyStats((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: [...arr, entry] };
    });
    showToastMsg("Mätvärde sparat", "");
  }

  function handleSelectProgram(id) { setActiveProgramId(id); setDayIndex(0); bumpMood("start_program"); }
  function handleNextDay() { const prog = PROGRAMS.find((p) => p.id === activeProgramId) || PROGRAMS[0]; if (!prog) return; setDayIndex((d) => (d + 1) % prog.days.length); }
  function handleClaimReward(id) { if (claimedRewards.includes(id)) return; setClaimedRewards((p) => [...p, id]); showToastMsg("Reward klaimad 🎁", "Nice!"); }

  // small mobile/desktop UI helpers
  function openMobileMenu() { setMobileMenuOpen(true); }
  function closeMobileMenu() { setMobileMenuOpen(false); }

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* Sidebar for desktop */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <BebiAvatar size={46} mood={mood} />
          <div style={{ marginLeft: 10 }}>
            <div className="sidebar-title">Bebi Gym v17</div>
            <div className="sidebar-sub">För {profile.name} 💗</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <button className={`sidebar-link ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
          <button className={`sidebar-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>📓 Logga pass</button>
          <button className={`sidebar-link ${view === "program" ? "active" : ""}`} onClick={() => setView("program")}>📅 Program</button>
          <button className={`sidebar-link ${view === "boss" ? "active" : ""}`} onClick={() => setView("boss")}>🐲 Boss Raid</button>
          <button className={`sidebar-link ${view === "lift" ? "active" : ""}`} onClick={() => setView("lift")}>📈 Lift Tools</button>
          <button className={`sidebar-link ${view === "ach" ? "active" : ""}`} onClick={() => setView("ach")}>🏅 Achievements</button>
          <button className={`sidebar-link ${view === "pr" ? "active" : ""}`} onClick={() => setView("pr")}>🏆 PR-lista</button>
          <button className={`sidebar-link ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>👤 Profil</button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 11, color: "#9ca3af" }}>
          <div>{profile.name}</div>
          <div>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div><strong>Bebi Gym</strong></div>
          <button className="close-btn" onClick={closeMobileMenu}>×</button>
        </div>
        <div className="drawer-links">
          <button onClick={() => { setView("dashboard"); closeMobileMenu(); }}>🏠 Dashboard</button>
          <button onClick={() => { setView("log"); closeMobileMenu(); }}>📓 Logga pass</button>
          <button onClick={() => { setView("program"); closeMobileMenu(); }}>📅 Program</button>
          <button onClick={() => { setView("boss"); closeMobileMenu(); }}>🐲 Boss Raid</button>
          <button onClick={() => { setView("lift"); closeMobileMenu(); }}>📈 Lift Tools</button>
          <button onClick={() => { setView("ach"); closeMobileMenu(); }}>🏅 Achievements</button>
          <button onClick={() => { setView("pr"); closeMobileMenu(); }}>🏆 PR-lista</button>
          <button onClick={() => { setView("profile"); closeMobileMenu(); }}>👤 Profil</button>
        </div>
      </div>

      {/* Main */}
      <main className="main">
        <div className="main-header">
          <button className="hamburger-btn" onClick={openMobileMenu}>☰</button>
          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">Idag är en perfekt dag att bli starkare — logga ett set så händer magi ✨</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="small" style={{ textAlign: "right" }}>{xpState} XP • Tier {battleTier}</div>
            <button className="btn-pink" onClick={() => setShowModal(true)}>+ Logga set</button>
          </div>
        </div>

        {/* CONTENT */}
        {view === "dashboard" && (
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card small">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>XP & Level</div>
                    <div className="small">Du får XP för varje tungt set</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <div>{xpState} XP</div>
                    <div>Tier {battleTier}</div>
                  </div>
                </div>
                <div className="progress-wrap" style={{ marginTop: 6 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xpState / nextTierXp) * 100))}%` }} />
                </div>
                <div className="small" style={{ marginTop: 4 }}>Nästa tier vid {nextTierXp} XP</div>
              </div>

              {/* Cycle tracker card */}
              <CycleTracker cycleData={cycleData} setCycleData={setCycleData} />

              <MuscleMap muscleStats={muscleStats} />

              <div style={{ marginTop: 10 }}><MuscleComparison data={comparisonData} /></div>
            </div>

            <div className="col" style={{ flex: 1, gap: 10 }}>
              <BossArena bosses={bosses} />
              <BattlePass
                tier={battleTier}
                xp={xpState}
                nextTierXp={nextTierXp}
                rewards={BATTLE_REWARDS}
                claimedRewards={claimedRewards}
                onClaimReward={handleClaimReward}
              />
            </div>
          </div>
        )}

        {view === "log" && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Loggade set 📓</h3>
            {!logs.length && <p className="small">Inga set än — klicka på "Logga set" för att börja.</p>}
            <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0, marginTop: 6 }}>
              {logs.map((l) => {
                const ex = EXERCISES.find((e) => e.id === l.exerciseId);
                return (
                  <li key={l.id} style={{ fontSize: 12, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", borderRadius: 8, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.4)" }}>
                    <div>
                      {l.date} • {ex?.name || l.exerciseId} • {l.weight} kg × {l.reps} reps (1RM ca {calc1RM(l.weight, l.reps)} kg)
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" onClick={() => { /* future: edit */ }}>✏️</button>
                      <button className="btn" onClick={() => handleDeleteLog(l.id)}>🗑️</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {view === "program" && (
          <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={handleSelectProgram} onNextDay={handleNextDay} logs={logs} />
        )}

        {view === "boss" && (
          <div className="row" style={{ gap: 10 }}>
            <div className="col" style={{ flex: 2, gap: 10 }}>
              <BossArena bosses={bosses} />
            </div>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Hur funkar raid? 🐉</h3>
                <p className="small">PR ger extra damage och triggar Rage-avatarläge. Attack sker automatiskt när du loggar set.</p>
              </div>
            </div>
          </div>
        )}

        {view === "lift" && (
          <div className="card" style={{ padding: 20 }}>
            <div className="main-header" style={{ marginBottom: 10 }}>
              <div><div className="main-title">Lift Tools 🛠️</div><div className="main-sub">1RM, volym, grafer & kroppsmått</div></div>
            </div>
            <LiftTools logs={logs} bodyStats={bodyStats} onAddManual={(entry) => { setLogs((prev) => [entry, ...prev]); showToastMsg("Lyft tillagt", "Sparat."); }} />
          </div>
        )}

        {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

        {view === "pr" && <PRList prMap={prMap} />}

        {view === "profile" && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            bodyStats={bodyStats}
            onAddMeasurement={(key, entry) => handleAddMeasurement(key, entry)}
            onDeleteMeasurement={(key, id) => handleDeleteMeasurement(key, id)}
          />
        )}
      </main>

      <LogModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} />
    </div>
  );
}
