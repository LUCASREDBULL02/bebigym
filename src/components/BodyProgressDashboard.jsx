import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const COLOR_MAP = {
  waist: "#ff4fae",
  hips: "#ffa64f",
  glutes: "#4fffa6",
  thigh: "#4fa6ff",
  chest: "#d44fff",
  arm: "#ffe74f",
};

const LABELS = {
  waist: "Midja",
  hips: "Höfter",
  glutes: "Glutes",
  thigh: "Lår",
  chest: "Bröst",
  arm: "Arm",
};

export default function BodyProgressDashboard({ bodyStats }) {

  const allDates = useMemo(() => {
    const dates = new Set();
    Object.values(bodyStats).forEach((arr) =>
      arr.forEach((m) => dates.add(m.date))
    );
    return [...dates].sort();
  }, [bodyStats]);

  const chartData = useMemo(() => {
    return {
      labels: allDates,
      datasets: Object.entries(bodyStats)
        .filter(([key, list]) => list.length > 0)
        .map(([key, list]) => {
          const map = {};
          list.forEach((m) => (map[m.date] = m.value));

          return {
            label: LABELS[key],
            data: allDates.map((d) => map[d] ?? null),
            borderColor: COLOR_MAP[key] || "#fff",
            backgroundColor: (COLOR_MAP[key] || "#fff") + "55",
            borderWidth: 3,
            pointRadius: 4,
            tension: 0.3,
          };
        }),
    };
  }, [bodyStats, allDates]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#fff" },
      },
    },
    scales: {
      x: { ticks: { color: "#ccc" } },
      y: { ticks: { color: "#ccc" } },
    },
  };

  return (
    <div className="dashboard-page">
      <h2 className="profile-header">📊 Body Progress Dashboard</h2>

      <p className="main-sub">
        Alla dina kroppsmått samlade i en enda översiktsgraf ✨  
        Perfekt för att se långsiktiga förändringar.
      </p>

      <div className="big-chart-card">
        {allDates.length > 1 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p className="empty-text">
            Lägg till fler kroppsmätningar för att se grafen 💗
          </p>
        )}
      </div>
    </div>
  );
}
