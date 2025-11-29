import { useState } from "react";
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

const Graph = ({ data, dataKey, label, borderColor, backgroundColor }: GraphProps) => {
  const [filter, setFilter] = useState('100');

  const filteredData = filter === 'all' ? data : data.slice(-Number(filter));

  const chartData = {
    labels: filteredData.map((d) => new Date(d.t).toLocaleTimeString()),
    datasets: [
      {
        label,
        data: filteredData.map((d) => d[dataKey]),
        borderColor,
        backgroundColor,
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value={100}>Last 100 data points</option>
          <option value={200}>Last 200 data points</option>
          <option value={300}>Last 300 data points</option>
          <option value="all">All data</option>
        </select>
      </div>
      <Line data={chartData} />
    </div>
  );
};

export default Graph;
