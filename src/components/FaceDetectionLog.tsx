import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock3,
  Fingerprint,
  History,
  Radar,
  ScanFace,
  Sparkles,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import type { RecognizedFace, Sample } from "../hooks/useSensorStream";
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

function formatSimilarity(sim?: number) {
  if (typeof sim !== "number" || Number.isNaN(sim)) return "—";
  return `${Math.round(sim * 100)}% match`;
}

function formatBBox(face?: RecognizedFace) {
  const bbox = face?.bbox;
  if (!bbox) return null;
  return `bbox x:${bbox.x} y:${bbox.y} w:${bbox.w} h:${bbox.h}`;
}

export function FaceDetectionLog({
  samples,
  latest,
  sourcePath,
}: FaceDetectionLogProps) {
  const faceSamples = samples.filter(
    (s) =>
      typeof s.face_detected === "boolean" ||
      typeof s.known_face === "boolean" ||
      typeof s.faces_count === "number" ||
      Array.isArray(s.recognized_faces) ||
      typeof s.face_last_seen_ts === "number"
  );
  const latestWithFace =
    faceSamples.length > 0 ? faceSamples[faceSamples.length - 1] : null;

  const latestRecognitions: RecognizedFace[] =
    latest?.recognized_faces ??
    latestWithFace?.recognized_faces ??
    [];

  const facesCount =
    typeof latest?.faces_count === "number"
      ? latest.faces_count
      : typeof latestWithFace?.faces_count === "number"
      ? latestWithFace.faces_count
      : latestRecognitions.length
      ? latestRecognitions.length
      : undefined;

  const knownFacePresent = (() => {
    if (typeof latest?.face_detected === "boolean") return latest.face_detected;
    if (typeof latest?.known_face === "boolean") return latest.known_face;
    if (typeof latestWithFace?.face_detected === "boolean")
      return latestWithFace.face_detected;
    if (typeof latestWithFace?.known_face === "boolean")
      return latestWithFace.known_face;
    return latestRecognitions.some((f) => f.known);
  })();

  const anyFacePresent =
    typeof facesCount === "number"
      ? facesCount > 0
      : latestRecognitions.length > 0 ||
        faceSamples.some((s) => (s.faces_count ?? 0) > 0);

  const lastKnownSnapshot =
    [...faceSamples].reverse().find(
      (s) =>
        s.face_detected ||
        s.known_face ||
        s.face_last_seen_iso ||
        s.recognized_faces?.some((f) => f.known)
    ) ?? null;

  const lastKnownIso = lastKnownSnapshot?.face_last_seen_iso;
  const lastKnownTs =
    lastKnownSnapshot?.face_last_seen_ts ??
    (lastKnownIso ? Date.parse(lastKnownIso) : lastKnownSnapshot?.t);
  const lastKnownLabel =
    lastKnownSnapshot?.recognized_faces?.find((f) => f.known)?.label;

  const latestFrameTs = latest?.t ?? latestWithFace?.t;

  const windowStart = Date.now() - 15 * 60 * 1000;
  const windowSamples = faceSamples.filter((s) => s.t >= windowStart);
  const seenInWindow = windowSamples.filter(
    (s) =>
      (s.faces_count ?? 0) > 0 ||
      s.recognized_faces?.length ||
      s.face_detected ||
      s.known_face
  ).length;
  const presencePct = windowSamples.length
    ? Math.round((seenInWindow / windowSamples.length) * 100)
    : 0;

  const streakMs = (() => {
    if (!faceSamples.length || typeof knownFacePresent !== "boolean")
      return undefined;
    let lastChangeTs: number | undefined;
    for (let i = faceSamples.length - 1; i >= 0; i--) {
      const s = faceSamples[i];
      const state =
        typeof s.face_detected === "boolean"
          ? s.face_detected
          : typeof s.known_face === "boolean"
          ? s.known_face
          : s.recognized_faces?.some((f) => f.known)
          ? true
          : null;
      if (state !== null && state !== knownFacePresent) {
        lastChangeTs = faceSamples[i + 1]?.t ?? s.t;
        break;
      }
    }
    if (!lastChangeTs) lastChangeTs = faceSamples[0].t;
    return Date.now() - lastChangeTs;
  })();

  const timeline = faceSamples.slice(-12).reverse();

  const latestKnownCount = latestRecognitions.filter(
    (f) => f.known !== false && f.label.toLowerCase() !== "unknown"
  ).length;
  const latestUnknownCount = latestRecognitions.filter(
    (f) => f.known === false || f.label.toLowerCase() === "unknown"
  ).length;

  const stateBadge =
    knownFacePresent === true
      ? {
          label: "Known face detected",
          color:
            "bg-rose-500/80 text-rose-50 border border-rose-200/40 shadow-[0_10px_45px_-22px_rgba(255,87,120,0.9)]",
        }
      : anyFacePresent
      ? {
          label: "Faces present (unknown)",
          color:
            "bg-amber-500/70 text-amber-50 border border-amber-200/40 shadow-[0_10px_45px_-22px_rgba(251,191,36,0.7)]",
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
              {knownFacePresent === true
                ? "Known face spotted"
                : anyFacePresent
                ? "Faces visible (unlabeled)"
                : "No faces in the current frame"}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Latest frame has{" "}
              {typeof facesCount === "number"
                ? `${facesCount} face${facesCount === 1 ? "" : "s"}`
                : "no face count yet"}
              , streamed from{" "}
              <code className="rounded bg-black/20 px-1.5 py-0.5 text-[11px]">
                {sourceLabel}
              </code>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Clock3 className="h-4 w-4 text-amber-200" />
              Last known face
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {lastKnownTs ? formatRelative(lastKnownTs) : "No known face yet"}
            </div>
            <p className="mt-1 text-xs text-white/60">
              Label: {lastKnownLabel ?? "—"}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Timestamp:{" "}
              {lastKnownIso
                ? lastKnownIso
                : lastKnownTs
                ? formatClock(lastKnownTs)
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <History className="h-4 w-4 text-amber-200" />
              Activity streak
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {streakMs ? formatDuration(streakMs) : "—"}
            </div>
            <p className="mt-1 text-xs text-white/60">
              {presencePct}% face presence across the last 15 minutes window.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/70">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(240,199,94,0.12)]" />
                Latest recognition frame
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px]">
                {latestFrameTs ? formatClock(latestFrameTs) : "Waiting..."}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/10 px-3 py-1">
                Known: {latestKnownCount}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Unknown: {latestUnknownCount}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                From {sourceLabel}
              </span>
            </div>

            {latestRecognitions.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/10 px-3 py-10 text-sm text-white/60">
                Waiting for recognized_faces payload to arrive…
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {latestRecognitions.map((face, idx) => {
                  const badgeColor = face.known
                    ? "bg-rose-500/80 text-rose-50 border border-rose-200/40"
                    : "bg-emerald-500/60 text-emerald-50 border border-emerald-200/40";
                  const bboxText = formatBBox(face);
                  return (
                    <motion.div
                      key={`${face.label}-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-emerald-900/10 p-3 shadow-inner shadow-emerald-950/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${badgeColor}`}>
                            {face.known ? (
                              <UserCheck className="h-5 w-5" />
                            ) : (
                              <UserX className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{face.label}</p>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-white/60">
                              {face.known ? "Known face" : "Unknown face"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/80">
                          {formatSimilarity(face.similarity)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                        {bboxText && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5">
                            {bboxText}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
                          <Fingerprint className="h-3 w-3 text-amber-200" />
                          label: {face.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-black/20 via-emerald-950/40 to-black/30 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/70">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_0_6px_rgba(244,114,182,0.12)]" />
                Snapshot trail
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px]">
                Last {timeline.length || 0} frames with face payload
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-auto pr-1">
              {timeline.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/10 px-3 py-10 text-sm text-white/60">
                  Waiting for face telemetry to arrive…
                </div>
              ) : (
                timeline.map((entry, idx) => {
                  const entryFaces = entry.recognized_faces ?? [];
                  const entryKnown = entryFaces.filter(
                    (f) => f.known !== false && f.label.toLowerCase() !== "unknown"
                  );
                  const entryUnknown = entryFaces.filter(
                    (f) => f.known === false || f.label.toLowerCase() === "unknown"
                  );
                  const entryCount =
                    typeof entry.faces_count === "number"
                      ? entry.faces_count
                      : entryFaces.length;
                  const knownBadge =
                    entry.face_detected ??
                    entry.known_face ??
                    entryKnown.length > 0;
                  const badge = knownBadge
                    ? "bg-rose-500/80 text-rose-50 border border-rose-200/40"
                    : entryCount > 0
                    ? "bg-amber-500/60 text-amber-50 border border-amber-200/40"
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
                              {knownBadge
                                ? "Known face"
                                : entryCount > 0
                                ? "Unknown only"
                                : "Clear"}
                            </span>
                            <span className="text-[11px] text-white/70">
                              {entryCount} face{entryCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          <span className="text-xs text-white/60">
                            {formatClock(entry.t)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
                          {entryKnown.length ? (
                            entryKnown.map((f, i) => (
                              <span
                                key={`${f.label}-${i}`}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5"
                              >
                                <UserCheck className="h-3 w-3 text-rose-200" />
                                {f.label}
                              </span>
                            ))
                          ) : entryCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
                              <UserX className="h-3 w-3 text-amber-200" />
                              No known labels in this frame
                            </span>
                          ) : null}
                          {entryUnknown.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
                              <Users className="h-3 w-3 text-emerald-200" />
                              {entryUnknown.length} unknown
                            </span>
                          )}
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-black/15 via-emerald-900/30 to-black/25 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <AlertTriangle className="h-4 w-4 text-amber-200" />
            Quick read for the new face payload
          </div>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_0_6px_rgba(240,199,94,0.18)]" />
              <span>
                <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">recognized_faces</code> carries one object per face with <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">label</code>, <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">similarity</code>, <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">known</code>, and bounding box <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">bbox</code>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
              <span>
                <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">face_detected</code> / <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">known_face</code> is true when a known face is present; <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">faces_count</code> reflects total faces (known + unknown).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-rose-200 shadow-[0_0_0_6px_rgba(244,114,182,0.18)]" />
              <span>
                <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">face_last_seen_iso</code> is emitted when a known face is present in the frame; timestamps in the list above are straight from the Firebase snapshots for auditability.
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default FaceDetectionLog;
