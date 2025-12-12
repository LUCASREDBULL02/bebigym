import React from 'react'

export default function BattlePass({
  tier,
  xp,
  nextTierXp,
  rewards,
  claimedRewards,
  onClaimReward,
}) {
  const pct = nextTierXp ? Math.min(100, Math.round((xp / nextTierXp) * 100)) : 0

  return (
    <div className="card small">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Battle Pass 🎟️</div>
        <div className="small">
          Tier {tier} • {xp} XP
        </div>
      </div>
      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="small" style={{ marginTop: 4 }}>
        Nästa tier vid {nextTierXp} XP
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rewards</div>
        <ul
          style={{
            paddingLeft: 0,
            listStyle: 'none',
            margin: 0,
            maxHeight: 140,
            overflowY: 'auto',
          }}
        >
          {rewards.map((r) => {
            const unlocked = xp >= r.xpRequired
            const claimed = claimedRewards.includes(r.id)
            return (
              <li
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  padding: '4px 6px',
                  borderRadius: 8,
                  marginBottom: 3,
                  background: unlocked
                    ? claimed
                      ? 'rgba(34,197,94,0.18)'
                      : 'rgba(59,130,246,0.16)'
                    : 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(148,163,184,0.5)',
                }}
              >
                <div>
                  <div>
                    {r.emoji} <strong>{r.label}</strong>
                  </div>
                  <div className="small">
                    {r.desc} • kräver {r.xpRequired} XP
                  </div>
                </div>
                <div>
                  {claimed ? (
                    <span style={{ fontSize: 11 }}>✅ Claimed</span>
                  ) : unlocked ? (
                    <button
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={() => onClaimReward(r.id)}
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="small">Låst</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
