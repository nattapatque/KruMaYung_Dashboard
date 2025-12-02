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
import type {
  FaceStatus,
  RecognizedFace,
  Sample,
} from "../hooks/useSensorStream";
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

const bangkokTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function formatClock(ts?: number) {
  if (!ts || Number.isNaN(ts)) return "—";
  return `${bangkokTime.format(ts)} GMT+7`;
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

function resolveStatus(sample?: Sample | null): FaceStatus | undefined {
  if (!sample) return undefined;
  if (
    sample.face_status === "face_detected" ||
    sample.face_status === "clear"
  ) {
    return sample.face_status;
  }
  if (typeof sample.face_detected === "boolean") {
    return sample.face_detected ? "face_detected" : "clear";
  }
  if (typeof sample.known_face === "boolean") {
    return sample.known_face ? "face_detected" : undefined;
  }
  return undefined;
}

function resolveKnown(sample?: Sample | null): boolean | undefined {
  if (!sample) return undefined;
  if (typeof sample.known_face === "boolean") return sample.known_face;
  if (sample.recognized_faces?.some((f) => f.known)) return true;
  return undefined;
}

export function FaceDetectionLog({
  samples,
  latest,
  sourcePath,
}: FaceDetectionLogProps) {
  const faceSamples = samples.filter(
    (s) =>
      typeof s.face_status === "string" ||
      typeof s.face_detected === "boolean" ||
      typeof s.known_face === "boolean" ||
      typeof s.faces_count === "number" ||
      Array.isArray(s.recognized_faces) ||
      typeof s.face_last_seen_ts === "number" ||
      typeof s.face_last_seen_iso === "string"
  );
  const latestWithFace =
    faceSamples.length > 0 ? faceSamples[faceSamples.length - 1] : null;

  const latestStatus =
    resolveStatus(latest) ?? resolveStatus(latestWithFace);

  const latestKnown =
    resolveKnown(latest) ?? resolveKnown(latestWithFace);

  const latestRecognitionSnapshot =
    (latest?.recognized_faces?.length ? latest : null) ??
    faceSamples
      .slice()
      .reverse()
      .find((s) => (s.recognized_faces?.length ?? 0) > 0) ??
    null;

  const latestRecognitions: RecognizedFace[] =
    latestRecognitionSnapshot?.recognized_faces ?? [];

  const facesCount =
    typeof latest?.faces_count === "number"
      ? latest.faces_count
      : typeof latestWithFace?.faces_count === "number"
      ? latestWithFace.faces_count
      : typeof latestRecognitionSnapshot?.faces_count === "number"
      ? latestRecognitionSnapshot.faces_count
      : latestRecognitions.length || undefined;

  const lastKnownSnapshot =
    [...faceSamples].reverse().find(
      (s) =>
        s.known_face ||
        s.face_last_seen_iso ||
        s.recognized_faces?.some((f) => f.known)
    ) ?? null;

  const lastKnownIso = lastKnownSnapshot?.face_last_seen_iso;
  const lastKnownLabel =
    lastKnownSnapshot?.recognized_faces?.find((f) => f.known)?.label;

  const latestFrameTs =
    latest?.t ?? latestWithFace?.t ?? latestRecognitionSnapshot?.t;

  const windowStart = Date.now() - 15 * 60 * 1000;
  const windowSamples = faceSamples.filter((s) => s.t >= windowStart);
  const seenInWindow = windowSamples.filter(
    (s) => resolveStatus(s) === "face_detected"
  ).length;
  const presencePct = windowSamples.length
    ? Math.round((seenInWindow / windowSamples.length) * 100)
    : 0;

  const streakMs = (() => {
    if (!faceSamples.length || !latestStatus) return undefined;
    let lastChangeTs: number | undefined;
    for (let i = faceSamples.length - 1; i >= 0; i--) {
      const status = resolveStatus(faceSamples[i]);
      if (status && status !== latestStatus) {
        lastChangeTs = faceSamples[i + 1]?.t ?? faceSamples[i].t;
        break;
      }
    }
    if (!lastChangeTs) lastChangeTs = faceSamples[0].t;
    return Date.now() - lastChangeTs;
  })();

  const todayStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  let knownDetectionsToday = 0;
  let unknownDetectionsToday = 0;
  let prevStatusToday: FaceStatus | undefined;
  faceSamples
    .filter((s) => s.t >= todayStart)
    .forEach((s) => {
      const status = resolveStatus(s);
      const known = resolveKnown(s);
      if (status === "face_detected" && prevStatusToday !== "face_detected") {
        if (known === true) knownDetectionsToday += 1;
        else unknownDetectionsToday += 1;
      }
      if (status) prevStatusToday = status;
    });

  type TimelineEvent = {
    ts: number;
    status?: FaceStatus;
    known?: boolean;
    faces?: number;
    recognized_faces?: RecognizedFace[];
    face_last_seen_iso?: string;
  };

  const timelineEvents: TimelineEvent[] = [];
  let prevStatus: FaceStatus | undefined;
  let prevKnown: boolean | undefined;
  for (const s of faceSamples) {
    const status = resolveStatus(s);
    const known = resolveKnown(s);
    const changed =
      (status && status !== prevStatus) ||
      (typeof known === "boolean" && known !== prevKnown);

    if (changed) {
      timelineEvents.push({
        ts: s.t,
        status,
        known,
        faces:
          typeof s.faces_count === "number"
            ? s.faces_count
            : s.recognized_faces?.length,
        recognized_faces: s.recognized_faces,
        face_last_seen_iso: s.face_last_seen_iso,
      });
    }

    if (status) prevStatus = status;
    if (typeof known === "boolean") prevKnown = known;
  }

  const timeline = timelineEvents.slice(-14).reverse();

  const statusBadge =
    latestStatus === "face_detected"
      ? latestKnown
        ? {
            label: "Known face confirmed",
            tone:
              "bg-emerald-300/80 text-emerald-950 border border-emerald-50/80 shadow-[0_10px_45px_-22px_rgba(16,185,129,0.8)]",
            sub: "Debounced lock from the Pi",
          }
        : {
            label: "Face detected (awaiting ID)",
            tone:
              "bg-amber-500/70 text-amber-50 border border-amber-200/40 shadow-[0_10px_45px_-22px_rgba(251,191,36,0.7)]",
            sub: "Any-face signal is debounced",
          }
      : latestStatus === "clear"
      ? {
          label: "No face in view",
          tone:
            "bg-white/10 text-white border border-white/20 shadow-[0_10px_45px_-22px_rgba(255,255,255,0.35)]",
          sub: "Debounced clear",
        }
      : {
          label: "Waiting for face data",
          tone:
            "bg-white/10 text-white border border-white/20 shadow-[0_10px_45px_-22px_rgba(255,255,255,0.35)]",
          sub: "Listening for the next snapshot",
        };

  const statusChangeKey = `${latestStatus ?? "unknown"}-${
    latest?.t ?? latestWithFace?.t ?? "na"
  }`;

  const activeKnown = latestKnown === true;
  const showUnknownAlert =
    latestStatus === "face_detected" && latestKnown === false;
  const unknownAlertTs = latestFrameTs;

  const identitySnapshot =
    (latest?.known_face ? latest : null) ??
    (latestWithFace?.known_face ? latestWithFace : null) ??
    lastKnownSnapshot ??
    latestRecognitionSnapshot ??
    null;

  const identityFaces = identitySnapshot?.recognized_faces ?? [];
  const identityLastSeenIso =
    identitySnapshot?.face_last_seen_iso ?? lastKnownIso;
  const parsedIdentityTs =
    identityLastSeenIso && Number.isFinite(Date.parse(identityLastSeenIso))
      ? Date.parse(identityLastSeenIso)
      : undefined;
  const identityLastSeenTs =
    identitySnapshot?.face_last_seen_ts ??
    parsedIdentityTs ??
    identitySnapshot?.t;
  const identityState =
    activeKnown ? "active" : identitySnapshot ? "recent" : "none";

  const faceDetectedFlag =
    typeof latest?.face_detected === "boolean"
      ? latest.face_detected
      : typeof latestWithFace?.face_detected === "boolean"
      ? latestWithFace.face_detected
      : undefined;

  const knownFaceFlag =
    typeof latest?.known_face === "boolean"
      ? latest.known_face
      : typeof latestWithFace?.known_face === "boolean"
      ? latestWithFace.known_face
      : undefined;

  const knownFacesList = identityFaces.filter(
    (f) => f.known !== false && f.label.toLowerCase() !== "unknown"
  );
  const unknownFacesList = identityFaces.filter(
    (f) => f.known === false || f.label.toLowerCase() === "unknown"
  );
  const recognitionTimestamp = identitySnapshot?.t ?? latestFrameTs;

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
        <motion.div
          key={statusChangeKey}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold uppercase tracking-[0.08em] ${statusBadge.tone}`}
        >
          <div className="flex items-center gap-2">
            <span>{statusBadge.label}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_0_6px_rgba(255,255,255,0.15)] animate-pulse" />
          </div>
          <p className="mt-0.5 text-[10px] font-normal normal-case text-white/80">
            {statusBadge.sub}
          </p>
        </motion.div>
      </CardHeader>
      <CardContent className="relative space-y-5">
        {showUnknownAlert && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-amber-200/30 bg-amber-500/15 px-4 py-3 text-amber-50 shadow-[0_10px_40px_-20px_rgba(245,158,11,0.35)]"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Unknown face detected</p>
              <p className="text-xs text-amber-50/80">
                Waiting for the known-face threshold to trip.{" "}
                {unknownAlertTs ? `Last frame ${formatClock(unknownAlertTs)}.` : ""}
              </p>
            </div>
          </motion.div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Radar className="h-4 w-4 text-amber-200" />
              Face status (debounced)
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {latestStatus === "face_detected"
                ? activeKnown
                  ? "Known face locked after threshold"
                  : "Face detected, gating identity"
                : latestStatus === "clear"
                ? "No face in the frame"
                : "Waiting for face telemetry"}
            </div>
            <p className="mt-2 text-xs text-white/60">
              face_status:{" "}
              <code className="rounded bg-black/20 px-1.5 py-0.5 text-[11px]">
                {latestStatus ?? "—"}
              </code>{" "}
              · face_detected:{" "}
              {typeof faceDetectedFlag === "boolean" ? String(faceDetectedFlag) : "—"} ·
              known_face: {typeof knownFaceFlag === "boolean" ? String(knownFaceFlag) : "—"}
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-200 animate-pulse" />
                Debounced
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Clock3 className="h-4 w-4 text-amber-200" />
              Last confirmed identity
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {identityState !== "none"
                ? identityLastSeenTs
                  ? formatRelative(identityLastSeenTs)
                  : "Timestamp pending"
                : "No known face yet"}
            </div>
            <p className="mt-1 text-xs text-white/60">
              Label: {identityFaces[0]?.label ?? lastKnownLabel ?? "—"}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Last seen: {identityLastSeenIso ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-950/30">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <History className="h-4 w-4 text-amber-200" />
              Activity & today
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {streakMs ? formatDuration(streakMs) : "—"}
            </div>
            <p className="mt-1 text-xs text-white/60">
              {presencePct}% face_status=detected across the last 15 minutes window.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/80">
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                Known detections today: {knownDetectionsToday}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                Unknown detections today: {unknownDetectionsToday}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                Stream: {sourceLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/70">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(240,199,94,0.12)]" />
                Identity panel
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px]">
                {recognitionTimestamp
                  ? formatClock(recognitionTimestamp)
                  : "Waiting..."}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/10 px-3 py-1">
                known_face:{" "}
                {typeof knownFaceFlag === "boolean" ? String(knownFaceFlag) : "—"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                face_status: {latestStatus ?? "—"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                face_last_seen_iso: {identityLastSeenIso ?? "—"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                faces_count: {typeof facesCount === "number" ? facesCount : "—"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                recognized_faces: {identityFaces.length}
              </span>
              {identityFaces.length > 0 && (
                <span className="rounded-full border border-white/10 px-3 py-1">
                  known labels: {knownFacesList.length} · unknown tags: {unknownFacesList.length}
                </span>
              )}
            </div>

            {identityFaces.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/10 px-3 py-10 text-sm text-white/60">
                {activeKnown
                  ? "Waiting for recognized_faces payload (debounced from the Pi)…"
                  : "No confirmed identity right now. Names will appear once known_face flips true."}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {identityFaces.map((face, idx) => {
                  const badgeColor = face.known
                    ? "bg-emerald-300/80 text-emerald-950 border border-emerald-100/80"
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
                        {typeof face.similarity === "number" ? (
                          <span className="rounded-full border border-white/10 px-2 py-0.5">
                            similarity: {formatSimilarity(face.similarity)}
                          </span>
                        ) : null}
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
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
                Snapshot trail
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px]">
                Last {timeline.length || 0} status flips
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
                  const entryKnownFaces = entryFaces.filter(
                    (f) => f.known !== false && f.label.toLowerCase() !== "unknown"
                  );
                  const entryUnknownFaces = entryFaces.filter(
                    (f) => f.known === false || f.label.toLowerCase() === "unknown"
                  );
                  const entryCount =
                    typeof entry.faces === "number" ? entry.faces : entryFaces.length;
                  const badge = entry.known
                    ? "bg-emerald-300/80 text-emerald-950 border border-emerald-100/80"
                    : entry.status === "face_detected"
                    ? "bg-amber-500/60 text-amber-50 border border-amber-200/40"
                    : "bg-white/10 text-white border border-white/20";
                  const statusLabel = entry.known
                    ? "Known face"
                    : entry.status === "face_detected"
                    ? "Face detected"
                    : "Clear";
                  return (
                    <motion.div
                      key={`${entry.ts}-${idx}`}
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
                              {statusLabel}
                            </span>
                            <span className="text-[11px] text-white/70">
                              {entryCount ?? 0} face{entryCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          <span className="text-xs text-white/60">
                            {formatClock(entry.ts)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
                          {entryKnownFaces.length ? (
                            entryKnownFaces.map((f, i) => (
                              <span
                                key={`${f.label}-${i}`}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5"
                              >
                                <UserCheck className="h-3 w-3 text-emerald-200" />
                                {f.label}
                              </span>
                            ))
                          ) : entry.known ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
                              <UserCheck className="h-3 w-3 text-emerald-200" />
                              Known face confirmed
                            </span>
                          ) : entry.status === "face_detected" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
                              <UserX className="h-3 w-3 text-amber-200" />
                              Waiting for known_face confirmation
                            </span>
                          ) : null}
                          {entryUnknownFaces.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
                              <Users className="h-3 w-3 text-emerald-200" />
                              {entryUnknownFaces.length} unknown
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

      </CardContent>
    </Card>
  );
}

export default FaceDetectionLog;
