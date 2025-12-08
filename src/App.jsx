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

// ------------------ KONSTANTER ------------------

const BATTLE_REWARDS = [
  {
    id: "r_50xp",
    xpRequired: 50,
    label: "Warmup Queen",
    desc: "Första 50 XP insamlade",
    emoji: "💖",
  },
  {
    id: "r_200xp",
    xpRequired: 200,
    label: "Tier 2 Gift",
    desc: "Du har grindat till minst tier 2",
    emoji: "🎁",
  },
  {
    id: "r_500xp",
    xpRequired: 500,
    label: "Boss Slayer",
    desc: "Massor av XP – du är farlig nu",
    emoji: "🐲",
  },
  {
    id: "r_1000xp",
    xpRequired: 1000,
    label: "Legendary Bebi",
    desc: "När du nått 1000+ XP",
    emoji: "🌟",
  },
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
  let dmgBase = oneRm;
  if (isPR) dmgBase *= 1.5;

  if (entry.exerciseId === "bench") {
    copy.chest.currentHP = Math.max(
      0,
      copy.chest.currentHP - Math.round(dmgBase * 0.6)
    );
  } else if (
    entry.exerciseId === "hipthrust" ||
    entry.exerciseId === "legpress" ||
    entry.exerciseId === "squat"
  ) {
    copy.glute.currentHP = Math.max(
      0,
      copy.glute.currentHP - Math.round(dmgBase * 0.7)
    );
  } else if (
    entry.exerciseId === "row" ||
    entry.exerciseId === "deadlift" ||
    entry.exerciseId === "latpulldown"
  ) {
    copy.back.currentHP = Math.max(
      0,
      copy.back.currentHP - Math.round(dmgBase * 0.65)
    );
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
    prMap = {
      ...prMap,
      [entry.exerciseId]: { best1RM, history },
    };
    return isPR;
  }

  const chronological = [...logs].reverse();
  chronological.forEach((entry) => {
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
  MUSCLES.forEach((m) => {
    stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 };
  });

  if (!logs || logs.length === 0) return stats;

  const bw = profile?.weight || profile?.weight_kg || 60;

  // Bästa 1RM per övning
  const best = {};
  logs.forEach((l) => {
    if (!l.weight || !l.reps) return;
    const oneRm = calc1RM(l.weight, l.reps);
    if (!best[l.exerciseId] || oneRm > best[l.exerciseId]) {
      best[l.exerciseId] = oneRm;
    }
  });

  // Mappa 1RM => muskler
  Object.entries(best).forEach(([exId, oneRm]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std) return;

    const advancedTarget = bw * std.coeff;
    if (!advancedTarget) return;

    const ratio = oneRm / advancedTarget;

    std.muscles.forEach((mId) => {
      if (!stats[mId]) return;
      stats[mId].score += ratio;
    });
  });

  // Score → nivå + %
  Object.keys(stats).forEach((mId) => {
    const val = stats[mId].score;

    let level = "Beginner";
    if (val >= 0.55) level = "Novice";
    if (val >= 0.75) level = "Intermediate";
    if (val >= 1.0) level = "Advanced";
    if (val >= 1.25) level = "Elite";

    const pct = Math.min(150, Math.max(0, Math.round((val / 1.25) * 100)));

    stats[mId] = {
      score: val,
      levelKey: level,
      percent: pct,
    };
  });

  return stats;
}

// ------------------ HUVUDKOMPONENT ------------------

export default function App() {
  const [view, setView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loggar – persisteras
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("bebi_logs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("bebi_logs", JSON.stringify(logs));
  }, [logs]);

  // Profil – persisteras
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

  useEffect(() => {
    localStorage.setItem("bebi_profile", JSON.stringify(profile));
  }, [profile]);

  // Kroppsmått – persisteras
  const [bodyStats, setBodyStats] = useState(() => {
    const saved = localStorage.getItem("bebi_bodyStats");
    return saved
      ? JSON.parse(saved)
      : {
          waist: [],
          hips: [],
          thigh: [],
          glutes: [],
          chest: [],
          arm: [],
        };
  });

  useEffect(() => {
    localStorage.setItem("bebi_bodyStats", JSON.stringify(bodyStats));
  }, [bodyStats]);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSet, setLastSet] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0].id);
  const [dayIndex, setDayIndex] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);

  const { mood, bumpMood } = useBebiMood();

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 2600);
  }

  // Recompute XP, BattlePass, Bossar, PRs från loggar
  const { xp, battleTier, bosses, prMap } = useMemo(
    () => recomputeFromLogs(logs, profile),
    [logs, profile.weight]
  );

  // Muskelkarta + jämförelsedata
  const muscleStats = useMemo(
    () => computeMuscleStatsFromLogs(logs, profile),
    [logs, profile.weight]
  );
  const comparisonData = useMemo(
    () => buildComparisonChartData(muscleStats),
    [muscleStats]
  );

  const unlockedAchievements = useMemo(() => {
    const arr = [];

    if (logs.length >= 1)
     arr.push({
        id: "ach_first",
        title: "Första passet! 💖",
        desc: "Du loggade ditt första pass.",
        emoji: "🎉",
      });

    if (logs.length >= 5)
      arr.push({
        id: "ach_5_logs",
        title: "Consistency Bebi",
        desc: "Minst 5 loggade pass.",
        emoji: "📅",
      });

    const totalSets = logs.length;
    if (totalSets >= 20)
      arr.push({
        id: "ach_20_sets",
        title: "Set Machine",
        desc: "20+ loggade set.",
        emoji: "🛠️",
      });

    const glute = muscleStats.glutes;
    if (glute && glute.levelKey === "Elite")
      arr.push({
        id: "ach_glute_elite",
        title: "Glute Queen",
        desc: "Elite på glutes – Glute Dragon darrar.",
        emoji: "🍑",
      });

    const anyPR = Object.values(prMap).some((p) => p.best1RM > 0);
    if (anyPR)
      arr.push({
        id: "ach_pr_any",
        title: "PR Era",
        desc: "Minst ett registrerat PR.",
        emoji: "🔥",
      });

    const bossesArray = Object.values(bosses);
    const totalMax = bossesArray.reduce((s, b) => s + b.maxHP, 0);
    const totalCurrent = bossesArray.reduce((s, b) => s + b.currentHP, 0);
    const totalPct = totalMax ? Math.round(100 * (1 - totalCurrent / totalMax)) : 0;
    if (totalPct >= 50)
      arr.push({
        id: "ach_raid_50",
        title: "Raid 50%",
        desc: "Minst 50% av all boss-HP nedslagen.",
        emoji: "🐉",
      });

    if (battleTier >= 3)
      arr.push({
        id: "ach_battle_tier3",
        title: "Battle Pass Tier 3",
        desc: "Nått minst tier 3 i Battle Pass.",
        emoji: "🎟️",
      });

    const eliteMuscles = Object.values(muscleStats).filter(
      (m) => m.levelKey === "Elite"
    ).length;
    if (eliteMuscles >= 2)
      arr.push({
        id: "ach_multi_elite",
        title: "Multi-Elite Queen",
        desc: "Minst två muskelgrupper på Elite-nivå.",
        emoji: "👑",
      });

    return arr;
  }, [logs, muscleStats, prMap, bosses, battleTier]);

  const nextTierXp = battleTier * 200;

  function handleSaveSet(entry) {
    const today = new Date().toISOString().slice(0, 10);
    const finalEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      date: entry.date || today,
    };

    // PR-check innan vi uppdaterar loggar
    const previousForExercise = logs.filter(
      (l) => l.exerciseId === finalEntry.exerciseId
    );
    const prevBest = previousForExercise.length
      ? Math.max(...previousForExercise.map((l) => calc1RM(l.weight, l.reps)))
      : 0;
    const this1RM = calc1RM(finalEntry.weight, finalEntry.reps);
    const isPR = this1RM > prevBest;

    setLogs((prev) => [finalEntry, ...prev]);
    setLastSet(finalEntry);

    if (isPR) {
      bumpMood("pr");
      showToastMsg("OMG BEBI!! NYTT PR!!! 🔥💖", "Du är helt magisk, jag svär.");
    } else if (
      lastSet &&
      finalEntry.exerciseId === lastSet.exerciseId &&
      finalEntry.weight >= lastSet.weight * 1.1
    ) {
      bumpMood("heavy_set");
      showToastMsg("Starkiii set! 💪", "Du tog i extra hårt nyss!");
    } else {
      showToastMsg("Set sparat 💪", "Bebi, du blev precis lite starkare.");
    }

    setShowModal(false);
  }

  function handleDeleteLog(id) {
    const newLogs = logs.filter((l) => l.id !== id);
    setLogs(newLogs);
    showToastMsg(
      "Logg borttagen 🗑️",
      "Statistik, PR, boss-HP & muskelkarta har uppdaterats."
    );
  }

  function handleSelectProgram(id) {
    setActiveProgramId(id);
    setDayIndex(0);
    bumpMood("start_program");
  }

  function handleNextDay() {
    const prog =
      PROGRAMS.find((p) => p.id === activeProgramId) || PROGRAMS[0];
    if (!prog) return;
    const next = (dayIndex + 1) % prog.days.length;
    setDayIndex(next);
  }

  function handleClaimReward(id) {
    if (claimedRewards.includes(id)) return;
    setClaimedRewards((prev) => [...prev, id]);
    bumpMood("achievement");
    const r = BATTLE_REWARDS.find((x) => x.id === id);
    showToastMsg("Reward klaimad 🎁", r ? r.label : "Du tog en battle pass-belöning!");
  }

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      {/* SIDEBAR (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-title">Bebi Gym v17</div>
            <div className="sidebar-sub">För Maria Kristina 💗</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-link ${view === "dashboard" ? "active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-link ${view === "log" ? "active" : ""}`}
            onClick={() => setView("log")}
          >
            <span className="icon">📓</span>
            <span>Log</span>
          </button>

          <button
            className={`sidebar-link ${view === "program" ? "active" : ""}`}
            onClick={() => setView("program")}
          >
            <span className="icon">📅</span>
            <span>Program</span>
          </button>

          <button
            className={`sidebar-link ${view === "boss" ? "active" : ""}`}
            onClick={() => setView("boss")}
          >
            <span className="icon">🐲</span>
            <span>Boss</span>
          </button>

          <button
            className={`sidebar-link ${view === "ach" ? "active" : ""}`}
            onClick={() => setView("ach")}
          >
            <span className="icon">🏅</span>
            <span>Achievements</span>
          </button>

          <button
            className={`sidebar-link ${view === "pr" ? "active" : ""}`}
            onClick={() => setView("pr")}
          >
            <span className="icon">🏆</span>
            <span>PR</span>
          </button>

          <button
            className={`sidebar-link ${view === "profile" ? "active" : ""}`}
            onClick={() => setView("profile")}
          >
            <span className="icon">👤</span>
            <span>Profil</span>
          </button>

          <button
            className={`sidebar-link ${view === "lift" ? "active" : ""}`}
            onClick={() => setView("lift")}
          >
            <span className="icon">📈</span>
            <span>LiftTools</span>
          </button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 11, color: "#9ca3af" }}>
          <div>Bebi: {profile.name}</div>
          <div>
            {profile.height} cm • {profile.weight} kg • {profile.age} år
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <span style={{ fontWeight: 600 }}>Bebi Gym 💗</span>
          <button
            className="close-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="drawer-links">
          <button
            onClick={() => {
              setView("dashboard");
              setMobileMenuOpen(false);
            }}
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => {
              setView("log");
              setMobileMenuOpen(false);
            }}
          >
            📓 Logga pass
          </button>
          <button
            onClick={() => {
              setView("program");
              setMobileMenuOpen(false);
            }}
          >
            📅 Program
          </button>
          <button
            onClick={() => {
              setView("boss");
              setMobileMenuOpen(false);
            }}
          >
            🐲 Boss Raid
          </button>
          <button
            onClick={() => {
              setView("ach");
              setMobileMenuOpen(false);
            }}
          >
            🏅 Achievements
          </button>
          <button
            onClick={() => {
              setView("pr");
              setMobileMenuOpen(false);
            }}
          >
            🏆 PR-lista
          </button>
          <button
            onClick={() => {
              setView("profile");
              setMobileMenuOpen(false);
            }}
          >
            👤 Profil
          </button>
          <button
            onClick={() => {
              setView("lift");
              setMobileMenuOpen(false);
            }}
          >
            📈 Lift Tools
          </button>
        </div>
      </div>

      {/* MAIN */}
      <main className="main">
        <div className="main-header">
          {/* Hamburger på mobil */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>

          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">
              Idag är en perfekt dag att bli starkare. Varje set du gör skadar
              bossar, ger XP och bygger din PR-historia.
            </div>
          </div>
          <button className="btn-pink" onClick={() => setShowModal(true)}>
            + Logga set
          </button>
        </div>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card small">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      XP & Level
                    </div>
                    <div className="small">
                      Du får XP för varje tungt set
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <div>{xp} XP</div>
                    <div>Tier {battleTier}</div>
                  </div>
                </div>
                <div className="progress-wrap" style={{ marginTop: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((xp / nextTierXp) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="small" style={{ marginTop: 4 }}>
                  Nästa tier vid {nextTierXp} XP
                </div>
              </div>

              <MuscleMap muscleStats={muscleStats} />

              <div style={{ marginTop: 10 }}>
                <MuscleComparison data={comparisonData} />
              </div>
            </div>

            <div className="col" style={{ flex: 1, gap: 10 }}>
              <BossArena bosses={bosses} />
              <BattlePass
                tier={battleTier}
                xp={xp}
                nextTierXp={nextTierXp}
                rewards={BATTLE_REWARDS}
                claimedRewards={claimedRewards}
                onClaimReward={handleClaimReward}
              />
            </div>
          </div>
        )}

        {/* LOGGAR */}
        {view === "log" && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Loggade set 📓</h3>
            {!logs.length && (
              <p className="small">
                Inga set än. Klicka på “Logga set” för att lägga till ditt första
                pass, Bebi 💗
              </p>
            )}
            <ul
              style={{
                paddingLeft: 0,
                listStyle: "none",
                margin: 0,
                marginTop: 6,
              }}
            >
              {logs.map((l) => {
                const ex = EXERCISES.find((e) => e.id === l.exerciseId);
                return (
                  <li
                    key={l.id}
                    style={{
                      fontSize: 12,
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "4px 6px",
                      borderRadius: 8,
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(148,163,184,0.5)",
                    }}
                  >
                    <div>
                      {l.date} • {ex?.name || l.exerciseId} • {l.weight} kg ×{" "}
                      {l.reps} reps (1RM ca {calc1RM(l.weight, l.reps)} kg)
                    </div>
                    <button
                      className="btn"
                      style={{ fontSize: 11, padding: "3px 7px" }}
                      onClick={() => handleDeleteLog(l.id)}
                    >
                      🗑️
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* PROGRAM */}
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

        {/* BOSS RAID */}
        {view === "boss" && (
          <div className="row" style={{ gap: 10 }}>
            <div className="col" style={{ flex: 2, gap: 10 }}>
              <BossArena bosses={bosses} />
            </div>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Hur funkar raid? 🐉</h3>
                <p className="small">
                  Chest Beast tar mest skada av bänkpress. Glute Dragon hatar
                  Hip Thrust / Benpress / Knäböj. Row Titan blir rasande av
                  tunga roddar & marklyft.
                </p>
                <p className="small">
                  PR ger extra damage och triggar Rage-avatarläge. Allt sker
                  automatiskt när du loggar set.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LIFT TOOLS */}
        {view === "lift" && (
          <div className="card" style={{ padding: 20 }}>
            <div className="main-header" style={{ marginBottom: 10 }}>
              <div>
                <div className="main-title">Lift Tools 🛠️</div>
                <div className="main-sub">
                  1RM, volym, grafer & kroppsmått – allt på ett ställe.
                </div>
              </div>
            </div>
            <LiftTools
              logs={logs}
              bodyStats={bodyStats}
              onAddManual={(entry) => {
                setLogs((prev) => [entry, ...prev]);
                showToastMsg(
                  "Lyft tillagt ✨",
                  "Ditt tidigare lyft är nu sparat i historiken."
                );
              }}
            />
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {view === "ach" && <Achievements unlocked={unlockedAchievements} />}

        {/* PR-LISTA */}
        {view === "pr" && <PRList prMap={prMap} />}

        {/* PROFIL */}
        {view === "profile" && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            bodyStats={bodyStats}
            onAddMeasurement={(key, entry) => {
              setBodyStats((prev) => {
                const arr = prev[key] || [];
                return { ...prev, [key]: [...arr, entry] };
              });
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
