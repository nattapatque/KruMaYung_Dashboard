import { useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Sun,
  Volume2,
  CloudAlert,
  Ruler,
  Activity,
  RefreshCw,
  Snowflake,
  Sparkles,
  Gift,
  TreePine,
  Bell,
  ScanFace,
} from "lucide-react";
import { motion } from "framer-motion";

import { DigitalCard } from "../components/DigitalCard.tsx";
import { StatCard } from "../components/StatCard";
import Graph from "../components/Graph";
import FaceDetectionLog from "../components/FaceDetectionLog";
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

  const garland = Array.from({ length: 18 }, (_, idx) =>
    ["bg-emerald-300", "bg-amber-300", "bg-rose-300", "bg-teal-200", "bg-emerald-200"][
      idx % 5
    ]
  );

  return (
    <div className="relative min-h-screen px-4 pb-12 pt-6 text-emerald-50 md:px-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-52 w-52 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-4 top-1/3 h-40 w-40 rounded-full bg-amber-300/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-10">
        <div className="holiday-shell relative overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="holiday-pill uppercase tracking-[0.2em]">
                <Snowflake className="h-4 w-4 text-amber-200" />
                Holiday mode
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <TreePine className="h-9 w-9 text-emerald-200" />
                  <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                    Merry & Bright Sensor Watch
                  </h1>
                </div>
                <p className="max-w-2xl text-sm text-emerald-50/80 md:text-base">
                  Keep the lab cozy and safe with live IoT telemetry wrapped in a
                  winter glow. Monitor everything in one tidy view.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="holiday-pill">
                  <Sparkles className="h-4 w-4 text-amber-200" />
                  Last update{" "}
                  <span className="font-semibold text-white">{lastUpdated}</span>
                </span>
                <span className="holiday-pill">
                  <Gift className="h-4 w-4 text-amber-200" />
                  Live Firebase stream
                </span>
                <span className="holiday-pill">
                  <Bell className="h-4 w-4 text-amber-200" />
                  Alerts ready
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {garland.map((color, idx) => (
                  <span
                    key={idx}
                    className={`h-2 w-6 rounded-full ${color} shadow-[0_6px_14px_-6px_rgba(0,0,0,0.7)]`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <Button
                variant="default"
                className="shadow-xl shadow-emerald-900/30"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh data
              </Button>
              <p className="text-xs text-emerald-50/70">
                Reload if your elves pushed new readings.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-amber-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-50/70">
                Sensor snapshots
              </p>
              <h2 className="text-xl font-semibold">Stay on the nice list</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <StatCard
                title="Brightness"
                icon={<Sun className="h-4 w-4" />}
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
                icon={<Volume2 className="h-4 w-4" />}
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
                icon={<Ruler className="h-4 w-4" />}
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
                icon={<CloudAlert className="h-4 w-4" />}
                value={gasVal}
                bgColor={gasColor}
                note={gasNote}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="xl:col-span-4"
            >
              <StatCard
                title="MPU6050"
                icon={<Activity className="h-4 w-4" />}
                value={latestRpi?.accel_mag?.toFixed(2) ?? "No Data"}
                unit="g"
                badge={latestRpi?.quake_status ?? "IDLE"}
                bgColor={mpuColor}
                note={mpuNote}
              />
            </motion.div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <ScanFace className="h-4 w-4 text-amber-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-50/70">
                Face detection trail
              </p>
              <h2 className="text-xl font-semibold">
                Presence snapshots from the RPi feed
              </h2>
            </div>
          </div>

          <FaceDetectionLog
            samples={rpiData}
            latest={latestRpi}
            sourcePath="/devices/rpi-cedt-node-01/telemetry"
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Snowflake className="h-4 w-4 text-amber-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-50/70">
                Cozy live trends
              </p>
              <h2 className="text-xl font-semibold">
                Watch the sleigh ride in real time
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div
              className={`chart-card relative overflow-hidden rounded-2xl p-5 ${brightnessColor} text-white`}
            >
              <div className="pointer-events-none absolute right-6 top-4 h-12 w-12 rounded-full bg-amber-300/20 blur-xl" />
              <h3 className="mb-3 text-lg font-medium text-white">
                Brightness
              </h3>
              <Graph
                data={espData}
                dataKey="brightness_pct"
                label="Brightness (%)"
                borderColor="rgb(255, 205, 86)"
                backgroundColor="rgba(255, 205, 86, 0.35)"
              />
            </div>
            <div
              className={`chart-card relative overflow-hidden rounded-2xl p-5 ${soundColor} text-white`}
            >
              <div className="pointer-events-none absolute right-6 top-4 h-12 w-12 rounded-full bg-amber-300/20 blur-xl" />
              <h3 className="mb-3 text-lg font-medium text-white">
                Sound Level
              </h3>
              <Graph
                data={espData}
                dataKey="sound_db"
                label="Sound (dB)"
                borderColor="rgb(75, 192, 192)"
                backgroundColor="rgba(75, 192, 192, 0.35)"
              />
            </div>
            <div
              className={`chart-card relative overflow-hidden rounded-2xl p-5 ${ultraColor} text-white`}
            >
              <div className="pointer-events-none absolute right-6 top-4 h-12 w-12 rounded-full bg-amber-300/20 blur-xl" />
              <h3 className="mb-3 text-lg font-medium text-white">
                Ultrasonic Distance
              </h3>
              <Graph
                data={rpiData}
                dataKey="distance_cm"
                label="Distance (cm)"
                borderColor="rgb(255, 99, 132)"
                backgroundColor="rgba(255, 99, 132, 0.35)"
              />
            </div>
            <div
              className={`chart-card relative overflow-hidden rounded-2xl p-5 ${mpuColor} text-white`}
            >
              <div className="pointer-events-none absolute right-6 top-4 h-12 w-12 rounded-full bg-amber-300/20 blur-xl" />
              <h3 className="mb-3 text-lg font-medium text-white">
                Acceleration
              </h3>
              <Graph
                data={rpiData}
                dataKey="accel_mag"
                label="Acceleration (g)"
                borderColor="rgb(54, 162, 235)"
                backgroundColor="rgba(54, 162, 235, 0.35)"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
