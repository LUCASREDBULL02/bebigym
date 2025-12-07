
import React from 'react'

export default function MuscleComparison({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card small">
        <h3 style={{ marginTop: 0 }}>Muskel-jämförelse 📊</h3>
        <p className="small">Ingen data ännu – logga några pass först 💪</p>
      </div>
    )
  }

  return (
    <div className="card small">
      <h3 style={{ marginTop: 0 }}>Muskel-jämförelse 📊</h3>
      <p className="small">Färgad stapel = Bebi • Grå linje = 100% (Intermediate).</p>

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {data.map((row) => (
          <div key={row.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>{row.name}</span>
              <span style={{ opacity: 0.7 }}>
                {row.actual}% • {row.levelKey}
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                height: 8,
                borderRadius: 999,
                background: 'rgba(15,23,42,0.9)',
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.6)',
              }}
            >
              {/* expected 100% marker */}
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  width: 2,
                  top: 0,
                  bottom: 0,
                  background: '#9ca3af',
                }}
              />
              {/* actual bar */}
              <div
                style={{
                  position: 'relative',
                  width: `${Math.min(150, row.actual)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#facc15,#fb7185,#a855f7)',
                  transition: 'width 0.2s ease-out',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
