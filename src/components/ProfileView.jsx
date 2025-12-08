import React, { useState } from "react";

export default function ProfileView({
  profile,
  setProfile,
  bodyStats,
  onAddMeasurement,
  onDeleteMeasurement,
}) {
  const [form, setForm] = useState({
    name: profile.name,
    nick: profile.nick,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
  });

  const [newMeasurement, setNewMeasurement] = useState({
    key: "waist",
    value: "",
  });

  const measurementLabels = {
    waist: "Midja",
    hips: "Höfter",
    thigh: "Lår",
    glutes: "Glutes",
    chest: "Bröst",
    arm: "Arm",
  };

  function handleSaveProfile() {
    setProfile({
      ...profile,
      name: form.name,
      nick: form.nick,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
    });
  }

  function handleAddMeasurement() {
    if (!newMeasurement.value) return;

    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      value: Number(newMeasurement.value),
    };

    onAddMeasurement(newMeasurement.key, entry);

    setNewMeasurement({ ...newMeasurement, value: "" });
  }

  return (
    <div className="profile-container">

      {/* HEADER */}
      <h2 className="profile-header">
        👤 Din Profil
      </h2>

      {/* PROFILE CARD */}
      <div className="profile-card">
        <h3 className="section-title">🧸 Grundinfo</h3>

        <div className="input-group">
          <label>Namn</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label>Smeknamn</label>
          <input
            value={form.nick}
            onChange={(e) => setForm({ ...form, nick: e.target.value })}
          />
        </div>

        <div className="profile-grid">
          <div className="input-group">
            <label>Ålder</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm
