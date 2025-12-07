import React from 'react'

export default function Toast({ title, subtitle }) {
  if (!title) return null
  return (
    <div className="toast-root">
      <div
        style={{
          minWidth: 260,
          maxWidth: 360,
          borderRadius: 16,
          padding: '10px 14px',
          background:
            'linear-gradient(135deg, rgba(236,72,153,0.96), rgba(129,140,248,0.95))',
          boxShadow: '0 18px 40px rgba(15,23,42,0.8)',
          color: 'white',
          border: '1px solid rgba(248,250,252,0.9)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', gap: 6 }}>
          <span>✨</span>
          <span>{title}</span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, marginTop: 2, opacity: 0.9 }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
