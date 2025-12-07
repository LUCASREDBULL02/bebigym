import React from 'react'

export default function Achievements({ unlocked }) {
  const baseList = [
    'ach_first',
    'ach_5_logs',
    'ach_20_sets',
    'ach_glute_elite',
    'ach_pr_any',
    'ach_raid_50',
    'ach_battle_tier3',
    'ach_multi_elite',
  ]

  const sorted = [...unlocked].sort(
    (a, b) => baseList.indexOf(a.id ?? '') - baseList.indexOf(b.id ?? '')
  )

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Achievements 🏅</h3>
      {!sorted.length && <p className="small">Inga achievements än – men det kommer, Bebi 💖</p>}
      <ul style={{ paddingLeft: 16, margin: 0, marginTop: 6, maxHeight: 220, overflowY: 'auto' }}>
        {sorted.map((a) => (
          <li key={a.id} style={{ fontSize: 12, marginBottom: 3 }}>
            {a.emoji}{' '}
            <strong>
              {a.title}
            </strong>{' '}
            — <span className="small">{a.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
