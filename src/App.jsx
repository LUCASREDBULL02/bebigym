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
import BackupTools from "./components/BackupTools.jsx";

import { buildComparisonChartData } from "./utils/comparisonData.js";
import { useBebiMood } from "./hooks/useBebiMood.js";
import { EXERCISES } from "./data/exercises";
import { MUSCLES } from "./data/muscles";
import { STRENGTH_STANDARDS } from "./data/strengthStandards";
import { PROGRAMS } from "./data/programs";
import { initialBosses } from "./data/bosses";

/* ---------------- CONSTANTS ---------------- */

const BATTLE_REWARDS = [
  { id: "r_50xp", xpRequired: 50, label: "Warmup Queen", desc: "Första 50 XP", emoji: "💖" },
  { id: "r_200xp", xpRequired: 200, label: "Tier 2 Gift", desc: "Nått tier 2", emoji: "🎁" },
  { id: "r_500xp", xpRequired: 500, label: "Boss Slayer", desc: "Massor av XP", emoji: "🐲" },
  { id: "r_1000xp", xpRequired: 1000, label: "Legendary Bebi", desc: "1000+ XP", emoji: "🌟" },
];

/* ---------- Helper math / core logic ---------- */

function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

function cloneBosses(b) {
  return {
    chest: { ...b.chest },
    glute: { ...b.glute },
    back: { ...b.back },
  };
}

/**
 * computeCycleModifiers(cycle)
 * cycle: { cycleLength, lastPeriodStart (YYYY-MM-DD) }
 * returns: { phase, strengthMult, xpMult, bossDmgMult }
 */
function computeCycleModifiers(cycle) {
  if (!cycle || !cycle.lastPeriodStart) {
    return { phase: null, strengthMult: 1, xpMult: 1, bossDmgMult: 1 };
  }

  const today = new Date();
  const start = new Date(cycle.lastPeriodStart + "T00:00:00");
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const day = ((diffDays % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength; // normalize

  // Basic mapping — just adjust numbers to taste
  if (day <= 4) {
    // Menstruation (days 0-4)
    return { phase: "menstruation", strengthMult: 0.85, xpMult: 0.9, bossDmgMult: 0.85 };
  }
  if (day <= 13) {
    // Follicular (days 5-13)
    return { phase: "follicular", strengthMult: 1.15, xpMult: 1.0, bossDmgMult: 1.1 };
  }
  if (day === 14) {
    // Ovulation (peak)
    return { phase: "ovulation", strengthMult: 1.25, xpMult: 1.1, bossDmgMult: 1.25 };
  }
  // Luteal
  return { phase: "luteal", strengthMult: 0.98, xpMult: 0.95, bossDmgMult: 0.98 };
}

/**
 * recomputeFromLogs: computes XP, tier, bosses, PR-map from logs + cycle modifiers
 * returns: { xp, battleTier, bosses, prMap }
 */
function recomputeFromLogs(logs, profile, cycleMod) {
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

  // chronological: oldest -> newest (so XP accrues in time-order)
  const chronological = [...logs].slice().reverse();

  chronological.forEach((entry) => {
    const base1RM = calc1RM(entry.weight, entry.reps);
    const oneRm = Math.round(base1RM * (cycleMod?.strengthMult || 1));

    // XP uses xpMult
    const gainedXp = Math.max(5, Math.round((oneRm / 10) * (cycleMod?.xpMult || 1)));
    xp += gainedXp;
    battleTier = 1 + Math.floor(xp / 200);

    const currentPR = prMap[entry.exerciseId]?.best1RM || 0;
    const isPR = oneRm > currentPR;

    updatePRLocal(entry, oneRm);

    // damage to bosses uses bossDmgMult
    const dmgBase = Math.round(oneRm * (isPR ? 1.5 : 1));
    const dmgMult = cycleMod?.bossDmgMult || 1;

    if (entry.exerciseId === "bench") {
      bosses.chest.currentHP = Math.max(0, bosses.chest.currentHP - Math.round(dmgBase * 0.6 * dmgMult));
    } else if (["hipthrust", "legpress", "squat"].includes(entry.exerciseId)) {
      bosses.glute.currentHP = Math.max(0, bosses.glute.currentHP - Math.round(dmgBase * 0.7 * dmgMult));
    } else if (["row", "deadlift", "latpulldown"].includes(entry.exerciseId)) {
      bosses.back.currentHP = Math.max(0, bosses.back.currentHP - Math.round(dmgBase * 0.65 * dmgMult));
    }
  });

  return { xp, battleTier, bosses, prMap };
}

/* ------------------ APP ------------------ */

export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logs (persist)
  const [logs, setLogs] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_logs");
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });
  useEffect(() => {
    try { localStorage.setItem("bebi_logs", JSON.stringify(logs)); } catch (e) {}
  }, [logs]);

  // Profile (persist)
  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_profile");
      return s
        ? JSON.parse(s)
        : { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" };
    } catch (e) {
      return { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" };
    }
  });
  useEffect(() => {
    try { localStorage.setItem("bebi_profile", JSON.stringify(profile)); } catch (e) {}
  }, [profile]);

  // Cycle (persist) — user can set lastPeriodStart and cycleLength
  const [cycle, setCycle] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_cycle");
      return s ? JSON.parse(s) : { cycleLength: 28, lastPeriodStart: null };
    } catch (e) {
      return { cycleLength: 28, lastPeriodStart: null };
    }
  });
  useEffect(() => {
    try { localStorage.setItem("bebi_cycle", JSON.stringify(cycle)); } catch (e) {}
  }, [cycle]);
  const cycleMod = useMemo(() => computeCycleModifiers(cycle), [cycle]);

  // Body stats (persist)
  const [bodyStats, setBodyStats] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_bodyStats");
      return s ? JSON.parse(s) : { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
    } catch (e) {
      return { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
    }
  });
  useEffect(() => {
    try { localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)); } catch (e) {}
  }, [bodyStats]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0]?.id || null);
  const [dayIndex, setDayIndex] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bebi_claimed")) || []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("bebi_claimed", JSON.stringify(claimedRewards)); } catch {} }, [claimedRewards]);

  const { mood, bumpMood } = useBebiMood();

  // Notification permission request (when app mounts)
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  function showToastMsg(title, subtitle, useNotification = false) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
    if (useNotification && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body: subtitle, icon: profile.avatar || "/avatar.png" });
      } catch (e) {
        // ignore
      }
    }
  }

  // recompute XP/boss/prMap from logs + cycleMod
  const { xp, battleTier, bosses, prMap } = useMemo(
    () => recomputeFromLogs(logs, profile, cycleMod),
    [logs, profile.weight, cycleMod.strengthMult, cycleMod.xpMult, cycleMod.bossDmgMult]
  );

  // muscle stats & comparison
  const muscleStats = useMemo(() => {
    // Build baseline
    const s = {};
    MUSCLES.forEach((m) => { s[m.id] = { score: 0, levelKey: "Beginner", percent: 0 }; });

    // Use PRs (prMap) to score each muscle (strength standards map exercises -> muscles)
    Object.entries(prMap || {}).forEach(([exId, data]) => {
      const std = STRENGTH_STANDARDS[exId];
      if (!std || !data?.best1RM) return;
      const bw = profile?.weight || 60;
      const target = bw * (std.coeff || 1);
      if (!target || target <= 0) return;
      const ratio = data.best1RM / target;
      std.muscles.forEach((mId) => { if (s[mId]) s[mId].score += ratio; });
    });

    // convert to levels & % (StrengthLevel-like)
    Object.keys(s).forEach((mId) => {
      const score = s[mId].score || 0;
      let levelKey = "Beginner";
      if (score >= 0.55) levelKey = "Novice";
      if (score >= 0.75) levelKey = "Intermediate";
      if (score >= 1.0) levelKey = "Advanced";
      if (score >= 1.25) levelKey = "Elite";
      const percent = Math.min(150, Math.max(0, Math.round((score / 1.25) * 100)));
      s[mId] = { ...s[mId], score, levelKey, percent };
    });

    return s;
  }, [prMap, profile.weight]);

  const comparisonData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats]);

  const unlockedAchievements = useMemo(() => {
    const arr = [];
    if (logs.length >= 1) arr.push({ id: "ach_first", title: "Första passet! 💖", desc: "Du loggade ditt första pass.", emoji: "🎉" });
    if (logs.length >= 5) arr.push({ id: "ach_5_logs", title: "Consistency Bebi", desc: "Minst 5 loggade pass.", emoji: "📅" });
    if (logs.length >= 20) arr.push({ id: "ach_20_sets", title: "Set Machine", desc: "20+ loggade set.", emoji: "🛠️" });
    const anyPR = Object.values(prMap).some((p) => p.best1RM > 0);
    if (anyPR) arr.push({ id: "ach_pr_any", title: "PR Era", desc: "Minst ett registrerat PR.", emoji: "🔥" });
    const bossesArray = Object.values(bosses || {});
    const totalMax = bossesArray.reduce((s, b) => s + (b.maxHP || 0), 0);
    const totalCurrent = bossesArray.reduce((s, b) => s + (b.currentHP || 0), 0);
    const totalPct = totalMax ? Math.round(100 * (1 - totalCurrent / totalMax)) : 0;
    if (totalPct >= 50) arr.push({ id: "ach_raid_50", title: "Raid 50%", desc: "Minst 50% av all boss-HP nedslagen.", emoji: "🐉" });
    if (battleTier >= 3) arr.push({ id: "ach_battle_tier3", title: "Battle Pass Tier 3", desc: "Nått minst tier 3 i Battle Pass.", emoji: "🎟️" });
    const eliteMuscles = Object.values(muscleStats || {}).filter((m) => m.levelKey === "Elite").length;
    if (eliteMuscles >= 2) arr.push({ id: "ach_multi_elite", title: "Multi-Elite Queen", desc: "Minst två muskelgrupper på Elite-nivå.", emoji: "👑" });
    return arr;
  }, [logs, prMap, bosses, battleTier, muscleStats]);

  const nextTierXp = battleTier * 200;

  /* ---------- Actions ---------- */

  function handleSaveSet(entry) {
    // Normalize entry, add id + date
    const today = new Date().toISOString().slice(0, 10);
    const finalEntry = {
      ...entry,
      id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      date: entry.date || today,
    };

    // compute adjusted 1RM with cycle strength multiplier
    const base1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const adjusted1RM = Math.round(base1RM * (cycleMod?.strengthMult || 1));

    // check PR vs existing best
    const prevForEx = logs.filter((l) => l.exerciseId === finalEntry.exerciseId);
    const prevBest = prevForEx.length ? Math.max(...prevForEx.map((l) => calc1RM(l.weight, l.reps))) : 0;
    const isPR = adjusted1RM > prevBest;

    // compute XP (apply xp multiplier)
    const gainedXp = Math.max(5, Math.round((adjusted1RM / 10) * (cycleMod?.xpMult || 1)));

    // add to logs — note: xp & boss damage will be recomputed from logs via useMemo
    setLogs((prev) => [finalEntry, ...prev]);
    setLastSet(finalEntry);

    // mood + notifs
    if (isPR) {
      bumpMood("pr");
      showToastMsg("OMG BEBI!! NYTT PR!!! 🔥💖", "Du är helt magisk, jag svär.", true);
    } else if (lastSet && finalEntry.exerciseId === lastSet.exerciseId && finalEntry.weight >= (lastSet.weight || 0) * 1.1) {
      bumpMood("heavy_set");
      showToastMsg("Starkiii set! 💪", "Du tog i extra hårt nyss!", true);
    } else {
      showToastMsg("Set sparat 💪", "Bebi, du blev precis lite starkare.");
    }

    setShowModal(false);
  }

  function handleDeleteLog(id) {
    const newLogs = logs.filter((l) => l.id !== id);
    setLogs(newLogs);
    showToastMsg("Logg borttagen 🗑️", "Statistik, PR, boss-HP & muskelkarta har uppdaterats.");
  }

  function handleSelectProgram(id) {
    setActiveProgramId(id);
    setDayIndex(0);
    bumpMood("start_program");
  }

  function handleNextDay() {
    const prog = PROGRAMS.find((p) => p.id === activeProgramId) || PROGRAMS[0];
    if (!prog) return;
    const next = (dayIndex + 1) % (prog.days?.length || 1);
    setDayIndex(next);
  }

  function handleClaimReward(id) {
    if (claimedRewards.includes(id)) return;
    setClaimedRewards((prev) => [...prev, id]);
    bumpMood("achievement");
    const r = BATTLE_REWARDS.find((x) => x.id === id);
    showToastMsg("Reward klaimad 🎁", r ? r.label : "Du tog en battle pass-belöning!", true);
  }

  /* ---------- Small UI helpers ---------- */

  function formatPhaseText(mod) {
    if (!mod || !mod.phase) return "Ingen cykel info satt";
    if (mod.phase === "menstruation") return "Menstruation — återhämtning rekommenderas";
    if (mod.phase === "follicular") return "Follicular — bra för styrka & volym";
    if (mod.phase === "ovulation") return "Ovulation — peakstyrka! PR-läge";
    if (mod.phase === "luteal") return "Luteal — stabil fas, anpassa volym";
    return mod.phase;
  }

  /* ---------- RENDER ---------- */

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <BebiAvatar size={48} mood={mood} />
          <div style={{ marginLeft: 10 }}>
            <div className="sidebar-title">Bebi Gym</div>
            <div className="sidebar-sub">För {profile.name} 💗</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <button className={`sidebar-link ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            <span className="icon">🏠</span><span>Dashboard</span>
          </button>

          <button className={`sidebar-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>
            <span className="icon">📓</span><span>Logga pass</span>
          </button>

          <button className={`sidebar-link ${view === "program" ? "active" : ""}`} onClick={() => setView("program")}>
            <span className="icon">📅</span><span>Program</span>
          </button>

          <button className={`sidebar-link ${view === "boss" ? "active" : ""}`} onClick={() => setView("boss")}>
            <span className="icon">🐲</span><span>Boss Raid</span>
          </button>

          <button className={`sidebar-link ${view === "lift" ? "active" : ""}`} onClick={() => setView("lift")}>
            <span className="icon">📈</span><span>LiftTools</span>
          </button>

          <button className={`sidebar-link ${view === "ach" ? "active" : ""}`} onClick={() => setView("ach")}>
            <span className="icon">🏅</span><span>Achievements</span>
          </button>

          <button className={`sidebar-link ${view === "pr" ? "active" : ""}`} onClick={() => setView("pr")}>
            <span className="icon">🏆</span><span>PR-lista</span>
          </button>

          <button className={`sidebar-link ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>
            <span className="icon">👤</span><span>Profil</span>
          </button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 12, color: "#9ca3af" }}>
          <div style={{ fontWeight: 600 }}>{profile.nick} — {formatPhaseText(cycleMod)}</div>
          <div style={{ marginTop: 6 }}>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
        </div>
      </aside>

      {/* MOBILE DRAWER / HAMBURGER */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div style={{ fontWeight: 700 }}>Bebi Gym</div>
          <button className="close-btn" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="drawer-links">
          <button onClick={() => { setView("dashboard"); setMobileMenuOpen(false); }}>🏠 Dashboard</button>
          <button onClick={() => { setView("log"); setMobileMenuOpen(false); }}>📓 Logga pass</button>
          <button onClick={() => { setView("program"); setMobileMenuOpen(false); }}>📅 Program</button>
          <button onClick={() => { setView("boss"); setMobileMenuOpen(false); }}>🐲 Boss Raid</button>
          <button onClick={() => { setView("lift"); setMobileMenuOpen(false); }}>📈 Lift Tools</button>
          <button onClick={() => { setView("ach"); setMobileMenuOpen(false); }}>🏅 Achievements</button>
          <button onClick={() => { setView("pr"); setMobileMenuOpen(false); }}>🏆 PR-lista</button>
          <button onClick={() => { setView("profile"); setMobileMenuOpen(false); }}>👤 Profil</button>
        </div>
      </div>

      {/* MAIN */}
      <main className="main">
        <div className="main-header">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">Varje set skadar bossar, ger XP och bygger din PR-historia. Cykelfas: <strong>{cycleMod.phase || "ingen"}</strong></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setShowModal(true)}>+ Logga set</button>
            <button className="btn-outline" onClick={() => {
              // quick open cycle settings prompt (simple)
              const start = prompt("Sätt senaste mens-start (YYYY-MM-DD) eller lämna tom för att rensa:");
              if (start === "") {
                setCycle((c) => ({ ...c, lastPeriodStart: null }));
                showToastMsg("Cykel rensad", "Ingen cykeldata sparad");
              } else if (start) {
                setCycle((c) => ({ ...c, lastPeriodStart: start }));
                showToastMsg("Cykel uppdaterad", `Period start: ${start}`);
              }
            }}>Cycle</button>
          </div>
        </div>

        {/* Dashboard */}
        {view === "dashboard" && (
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card small">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>XP & Level</div>
                    <div className="small">Du får XP för varje tungt set</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <div>{xp} XP</div>
                    <div>Tier {battleTier}</div>
                  </div>
                </div>

                <div className="progress-wrap" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xp / nextTierXp) * 100))}%` }} />
                </div>

                <div className="small" style={{ marginTop: 6 }}>Nästa tier vid {nextTierXp} XP</div>
              </div>

              {/* Cycle summary card */}
              <div className="card small" style={{ borderLeft: "4px solid #ff77b6" }}>
                <div style={{ fontWeight: 700 }}>Dagens fas: {cycleMod.phase || "ingen"}</div>
                <div className="small" style={{ marginTop: 6 }}>
                  {cycleMod.phase ? formatPhaseText(cycleMod) : "Sätt din senaste mens-start i Cycle-knappen."}
                </div>
                <div style={{ marginTop: 8 }}>Styrka: {(cycleMod.strengthMult * 100).toFixed(0)}% • XP: {(cycleMod.xpMult * 100).toFixed(0)}%</div>
              </div>

              <MuscleMap muscleStats={muscleStats} />

              <div style={{ marginTop: 10 }}>
                <MuscleComparison data={comparisonData} />
              </div>
            </div>

            <div className="col" style={{ flex: 1, gap: 10 }}>
              <BossArena bosses={bosses} />
              <BattlePass tier={battleTier} xp={xp} nextTierXp={nextTierXp} rewards={BATTLE_REWARDS} claimedRewards={claimedRewards} onClaimReward={handleClaimReward} />
            </div>
          </div>
        )}

        {/* Log list */}
        {view === "log" && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Loggade set 📓</h3>
            {!logs.length && <p className="small">Inga set än. Klicka "+ Logga set" för att börja.</p>}
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {logs.map((l) => {
                const ex = EXERCISES.find((e) => e.id === l.exerciseId);
                return (
                  <li key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, borderRadius: 8, marginBottom: 6, background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ex?.name || l.exerciseId}</div>
                      <div className="small">{l.date} • {l.weight} kg × {l.reps} reps • 1RM ≈ {calc1RM(l.weight, l.reps)} kg</div>
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

        {/* Program runner */}
        {view === "program" && <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={handleSelectProgram} onNextDay={handleNextDay} logs={logs} />}

        {/* Boss */}
        {view === "boss" && <div className="row"><div className="col" style={{ flex: 2 }}><BossArena bosses={bosses} /></div><div className="col" style={{ flex: 1 }}><div className="card"><h3 style={{ marginTop: 0 }}>Hur funkar raid?</h3><p className="small">Attacker sker automatiskt när du loggar set. PR ger extra damage och triggar avatar-rage.</p></div></div></div>}

        {/* LiftTools */}
        {view === "lift" && <div className="card" style={{ padding: 20 }}><LiftTools logs={logs} bodyStats={bodyStats} onAddManual={(entry) => { setLogs((prev) => [entry, ...prev]); showToastMsg("Lyft tillagt ✨", "Ditt lyft sparades."); }} /></div>}

        {/* Achievements */}
        {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

        {/* PR list */}
        {view === "pr" && <PRList prMap={prMap} />}

        {/* Profile view */}
        {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} bodyStats={bodyStats} onAddMeasurement={(key, entry) => { setBodyStats((prev) => ({ ...prev, [key]: [...(prev[key] || []), entry] })); }} onDeleteMeasurement={(key, id) => { setBodyStats((prev) => ({ ...prev, [key]: (prev[key] || []).filter(m => m.id !== id) })); }} />}

      </main>

      {/* LogModal — pass cycleMod so it can highlight recommended exercises */}
      <LogModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} cycleMod={cycleMod} />

    </div>
  );
}
