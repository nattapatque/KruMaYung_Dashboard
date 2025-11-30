import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import type { Sample } from "../hooks/useSensorStream";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GraphProps {
  data: Sample[];
  dataKey: keyof Sample;
  label: string;
  borderColor: string;
  backgroundColor: string;
}

const Graph = ({
  data,
  dataKey,
  label,
  borderColor,
  backgroundColor,
}: GraphProps) => {
  const [filter, setFilter] = useState("100");

  const filteredData = filter === "all" ? data : data.slice(-Number(filter));

  const chartData = {
    labels: filteredData.map((d) => new Date(d.t).toLocaleTimeString()),
    datasets: [
      {
        label,
        data: filteredData.map((d) => d[dataKey]),
        borderColor,
        backgroundColor,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            display: false,
            labels: { color: "#ecf4ef" },
          },
          tooltip: {
            backgroundColor: "rgba(12, 28, 19, 0.95)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            titleColor: "#ffffff",
            bodyColor: "#e3f5e6",
            cornerRadius: 12,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.08)" },
            ticks: {
              color: "rgba(236,244,239,0.75)",
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.08)" },
            ticks: { color: "rgba(236,244,239,0.75)" },
          },
        },
        elements: {
          line: { tension: 0.35 },
          point: { hoverRadius: 4, hoverBorderWidth: 2 },
        },
      }) satisfies ChartOptions<"line">,
    []
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-white/70">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(240,199,94,0.15)]" />
          Live trend
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-200/60"
        >
          <option value="100" className="bg-[#0c1b13]">Last 100 data points</option>
          <option value="200" className="bg-[#0c1b13]">Last 200 data points</option>
          <option value="300" className="bg-[#0c1b13]">Last 300 data points</option>
          <option value="all" className="bg-[#0c1b13]">All data</option>
        </select>
      </div>
      <div className="h-64">
        {filteredData.length ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            Waiting for fresh data…
          </div>
        )}
      </div>
    </div>
  );
};

export default Graph;
