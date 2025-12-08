import React, { useState, useMemo, useEffect } from "react";
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

// ----------- KONSTANTER -----------
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

function cloneBosses(b) {
  return {
    chest: { ...b.chest },
    glute: { ...b.glute },
    back: { ...b.back },
  };
}

function applyBossDamageToState(stateBosses, entry, oneRm, isPR) {
  const copy = cloneBosses(stateBosses);
  let dmg = oneRm * (isPR ? 1.5 : 1);

  if (entry.exerciseId === "bench") {
    copy.chest.currentHP = Math.max(0, copy.chest.currentHP - Math.round(dmg * 0.6));
  } else if (["hipthrust", "legpress", "squat"].includes(entry.exerciseId)) {
    copy.glute.currentHP = Math.max(0, copy.glute.currentHP - Math.round(dmg * 0.7));
  } else if (["row", "deadlift", "latpulldown"].includes(entry.exerciseId)) {
    copy.back.currentHP = Math.max(0, copy.back.currentHP - Math.round(dmg * 0.65));
  }
  return copy;
}

function recomputeFromLogs(logs, profile) {
  let xp = 0;
  let tier = 1;
  let bosses = initialBosses();
  let prMap = {};

  logs
    .slice()
    .reverse()
    .forEach((entry) => {
      const this1RM = calc1RM(entry.weight, entry.reps);
      xp += Math.max(5, Math.round(this1RM / 10));
      tier = 1 + Math.floor(xp / 200);

      const current = prMap[entry.exerciseId]?.best1RM || 0;
      const isPR = this1RM > current;

      prMap[entry.exerciseId] = {
        best1RM: isPR ? this1RM : current,
        history: [
          ...(prMap[entry.exerciseId]?.history || []),
          { ...entry, oneRm: this1RM },
        ],
      };

      bosses = applyBossDamageToState(bosses, entry, this1RM, isPR);
    });

  return { xp, battleTier: tier, bosses, prMap };
}

function computeMuscleStatsFromLogs(logs, profile) {
  const stats = {};
  MUSCLES.forEach((m) => {
    stats[m.id] = { score: 0, percent: 0, levelKey: "Beginner" };
  });

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

    const adv = bw * std.coeff;
    if (!adv) return;

    const ratio = oneRm / adv;
    std.muscles.forEach((mId) => {
      if (!stats[mId]) return;
      stats[mId].score += ratio;
    });
  });

  Object.keys(stats).forEach((mId) => {
    const s = stats[mId].score;
    let lvl = "Beginner";
    if (s >= 0.55) lvl = "Novice";
    if (s >= 0.75) lvl = "Intermediate";
    if (s >= 1.0) lvl = "Advanced";
    if (s >= 1.25) lvl = "Elite";
    stats[mId].levelKey = lvl;
    stats[mId].percent = Math.min(150, Math.round((s / 1.25) * 100));
  });

  return stats;
}

// -------------- HUVUDKOMPONENT --------------
export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // LOGGAR
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("bebi_logs");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => localStorage.setItem("bebi_logs", JSON.stringify(logs)), [logs]);

  // PROFIL
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("bebi_profile");
    return saved
      ? JSON.parse(saved)
      : {
          name: "Maria Kristina",
          nick: "Bebi",
          age: 21,
          height: 170,
          weight: 68,
          avatar: "/avatar.png",
        };
  });
  useEffect(() => localStorage.setItem("bebi_profile", JSON.stringify(profile)), [profile]);

  // BODY STATS
  const [bodyStats, setBodyStats] = useState(() => {
    const saved = localStorage.getItem("bebi_bodyStats");
    return saved
      ? JSON.parse(saved)
      : { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
  });
  useEffect(() => localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats)), [bodyStats]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);

  const { mood, bumpMood } = useBebiMood();

  // Recompute varje gång loggar ändras
  const { xp, battleTier, bosses, prMap } = useMemo(
    () => recomputeFromLogs(logs, profile),
    [logs, profile.weight]
  );

  const muscleStats = useMemo(
    () => computeMuscleStatsFromLogs(logs, profile),
    [logs, profile.weight]
  );

  const comparisonData = useMemo(
    () => buildComparisonChartData(muscleStats),
    [muscleStats]
  );

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
  }

  function handleSaveSet(entry) {
    const today = new Date().toISOString().slice(0, 10);
    const finalEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      date: entry.date || today,
    };

    const previous = logs.filter(
      (l) => l.exerciseId === finalEntry.exerciseId
    );
    const prevBest = previous.length
      ? Math.max(...previous.map((l) => calc1RM(l.weight, l.reps)))
      : 0;

    const this1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = this1RM > prevBest;

    setLogs((prev) => [finalEntry, ...prev]);
    setLastSet(finalEntry);

    if (isPR) {
      bumpMood("pr");
      showToastMsg("NYTT PR! 🔥", "Du är sjuk stark Bebi!");
    } else {
      showToastMsg("Set sparat 💪", "Du blev lite starkare precis.");
    }

    setShowModal(false);
  }

  function handleDeleteLog(id) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    showToastMsg("Raderat 🗑️", "Loggen är borttagen.");
  }

  function handleSelectProgram(id) {
    setActiveProgramId(id);
    setDayIndex(0);
    bumpMood("start_program");
  }

  function handleNextDay() {
    const prog = PROGRAMS.find((p) => p.id === activeProgramId);
    if (!prog) return;
    setDayIndex((prev) => (prev + 1) % prog.days.length);
  }

  function handleClaimReward(id) {
    if (claimedRewards.includes(id)) return;
    const reward = BATTLE_REWARDS.find((r) => r.id === id);
    setClaimedRewards((prev) => [...prev, id]);
    showToastMsg("Reward klaimad 🎁", reward?.label || "");
  }

  // ------------------ SIDEBAR (DESKTOP) ------------------
  const desktopSidebar = (
    <aside className="sidebar desktop-only">
      <div className="sidebar-header">
        <div>
          <div className="sidebar-title">Bebi Gym v17</div>
          <div className="sidebar-sub">För Maria Kristina 💗</div>
        </div>
      </div>

      <div className="sidebar-nav">
        <button className={`sidebar-link ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
        <button className={`sidebar-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>📓 Log</button>
        <button className={`sidebar-link ${view === "program" ? "active" : ""}`} onClick={() => setView("program")}>📅 Program</button>
        <button className={`sidebar-link ${view === "boss" ? "active" : ""}`} onClick={() => setView("boss")}>🐲 Boss</button>
        <button className={`sidebar-link ${view === "ach" ? "active" : ""}`} onClick={() => setView("ach")}>🏅 Achievements</button>
        <button className={`sidebar-link ${view === "pr" ? "active" : ""}`} onClick={() => setView("pr")}>🏆 PR</button>
        <button className={`sidebar-link ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>👤 Profil</button>
        <button className={`sidebar-link ${view === "lift" ? "active" : ""}`} onClick={() => setView("lift")}>📈 LiftTools</button>
      </div>

      <div className="sidebar-footer">
        <div>Bebi: {profile.name}</div>
        <div>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
      </div>
    </aside>
  );

  // ------------------ MOBILE DRAWER ------------------
  const mobileDrawer = (
    <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
      <div className="drawer-header">
        <b>Bebi Gym 💗</b>
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
        <button onClick={() => { setView("lift"); setMobileMenuOpen(false); }}>📈 Lift Tools</button>
      </div>
    </div>
  );

  // ------------------ RETURN ------------------
  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {desktopSidebar}
      {mobileDrawer}

      <main className="main">
        {/* ------------------ HEADER ------------------ */}
        <div className="main-header">
          <button className="hamburger-btn mobile-only" onClick={() => setMobileMenuOpen(true)}>☰</button>

          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">
              Idag är en perfekt dag att bli starkare. Varje set du gör skadar bossar & bygger XP.
            </div>
          </div>

          <button className="btn-pink" onClick={() => setShowModal(true)}>+ Logga set</button>
        </div>

        {/* ------------------ DASHBOARD ------------------ */}
        {view === "dashboard" && (
          <div className="row dash">
            <div className="col">
              <div className="card small">
                <div className="flex-between">
                  <div>
                    <div className="title-sm">XP & Level</div>
                    <div className="small">Du får XP för varje tungt set</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>{xp} XP</div>
                    <div>Tier {battleTier}</div>
                  </div>
                </div>

                <div className="progress-wrap">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.round((xp / (battleTier * 200)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="small">Nästa tier vid {battleTier * 200} XP</div>
              </div>

              <MuscleMap muscleStats={muscleStats} />
              <MuscleComparison data={comparisonData} />
            </div>

            <div className="col">
              <BossArena bosses={bosses} />
              <BattlePass
                tier={battleTier}
                xp={xp}
                nextTierXp={battleTier * 200}
                rewards={BATTLE_REWARDS}
                claimedRewards={claimedRewards}
                onClaimReward={handleClaimReward}
              />
            </div>
          </div>
        )}

        {/* ------------------ LOGGAR ------------------ */}
        {view === "log" && (
          <div className="card">
            <h3>Loggade set 📓</h3>

            {!logs.length && <p className="small">Inga set än, Bebi 💗</p>}

            <ul className="log-list">
              {logs.map((l) => {
                const ex = EXERCISES.find((e) => e.id === l.exerciseId);
                return (
                  <li key={l.id} className="log-item">
                    {l.date} • {ex?.name} • {l.weight} kg × {l.reps}
                    <button onClick={() => handleDeleteLog(l.id)}>🗑️</button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ------------------ PROGRAM ------------------ */}
        {view === "program" && (
          <ProgramRunner
            programs={PROGRAMS}
            activeProgramId={activeProgramId}
            dayIndex={dayIndex}
            onSelectProgram={handleSelectProgram}
            onNextDay={handleNextDay}
            logs={logs}
          />
        )}

        {/* ------------------ BOSS ------------------ */}
        {view === "boss" && (
          <div className="row">
            <div className="col">
              <BossArena bosses={bosses} />
            </div>
            <div className="col">
              <div className="card">
                <h3>Hur funkar raid? 🐉</h3>
                <p className="small">Bänk = chest damage • Hip Thrust = glutes • Rodd/Mark = back</p>
                <p className="small">PR ger extra damage! 🔥</p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------ LIFT TOOLS ------------------ */}
        {view === "lift" && (
          <div className="card lift-wrapper">
            <h2>Lift Tools 🛠️</h2>
            <LiftTools
              logs={logs}
              bodyStats={bodyStats}
              onAddManual={(entry) => setLogs((prev) => [entry, ...prev])}
            />
          </div>
        )}

        {/* ------------------ ACHIEVEMENTS ------------------ */}
        {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

        {/* ------------------ PR-LISTA ------------------ */}
        {view === "pr" && <PRList prMap={prMap} />}

        {/* ------------------ PROFIL ------------------ */}
        {view === "profile" && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            bodyStats={bodyStats}
            onAddMeasurement={(k, m) => {
              setBodyStats((prev) => ({ ...prev, [k]: [...prev[k], m] }));
            }}
            onDeleteMeasurement={(k, id) => {
              setBodyStats((prev) => ({
                ...prev,
                [k]: prev[k].filter((x) => x.id !== id),
              }));
            }}
          />
        )}
      </main>
      <LogModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveSet}
        lastSet={lastSet}
      />
    </div>
  );
}
