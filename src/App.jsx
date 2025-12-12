import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Sidor & komponenter
import Dashboard from "./Dashboard";
import LogModal from "./LogModal";
import LiftTools from "./LiftTools";
import ProfileView from "./ProfileView";
import ProgramRunner from "./ProgramRunner";
import PRPage from "./PRPage";
import Achievements from "./Achievements";
import BossArena from "./BossArena";
import CycleCalendar from "./CycleCalendar";
import BattlePass from "./BattlePass";
import MuscleMap from "./MuscleMap";
import Toast from "./Toast";

// Dummy-data eller hooks kan senare ersättas med kontext/store
const dummyProfile = { name: "Bebi", nick: "BB", age: 25, height: 165, weight: 62 };
const dummyStats = { waist: [], hips: [], thigh: [], glutes: [], chest: [], arm: [] };

export default function App() {
  const [profile, setProfile] = useState(dummyProfile);
  const [bodyStats, setBodyStats] = useState(dummyStats);

  const handleAddMeasurement = (key, entry) => {
    setBodyStats((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), entry],
    }));
  };

  const handleDeleteMeasurement = (key, id) => {
    setBodyStats((prev) => ({
      ...prev,
      [key]: prev[key].filter((e) => e.id !== id),
    }));
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = [
    { to: "/", label: "🏠 Dashboard" },
    { to: "/log", label: "📓 Log" },
    { to: "/program", label: "📅 Program" },
    { to: "/boss", label: "🐲 Boss" },
    { to: "/achievements", label: "🏅 Achievements" },
    { to: "/pr", label: "🏆 PR" },
    { to: "/profile", label: "👤 Profil" },
    { to: "/tools", label: "📈 LiftTools" },
    { to: "/cycle", label: "📅 Cycle" },
    { to: "/battlepass", label: "🎮 BattlePass" },
    { to: "/musclemap", label: "🦿 MuscleMap" },
  ];

  return (
    <Router>
      <div className="app-container">
        {/* Mobil meny */}
        <div className="mobile-header">
          <button className="hamburger" onClick={() => setDrawerOpen(!drawerOpen)}>☰</button>
          <div className="app-title">BebiGym 💗</div>
        </div>

        {/* Sidebar */}
        <aside className={`sidebar ${drawerOpen ? "open" : ""}`}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setDrawerOpen(false)}>
              {l.label}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogModal />} />
            <Route path="/program" element={<ProgramRunner programs={[]} activeProgramId={null} dayIndex={0} logs={[]} onSelectProgram={()=>{}} onNextDay={()=>{}} />} />
            <Route path="/boss" element={<BossArena />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/pr" element={<PRPage />} />
            <Route path="/profile" element={
              <ProfileView
                profile={profile}
                setProfile={setProfile}
                bodyStats={bodyStats}
                onAddMeasurement={handleAddMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
              />
            }/>
            <Route path="/tools" element={<LiftTools />} />
            <Route path="/cycle" element={<CycleCalendar />} />
            <Route path="/battlepass" element={<BattlePass />} />
            <Route path="/musclemap" element={<MuscleMap />} />
          </Routes>
        </main>

        <Toast />
      </div>
    </Router>
  );
}
