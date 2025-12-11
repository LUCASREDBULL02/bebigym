import React, { useState, useMemo, useEffect, useRef } from "react";
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

/* ==========================
   Constants & helpers
   ========================== */

const BATTLE_REWARDS = [
  { id: "r_50xp", xpRequired: 50, label: "Warmup Queen", emoji: "💖" },
  { id: "r_200xp", xpRequired: 200, label: "Tier 2 Gift", emoji: "🎁" },
  { id: "r_500xp", xpRequired: 500, label: "Boss Slayer", emoji: "🐲" },
  { id: "r_1000xp", xpRequired: 1000, label: "Legendary Bebi", emoji: "🌟" },
];

// Simple 1RM (Epley-style approx)
function calc1RM(weight, reps) {
  if (!weight || !reps || reps < 1) return 0;
  // Use Epley: 1RM = w * (1 + reps/30)
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
  let dmgBase = Math.max(0, oneRm);
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

// recompute xp, tier, bosses and prMap from logs (chronological)
function recomputeFromLogs(logs = [], profile = {}) {
  let xp = 0;
  let battleTier = 1;
  let bosses = initialBosses();
  let prMap = {};

  const chrono = [...logs].reverse(); // oldest first
  chrono.forEach((entry) => {
    const oneRm = calc1RM(entry.weight, entry.reps);
    const gainedXp = Math.max(5, Math.round(oneRm / 10));
    xp += gainedXp;
    battleTier = 1 + Math.floor(xp / 200);

    const cur = prMap[entry.exerciseId] || { best1RM: 0, history: [] };
    const isPR = oneRm > (cur.best1RM || 0);
    const history = [...cur.history, { ...entry, oneRm }];
    const best1RM = isPR ? oneRm : cur.best1RM;
    prMap = { ...prMap, [entry.exerciseId]: { best1RM, history } };

    bosses = applyBossDamageToState(bosses, entry, oneRm, isPR);
  });

  return { xp, battleTier, bosses, prMap };
}

// compute muscle stats using best 1RM per exercise (StrengthLevel-style)
function computeMuscleStatsFromLogs(logs = [], profile = {}) {
  const stats = {};
  MUSCLES.forEach((m) => (stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 }));
  if (!logs || logs.length === 0) return stats;

  const bw = profile?.weight || profile?.weight_kg || 60;
  // best 1RM per exercise
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
    (std.muscles || []).forEach((mId) => {
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

/* ==========================
   Main App
   ========================== */

export default function App() {
  // Views: dashboard, log, program, boss, ach, pr, profile, lift
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // persisted states
  const [logs, setLogs] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_logs");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("bebi_logs", JSON.stringify(logs));
  }, [logs]);

  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_profile");
      return s
        ? JSON.parse(s)
        : { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" };
    } catch {
      return { name: "Maria Kristina", nick: "Bebi", age: 21, height: 170, weight: 68, avatar: "/avatar.png" };
    }
  });
  useEffect(() => {
    localStorage.setItem("bebi_profile", JSON.stringify(profile));
  }, [profile]);

  const [bodyStats, setBodyStats] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_bodyStats");
      return s ? JSON.parse(s) : { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
    } catch {
      return { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };
    }
  });
  useEffect(() => {
    localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats));
  }, [bodyStats]);

  const [claimedRewards, setClaimedRewards] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_claimedRewards");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("bebi_claimedRewards", JSON.stringify(claimedRewards));
  }, [claimedRewards]);

  // UI state
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0]?.id || null);
  const [dayIndex, setDayIndex] = useState(0);

  const { mood, bumpMood } = useBebiMood();

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
  }

  // Derived summary from logs
  const { xp, battleTier, bosses, prMap } = useMemo(() => recomputeFromLogs(logs, profile), [logs, profile.weight]);

  // muscle stats and comparison
  const muscleStats = useMemo(() => computeMuscleStatsFromLogs(logs, profile), [logs, profile.weight]);
  const comparisonData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats]);

  // Achievements (simple)
  const unlockedAchievements = useMemo(() => {
    const arr = [];
    if (logs.length >= 1) arr.push({ id: "ach_first", title: "Första passet! 💖", emoji: "🎉" });
    if (logs.length >= 5) arr.push({ id: "ach_5_logs", title: "Consistency Bebi", emoji: "📅" });
    const glute = muscleStats.glutes;
    if (glute && glute.levelKey === "Elite") arr.push({ id: "ach_glute_elite", title: "Glute Queen", emoji: "🍑" });
    if (battleTier >= 3) arr.push({ id: "ach_battle_tier3", title: "Battle Pass Tier 3", emoji: "🎟️" });
    return arr;
  }, [logs, muscleStats, battleTier]);

  const nextTierXp = battleTier * 200;

  // ----- Log / search states (GymLogger Pro)
  const [searchQ, setSearchQ] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const s = localStorage.getItem("bebi_favs");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("bebi_favs", JSON.stringify(favorites));
  }, [favorites]);

  // last used exercise ids (most recent unique)
  const lastUsed = useMemo(() => {
    const seen = new Set();
    const arr = [];
    for (const l of logs) {
      if (!seen.has(l.exerciseId)) {
        seen.add(l.exerciseId);
        arr.push(l.exerciseId);
      }
      if (arr.length >= 5) break;
    }
    return arr;
  }, [logs]);

  // filtered/search list
  const filteredExercises = useMemo(() => {
    const q = (searchQ || "").trim().toLowerCase();
    let list = EXERCISES.slice();
    if (q) {
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    }
    if (onlyFavorites) {
      list = list.filter((e) => favorites.includes(e.id));
    }
    // sort: favorites first, then lastUsed, then alphabetic
    list.sort((a, b) => {
      const fa = favorites.includes(a.id) ? 0 : 1;
      const fb = favorites.includes(b.id) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      const la = lastUsed.indexOf(a.id) === -1 ? 999 : lastUsed.indexOf(a.id);
      const lb = lastUsed.indexOf(b.id) === -1 ? 999 : lastUsed.indexOf(b.id);
      if (la !== lb) return la - lb;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [searchQ, onlyFavorites, favorites, lastUsed]);

  // Save set (from modal or inline)
  function handleSaveSet(entry) {
    const today = new Date().toISOString().slice(0, 10);
    const finalEntry = {
      ...entry,
      id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 9),
      date: entry.date || today,
    };

    // PR check
    const previousForExercise = logs.filter((l) => l.exerciseId === finalEntry.exerciseId);
    const prevBest = previousForExercise.length ? Math.max(...previousForExercise.map((l) => calc1RM(l.weight, l.reps))) : 0;
    const this1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = this1RM > prevBest;

    setLogs((p) => [finalEntry, ...p]);
    setLastSet(finalEntry);

    if (isPR) {
      bumpMood("pr");
      showToastMsg("Nytt PR!! 🔥", `${finalEntry.exerciseId} — 1RM ≈ ${this1RM} kg`);
    } else {
      showToastMsg("Set sparat", "Bra jobbat!");
    }
    setShowModal(false);
  }

  function handleDeleteLog(id) {
    if (!confirm("Vill du verkligen ta bort detta set? Detta påverkar PR & statistik.")) return;
    const newLogs = logs.filter((l) => l.id !== id);
    setLogs(newLogs);
    showToastMsg("Logg borttagen", "Statistik har uppdaterats.");
  }

  function toggleFavorite(exId) {
    setFavorites((prev) => {
      if (prev.includes(exId)) return prev.filter((p) => p !== exId);
      return [exId, ...prev].slice(0, 50);
    });
  }

  function handleClaimReward(id) {
    if (claimedRewards.includes(id)) return;
    setClaimedRewards((prev) => [...prev, id]);
    showToastMsg("Reward klaimad 🎁", "Grattis!");
  }

  // Program / navigation helpers
  function handleSelectProgram(id) {
    setActiveProgramId(id);
    setDayIndex(0);
    bumpMood("start_program");
  }
  function handleNextDay() {
    const prog = PROGRAMS.find((p) => p.id === activeProgramId) || PROGRAMS[0];
    if (!prog) return;
    setDayIndex((d) => (d + 1) % prog.days.length);
  }

  // quick search ref
  const searchRef = useRef(null);

  /* ===========
     UI JSX
     =========== */
  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}
      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar" role="navigation">
        <div className="sidebar-header">
          <BebiAvatar size={48} mood={mood} />
          <div>
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
            <span className="icon">📈</span><span>Lift Tools</span>
          </button>
          <button className={`sidebar-link ${view === "pr" ? "active" : ""}`} onClick={() => setView("pr")}>
            <span className="icon">🏆</span><span>PR</span>
          </button>
          <button className={`sidebar-link ${view === "ach" ? "active" : ""}`} onClick={() => setView("ach")}>
            <span className="icon">🏅</span><span>Achievements</span>
          </button>
          <button className={`sidebar-link ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>
            <span className="icon">👤</span><span>Profil</span>
          </button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 12, color: "#9ca3af" }}>
          <div>{profile.nick} — {profile.name}</div>
          <div style={{ fontSize: 11 }}>{profile.height} cm • {profile.weight} kg • {profile.age} år</div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div style={{ fontWeight: 600 }}>Bebi Gym</div>
          <button className="close-btn" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="drawer-links">
          <button onClick={() => { setView("dashboard"); setMobileMenuOpen(false); }}>🏠 Dashboard</button>
          <button onClick={() => { setView("log"); setMobileMenuOpen(false); }}>📓 Logga pass</button>
          <button onClick={() => { setView("program"); setMobileMenuOpen(false); }}>📅 Program</button>
          <button onClick={() => { setView("boss"); setMobileMenuOpen(false); }}>🐲 Boss Raid</button>
          <button onClick={() => { setView("lift"); setMobileMenuOpen(false); }}>📈 Lift Tools</button>
          <button onClick={() => { setView("pr"); setMobileMenuOpen(false); }}>🏆 PR</button>
          <button onClick={() => { setView("ach"); setMobileMenuOpen(false); }}>🏅 Achievements</button>
          <button onClick={() => { setView("profile"); setMobileMenuOpen(false); }}>👤 Profil</button>
        </div>
      </div>

      {/* MAIN */}
      <main className="main">
        <div className="main-header">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>

          <div style={{ flex: 1 }}>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">Varje set du loggar räknas — PR, XP, muskelkarta och boss-raid update automatiskt.</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ alignSelf: "center", fontSize: 13 }}>{xp} XP • Tier {battleTier}</div>
            <button className="btn-pink" onClick={() => setShowModal(true)}>+ Logga set</button>
          </div>
        </div>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              {/* XP card */}
              <div className="card small">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontWeight: 600 }}>XP & Battle Tier</div><div className="small">Grinda XP med tunga set</div></div>
                  <div style={{ textAlign: "right" }}>{xp} XP<br/>Tier {battleTier}</div>
                </div>
                <div className="progress-wrap" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xp / nextTierXp) * 100))}%` }} />
                </div>
                <div className="small" style={{ marginTop: 6 }}>Nästa tier: {nextTierXp} XP</div>
              </div>

              {/* Muscle map */}
              <MuscleMap muscleStats={muscleStats} />

              {/* Comparison */}
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

        {/* LOGGA PASS — GymLogger Pro style */}
        {view === "log" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Logga set</h3>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={searchRef}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Sök övning (snabb sök)"
                  style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.4)", background: "transparent", color: "inherit" }}
                />
                <button className={`btn ${onlyFavorites ? "active" : ""}`} onClick={() => setOnlyFavorites((v) => !v)} title="Endast favoriter">⭐</button>
                <button className="btn" onClick={() => { setShowModal(true); }}>Snabb-logga</button>
              </div>
            </div>

            {/* Shortcuts: favorites + recent */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {lastUsed.map((id) => {
                const ex = EXERCISES.find((e) => e.id === id);
                if (!ex) return null;
                return <button key={id} className="chip" onClick={() => setShowModal(true) /* open modal prefilled could be added */ }>{ex.name}</button>;
              })}
              {favorites.slice(0, 6).map((id) => {
                const ex = EXERCISES.find((e) => e.id === id);
                if (!ex) return null;
                return <div key={id} className="chip favorite">{ex.name}</div>;
              })}
            </div>

            {/* Exercise search results */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 8 }}>Sökresultat</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                {filteredExercises.map((e) => {
                  const pr = prMap[e.id]?.best1RM || 0;
                  const isFav = favorites.includes(e.id);
                  return (
                    <div key={e.id} className="log-row">
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
                        <div className="small" style={{ opacity: 0.8 }}>{e.muscleGroup}</div>
                        <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{pr ? `PR ≈ ${pr} kg` : ""}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <button className="btn small" onClick={() => { setShowModal(true); /* optionally prefill modal with e.id */ }}>
                          Logga
                        </button>
                        <button className={`btn small ${isFav ? "active" : ""}`} onClick={() => toggleFavorite(e.id)}>{isFav ? "★" : "☆"}</button>
                        <button className="btn small" onClick={() => {
                          // quick-add template (1x5 at 60% of PR if exists)
                          const guessWeight = pr ? Math.round(pr * 0.6) : 10;
                          handleSaveSet({ exerciseId: e.id, weight: guessWeight, reps: 5 });
                        }}>Quick +</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History list */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, marginBottom: 8 }}>Historia (senaste)</div>
              <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
                {logs.slice(0, 40).map((l) => {
                  const ex = EXERCISES.find((x) => x.id === l.exerciseId);
                  return (
                    <li key={l.id} className="history-row">
                      <div>
                        <div style={{ fontSize: 13 }}>{ex?.name || l.exerciseId} — {l.weight} kg × {l.reps}</div>
                        <div className="small" style={{ color: "#9ca3af" }}>{l.date} • 1RM ≈ {calc1RM(l.weight, l.reps)} kg</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn small" onClick={() => {
                          if (confirm("Vill du återställa detta set (kopiera till modal)?")) {
                            setShowModal(true);
                            // Could prefill the modal using state — omitted for brevity
                          }
                        }}>Edit</button>
                        <button className="btn small" onClick={() => handleDeleteLog(l.id)}>🗑️</button>
                      </div>
                    </li>
                  );
                })}
                {!logs.length && <li className="small">Inga loggar ännu — börja logga!</li>}
              </ul>
            </div>
          </div>
        )}

        {/* PROGRAM */}
        {view === "program" && (
          <ProgramRunner programs={PROGRAMS} activeProgramId={activeProgramId} dayIndex={dayIndex} onSelectProgram={handleSelectProgram} onNextDay={handleNextDay} logs={logs} />
        )}

        {/* BOSS */}
        {view === "boss" && (
          <div className="row" style={{ gap: 10 }}>
            <div className="col" style={{ flex: 2 }}>
              <BossArena bosses={bosses} />
            </div>
            <div className="col" style={{ flex: 1 }}>
              <div className="card">
                <h4>Hur funkar raid?</h4>
                <p className="small">PR ger extra skada. Logga tunga set för att slå ner bossarna automatiskt.</p>
              </div>
            </div>
          </div>
        )}

        {/* LIFT TOOLS */}
        {view === "lift" && (
          <div className="card">
            <LiftTools logs={logs} bodyStats={bodyStats} onAddManual={(entry) => { setLogs((p) => [entry, ...p]); showToastMsg("Lyft tillagt", "Manuell lyft registrerad"); }} />
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

        {/* PR */}
        {view === "pr" && <PRList prMap={prMap} />}

        {/* PROFILE */}
        {view === "profile" && (
          <ProfileView profile={profile} setProfile={setProfile} bodyStats={bodyStats}
            onAddMeasurement={(key, entry) => setBodyStats((p) => ({ ...p, [key]: [...(p[key]||[]), entry] }))}
            onDeleteMeasurement={(key, id) => setBodyStats((p) => ({ ...p, [key]: (p[key]||[]).filter(m => m.id !== id) }))} />
        )}

      </main>

      <LogModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveSet} lastSet={lastSet} />

      <style jsx>{`
        /* lightweight styles that match the app look - ideally move to index.css */
        .app-shell { display: flex; min-height: 100vh; background: #071024; color: #e6eef8; }
        .sidebar { width: 240px; padding: 16px; border-right: 1px solid rgba(255,255,255,0.03); display: flex; flex-direction: column; gap: 12px; }
        .sidebar-header { display:flex; gap:10px; align-items:center; }
        .sidebar-title { font-weight:700; }
        .sidebar-sub { font-size:12px; color:#9ca3af; }
        .sidebar-nav { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
        .sidebar-link { display:flex; gap:8px; align-items:center; padding:8px 10px; border-radius:8px; background: transparent; border: none; color:inherit; cursor:pointer; text-align:left; }
        .sidebar-link.active { background: linear-gradient(90deg, rgba(236,72,153,0.12), rgba(236,72,153,0.06)); }
        .main { flex:1; padding: 18px; overflow:auto; }
        .main-header { display:flex; gap:12px; align-items:center; margin-bottom:12px; }
        .main-title { font-size:20px; font-weight:700; }
        .main-sub { color:#9ca3af; font-size:13px; }
        .row { display:flex; gap:12px; }
        .col { display:flex; flex-direction:column; }
        .card { background: linear-gradient(180deg, rgba(8,16,30,0.9), rgba(6,9,18,0.85)); padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,0.03); }
        .card.small { padding:10px; }
        .small { font-size:12px; color:#9ca3af; }
        .progress-wrap { height:8px; background: rgba(255,255,255,0.03); border-radius:6px; overflow:hidden; }
        .progress-fill { height:100%; background: linear-gradient(90deg,#ec4899,#f97316); border-radius:6px; }
        .btn { padding:6px 10px; border-radius:8px; background: rgba(255,255,255,0.03); border:none; color:inherit; cursor:pointer; }
        .btn.small { padding:4px 6px; font-size:12px; }
        .btn-pink { background: linear-gradient(90deg,#ec4899,#f97316); color:white; padding:8px 12px; border-radius:10px; border:none; }
        .btn.active { background: rgba(236,72,153,0.18); }
        .chip { background: rgba(255,255,255,0.03); padding:6px 10px; border-radius:999px; font-size:13px; cursor:pointer; }
        .chip.favorite { background: linear-gradient(90deg, rgba(236,72,153,0.12), rgba(236,72,153,0.04)); }
        .log-row { padding:10px; border-radius:10px; background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.02); }
        .history-row { display:flex; justify-content:space-between; padding:8px; border-radius:8px; margin-bottom:6px; background: rgba(255,255,255,0.01); }
        .mobile-drawer { position:fixed; left:0; top:0; bottom:0; width:260px; transform:translateX(-110%); transition:transform .22s; background:#041025; padding:12px; z-index:1200; }
        .mobile-drawer.open { transform:translateX(0); }
        .drawer-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .drawer-links button { display:block; width:100%; padding:10px; margin-bottom:6px; border-radius:8px; background:transparent; color:inherit; border:none; text-align:left; }
        .hamburger-btn { display:none; background:transparent; border:none; color:inherit; font-size:20px; cursor:pointer; }
        @media (max-width: 900px) {
          .sidebar { display:none; }
          .hamburger-btn { display:inline-block; }
          .main { padding:12px; }
          .row { flex-direction:column; }
        }
      `}</style>
    </div>
  );
}
