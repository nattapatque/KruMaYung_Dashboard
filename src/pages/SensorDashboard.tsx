import { useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Sun,
  Volume2,
  CloudAlert,
  Ruler,
  Activity,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

import { DigitalCard } from "../components/DigitalCard.tsx";
// import type { Sample } from "../hooks/useSensorStream";
import { StatCard } from "../components/StatCard";
// import { MiniChart } from "../components/MiniChart";
import Graph from "../components/Graph";
import { useSensorStream } from "../hooks/useSensorStream";
import {
  BRIGHTNESS,
  SOUND,
  GAS,
  ULTRA,
  MPU6050,
  bandColor,
  bandLabel,
  bandColorForStr,
} from "../config/sensorConfig.ts";

export default function SensorDashboard() {
  const { data: rpiData, latest: latestRpi } =
    useSensorStream("rpi-cedt-node-01");
  const { data: espData, latest: latestEsp } = useSensorStream("esp32-cedt-01");

  const brightnessPct = latestEsp?.brightness_pct ?? 0;
  const soundDb = latestEsp?.sound_db ?? 0;
  const gasVal = latestEsp?.gas ?? "";
  const distance = latestRpi?.distance_cm ?? 0;
  const accel = latestRpi?.accel_mag ?? 0;

  const brightnessColor = bandColor(BRIGHTNESS.bands, brightnessPct);
  const soundColor = bandColor(SOUND.bands, soundDb);
  const gasColor = bandColorForStr(GAS.bands, gasVal);
  const ultraColor = bandColor(ULTRA.bands, distance);
  const mpuColor = bandColor(MPU6050.bands, accel);

  const brightnessNote = BRIGHTNESS.recommend(brightnessPct);
  const soundNote = SOUND.recommend(soundDb);
  const gasNote = GAS.recommend(gasVal);
  const ultraNote = ULTRA.recommend(distance);
  const mpuNote = MPU6050.recommend(accel);

  const lastUpdated = useMemo(
    () => new Date(latestRpi?.t ?? Date.now()).toLocaleTimeString(),
    [latestRpi]
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            IoT Sensor Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="secondary" className="rounded-2xl" onClick={() => setLive((v) => !v)}>
            {live ? (
              <span className="inline-flex items-center gap-2"><Pause className="w-4 h-4" /> Pause</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Play className="w-4 h-4" /> Resume</span>
            )}
          </Button> */}
          <Button
            variant="ghost"
            className="rounded-2xl bg-white"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm mb-4 opacity-70">Last update: {lastUpdated}</p>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatCard
            title="Brightness"
            icon={<Sun className="w-4 h-4" />}
            value={brightnessPct.toFixed(1)}
            unit="%"
            badge={bandLabel(BRIGHTNESS.bands, brightnessPct)}
            bgColor={brightnessColor}
            note={brightnessNote}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <StatCard
            title="Sound"
            icon={<Volume2 className="w-4 h-4" />}
            value={soundDb.toFixed(1)}
            unit="dB"
            badge={bandLabel(SOUND.bands, soundDb)}
            bgColor={soundColor}
            note={soundNote}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StatCard
            title="Ultrasonic"
            icon={<Ruler className="w-4 h-4" />}
            value={distance.toFixed(0)}
            unit="cm"
            badge={bandLabel(ULTRA.bands, distance)}
            bgColor={ultraColor}
            note={ultraNote}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DigitalCard
            title="Gas Sensor"
            icon={<CloudAlert className="w-4 h-4" />}
            value={gasVal} // e.g., "No Gas" or "Gas Detected"
            bgColor={gasColor}
            note={gasNote}
          />
        </motion.div>
        <StatCard
          title="MPU6050"
          icon={<Activity className="w-4 h-4" />}
          value={latestRpi?.accel_mag?.toFixed(2) ?? "No Data"}
          unit="g"
          badge={latestRpi?.quake_status ?? "IDLE"}
          bgColor={mpuColor}
          note={mpuNote}
        />
      </div>

      {/* Live Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl border shadow-sm p-4">
          <h3 className="text-lg font-medium mb-4">Brightness</h3>
          <Graph 
            data={espData} 
            dataKey="brightness_pct"
            label="Brightness (%)"
            borderColor="rgb(255, 205, 86)"
            backgroundColor="rgba(255, 205, 86, 0.5)"
          />
        </div>
        <div className="rounded-2xl border shadow-sm p-4">
          <h3 className="text-lg font-medium mb-4">Sound Level</h3>
          <Graph 
            data={espData} 
            dataKey="sound_db"
            label="Sound (dB)"
            borderColor="rgb(75, 192, 192)"
            backgroundColor="rgba(75, 192, 192, 0.5)"
          />
        </div>
        <div className="rounded-2xl border shadow-sm p-4">
          <h3 className="text-lg font-medium mb-4">Ultrasonic Distance</h3>
          <Graph 
            data={rpiData} 
            dataKey="distance_cm"
            label="Distance (cm)"
            borderColor="rgb(255, 99, 132)"
            backgroundColor="rgba(255, 99, 132, 0.5)"
          />
        </div>
        <div className="rounded-2xl border shadow-sm p-4">
          <h3 className="text-lg font-medium mb-4">Acceleration</h3>
          <Graph 
            data={rpiData} 
            dataKey="accel_mag"
            label="Acceleration (g)"
            borderColor="rgb(54, 162, 235)"
            backgroundColor="rgba(54, 162, 235, 0.5)"
          />
        </div>
        {/* <div className="rounded-2xl border shadow-sm p-4 lg:col-span-2">
          <h3 className="text-lg font-medium mb-4">Gas Detection</h3>
          <Graph 
            data={espData} 
            dataKey="gas"
            label="Gas"
            borderColor="rgb(153, 102, 255)"
            backgroundColor="rgba(153, 102, 255, 0.5)"
          />
        </div> */}
      </div>

      {/* Main charts */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardChart title="Brightness & Sound (last 5 min)" data={data} yKeys={["brightness_pct", "sound_db"]} yDomains={[[0, 100], [30, 100]]} />
        <CardChart title="Gas & Ultrasonic (last 5 min)" data={data} yKeys={["gas_level", "distance_cm"]} yDomains={[[0, 1], [0, 300]]} />
      </div> */}

      {/* Mini charts row */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <MiniCard title="Brightness mini" k="brightness_pct" data={data} />
        <MiniCard title="Sound mini" k="sound_db" data={data} />
        <MiniCard title="Gas mini" k="gas_level" data={data} />
        <MiniCard title="Ultrasonic mini" k="distance_cm" data={data} />
      </div> */}
    </div>
  );
}

// function CardChart({
//   title,
//   data,
//   yKeys,
//   yDomains,
// }: {
//   title: string;
//   data: Sample[];
//   yKeys: string[];
//   yDomains: [number, number][];
// }) {
//   return (
//     <div className="rounded-2xl border shadow-sm">
//       <div className="p-4 border-b">
//         <h3 className="text-base font-medium">{title}</h3>
//       </div>
//       <div className="p-4 h-64">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart
//             data={data}
//             margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis
//               dataKey="t"
//               tickFormatter={(t) =>
//                 new Date(t).toLocaleTimeString([], {
//                   minute: "2-digit",
//                   second: "2-digit",
//                 })
//               }
//               minTickGap={32}
//             />
//             {yKeys.map((_, idx) => (
//               <YAxis
//                 key={idx}
//                 yAxisId={idx}
//                 domain={yDomains[idx]}
//                 tickCount={6}
//                 orientation={idx === 1 ? "right" : "left"}
//               />
//             ))}
//             <Tooltip
//               labelFormatter={(t) => new Date(t as number).toLocaleTimeString()}
//             />
//             {yKeys.map((key, idx) => (
//               <Line
//                 key={key}
//                 yAxisId={idx}
//                 type="monotone"
//                 dataKey={key}
//                 strokeWidth={2}
//                 dot={false}
//               />
//             ))}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }

// function MiniCard({
//   title,
//   k,
//   data,
// }: {
//   title: string;
//   k: keyof (typeof data)[0];
//   data: Sample[];
// }) {
//   return (
//     <div className="rounded-2xl border shadow-sm">
//       <div className="p-2 border-b">
//         <h4 className="text-sm font-medium">{title}</h4>
//       </div>
//       <div className="p-2">
//         <MiniChart data={data} k={k} />
//       </div>
//     </div>
//   );
// }
