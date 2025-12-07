import React, { useState, useMemo } from 'react'
import BebiAvatar from './components/BebiAvatar.jsx'
import ProfileCard from './components/ProfileCard.jsx'
import Toast from './components/Toast.jsx'
import LogModal from './components/LogModal.jsx'
import MuscleMap from './components/MuscleMap.jsx'
import BossArena from './components/BossArena.jsx'
import Achievements from './components/Achievements.jsx'
import BattlePass from './components/BattlePass.jsx'
import ProgramRunner from './components/ProgramRunner.jsx'
import PRList from './components/PRList.jsx'
import MuscleComparison from './components/MuscleComparison.jsx'
import { buildComparisonChartData } from './utils/comparisonData.js'
import { useBebiMood } from './hooks/useBebiMood.js'
import { EXERCISES } from './data/exercises'
import { MUSCLES } from './data/muscles'
import { STRENGTH_STANDARDS } from './data/strengthStandards'
import { PROGRAMS } from './data/programs'
import { initialBosses } from './data/bosses'

const BATTLE_REWARDS = [
  {
    id: 'r_50xp',
    xpRequired: 50,
    label: 'Warmup Queen',
    desc: 'Första 50 XP insamlade',
    emoji: '💖',
  },
  {
    id: 'r_200xp',
    xpRequired: 200,
    label: 'Tier 2 Gift',
    desc: 'Du har grindat till minst tier 2',
    emoji: '🎁',
  },
  {
    id: 'r_500xp',
    xpRequired: 500,
    label: 'Boss Slayer',
    desc: 'Massor av XP – du är farlig nu',
    emoji: '🐲',
  },
  {
    id: 'r_1000xp',
    xpRequired: 1000,
    label: 'Legendary Bebi',
    desc: 'När du nått 1000+ XP',
    emoji: '🌟',
  },
]

function calc1RM(weight, reps) {
  if (!weight || !reps) return 0
  return Math.round(weight * (1 + reps / 30))
}

function cloneBosses(b) {
  return {
    chest: { ...b.chest },
    glute: { ...b.glute },
    back: { ...b.back },
  }
}

function applyBossDamageToState(stateBosses, entry, oneRm, isPR) {
  const copy = cloneBosses(stateBosses)
  let dmgBase = oneRm
  if (isPR) dmgBase *= 1.5

  if (entry.exerciseId === 'bench') {
    copy.chest.currentHP = Math.max(0, copy.chest.currentHP - Math.round(dmgBase * 0.6))
  } else if (
    entry.exerciseId === 'hipthrust' ||
    entry.exerciseId === 'legpress' ||
    entry.exerciseId === 'squat'
  ) {
    copy.glute.currentHP = Math.max(0, copy.glute.currentHP - Math.round(dmgBase * 0.7))
  } else if (
    entry.exerciseId === 'row' ||
    entry.exerciseId === 'deadlift' ||
    entry.exerciseId === 'latpulldown'
  ) {
    copy.back.currentHP = Math.max(0, copy.back.currentHP - Math.round(dmgBase * 0.65))
  }
  return copy
}

function recomputeFromLogs(logs, profile) {
  let xp = 0
  let battleTier = 1
  let bosses = initialBosses()
  let prMap = {}

  function updatePRLocal(entry, new1RM) {
    const current = prMap[entry.exerciseId] || { best1RM: 0, history: [] }
    const isPR = new1RM > (current.best1RM || 0)
    const history = [...current.history, { ...entry, oneRm: new1RM }]
    const best1RM = isPR ? new1RM : current.best1RM
    prMap = {
      ...prMap,
      [entry.exerciseId]: { best1RM, history },
    }
    return isPR
  }

  const chronological = [...logs].reverse()
  chronological.forEach((entry) => {
    const oneRm = calc1RM(entry.weight, entry.reps)
    const gainedXp = Math.max(5, Math.round(oneRm / 10))
    xp += gainedXp
    battleTier = 1 + Math.floor(xp / 200)
    const currentPR = prMap[entry.exerciseId]?.best1RM || 0
    const isPR = oneRm > currentPR
    updatePRLocal(entry, oneRm)
    bosses = applyBossDamageToState(bosses, entry, oneRm, isPR)
  })

  return { xp, battleTier, bosses, prMap }
}
function computeMuscleStatsFromLogs(logs, profile) {
  const stats = {};

  // Initiera musklerna
  MUSCLES.forEach((m) => {
    stats[m.id] = { score: 0, levelKey: "Beginner", percent: 0 };
  });

  if (!logs || logs.length === 0) return stats;

  const bw = profile.weight || 60;

  // Bästa 1RM per övning
  const best = {};
  logs.forEach((l) => {
    const oneRm = calc1RM(l.weight, l.reps);
    if (!best[l.exerciseId] || oneRm > best[l.exerciseId]) {
      best[l.exerciseId] = oneRm;
    }
  });

  Object.entries(best).forEach(([exId, oneRm]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std) return;

    const advancedTarget = bw * std.coeff;

    if (advancedTarget === 0) return;

    const ratio = oneRm / advancedTarget;

    std.muscles.forEach((mId) => {
      if (!stats[mId]) return;
      stats[mId].score += ratio;
    });
  });

  Object.keys(stats).forEach((mId) => {
    const val = stats[mId].score;

    let level = "Beginner";
    if (val >= 0.55) level = "Novice";
    if (val >= 0.75) level = "Intermediate";
    if (val >= 1.0) level = "Advanced";
    if (val >= 1.25) level = "Elite";

    // Percent towards Elite
    const pct = Math.round((val / 1.25) * 100);

    stats[mId] = {
      score: val,
      levelKey: level,
      percent: Math.min(150, Math.max(0, pct)),
    };
  });

  return stats;
}
function computeMuscleStatsFromLogs_v2(logs, profile) {

  const bw = profile?.weight || profile?.weight_kg || 60;

  // 1) Räkna ut bästa 1RM per övning baserat på loggarna
  const bestByExercise = {};

  logs.forEach((entry) => {
    const exId = entry.exerciseId;
    if (!exId || !entry.weight || !entry.reps) return;

    const oneRm = calc1RM(entry.weight, entry.reps);
    if (!bestByExercise[exId] || oneRm > bestByExercise[exId]) {
      bestByExercise[exId] = oneRm;
    }
  });

  // 2) Mappa bästa 1RM → muskler via STRENGTH_STANDARDS
  Object.entries(bestByExercise).forEach(([exId, best1RM]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std) return; // övning ej mappad => ingen effekt

    const target = bw * std.coeff;
    if (!target || target <= 0) return;

    const ratio = best1RM / target;

    std.muscles.forEach((mId) => {
      if (!stats[mId]) return;
      stats[mId].score += ratio;
    });
  });

  // 3) Konvertera score → nivå + procent (StrengthLevel-style)
  Object.keys(stats).forEach((mId) => {
    const score = stats[mId].score;

    let levelKey = "Beginner";
    if (score >= 0.55) levelKey = "Novice";
    if (score >= 0.75) levelKey = "Intermediate";
    if (score >= 1.0) levelKey = "Advanced";
    if (score >= 1.25) levelKey = "Elite";

    const percent = Math.min(150, Math.round((score / 1.25) * 100));

    stats[mId] = {
      ...stats[mId],
      levelKey,
      percent,
    };
  });

  return stats;
}
export default function App() {
  const [view, setView] = useState('dashboard')
  const [logs, setLogs] = useState([])
  const [bosses, setBosses] = useState(initialBosses)
  const [xp, setXp] = useState(0)
  const [battleTier, setBattleTier] = useState(1)
  const [toast, setToast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [lastSet, setLastSet] = useState(null)
  const [prMap, setPrMap] = useState({})
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0].id)
  const [dayIndex, setDayIndex] = useState(0)
  const [claimedRewards, setClaimedRewards] = useState([])

  const [profile, setProfile] = useState({
  name: "Maria Kristina",
  nick: "Bebi",
  age: 21,
  height: 170,
  weight: 68,
});

  const { mood, bumpMood } = useBebiMood()

  function showToastMsg(title, subtitle) {
    setToast({ title, subtitle })
    setTimeout(() => setToast(null), 2600)
  }

  function updatePR(entry, new1RM) {
    setPrMap((prev) => {
      const current = prev[entry.exerciseId] || { best1RM: 0, history: [] }
      const isPR = new1RM > (current.best1RM || 0)
      const history = [...current.history, { ...entry, oneRm: new1RM }]
      const best1RM = isPR ? new1RM : current.best1RM
      return {
        ...prev,
        [entry.exerciseId]: { best1RM, history },
      }
    })
  }

  function applyBossDamage(entry, oneRm, isPR) {
    setBosses((prev) => applyBossDamageToState(prev, entry, oneRm, isPR))
  }

  function handleSaveSet(entry) {
    const oneRm = calc1RM(entry.weight, entry.reps)

    setLogs((prev) => [entry, ...prev])
    setLastSet(entry)

    const gainedXp = Math.max(5, Math.round(oneRm / 10))
    const totalXp = xp + gainedXp
    setXp(totalXp)

    const newTier = 1 + Math.floor(totalXp / 200)
    if (newTier !== battleTier) {
      setBattleTier(newTier)
      showToastMsg(
        'Battle Pass Tier Up 🎟️',
        `Starkiii! Du nådde tier ${newTier} i Battle Pass 💖`
      )
    }

    const currentPR = prMap[entry.exerciseId]?.best1RM || 0
    const isPR = oneRm > currentPR

    updatePR(entry, new1RM = oneRm)
    applyBossDamage(entry, oneRm, isPR)

    if (isPR) {
      bumpMood('pr')
      showToastMsg('OMG BEBI!! NYTT PR!!! 🔥💖', 'Du är helt magisk, jag svär.')
    } else if (entry.weight >= (lastSet?.weight || 0) * 1.1) {
      bumpMood('heavy_set')
      showToastMsg('Starkiii set! 💪', 'Du tog i extra hårt nyss!')
    } else {
      showToastMsg('Set sparat 💪', 'Bebi, du blev precis lite starkare.')
    }

    setShowModal(false)
  }

  function handleDeleteLog(id) {
    const newLogs = logs.filter((l) => l.id !== id)
    const recalced = recomputeFromLogs(newLogs, profile)
    setLogs(newLogs)
    setXp(recalced.xp)
    setBattleTier(recalced.battleTier)
    setBosses(recalced.bosses)
    setPrMap(recalced.prMap)
    showToastMsg('Logg borttagen 🗑️', 'Statistik, PR & boss-HP har uppdaterats.')
  }


 function computeMuscleStats(prMap, profile) {
  if (!profile || !prMap) return {};

  const bw = profile.weight || 60;

  const stats = {};
  MUSCLES.forEach(m => {
    stats[m.id] = { percent: 0, levelKey: "Beginner", score: 0 };
  });

  Object.entries(prMap).forEach(([exId, data]) => {
    const std = STRENGTH_STANDARDS[exId];
    if (!std || !data?.best1RM) return;

    const target = bw * std.coeff;
    if (target <= 0) return;

    const ratio = data.best1RM / target;

    std.muscles.forEach(muscleId => {
      if (stats[muscleId]) {
        stats[muscleId].score += ratio;
      }
    });
  });

  Object.keys(stats).forEach(mId => {
    const score = stats[mId].score;

    let level = "Beginner";
    if (score >= 0.55) level = "Novice";
    if (score >= 0.75) level = "Intermediate";
    if (score >= 1.0) level = "Advanced";
    if (score >= 1.25) level = "Elite";

    const percent = Math.min(150, Math.round((score / 1.25) * 100));

    stats[mId] = { score, percent, levelKey: level };
  });

  return stats;
}
  function computeMuscleStats_v15(prMap, profile) {
    try {
      const stats = {}
      // init all muscles as Beginner 0%
      MUSCLES.forEach((m) => {
        stats[m.id] = { percent: 0, levelKey: 'Beginner', score: 0 }
      })

      // no PRs yet => keep everything at 0 / Beginner
      if (!prMap || typeof prMap !== 'object') {
        return stats
      }

      // accumulate strength ratios per exercise -> muscles
      Object.entries(prMap).forEach(([exId, data]) => {
        const standard = STRENGTH_STANDARDS[exId]
        if (!standard || !data || !data.best1RM) return
        const bw = profile?.weight || profile?.weight_kg || 60
        const target = bw * standard.coeff
        if (!target || target <= 0) return
        const ratio = data.best1RM / target
        standard.muscles.forEach((mId) => {
          if (!stats[mId]) return
          stats[mId].score += ratio
        })
      })

      // convert ratios -> levels & percent (StrengthLevel-style)
      Object.keys(stats).forEach((mId) => {
        const s = stats[mId]
        const score = s.score || 0
        let levelKey = 'Beginner'
        if (score >= 0.55) levelKey = 'Novice'
        if (score >= 0.75) levelKey = 'Intermediate'
        if (score >= 1.0) levelKey = 'Advanced'
        if (score >= 1.25) levelKey = 'Elite'
        const percent = Math.min(150, Math.round((score / 1.25) * 100))
        stats[mId] = { ...s, levelKey, percent }
      })

      return stats
    } catch (e) {
      console.error('computeMuscleStats v15 error', e)
      const stats = {}
      MUSCLES.forEach((m) => {
        stats[m.id] = { percent: 0, levelKey: 'Beginner', score: 0 }
      })
      return stats
    }
  }

  // === FIXED v18.1 ===
// Muskelstats bygger direkt på loggar + profil, inte på PRMap
const muscleStats = useMemo(() => {
  return computeMuscleStatsFromLogs(logs, profile);
}, [logs, profile.weight, profile.age]);
  const comparisonData = useMemo(() => buildComparisonChartData(muscleStats), [muscleStats])

  const unlockedAchievements = useMemo(() => {
    const arr = []
    if (logs.length >= 1)
      arr.push({
        id: 'ach_first',
        title: 'Första passet! 💖',
        desc: 'Du loggade ditt första pass.',
        emoji: '🎉',
      })
    if (logs.length >= 5)
      arr.push({
        id: 'ach_5_logs',
        title: 'Consistency Bebi',
        desc: 'Minst 5 loggade pass.',
        emoji: '📅',
      })
    const totalSets = logs.length
    if (totalSets >= 20)
      arr.push({
        id: 'ach_20_sets',
        title: 'Set Machine',
        desc: '20+ loggade set.',
        emoji: '🛠️',
      })

    const glute = muscleStats.glutes
    if (glute && glute.levelKey === 'Elite')
      arr.push({
        id: 'ach_glute_elite',
        title: 'Glute Queen',
        desc: 'Elite på glutes – Glute Dragon darrar.',
        emoji: '🍑',
      })

    const anyPR = Object.values(prMap).some((p) => p.best1RM > 0)
    if (anyPR)
      arr.push({
        id: 'ach_pr_any',
        title: 'PR Era',
        desc: 'Minst ett registrerat PR.',
        emoji: '🔥',
      })

    const bossesArray = Object.values(bosses)
    const totalMax = bossesArray.reduce((s, b) => s + b.maxHP, 0)
    const totalCurrent = bossesArray.reduce((s, b) => s + b.currentHP, 0)
    const totalPct = totalMax ? Math.round(100 * (1 - totalCurrent / totalMax)) : 0
    if (totalPct >= 50)
      arr.push({
        id: 'ach_raid_50',
        title: 'Raid 50%',
        desc: 'Minst 50% av all boss-HP nedslagen.',
        emoji: '🐉',
      })

    if (battleTier >= 3)
      arr.push({
        id: 'ach_battle_tier3',
        title: 'Battle Pass Tier 3',
        desc: 'Nått minst tier 3 i Battle Pass.',
        emoji: '🎟️',
      })

    const eliteMuscles = Object.values(muscleStats).filter((m) => m.levelKey === 'Elite').length
    if (eliteMuscles >= 2)
      arr.push({
        id: 'ach_multi_elite',
        title: 'Multi-Elite Queen',
        desc: 'Minst två muskelgrupper på Elite-nivå.',
        emoji: '👑',
      })

    return arr
  }, [logs, muscleStats, prMap, bosses, battleTier])

  const nextTierXp = battleTier * 200

  function handleSelectProgram(id) {
    setActiveProgramId(id)
    setDayIndex(0)
    bumpMood('start_program')
  }

  function handleNextDay() {
    const prog = PROGRAMS.find((p) => p.id === activeProgramId) || PROGRAMS[0]
    if (!prog) return
    const next = (dayIndex + 1) % prog.days.length
    setDayIndex(next)
  }

  function handleClaimReward(id) {
    if (claimedRewards.includes(id)) return
    setClaimedRewards((prev) => [...prev, id])
    bumpMood('achievement')
    const r = BATTLE_REWARDS.find((x) => x.id === id)
    showToastMsg('Reward klaimad 🎁', r ? r.label : 'Du tog en battle pass-belöning!')
  }

  return (
    <div className="app-shell">
      {toast && <Toast title={toast.title} subtitle={toast.subtitle} />}

      <aside className="sidebar">
  <div className="sidebar-header">
    <BebiAvatar size={52} mood={mood} />
    <div>
      <div className="sidebar-title">Bebi Gym v17</div>
      <div className="sidebar-sub">För Maria Kristina 💗</div>
    </div>
  </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-link ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-link ${view === 'log' ? 'active' : ''}`}
            onClick={() => setView('log')}
          >
            <span className="icon">📓</span>
            <span>Logga pass</span>
          </button>
          <button
            className={`sidebar-link ${view === 'program' ? 'active' : ''}`}
            onClick={() => setView('program')}
          >
            <span className="icon">📅</span>
            <span>Program</span>
          </button>
          <button
            className={`sidebar-link ${view === 'boss' ? 'active' : ''}`}
            onClick={() => setView('boss')}
          >
            <span className="icon">🐲</span>
            <span>Boss Raid</span>
          </button>
          <button
            className={`sidebar-link ${view === 'ach' ? 'active' : ''}`}
            onClick={() => setView('ach')}
          >
            <span className="icon">🏅</span>
            <span>Achievements</span>
          </button>
          <button
            className={`sidebar-link ${view === 'pr' ? 'active' : ''}`}
            onClick={() => setView('pr')}
          >
            <span className="icon">🏆</span>
            <span>PR-lista</span>
          </button>
        </div>

        <div style={{ marginTop: 'auto', fontSize: 11, color: '#9ca3af' }}>
          <div>Bebi: {profile.name}</div>
          <div>
            {profile.height} cm • {profile.weight} kg • {profile.age} år
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="main-header">
          <div>
            <div className="main-title">Hej {profile.nick}! 💖</div>
            <div className="main-sub">
              Idag är en perfekt dag att bli starkare. Varje set du gör skadar bossar, ger XP och
              bygger din PR-historia.
            </div>
          </div>
          <button className="btn-pink" onClick={() => setShowModal(true)}>
            + Logga set
          </button>
        </div>

      {view === 'dashboard' && (
  <div className="row" style={{ alignItems: 'flex-start' }}>

    <div className="col" style={{ flex: 1, gap: 10 }}>
      
      <ProfileCard profile={profile} />

      <div className="card small">
        ...

          <div className="row" style={{ alignItems: 'flex-start' }}>
          <ProfileCard profile={profile} setProfile={setProfile} />
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card small">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>XP & Level</div>
                    <div className="small">Du får XP för varje tungt set</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div>{xp} XP</div>
                    <div>Tier {battleTier}</div>
                  </div>
                </div>
                <div className="progress-wrap" style={{ marginTop: 6 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, Math.round((xp / nextTierXp) * 100))}%` }}
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

        {view === 'log' && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Loggade set 📓</h3>
            {!logs.length && (
              <p className="small">
                Inga set än. Klicka på “Logga set” för att lägga till ditt första pass, Bebi 💗
              </p>
            )}
            <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, marginTop: 6 }}>
              {logs.map((l) => {
                const ex = EXERCISES.find((e) => e.id === l.exerciseId)
                return (
                  <li
                    key={l.id}
                    style={{
                      fontSize: 12,
                      marginBottom: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 6px',
                      borderRadius: 8,
                      background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(148,163,184,0.5)',
                    }}
                  >
                    <div>
                      {l.date} • {ex?.name || l.exerciseId} • {l.weight} kg × {l.reps} reps (1RM ca{' '}
                      {calc1RM(l.weight, l.reps)} kg)
                    </div>
                    <button
                      className="btn"
                      style={{ fontSize: 11, padding: '3px 7px' }}
                      onClick={() => handleDeleteLog(l.id)}
                    >
                      🗑️
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {view === 'program' && (
          <ProgramRunner
            programs={PROGRAMS}
            activeProgramId={activeProgramId}
            dayIndex={dayIndex}
            onSelectProgram={handleSelectProgram}
            onNextDay={handleNextDay}
            logs={logs}
          />
        )}

        {view === 'boss' && (
          <div className="row" style={{ gap: 10 }}>
            <div className="col" style={{ flex: 2, gap: 10 }}>
              <BossArena bosses={bosses} />
            </div>
            <div className="col" style={{ flex: 1, gap: 10 }}>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Hur funkar raid? 🐉</h3>
                <p className="small">
                  Chest Beast tar mest skada av bänkpress. Glute Dragon hatar Hip Thrust / Benpress
                  / Knäböj. Row Titan blir rasande av tunga roddar & marklyft.
                </p>
                <p className="small">
                  PR ger extra damage och triggar Rage-avatarläge. Allt sker automatiskt när du
                  loggar set.
                </p>
              </div>
            </div>
          </div>
        )}

        {view === 'ach' && <Achievements unlocked={unlockedAchievements} />}

        {view === 'pr' && <PRList prMap={prMap} />}
      </main>

      <LogModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveSet}
        lastSet={lastSet}
      />
    </div>
  )
}
