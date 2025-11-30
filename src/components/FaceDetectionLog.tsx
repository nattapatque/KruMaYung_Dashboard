import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock3,
  History,
  Radar,
  ScanFace,
  Sparkles,
} from "lucide-react";
import type { Sample } from "../hooks/useSensorStream";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type FaceDetectionLogProps = {
  samples: Sample[];
  latest: Sample | null;
  sourcePath?: string;
};

function formatRelative(ts?: number) {
  if (!ts || Number.isNaN(ts)) return "Never";
  const diff = Date.now() - ts;
  if (diff < 0) return "Moments ago";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatClock(ts?: number) {
  if (!ts || Number.isNaN(ts)) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms?: number) {
  if (!ms || ms < 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  if (hours) return `${hours}h ${minutes % 60}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function FaceDetectionLog({
  samples,
  latest,
  sourcePath,
}: FaceDetectionLogProps) {
  const faceSamples = samples.filter(
    (s) =>
      typeof s.face_detected === "boolean" ||
      typeof s.face_last_seen_ts === "number"
  );
  const latestWithFace =
    faceSamples.length > 0 ? faceSamples[faceSamples.length - 1] : null;

  const currentState =
    typeof latest?.face_detected === "boolean"
      ? latest.face_detected
      : typeof latestWithFace?.face_detected === "boolean"
      ? latestWithFace.face_detected
      : null;

  const lastSeenTs = (() => {
    if (latest?.face_last_seen_ts) return latest.face_last_seen_ts;
    for (let i = faceSamples.length - 1; i >= 0; i--) {
      if (faceSamples[i].face_last_seen_ts) return faceSamples[i].face_last_seen_ts;
      if (faceSamples[i].face_detected) return faceSamples[i].t;
    }
    return undefined;
  })();

  const windowStart = Date.now() - 15 * 60 * 1000;
  const windowSamples = faceSamples.filter((s) => s.t >= windowStart);
  const seenInWindow = windowSamples.filter((s) => s.face_detected).length;
  const presencePct = windowSamples.length
    ? Math.round((seenInWindow / windowSamples.length) * 100)
    : 0;

  const streakMs = (() => {
    if (!faceSamples.length || typeof currentState !== "boolean") return undefined;
    let lastChangeTs: number | undefined;
    for (let i = faceSamples.length - 1; i >= 0; i--) {
      const state = faceSamples[i].face_detected;
      if (typeof state === "boolean" && state !== currentState) {
        lastChangeTs = faceSamples[i + 1]?.t ?? faceSamples[i].t;
        break;
      }
    }
    if (!lastChangeTs) lastChangeTs = faceSamples[0].t;
    return Date.now() - lastChangeTs;
  })();

  const timeline = faceSamples.slice(-24).reverse();

  const stateBadge =
    currentState === true
      ? {
          label: "Face detected",
          color:
            "bg-rose-500/80 text-rose-50 border border-rose-200/40 shadow-[0_10px_45px_-22px_rgba(255,87,120,0.9)]",
        }
      : currentState === false
      ? {
          label: "No face in frame",
          color:
            "bg-emerald-500/60 text-emerald-50 border border-emerald-200/40 shadow-[0_10px_45px_-22px_rgba(34,197,94,0.7)]",
        }
      : {
          label: "Waiting for face data",
          color:
            "bg-white/10 text-white border border-white/20 shadow-[0_10px_45px_-22px_rgba(255,255,255,0.35)]",
        };

  const sourceLabel = sourcePath ?? "/devices/rpi-cedt-node-01/telemetry";

  return (
    <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-emerald-950/70 via-emerald-900/40 to-emerald-950/40">
      <div className="pointer-events-none absolute -left-12 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl" />
      <CardHeader className="relative flex flex-row items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-300/30 text-amber-100">
            <ScanFace className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-emerald-50/70">
              Face status log
            </p>
            <CardTitle className="flex items-center gap-2 text-xl">
              Presence & last seen trail
              <Sparkles className="h-4 w-4 text-amber-200" />
            </CardTitle>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.08em] ${stateBadge.color}`}
        >
          {stateBadge.label}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Radar className="h-4 w-4 text-amber-200" />
              Live presence
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {currentState === true ? "Someone is in frame" : currentState === false ? "No face right now" : "Waiting on first sighting"}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Streamed from <code className="rounded bg-black/20 px-1.5 py-0.5 text-[11px]">{sourceLabel}</code>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Clock3 className="h-4 w-4 text-amber-200" />
              Last seen
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {lastSeenTs ? formatRelative(lastSeenTs) : "No sightings yet"}
            </div>
            <p className="mt-1 text-xs text-white/60">
              Last timestamp: {lastSeenTs ? formatClock(lastSeenTs) : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <History className="h-4 w-4 text-amber-200" />
              Current streak
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {streakMs ? formatDuration(streakMs) : "—"}
            </div>
            <p className="mt-1 text-xs text-white/60">
              {presencePct}% presence across the last 15 minutes window.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/70">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(240,199,94,0.12)]" />
                Recent face snapshots
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px]">
                Latest {timeline.length || 0} with face data
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-auto pr-1">
              {timeline.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/10 px-3 py-10 text-sm text-white/60">
                  Waiting for face telemetry to arrive…
                </div>
              ) : (
                timeline.map((entry, idx) => {
                  const detected = entry.face_detected;
                  const seenTs = entry.face_last_seen_ts ?? (entry.face_detected ? entry.t : undefined);
                  const badge =
                    detected === true
                      ? "bg-rose-500/80 text-rose-50 border border-rose-200/40"
                      : detected === false
                      ? "bg-emerald-500/60 text-emerald-50 border border-emerald-200/40"
                      : "bg-white/10 text-white border border-white/20";
                  return (
                    <motion.div
                      key={`${entry.t}-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-emerald-900/10 p-3 shadow-inner shadow-emerald-950/40"
                    >
                      <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border ${badge}`}>
                        <ScanFace className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.08em] ${badge}`}>
                              {detected === true
                                ? "Detected"
                                : detected === false
                                ? "Clear"
                                : "Unknown"}
                            </span>
                            {seenTs && (
                              <span className="text-[11px] text-white/70">
                                Last seen {formatRelative(seenTs)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/60">
                            {formatClock(entry.t)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/70">
                          <span>Snapshot {formatRelative(entry.t)}</span>
                          {entry.face_last_seen_iso && (
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px]">
                              ISO {entry.face_last_seen_iso}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-black/20 via-emerald-950/40 to-black/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle className="h-4 w-4 text-amber-200" />
              Quick read
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_0_6px_rgba(240,199,94,0.18)]" />
                <span>
                  Presence % looks at the last 15 minutes of snapshots so you can tell whether the space has been occupied recently.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
                <span>
                  The streak timer shows how long the feed has stayed in the current detected/clear state.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-rose-200 shadow-[0_0_0_6px_rgba(244,114,182,0.18)]" />
                <span>
                  Each log row comes directly from the Firebase RPi telemetry payload (including <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">face_detected</code> and <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">face_last_seen_iso</code>), so you can audit exactly what was sent.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FaceDetectionLog;
