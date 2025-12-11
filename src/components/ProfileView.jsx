import React, { useEffect, useState } from "react";

export default function ProfileView({ profile, setProfile, bodyStats = {}, onAddMeasurement, onDeleteMeasurement }) {
  const [form, setForm] = useState({
    name: profile?.name || "",
    nick: profile?.nick || "",
    age: profile?.age || 20,
    height: profile?.height || 170,
    weight: profile?.weight || 60,
  });

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      nick: profile?.nick || "",
      age: profile?.age || 20,
      height: profile?.height || 170,
      weight: profile?.weight || 60,
    });
  }, [profile]);

  function saveProfile() {
    setProfile((prev) => ({ ...prev, ...form }));
  }

  function handleAddMeasurement(key) {
    const val = prompt(`Ange värde för ${key} (cm):`);
    if (!val) return;
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return alert("Ange ett nummer");
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
      date: new Date().toISOString().slice(0, 10),
      value: parsed,
    };
    onAddMeasurement?.(key, entry);
  }

  function handleDeleteMeasurement(key, id) {
    if (!confirm("Ta bort denna mätning?")) return;
    onDeleteMeasurement?.(key, id);
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <div style={{
          width: 84, height: 84, borderRadius: 12, overflow: "hidden", background: "linear-gradient(180deg,#ffd6e8,#ffb6dd)",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 28, color: "#61204d"
        }}>
          {form.nick ? form.nick[0].toUpperCase() : "B"}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            <input className="input" style={{ width: 120 }} value={form.nick} onChange={(e) => setForm({...form, nick: e.target.value})} />
          </div>
          <div className="small" style={{ marginTop: 6 }}>Visningsnamn och smeknamn</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        <label className="small">Ålder
          <input className="input" type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} />
        </label>
        <label className="small">Längd (cm)
          <input className="input" type="number" value={form.height} onChange={(e) => setForm({...form, height: Number(e.target.value)})} />
        </label>
        <label className="small">Vikt (kg)
          <input className="input" type="number" value={form.weight} onChange={(e) => setForm({...form, weight: Number(e.target.value)})} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => {
          setForm({
            name: profile?.name || "",
            nick: profile?.nick || "",
            age: profile?.age || 20,
            height: profile?.height || 170,
            weight: profile?.weight || 60,
          });
        }}>Återställ</button>
        <button className="btn-pink" onClick={saveProfile}>Spara profil</button>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.04)", margin: "10px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Kroppsmått</div>
        <div className="small" style={{ opacity: 0.9 }}>
          Spara historik — du kan ta bort enskilda mätningar.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {Object.keys(bodyStats || {}).map((key) => (
          <div key={key} className="card small" style={{ padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{key}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn" onClick={() => handleAddMeasurement(key)}>+ Ny</button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {(bodyStats[key] || []).slice().reverse().slice(0,6).map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0" }}>
                  <div style={{ fontSize: 13 }}>{m.date}</div>
                  <div style={{ fontWeight: 700 }}>{m.value} cm</div>
                  <button className="btn-ghost" onClick={() => handleDeleteMeasurement(key, m.id)}>Ta bort</button>
                </div>
              ))}
              {(bodyStats[key] || []).length === 0 && <div className="small" style={{ opacity: 0.8 }}>Inga mätningar ännu</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
