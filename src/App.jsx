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

/* -------------------------
   Small helpers (kept compact)
   ------------------------- */

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

/* recomputeFromLogs returns xp, battleTier, bosses, prMap */
function recomputeFromLogs(logs, profile) {
  let xp = 0;
  let battleTier = 1;
  let bosses = initialBosses();
  let prMap = {};

  const chronological = [...logs].reverse();
  chronological.forEach((entry) => {
    const oneRm = calc1RM(entry.weight, entry.reps);
    const gainedXp = Math.max(5, Math.round(oneRm / 10));
    xp += gainedXp;
    battleTier = 1 + Math.floor(xp / 200);

    const currentPR = prMap[entry.exerciseId]?.best1RM || 0;
    const isPR = oneRm > currentPR;

    // update prMap
    const curr = prMap[entry.exerciseId] || { best1RM: 0, history: [] };
    const history = [...curr.history, { ...entry, oneRm }];
    const best1RM = isPR ? oneRm : curr.best1RM;
    prMap[entry.exerciseId] = { best1RM, history };

    bosses = applyBossDamageToState(bosses, entry, oneRm, isPR);
  });

  return { xp, battleTier, bosses, prMap };
}

/* computeMuscleStatsFromLogs (StrengthLevel-like) */
function computeMuscleStatsFromLogs(logs, profile) {
  const stats = {};
  MUSCLES.forEach((m) => {
    stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 };
  });

  if (!logs || logs.length === 0) return stats;
  const bw = profile?.weight || profile?.weight_kg || 60;

  // best 1RM per exercise from logs
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
    if (!target || target <= 0) return;
    const ratio = oneRm / target;
    std.muscles.forEach((mId) => {
      if (stats[mId]) stats[mId].score += ratio;
    });
  });

  Object.keys(stats).forEach((mId) => {
    const score = stats[mId].score || 0;
    let levelKey = "Beginner";
    if (score >= 0.55) levelKey = "Novice";
    if (score >= 0.75) levelKey = "Intermediate";
    if (score >= 1.0) levelKey = "Advanced";
    if (score >= 1.25) levelKey = "Elite";
    const percent = Math.min(150, Math.max(0, Math.round((score / 1.25) * 100)));
    stats[mId] = { ...stats[mId], levelKey, percent };
  });

  return stats;
}

/* -------------------------
   MAIN APP
   ------------------------- */

export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // logs (persisted)
  const [logs, setLogs] = useState(() => {
    try {
      const raw = localStorage.getItem("bebi_logs");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("bebi_logs", JSON.stringify(logs));
    } catch (e) {}
  }, [logs]);

  // profile (persisted)
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem("bebi_profile");
      return raw
        ? JSON.parse(raw)
        : {
            name: "Maria Kristina",
            nick: "Bebi",
            age: 21,
            height: 170,
            weight: 68,
            avatar: "/avatar.png",
          };
    } catch (e) {
      return {
        name: "Maria Kristina",
        nick: "Bebi",
        age: 21,
        height: 170,
        weight: 68,
        avatar: "/avatar.png",
      };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("bebi_profile", JSON.stringify(profile));
    } catch (e) {}
  }, [profile]);

  // bodyStats (persisted)
  const [bodyStats, setBodyStats] = useState(() => {
    try {
      const raw = localStorage.getItem("bebi_bodyStats");
      return raw
        ? JSON.parse(raw)
        : { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
    } catch (e) {
      return { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats));
    } catch (e) {}
  }, [bodyStats]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS?.[0]?.id || null);
  const [dayIndex, setDayIndex] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);

  const { mood, bumpMood } = useBebiMood?.() || { mood: "idle", bumpMood: () => {} };

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
  }

  // recompute XP/boss/pr from logs
  const { xp, battleTier, bosses, prMap } = useMemo(() => recomputeFromLogs(logs, profile), [logs, profile.weight]);

  // muscle stats derived from logs + profile
  const muscleStats = useMemo(() => computeMuscleStatsFromLogs(logs, profile), [logs, profile.weight]);
  const comparisonData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats]);

  // unlocked achievements (simple example)
  const unlockedAchievements = useMemo(() => {
    const arr = [];
    if (logs.length >= 1) arr.push({ id: "ach_first", title: "Första passet! 💖", desc: "Du loggade ditt första pass.", emoji: "🎉" });
    if (logs.length >= 5) arr.push({ id: "ach_5_logs", title: "Consistency Bebi", desc: "Minst 5 loggade pass.", emoji: "📅" });
    const glute = muscleStats.glutes;
    if (glute && glute.levelKey === "Elite") arr.push({ id: "ach_glute_elite", title: "Glute Queen", desc: "Elite på glutes – Glute Dragon darrar.", emoji: "🍑" });
    return arr;
  }, [logs, muscleStats]);

  const nextTierXp = battleTier * 200;

  function handleSaveSet(entry) {
    const today = new Date().toISOString().slice(0, 10);
    const finalEntry = {
      ...entry,
      id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      date: entry.date || today,
    };

    // PR-check quickly
    const previousForExercise = logs.filter((l) => l.exerciseId === finalEntry.exerciseId);
    const prevBest = previousForExercise.length ? Math.max(...previousForExercise.map((l) => calc1RM(l.weight, l.reps))) : 0;
    const this1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = this1RM > prevBest;

    setLogs((prev) => [finalEntry, ...prev]);
    setLastSet(finalEntry);

    if (isPR) {
      bumpMood?.("pr");
      showToastMsg("OMG BEBI!! NYTT PR!!! 🔥💖", "Du är helt magisk, jag svär.");
    } else {
      showToastMsg("Set sparat 💪", "Bebi, du blev precis lite starkare.");
    }

    setShowModal(false);
    // Auto-close mobile drawer if open
    setMobileMenuOpen(false);
  }

  function handleDeleteLog(id) {
    const newLogs = logs.filter((l) => l.id !== id);
    setLogs(newLogs);
    showToastMsg("Logg borttagen 🗑️", "Statistik & muskelkarta har uppdaterats.");
  }

  function handleAddMeasurement(key, entry) {
    setBodyStats((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: [...arr, entry] };
    });
  }

  function handleDeleteMeasurement(key, id) {
    setBodyStats((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.filter((m) => m.id !== id) };
    });
  }

  function handleSelectProgram(id) {
    setActiveProgramId(id);
    setDayIndex(0);
  }

  function handleNextDay() {
    const prog = PROGRAMS.find((p) => p.id === activeProgramId) || PROGRAMS[0];
    if (!prog) return;
    const next = (dayIndex + 1) % prog.days.length;
    setDayIndex(next);
  }

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* Desktop sidebar (hidden on small screens via CSS) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <BebiAvatar size={44} mood={mood} avatar={profile.avatar} />
            <div>
              <div className="sidebar-title">Bebi Gym</div>
              <div className="sidebar-sub">För {profile.name}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-link ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            <span className="icon">🏠</span><span>Dashboard</span>
          </button>
          <button className={`sidebar-link ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>
            <span className="icon">📓</span><span>Logga</span>
          </button>
          <button className={`sidebar-link ${view === "program" ? "active" : ""}`} onClick={() => setView("program")}>
            <span className="icon">📅</span><span>Program</span>
          </button>
          <button className={`sidebar-link ${view === "boss" ? "active" : ""}`} onClick={() => setView("boss")}>
            <span className="icon">🐲</span><span>Boss</span>
          </button>
          <button className={`sidebar-link ${view === "lift" ? "active" : ""}`} onClick={() => setView("lift")}>
            <span className="icon">📈</span><span>Lift Tools</span>
          </button>
          <button className={`sidebar-link ${view === "ach" ? "active" : ""}`} onClick={() => setView("ach")}>
            <span className="icon">🏅</span><span>Achievements</span>
          </button>
          <button className={`sidebar-link ${view === "pr" ? "active" : ""}`} onClick={() => setView("pr")}>
            <span className="icon">🏆</span><span>PR</span>
          </button>
          <button className={`sidebar-link ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>
            <span className="icon">👤</span><span>Profil</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="tiny"> {profile.height} cm • {profile.weight} kg • {profile.age} år </div>
        </div>
      </aside>

      {/* Mobile drawer (hamburger triggers) */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <BebiAvatar size={36} mood={mood} avatar={profile.avatar} />
            <strong>Bebi Gym</strong>
          </div>
          <button className="close-btn" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="drawer-links">
          <button onClick={() => { setView("dashboard"); setMobileMenuOpen(false); }}>🏠 Dashboard</button>
          <button onClick={() => { setView("log"); setMobileMenuOpen(false); }}>📓 Logga</button>
          <button onClick={() => { setView("program"); setMobileMenuOpen(false); }}>📅 Program</button>
          <button onClick={() => { setView("boss"); setMobileMenuOpen(false); }}>🐲 Boss</button>
          <button onClick={() => { setView("lift"); setMobileMenuOpen(false); }}>📈 Lift Tools</button>
          <button onClick={() => { setView("ach"); setMobileMenuOpen(false); }}>🏅 Achievements</button>
          <button onClick={() => { setView("pr"); setMobileMenuOpen(false); }}>🏆 PR</button>
          <button onClick={() => { setView("profile"); setMobileMenuOpen(false); }}>👤 Profil</button>
        </div>
      </div>

      {/* Main content */}
      <main className="main">
        <div className="main-header">
          <div className="left-controls">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <div>
              <div className="main-title">Hej {profile.nick} 💖</div>
              <div className="main-sub">Varje set skadar bossar, ger XP & bygger PR.</div>
            </div>
          </div>

          <div className="right-controls">
            <button className="btn btn-outline" onClick={() => { setView("profile"); }}>Profil</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Logga set</button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="content-area">
          {view === "dashboard" && (
            <div className="grid-2col">
              <div className="col-left">
                <div className="card small card-glow">
                  <div className="card-row-space">
                    <div>
                      <div className="muted">XP & Battle Tier</div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{xp} XP — Tier {battleTier}</div>
                    </div>
                    <div style={{ width: 180 }}>
                      <div className="progress-wrap">
                        <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xp / nextTierXp) * 100))}%` }} />
                      </div>
                      <div className="small muted">Nästa tier: {nextTierXp} XP</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <MuscleMap muscleStats={muscleStats} />
                </div>

                <div className="card">
                  <MuscleComparison data={comparisonData} />
                </div>
              </div>

              <div className="col-right">
                <div className="card">
                  <BossArena bosses={bosses} />
                </div>

                <div className="card">
                  <BattlePass tier={battleTier} xp={xp} nextTierXp={nextTierXp} rewards={[]} onClaimReward={() => {}} claimedRewards={claimedRewards} />
                </div>

                <div className="card small">
                  <h4 style={{ margin: 0 }}>Snabbstatistik</h4>
                  <div className="muted small">PRs, veckomissioner & troféer visas här.</div>
                </div>
              </div>
            </div>
          )}

          {view === "log" && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Loggade set</h3>
              {!logs.length ? (
                <p className="muted small">Inga set ännu — klicka "Logga set" för att börja.</p>
              ) : (
                <div className="log-list">
                  {logs.map((l) => {
                    const ex = EXERCISES.find((e) => e.id === l.exerciseId);
                    return (
                      <div key={l.id} className="log-row">
                        <div>
                          <div className="muted small">{l.date}</div>
                          <div style={{ fontWeight: 700 }}>{ex?.name || l.exerciseId}</div>
                          <div className="small muted">{l.weight} kg × {l.reps} reps • 1RM ≈ {calc1RM(l.weight, l.reps)} kg</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(JSON.stringify(l))}>📋</button>
                          <button className="btn btn-danger" onClick={() => handleDeleteLog(l.id)}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === "program" && (
            <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={handleSelectProgram} onNextDay={handleNextDay} logs={logs} />
          )}

          {view === "boss" && (
            <div className="card">
              <BossArena bosses={bosses} />
            </div>
          )}

          {view === "lift" && (
            <div className="card">
              <LiftTools logs={logs} bodyStats={bodyStats} onAddManual={(entry) => setLogs((p) => [entry, ...p])} />
            </div>
          )}

          {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

          {view === "pr" && <PRList prMap={prMap} />}

          {view === "profile" && (
            <ProfileView profile={profile} setProfile={setProfile} bodyStats={bodyStats} onAddMeasurement={handleAddMeasurement} onDeleteMeasurement={handleDeleteMeasurement} />
          )}
        </div>
      </main>

      <LogModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} />
    </div>
  );
}
