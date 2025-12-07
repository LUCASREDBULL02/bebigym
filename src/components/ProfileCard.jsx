import React, { useState, useEffect } from "react";

export default function ProfileCard({ profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(profile);

  useEffect(() => {
    setTemp(profile);
  }, [profile]);

  const save = () => {
    setProfile({
      ...profile,
      name: temp.name,
      age: Number(temp.age),
      height: Number(temp.height),
      weight: Number(temp.weight),
      goalWeight: Number(temp.goalWeight || profile.goalWeight),
    });
    setEditing(false);
  };

  const bmi = Math.round((profile.weight / (profile.height / 100) ** 2) * 10) / 10;
  const weightProgress =
    profile.goalWeight > 0
      ? Math.min(100, Math.round((profile.weight / profile.goalWeight) * 100))
      : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      {!editing ? (
        <>
          {/* HEADER WITH AVATAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <img
              src="/src/assets/avatar.png"
              alt="avatar"
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #ff7ab8",
                boxShadow: "0 0 20px rgba(255, 100, 180, 0.5)",
                animation: "pulseGlow 2s infinite ease-in-out",
              }}
            />

            <div>
              <h2 style={{ margin: 0 }}>{profile.name}</h2>
              <div style={{ opacity: 0.8 }}>
                {profile.age} år • {profile.height} cm • {profile.weight} kg
              </div>
              {profile.goalWeight > 0 && (
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Målvikt: {profile.goalWeight} kg
                </div>
              )}
            </div>
          </div>

          {/* MINI-STATS */}
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              textAlign: "center",
            }}
          >
            <div className="mini-card">
              <div className="mini-label">BMI</div>
              <div className="mini-value">{bmi}</div>
            </div>
            <div className="mini-card">
              <div className="mini-label">Styrkeindex</div>
              <div className="mini-value">{Math.round(profile.weight * 1.25)}</div>
            </div>
            <div className="mini-card">
              <div className="mini-label">Avancerad nivå?</div>
              <div className="mini-value">
                {profile.weight > 70 ? "💪 Ja!" : "🔄 Snart!"}
              </div>
            </div>
          </div>

          {/* GOAL WEIGHT BAR */}
          {profile.goalWeight > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Viktmål Progress</div>
              <div className="progress-wrap">
                <div
                  className="progress-fill"
                  style={{ width: `${weightProgress}%`, transition: "0.3s" }}
                />
              </div>
            </div>
          )}

          <button
            className="btn-pink"
            style={{ marginTop: 16 }}
            onClick={() => setEditing(true)}
          >
            Redigera profil
          </button>
        </>
      ) : (
        <>
          <h3>Redigera Profil</h3>
          <div className="space-y">
            <input
              className="input"
              value={temp.name}
              onChange={(e) => setTemp({ ...temp, name: e.target.value })}
              placeholder="Namn"
            />
            <input
              type="number"
              className="input"
              value={temp.age}
              onChange={(e) => setTemp({ ...temp, age: e.target.value })}
              placeholder="Ålder"
            />
            <input
              type="number"
              className="input"
              value={temp.height}
              onChange={(e) => setTemp({ ...temp, height: e.target.value })}
              placeholder="Längd (cm)"
            />
            <input
              type="number"
              className="input"
              value={temp.weight}
              onChange={(e) => setTemp({ ...temp, weight: e.target.value })}
              placeholder="Vikt (kg)"
            />
            <input
              type="number"
              className="input"
              value={temp.goalWeight || ""}
              onChange={(e) => setTemp({ ...temp, goalWeight: e.target.value })}
              placeholder="Målvikt (valfritt)"
            />
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button className="btn-green" onClick={save}>
              Spara
            </button>
            <button className="btn" onClick={() => setEditing(false)}>
              Avbryt
            </button>
          </div>
        </>
      )}
    </div>
  );
}
