import React, { useState, useMemo } from "react";
import { EXERCISES } from "../data/exercises";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// --------- HELPERS ---------

function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

// 7 famous 1RM formulas
function estimateAll(weight, reps) {
  return {
    Epley: Math.round(weight * (1 + reps / 30)),
    Brzycki: Math.round(weight * (36 / (37 - reps))),
    Lander: Math.round((100 * weight) / (101.3 - 2.67123 * reps)),
    Lombardi: Math.round(weight * reps ** 0.1),
    Mayhew: Math.round(
      (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps))
    ),
    OConnor: Math.round(weight * (1 + reps / 40)),
    Wathan: Math.round(
      (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps))
    ),
  };
}

// Maps EXERCISES → MUSCLE groups for volume tracker
const MUSCLE_MAP = {
  chest: ["bench", "inclinebench", "declinebench", "dumbbellpress", "cablefly", "pushups"],
  back: ["row", "latpulldown", "tbarrow", "pendlayrow", "meadowsrow", "sealrow"],
  glutes: ["hipthrust", "glutebridge", "frogpump", "bulgarian", "sumosquat"],
  legs: ["squat", "legpress", "frontsquat", "lunges", "legextension", "legcurl"],
  shoulders: ["ohp", "laterals", "rear-delt-fly", "arnoldpress"],
  arms: ["bicepcurl", "hammercurl", "triceppushdown", "skullcrusher"],
  core: ["plank", "cablecrunch", "hanginglegraise", "abwheel"],
};

function getISOWeek(dateStr) {
  const date = new Date(dateStr);
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
}

function getVolumeColor(sets) {
  if (sets === 0) return "rgba(30,64,175,0.8)"; // blå – ingen volym
  if (sets < 8) return "rgba(239,68,68,0.6)"; // lite – röd
  if (sets <= 18) return "rgba(34,197,94,0.6)"; // sweet spot – grön
  return "rgba(234,179,8,0.7)"; // väldigt mycket – gul
}

export default function LiftTools({ logs, onAddManual, bodyStats }) {
  const [tab, setTab] = useState("manual");

  // ----- TAB 1: MANUELL LOGG -----
  const [manual, setManual] = useState({
    exerciseId: "bench",
    weight: "",
    reps: "",
    date: new Date().toISOString().slice(0, 10),
  });

  function saveManual() {
    if (!manual.weight || !manual.reps) {
      alert("Fyll i vikt & reps 💖");
      return;
    }

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      exerciseId: manual.exerciseId,
      weight: Number(manual.weight),
      reps: Number(manual.reps),
      date: manual.date,
    };

    onAddManual(entry);
    setManual((prev) => ({ ...prev, weight: "", reps: "" }));
  }

  // ----- TAB 2: 1RM & % -----
  const [oneRmInput, setOneRmInput] = useState("");
  const [percent, setPercent] = useState("");
  const percentCalc =
    oneRmInput && percent ? Math.round((oneRmInput * percent) / 100) : "";

  // ----- TAB 3: VOLUME TRACKER -----
  const volume = useMemo(() => {
    const weekly = {};
    Object.keys(MUSCLE_MAP).forEach((m) => (weekly[m] = 0));

    if (!logs || !logs.length) return weekly;

    const currentWeek = getISOWeek(new Date());
    logs.forEach((l) => {
      const w = getISOWeek(l.date);
      if (w !== currentWeek) return;

      Object.entries(MUSCLE_MAP).forEach(([mId, exList]) => {
        if (exList.includes(l.exerciseId)) {
          weekly[mId] += 1;
        }
      });
    });

    return weekly;
  }, [logs]);

  const totalWeeklySets = useMemo(
    () => Object.values(volume).reduce((s, v) => s + v, 0),
    [volume]
  );

  const mostTrained = useMemo(() => {
    let best = null;
    let bestVal = -1;
    Object.entries(volume).forEach(([m, sets]) => {
      if (sets > bestVal) {
        bestVal = sets;
        best = m;
      }
    });
    return best && bestVal > 0 ? { muscle: best, sets: bestVal } : null;
  }, [volume]);

  // ----- TAB 4: 1RM ESTIMATORS -----
  const [estWeight, setEstWeight] = useState("");
  const [estReps, setEstReps] = useState("");
  const estimates =
    estWeight && estReps ? estimateAll(Number(estWeight), Number(estReps)) : null;

  // ----- TAB 5: GRAFER -----
  const [showStrengthCharts, setShowStrengthCharts] = useState(true);
  const [showBodyCharts, setShowBodyCharts] = useState(true);

  function getExerciseChart(exId) {
    const data = (logs || [])
      .filter((l) => l.exerciseId === exId)
      .map((l) => ({
        date: l.date,
        rm: calc1RM(l.weight, l.reps),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: data.map((d) => d.date),
      datasets: [
        {
          label: "1RM utveckling",
          data: data.map((d) => d.rm),
          borderColor: "#ec4899",
          borderWidth: 3,
          pointRadius: 4,
        },
      ],
    };
  }

  function getBodyChart(key, label, color) {
    const arr = bodyStats?.[key] || [];
    const data = [...arr].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      labels: data.map((d) => d.date),
      datasets: [
        {
          label,
          data: data.map((d) => d.value),
          borderColor: color,
          borderWidth: 3,
          pointRadius: 4,
        },
      ],
    };
  }

  return (
    <div>
      {/* TABS */}
      <div className="lift-tabs">
        <button
          className={tab === "manual" ? "lift-tab active" : "lift-tab"}
          onClick={() => setTab("manual")}
        >
          📝 Manuell logg
        </button>
        <button
          className={tab === "1rm" ? "lift-tab active" : "lift-tab"}
          onClick={() => setTab("1rm")}
        >
          🧮 1RM & %
        </button>
        <button
          className={tab === "volume" ? "lift-tab active" : "lift-tab"}
          onClick={() => setTab("volume")}
        >
          📊 Volym / vecka
        </button>
        <button
          className={tab === "est" ? "lift-tab active" : "lift-tab"}
          onClick={() => setTab("est")}
        >
          🔥 1RM Estimators
        </button>
        <button
          className={tab === "charts" ? "lift-tab active" : "lift-tab"}
          onClick={() => setTab("charts")}
        >
          📈 Grafer
        </button>
      </div>

      <div className="lift-content">
        {/* TAB 1: MANUELL */}
        {tab === "manual" && (
          <div className="fade">
            <label className="small">Övning</label>
            <select
              className="input"
              value={manual.exerciseId}
              onChange={(e) =>
                setManual({ ...manual, exerciseId: e.target.value })
              }
            >
              {EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>

            <label className="small">Vikt (kg)</label>
            <input
              className="input"
              type="number"
              value={manual.weight}
              onChange={(e) =>
                setManual({ ...manual, weight: e.target.value })
              }
            />

            <label className="small">Reps</label>
            <input
              className="input"
              type="number"
              value={manual.reps}
              onChange={(e) =>
                setManual({ ...manual, reps: e.target.value })
              }
            />

            <label className="small">Datum</label>
            <input
              className="input"
              type="date"
              value={manual.date}
              onChange={(e) =>
                setManual({ ...manual, date: e.target.value })
              }
            />

            <button
              className="btn-pink"
              style={{ marginTop: 15 }}
              onClick={saveManual}
            >
              ➕ Spara lyft
            </button>
          </div>
        )}

        {/* TAB 2: 1RM & % */}
        {tab === "1rm" && (
          <div className="fade">
            <label className="small">Ditt 1RM (kg)</label>
            <input
              className="input"
              type="number"
              value={oneRmInput}
              onChange={(e) => setOneRmInput(Number(e.target.value))}
            />

            <label className="small">Procent (%)</label>
            <input
              className="input"
              type="number"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
            />

            <div className="lift-result">
              {percentCalc !== "" ? (
                <>
                  <div className="result-number">{percentCalc} kg</div>
                  <div className="small">
                    {percent}% av {oneRmInput} kg
                  </div>
                </>
              ) : (
                <div className="small" style={{ opacity: 0.5 }}>
                  Fyll i värden ↑
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VOLUME */}
        {tab === "volume" && (
          <div className="fade">
            <div className="card small" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Weekly Report 📬
              </div>
              <div className="small">
                Totalt denna vecka: <strong>{totalWeeklySets}</strong> set.
              </div>
              {mostTrained ? (
                <div className="small">
                  Mest tränade muskel:{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {mostTrained.muscle}
                  </strong>{" "}
                  ({mostTrained.sets} set)
                </div>
              ) : (
                <div className="small">
                  Ingen volym registrerad ännu denna vecka.
                </div>
              )}
            </div>

            {Object.entries(volume).map(([m, sets]) => (
              <div
                key={m}
                className="card small"
                style={{
                  marginBottom: 8,
                  background: getVolumeColor(sets),
                  border: "1px solid rgba(15,23,42,0.6)",
                }}
              >
                <strong style={{ textTransform: "capitalize" }}>{m}</strong>:{" "}
                {sets} set denna veckan
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: 1RM ESTIMATORS */}
        {tab === "est" && (
          <div className="fade">
            <label className="small">Vikt (kg)</label>
            <input
              className="input"
              type="number"
              value={estWeight}
              onChange={(e) => setEstWeight(Number(e.target.value))}
            />

            <label className="small">Reps</label>
            <input
              className="input"
              type="number"
              value={estReps}
              onChange={(e) => setEstReps(Number(e.target.value))}
            />

            {estimates && (
              <div style={{ marginTop: 12 }}>
                {Object.entries(estimates).map(([name, val]) => (
                  <div
                    key={name}
                    className="card small"
                    style={{ marginBottom: 6 }}
                  >
                    <strong>{name}</strong>: {val} kg
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GRAFER */}
        {tab === "charts" && (
          <div
            className="fade"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn"
                style={{ fontSize: 11, padding: "4px 8px" }}
                onClick={() => setShowStrengthCharts((v) => !v)}
              >
                {showStrengthCharts ? "Dölj styrkegrafer" : "Visa styrkegrafer"}
              </button>
              <button
                className="btn"
                style={{ fontSize: 11, padding: "4px 8px" }}
                onClick={() => setShowBodyCharts((v) => !v)}
              >
                {showBodyCharts ? "Dölj kroppsmått" : "Visa kroppsmått"}
              </button>
            </div>

            {showStrengthCharts && (
              <>
                <h3>📈 Styrkeutveckling per övning</h3>
                {EXERCISES.slice(0, 5).map((ex) => (
                  <div key={ex.id} className="card">
                    <strong>{ex.name}</strong>
                    <Line data={getExerciseChart(ex.id)} />
                  </div>
                ))}
              </>
            )}

            {showBodyCharts && (
              <>
                <h3>📏 Kroppsmått</h3>
                {[
                  ["waist", "Midja", "#22d3ee"],
                  ["hips", "Höft", "#a78bfa"],
                  ["thigh", "Lår", "#f472b6"],
                  ["glutes", "Rumpa", "#fb923c"],
                  ["chest", "Bröst", "#34d399"],
                  ["arm", "Arm", "#facc15"],
                ].map(([key, label, color]) => (
                  <div key={key} className="card">
                    <strong>{label}</strong>
                    <Line data={getBodyChart(key, label, color)} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
