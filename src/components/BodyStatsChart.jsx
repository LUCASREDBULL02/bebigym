import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler
);

export default function BodyStatsChart({ label, list }) {
  if (!list || list.length === 0) return null;

  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));

  const dates = sorted.map((m) => m.date);
  const values = sorted.map((m) => m.value);

  const data = {
    labels: dates,
    datasets: [
      {
        label,
        data: values,
        fill: true,
        borderColor: "#ff7abf",
        backgroundColor: "rgba(255, 122, 191, 0.18)",
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    responsive: true,
    scales: {
      x: { ticks: { color: "#fff" } },
      y: { ticks: { color: "#fff" } },
    },
  };

  return (
    <div style={{ padding: 10, marginTop: 10 }}>
      <Line data={data} options={options} />
    </div>
  );
}
