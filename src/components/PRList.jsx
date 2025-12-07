import React from 'react'
import { EXERCISES } from '../data/exercises'

export default function PRList({ prMap }) {
  const rows = Object.entries(prMap).map(([exId, data]) => {
    const ex = EXERCISES.find((e) => e.id === exId)
    return {
      id: exId,
      name: ex?.name || exId,
      best1RM: data.best1RM,
      last: data.history[data.history.length - 1],
    }
  })

  if (!rows.length) {
    return (
      <div className="card small">
        <h3 style={{ marginTop: 0 }}>PR-lista 🏆</h3>
        <p className="small">Inga PR än – men det kommer, Bebi 💖</p>
      </div>
    )
  }

  return (
    <div className="card small">
      <h3 style={{ marginTop: 0 }}>Senaste PRs 🏆</h3>
      <ul style={{ paddingLeft: 16, margin: 0, marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
        {rows.map((r) => (
          <li key={r.id} style={{ fontSize: 12, marginBottom: 3 }}>
            {r.name}: {r.last.weight} kg × {r.last.reps} reps — 1RM ca {r.best1RM} kg ({r.last.date})
          </li>
        ))}
      </ul>
    </div>
  )
}
