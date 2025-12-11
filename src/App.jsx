import React, { useState, useMemo, useEffect } from "react";

// ---------------- COMPONENTS ----------------
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
import Dashboard from "./components/Dashboard.jsx";
import PRPage from "./components/PRPage.jsx";
import CycleCalendar from "./components/CycleCalendar.jsx";

// ---------------- DATA ----------------
import { buildComparisonChartData } from "./utils/comparisonData.js";
import { useBebiMood } from "./hooks/useBebiMood.js";
import { EXERCISES } from "./data/exercises";
import { MUSCLES } from "./data/muscles";
import { STRENGTH_STANDARDS } from "./data/strengthStandards";
import { PROGRAMS } from "./data/programs";
import { initialBosses } from "./data/bosses";

// =============================================
//                UTILS & HELPERS
// =============================================

const REWARDS = [
  { id: "r50", xpRequired: 50, label: "Warmup Queen", emoji: "💖" },
  { id: "r200", xpRequired: 200, label: "Tier 2 Gift", emoji: "🎁" },
  { id: "r500", xpRequired: 500, label: "Boss Slayer", emoji: "🐲" },
  { id: "r1000", xpRequired: 1000, label: "Legendary", emoji: "🌟" }
];

function calc1RM(w, r) {
  if (!w || !r) return 0;
  return Math.round(w * (1 + r / 30));
}

function cloneBosses(b) {
  return {
    chest: { ...b.chest },
    glute: { ...b.glute },
    back: { ...b.back },
  };
}

function applyBossDamage(stateBosses, entry, oneRm, isPR) {
  const b = cloneBosses(stateBosses);
  let dmg = oneRm;
  if (isPR) dmg *= 1.5;

  const ex = entry.exerciseId;

  if (ex === "bench") b.chest.currentHP = Math.max(0, b.chest.currentHP - Math.round(dmg * 0.6));
  if (["hipthrust", "squat", "legpress"].includes(ex)) b.glute.currentHP = Math.max(0, b.glute.currentHP - Math.round(dmg * 0.7));
  if (["deadlift", "row", "latpulldown"].includes(ex)) b.back.currentHP = Math.max(0, b.back.currentHP - Math.round(dmg * 0.65));

  return b;
}

function recomputeAll(logs, profile) {
  let xp = 0;
  let tier = 1;
  let bosses = initialBosses();
  let prMap = {};

  const ordered = [...logs].reverse();

  ordered.forEach((l) => {
    const oneRm = calc1RM(l.weight, l.reps);
    const gained = Math.max(5, Math.round(oneRm / 10));
    xp += gained;
    tier = 1 + Math.floor(xp / 200);

    const prev = prMap[l.exerciseId]?.best1RM || 0;
    const isPR = oneRm > prev;

    let history = prMap[l.exerciseId]?.history || [];
    history = [...history, { ...l, oneRm }];

    prMap[l.exerciseId] = {
      best1RM: isPR ? oneRm : prev,
      history,
    };

    bosses = applyBossDamage(bosses, l, oneRm, isPR);
  });

  return { xp, tier, bosses, prMap };
}

function computeMuscles(logs, profile) {
  const stats = {};
  MUSCLES.forEach((m) => (stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 }));

  if (logs.length === 0) return stats;

  const bw = profile.weight || 60;

  const best = {};
  logs.forEach((l) => {
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

    std.muscles.forEach((mId) => (stats[mId].score += ratio));
  });

  Object.keys(stats).forEach((mId) => {
    const val = stats[mId].score;
    let level = "Beginner";

    if (val >= 0.55) level = "Novice";
    if (val >= 0.75) level = "Intermediate";
    if (val >= 1.00) level = "Advanced";
    if (val >= 1.25) level = "Elite";

    stats[mId] = {
      score: val,
      levelKey: level,
      percent: Math.min(150, Math.round((val / 1.25) * 100)),
    };
  });

  return stats;
}

// ---------------- Cycle Helpers ----------------

function getCycleInfo(startISO, length = 28, today = new Date()) {
  if (!startISO) return null;

  const start = new Date(startISO + "T00:00:00");
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  const i = ((diff % length) + length) % length;

  const menstrual = Math.round(length * 0.18);
  const follicular = Math.round(length * 0.32);
  const ov = Math.round(length * 0.07);

  if (i < menstrual) return { phase: "Menstrual", day: i + 1 };
  if (i < menstrual + follicular) return { phase: "Follicular", day: i - menstrual + 1 };
  if (i < menstrual + follicular + ov) return { phase: "Ovulation", day: i - menstrual - follicular + 1 };
  return { phase: "Luteal", day: i - menstrual - follicular - ov + 1 };
}

function phaseIntensity(phase) {
  switch (phase) {
    case "Menstrual": return 0.85;
    case "Follicular": return 1.00;
    case "Ovulation": return 1.05;
    case "Luteal": return 0.95;
    default: return 1.0;
  }
}

// =============================================
//               MAIN COMPONENT
// =============================================

export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  // -------------- PERSISTED STATE ----------------
  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem("bebi_logs") || "[]"));
  useEffect(() => localStorage.setItem("bebi_logs", JSON.stringify(logs)), [logs]);

  const [profile, setProfile] = useState(() =>
    JSON.parse(localStorage.getItem("bebi_profile") || `{
      "name":"Maria Kristina",
      "nick":"Bebi",
      "age":21,
      "height":170,
      "weight":68
    }`)
  );
  useEffect(() => localStorage.setItem("bebi_profile", JSON.stringify(profile)), [profile]);

  const [bodyStats, setBodyStats] = useState(() =>
    JSON.parse(localStorage.getItem("bebi_bodyStats") || `{
      "waist":[], "hips":[], "thigh":[], "glutes":[], "chest":[], "arm":[]
    }`)
  );
  useEffect(() => localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)), [bodyStats]);

  const [cycleStart, setCycleStart] = useState(localStorage.getItem("bebi_cycle_start") || "");
  const [cycleLength, setCycleLength] = useState(Number(localStorage.getItem("bebi_cycle_length") || 28));

  useEffect(() => localStorage.setItem("bebi_cycle_start", cycleStart), [cycleStart]);
  useEffect(() => localStorage.setItem("bebi_cycle_length", cycleLength), [cycleLength]);

  // Others
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);

  const { mood, bumpMood } = useBebiMood();

  // -------------- COMPUTED ----------------
  const { xp, tier, bosses, prMap } = useMemo(() => recomputeAll(logs, profile), [logs, profile.weight]);

  const muscleStats = useMemo(() => computeMuscles(logs, profile), [logs, profile.weight]);

  const compData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats]);

  const cycleInfo = useMemo(() => getCycleInfo(cycleStart, cycleLength, new Date()), [
    cycleStart,
    cycleLength,
  ]);

  const intFactor = cycleInfo ? phaseIntensity(cycleInfo.phase) : 1.0;

  const nextTierXP = tier * 200;

  // =============== LOG FUNCTIONS ===============

  function saveSet(entry) {
    const today = new Date().toISOString().slice(0, 10);

    const finalEntry = {
      ...entry,
      id: crypto.randomUUID?.() || Math.random().toString(36),
      date: entry.date || today,
    };

    const prev = logs.filter((x) => x.exerciseId === finalEntry.exerciseId);
    const prevBest = prev.length ? Math.max(...prev.map((l) => calc1RM(l.weight, l.reps))) : 0;
    const cur1 = calc1RM(finalEntry.weight, finalEntry.reps);

    const isPR = cur1 > prevBest;

    setLogs((p) => [finalEntry, ...p]);
    setLastSet(finalEntry);

    if (isPR) {
      bumpMood("pr");
      showToast("Nytt PR! 🔥", "Bebi du är så stark!");
    } else {
      showToast("Set sparat 💪", "Bra jobbat!");
    }
    setShowModal(false);
  }

  function deleteLog(id) {
    setLogs((p) => p.filter((x) => x.id !== id));
    showToast("Logg borttagen", "All statistik uppdaterad.");
  }

  // ========= ACHIEVEMENTS =========
  const achievements = useMemo(() => {
    const arr = [];
    if (logs.length >= 1) arr.push({ id: "ach1", title: "Första passet", emoji: "🎉" });
    if (logs.length >= 5) arr.push({ id: "ach5", title: "Du är igång", emoji: "🔥" });
    if (tier >= 3) arr.push({ id: "tier3", title: "Tier 3!", emoji: "⭐" });
    return arr;
  }, [logs, tier]);

  // ====== TOAST HELPER ======
  function showToast(t, s) {
    setToast({ title: t, subtitle: s });
    setTimeout(() => setToast(null), 2800);
  }

  // ========= CYCLE PAGE =========
  function CyclePage() {
    const [start, setStart] = useState(cycleStart);
    const [len, setLen] = useState(cycleLength);

    function saveCycle() {
      setCycleStart(start);
      setCycleLength(Number(len));
      showToast("Cykel sparad", "Cykeln är nu uppdaterad.");
    }

    return (
      <div className="card">
        <h3>Cycle Calendar 🌸</h3>

        <div className="input-group">
          <label>Startdatum</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>

        <div className="input-group">
          <label>Längd (dagar)</label>
          <input type="number" min="20" max="40" value={len} onChange={(e) => setLen(e.target.value)} />
        </div>

        <button className="btn-pink" style={{ marginTop: 10 }} onClick={saveCycle}>
          Spara cykel
        </button>

        {cycleInfo && (
          <div style={{ marginTop: 20 }}>
            <div><strong>Dagens fas:</strong> {cycleInfo.phase} (dag {cycleInfo.day})</div>
            <div><strong>Rekommenderad intensitet:</strong> {Math.round(intFactor * 100)}%</div>
          </div>
        )}
      </div>
    );
  }

  // =============================================
  //                     RENDER
  // =============================================

  return (
    <div className="app-shell">

      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* SIDEBAR (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Bebi Gym</div>
          <div className="sidebar-sub">För {profile.name} 💗</div>
        </div>

        <div className="sidebar-nav">
          <button className={`sidebar-link ${view==="dashboard"?"active":""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
          <button className={`sidebar-link ${view==="log"?"active":""}`} onClick={() => setView("log")}>📓 Log</button>
          <button className={`sidebar-link ${view==="program"?"active":""}`} onClick={() => setView("program")}>📅 Program</button>
          <button className={`sidebar-link ${view==="boss"?"active":""}`} onClick={() => setView("boss")}>🐲 Boss</button>
          <button className={`sidebar-link ${view==="ach"?"active":""}`} onClick={() => setView("ach")}>🏅 Achievements</button>
          <button className={`sidebar-link ${view==="pr"?"active":""}`} onClick={() => setView("pr")}>🏆 PR</button>
          <button className={`sidebar-link ${view==="profile"?"active":""}`} onClick={() => setView("profile")}>👤 Profil</button>
          <button className={`sidebar-link ${view==="lift"?"active":""}`} onClick={() => setView("lift")}>📈 LiftTools</button>
          <button className={`sidebar-link ${view==="cycle"?"active":""}`} onClick={() => setView("cycle")}>🌸 Cycle</button>
        </div>

        <div className="sidebar-footer">
          {profile.name} • {profile.weight} kg • {profile.height} cm
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${mobileMenu?"open":""}`}>
        <div className="drawer-header">
          <strong>Bebi Gym</strong>
          <button className="close-btn" onClick={() => setMobileMenu(false)}>×</button>
        </div>

        <div className="drawer-links">
          {["dashboard","log","program","boss","ach","pr","profile","lift","cycle"].map((k) => (
            <button key={k} onClick={() => { setView(k); setMobileMenu(false); }}>
              {k === "dashboard" && "🏠 Dashboard"}
              {k === "log" && "📓 Log"}
              {k === "program" && "📅 Program"}
              {k === "boss" && "🐲 Boss"}
              {k === "ach" && "🏅 Achievements"}
              {k === "pr" && "🏆 PR"}
              {k === "profile" && "👤 Profil"}
              {k === "lift" && "📈 LiftTools"}
              {k === "cycle" && "🌸 Cycle"}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="main">

        <div className="main-header">
          <button className="hamburger-btn" onClick={() => setMobileMenu(true)}>☰</button>

          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">
              Idag är en perfekt dag att bli starkare!
            </div>
          </div>

          <button className="btn-pink" onClick={() => setShowModal(true)}>+ Logga set</button>
        </div>

        {/* VIEW ROUTER */}
     {view === "dashboard" && (
  <Dashboard xp={xp} battleTier={battleTier} nextTierXp={nextTierXp}
    muscleStats={muscleStats} comparisonData={comparisonData}
    bosses={bosses} cycleInfo={cycleInfo} todayFactor={todayFactor}
    onClaimReward={handleClaimReward} battleRewards={BATTLE_REWARDS}
    claimedRewards={claimedRewards}
  />
)}

{view === "pr" && <PRPage prMap={prMap} logs={logs} />}

{view === "cycle" && (
  <CycleCalendar cycleStart={cycleStart} setCycleStart={setCycleStart}
    cycleLength={cycleLength} setCycleLength={setCycleLength} />
)}


        {view === "profile" && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            bodyStats={bodyStats}
            onAddMeasurement={(key, entry) => {
              setBodyStats((p) => ({ ...p, [key]: [...(p[key] || []), entry] }));
            }}
            onDeleteMeasurement={(key, id) => {
              setBodyStats((p) => ({
                ...p,
                [key]: p[key].filter((m) => m.id !== id),
              }));
            }}
          />
        )}

        {view === "lift" && (
          <LiftTools
            logs={logs}
            bodyStats={bodyStats}
            cycleInfo={cycleInfo}
            onAddManual={(entry) => setLogs((p) => [entry, ...p])}
          />
        )}

        {view === "cycle" && <CyclePage />}
      </main>

      <LogModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={saveSet}
        lastSet={lastSet}
      />
    </div>
  );
}
