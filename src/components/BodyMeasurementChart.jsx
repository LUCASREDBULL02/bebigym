import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function BodyMeasurementChart({ label, dataPoints }) {
  if (!dataPoints || dataPoints.length === 0) {
    return <div style={{ fontSize: 12, opacity: 0.7 }}>Inga data än</div>;
  }

  const sorted = [...dataPoints].sort((a, b) => a.date.localeCompare(b.date));

  const chartData = {
    labels: sorted.map((d) => d.date),
    datasets: [
      {
        label,
        data: sorted.map((d) => d.value),
        borderColor: "#ec4899",
        backgroundColor: "rgba(236, 72, 153, 0.3)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#ec4899",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      x: {
        ticks: { color: "#fff" },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ marginTop: 10 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
