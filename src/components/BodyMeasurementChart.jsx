import React from "react";
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

export default function BodyMeasurementChart({ list, label }) {
  if (!list || list.length < 2) return null;

  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));

  const data = {
    labels: sorted.map((m) => m.date),
    datasets: [
      {
        label,
        data: sorted.map((m) => m.value),
        borderColor: "#ff4fae",
        backgroundColor: "rgba(255, 79, 174, 0.3)",
        borderWidth: 3,
        pointRadius: 4,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#fff" } },
    },
    scales: {
      x: {
        ticks: { color: "#ccc" },
      },
      y: {
        ticks: { color: "#ccc" },
      },
    },
  };

  return (
    <div className="measurement-chart">
      <Line data={data} options={options} />
    </div>
  );
}
