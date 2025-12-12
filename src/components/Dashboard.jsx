// src/components/Dashboard.jsx
import React from "react";
import MuscleMap from "./MuscleMap.jsx";
import MuscleComparison from "./MuscleComparison.jsx";
import BossArena from "./BossArena.jsx";
import BattlePass from "./BattlePass.jsx";

export default function Dashboard({
  xp,
  battleTier,
  nextTierXp,
  muscleStats,
  comparisonData,
  bosses,
  cycleInfo,
  todayFactor,
  onClaimReward,
  battleRewards,
  claimedRewards,
}) {
  return (
    <div className="dashboard-grid">
      <div className="card small">
        <div className="card-row">
          <div>
            <div className="muted">XP & Level</div>
            <div className="h4">{xp} XP</div>
            <div className="muted">Tier {battleTier}</div>
          </div>
          <div style={{ width: 160 }}>
            <div className="progress-wrap small">
              <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((xp / nextTierXp) * 100))}%` }} />
            </div>
            <div className="muted small">Nästa tier: {nextTierXp} XP</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="h4">Muskelkarta</div>
          <div className="muted small">Din styrkenivå per muskelgrupp</div>
        </div>
        <MuscleMap muscleStats={muscleStats} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="h4">Jämförelse</div>
          <div className="muted small">Visualisering jämfört med mål</div>
        </div>
        <MuscleComparison data={comparisonData} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="h4">Boss Arena</div>
          <div className="muted small">Hur mycket boss-HP du har sänkt</div>
        </div>
        <BossArena bosses={bosses} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="h4">Dagens rekommendation</div>
          <div className="muted small">Baserat på cykelfas</div>
        </div>
        <div style={{ padding: "8px 0" }}>
          <div className="muted small">Fas:</div>
          <div className="h5">{cycleInfo ? `${cycleInfo.phase} (dag ${cycleInfo.dayInPhase})` : "Ingen cykel satt"}</div>
          <div className="muted small" style={{ marginTop: 8 }}>
            Intensitet: <strong>{Math.round(todayFactor * 100)}%</strong>
          </div>
          <div style={{ marginTop: 10 }}>
            {cycleInfo ? (
              <div className="muted small">
                {cycleInfo.phase === "Menstrual" && "Fokusera teknik & rörelse. Mindre volym."}
                {cycleInfo.phase === "Follicular" && "Bra för volym & progressivt tunga set."}
                {cycleInfo.phase === "Ovulation" && "Top performance — försök tunga set/PR."}
                {cycleInfo.phase === "Luteal" && "Sänk volym något, prioritera kvalitet."}
              </div>
            ) : (
              <div className="muted small">Sätt din cykel i Cycle-sidan för personliga tips.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="h4">Battle Pass</div>
          <div className="muted small">Belöningar & tier</div>
        </div>
        <BattlePass tier={battleTier} xp={xp} nextTierXp={nextTierXp} rewards={battleRewards} claimedRewards={claimedRewards} onClaimReward={onClaimReward} />
      </div>
    </div>
  );
}
