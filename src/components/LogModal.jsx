import React, { useState, useEffect } from 'react'
import { EXERCISES } from '../data/exercises'

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const [exerciseId, setExerciseId] = useState('row')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  useEffect(() => {
    if (lastSet) {
      setExerciseId(lastSet.exerciseId || 'row')
      setWeight(String(lastSet.weight || ''))
      setReps(String(lastSet.reps || ''))
    }
  }, [lastSet])

  if (!open) return null

  function save() {
    if (!weight || !reps) return
    onSave({
      id: Date.now().toString(),
      exerciseId,
      weight: Number(weight),
      reps: Number(reps),
      date: new Date().toISOString().slice(0, 10),
    })
    setWeight('')
    setReps('')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 320, maxWidth: '90%', cursor: 'default', transform: 'translateY(-6px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Logga set 💪</h3>
        <p className="small" style={{ marginBottom: 8 }}>
          Bebi, skriv in vikt och reps så uppdateras XP, bossar, PR-listor och muskelkartan ✨
        </p>

        <label className="small">Övning</label>
        <select
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 6,
            marginTop: 2,
            padding: '6px 8px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.7)',
            background: 'rgba(15,23,42,0.8)',
            color: '#e5e7eb',
          }}
        >
          {EXERCISES.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <label className="small">Vikt (kg)</label>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.7)',
                background: 'rgba(15,23,42,0.9)',
                color: '#e5e7eb',
              }}
              type="number"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="small">Reps</label>
            <input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.7)',
                background: 'rgba(15,23,42,0.9)',
                color: '#e5e7eb',
              }}
              type="number"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          <button className="btn" onClick={onClose}>
            Avbryt
          </button>
          <button className="btn-pink" onClick={save}>
            Spara set ✨
          </button>
        </div>
      </div>
    </div>
  )
}
