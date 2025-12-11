import React, { useEffect, useMemo, useState } from "react";
import { EXERCISES } from "../data/exercises";

export default function LogModal({ open, onClose, onSave, lastSet }) {
  const today = new Date().toISOString().slice(0, 10);
  const [query, setQuery] = useState("");
  const [exerciseId, setExerciseId] = useState(EXERCISES[0]?.id || "");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [date, setDate] = useState(today);
  const [usePercent, setUsePercent] = useState(false);
  const [oneRmInput, setOneRmInput] = useState(""); // if user enters 1RM directly
  const [percent, setPercent] = useState(65);

  useEffect(() => {
    if (!open) {
      // reset minor fields when modal closes
      setQuery("");
      setPercent(65);
      setUsePercent(false);
    } else {
      // when opened, autofill with lastSet if exists and same exercise
      if (lastSet) {
        setExerciseId(lastSet.exerciseId || exerciseId);
        setWeight(lastSet.weight ? String(lastSet.weight) : "");
        setReps(lastSet.reps ? String(lastSet.reps) : "");
        setDate(lastSet.date || today);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXERCISES.slice(0, 30);
    return EXERCISES.filter(
      (e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [query]);

  function calc1RM(weightNum, repsNum) {
    if (!weightNum || !repsNum) return 0;
    return Math.round(weightNum * (1 + repsNum / 30));
  }

  function handlePercentChange(p, oneRmVal) {
    const w = Math.round(((oneRmVal || Number(oneRmInput) || 0) * p) / 100);
    setWeight(w ? String(w) : "");
    setPercent(p);
  }

  function handleSave(e) {
    e?.preventDefault?.();
    // validate
    if (!exerciseId) return alert("Välj en övning");
    // if using percent & provided oneRmInput, compute weight
    let weightNum = Number(weight);
    if (usePercent && Number(oneRmInput)) {
      weightNum = Math.round((Number(oneRmInput) * Number(percent)) / 100);
    }
    const payload = {
      exerciseId,
      weight: weightNum || 0,
      reps: Number(reps) || 0,
      rpe: rpe ? Number(rpe) : undefined,
      date: date || today,
    };
    onSave(payload);
  }

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal card" style={{ width: 420, maxWidth: "94%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>Logga set</div>
          <div style={{ opacity: 0.8 }} className="small">
            <button className="btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <label className="small">Sök övning</label>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök t.ex. hipthrust, squat..."
            className="input"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="input"
              style={{ flex: 1 }}
            >
              {filtered.map((ex) => (
                <option value={ex.id} key={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>

            <input
              className="input"
              style={{ width: 100 }}
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Vikt kg"
            />
            <input
              className="input"
              style={{ width: 80 }}
              value={reps}
              onChange={(e) => setReps(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Reps"
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              className="input"
              placeholder="RPE"
              value={rpe}
              style={{ width: 80 }}
              onChange={(e) => setRpe(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Extra verktyg</div>
              <div className="small" style={{ opacity: 0.85 }}>
                1RM / %-vikt
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <input
                className="input"
                value={oneRmInput}
                onChange={(e) => setOneRmInput(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="Ange 1RM (valfritt)"
                style={{ flex: 1 }}
              />
              <div style={{ width: 110 }}>
                <label className="small" style={{ display: "block" }}>
                  % av 1RM
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={200}
                  value={percent}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setPercent(p);
                    if (usePercent) handlePercentChange(p, Number(oneRmInput));
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <label className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={usePercent}
                  onChange={(e) => {
                    setUsePercent(e.target.checked);
                    if (e.target.checked && Number(oneRmInput)) {
                      handlePercentChange(percent, Number(oneRmInput));
                    }
                  }}
                />{" "}
                Använd % av 1RM för vikt
              </label>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  // autofill weight from lastSet if same exercise
                  if (lastSet && lastSet.exerciseId === exerciseId) {
                    setWeight(String(lastSet.weight || ""));
                    setReps(String(lastSet.reps || ""));
                  } else if (lastSet) {
                    setWeight(String(lastSet.weight || ""));
                    setReps(String(lastSet.reps || ""));
                    setExerciseId(lastSet.exerciseId);
                  } else {
                    // fallback: pick most recent weight for this exercise from localStorage logs
                    const saved = localStorage.getItem("bebi_logs");
                    if (saved) {
                      try {
                        const arr = JSON.parse(saved);
                        const found = arr.find((x) => x.exerciseId === exerciseId);
                        if (found) {
                          setWeight(String(found.weight || ""));
                          setReps(String(found.reps || ""));
                          setDate(found.date || today);
                        } else {
                          alert("Ingen tidigare vikt hittad för övningen.");
                        }
                      } catch {
                        // ignore
                      }
                    } else {
                      alert("Ingen tidigare vikt hittad.");
                    }
                  }
                }}
              >
                Autofill senaste
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Avbryt
            </button>
            <button className="btn-pink" type="submit">
              Spara set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
