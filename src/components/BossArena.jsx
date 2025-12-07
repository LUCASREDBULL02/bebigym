import React from 'react'

function getPhase(pctLeft) {
  if (pctLeft > 70) return { phase: 1, label: 'Phase 1 – Chill 😼' }
  if (pctLeft > 40) return { phase: 2, label: 'Phase 2 – Angry 😤' }
  if (pctLeft > 0) return { phase: 3, label: 'Phase 3 – Rage 🔥' }
  return { phase: 4, label: 'Nerplattad 💀' }
}

function BossCard({ boss }) {
  const pctLeft = boss.maxHP ? Math.max(0, Math.round((boss.currentHP / boss.maxHP) * 100)) : 0
  const pctDone = 100 - pctLeft
  const { phase, label } = getPhase(pctLeft)

  const barColor =
    phase === 1 ? '#22c55e' : phase === 2 ? '#eab308' : phase === 3 ? '#ef4444' : '#6366f1'

  return (
    <div className="card small" style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{boss.name}</div>
        <div className="small">
          HP {boss.currentHP} / {boss.maxHP}
        </div>
      </div>
      <div className="progress-wrap">
        <div
          className="progress-fill"
          style={{ width: `${pctDone}%`, background: barColor, transition: 'width 0.2s ease' }}
        />
      </div>
      <div className="small" style={{ marginTop: 4 }}>
        {label} • {pctDone}% skada gjord • Element: {boss.elemental}
      </div>
    </div>
  )
}

export default function BossArena({ bosses }) {
  const list = Object.values(bosses)
  const totalMax = list.reduce((s, b) => s + b.maxHP, 0)
  const totalCurrent = list.reduce((s, b) => s + b.currentHP, 0)
  const totalPct = totalMax ? Math.round(100 * (1 - totalCurrent / totalMax)) : 0

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Boss Raid 🐲</h3>
      <p className="small">
        Bossarna tar skada automatiskt när Bebi loggar tunga set i rätt övningar. Ju högre 1RM,
        desto mer damage 🔥
      </p>
      <div className="progress-wrap" style={{ marginTop: 6 }}>
        <div className="progress-fill" style={{ width: `${totalPct}%` }} />
      </div>
      <div className="small" style={{ marginTop: 4 }}>
        Totalt raid-progress: {totalPct}% av all boss-HP nedslagen.
      </div>

      {list.map((b) => (
        <BossCard key={b.id} boss={b} />
      ))}
    </div>
  )
}
