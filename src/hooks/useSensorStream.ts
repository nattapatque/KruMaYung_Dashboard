import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "../config/firebase";

export type FaceStatus = "clear" | "face_detected";

export type Sample = {
  t: number;
  brightness_pct: number;
  sound_db: number;
  gas?: string;
  gas_detected?: boolean;
  flame?: string;
  flame_detected?: boolean;
  distance_cm: number;
  accel_mag: number;
  quake_status: "IDLE" | "ALARM";
  face_status?: FaceStatus;
  face_detected?: boolean;
  known_face?: boolean;
  faces_count?: number;
  recognized_faces?: RecognizedFace[];
  face_last_seen_iso?: string;
  face_last_seen_ts?: number;
  raw?: string;
};

export type FaceBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RecognizedFace = {
  label: string;
  similarity?: number;
  known?: boolean;
  bbox?: FaceBBox;
};

export function useSensorStream(deviceId: string, live = true) {
  const [data, setData] = useState<Sample[]>([]);
  const [latest, setLatest] = useState<Sample | null>(null);

  useEffect(() => {
    if (!live || !deviceId) return;

    const dbRef = ref(database, `/devices/${deviceId}/telemetry`);

    const parseBoolLike = (
      v: unknown,
      opts?: { trueHints?: RegExp[]; falseHints?: RegExp[] }
    ) => {
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") {
        const normalized = v.trim().toLowerCase();
        const trueTokens = [
          "true",
          "1",
          "yes",
          "y",
          "detected",
          "on",
          "present",
        ];
        const falseTokens = ["false", "0", "no", "n", "clear", "absent", "none"];
        if (falseTokens.includes(normalized)) return false;
        if (trueTokens.includes(normalized)) return true;
        if (opts?.falseHints?.some((re) => re.test(normalized))) return false;
        if (opts?.trueHints?.some((re) => re.test(normalized))) return true;
      }
      return null;
    };

    const parseFaceBool = (v: unknown) =>
      parseBoolLike(v, {
        trueHints: [/face[_\s]?detected/, /face/],
        falseHints: [/clear/],
      });

    const parseFaceStatus = (v: unknown): FaceStatus | undefined => {
      if (typeof v === "string") {
        const normalized = v.trim().toLowerCase();
        if (
          ["face_detected", "detected", "face", "present"].includes(normalized)
        ) {
          return "face_detected";
        }
        if (["clear", "no_face", "none", "absent"].includes(normalized)) {
          return "clear";
        }
      }
      if (typeof v === "boolean") {
        return v ? "face_detected" : "clear";
      }
      if (typeof v === "number") {
        return v > 0 ? "face_detected" : "clear";
      }
      return undefined;
    };

    const parseFlameBool = (v: unknown, flameText?: string) =>
      parseBoolLike(v, {
        trueHints: [/flame/, /fire/, /burn/],
        falseHints: [/no\s*flame/, /safe/, /clear/],
      }) ??
      (typeof flameText === "string"
        ? /flame|fire|burn/i.test(flameText) &&
          !/no\s*flame|safe|clear/i.test(flameText)
        : null);

    const parseNumber = (v: unknown) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const parseRecognizedFaces = (
      raw: unknown
    ): RecognizedFace[] | undefined => {
      if (!Array.isArray(raw)) return undefined;
      const parsed = raw
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const face = entry as Record<string, unknown>;
          const bboxRaw = face.bbox as Record<string, unknown> | undefined;
          const bboxCandidate = {
            x: parseNumber(bboxRaw?.x),
            y: parseNumber(bboxRaw?.y),
            w: parseNumber(bboxRaw?.w),
            h: parseNumber(bboxRaw?.h),
          };
          const hasBBox = Object.values(bboxCandidate).every(
            (v) => typeof v === "number"
          );
          const label =
            typeof face.label === "string" ? face.label : "unknown";
          const similarity = parseNumber(face.similarity);
          const known =
            typeof face.known === "boolean"
              ? face.known
              : label.toLowerCase() !== "unknown"
              ? true
              : undefined;

          return {
            label,
            similarity,
            known,
            ...(hasBBox ? { bbox: bboxCandidate as FaceBBox } : {}),
          } as RecognizedFace;
        })
        .filter(Boolean) as RecognizedFace[];

      return parsed.length ? parsed : undefined;
    };

    const unsub = onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          setData([]);
          setLatest(null);
          return;
        }

        const samples: Sample[] = Object.values(val)
          .map((rec: any): Sample | null => {
            const ts = rec?.ts;
            const t =
              typeof ts === "number"
                ? ts
                : typeof ts === "string"
                ? Date.parse(ts)
                : NaN;

            const brightnessSrc =
              rec?.brightness_pct ?? rec?.esp?.brightness_pct;
            const fromField =
              typeof brightnessSrc === "number"
                ? brightnessSrc
                : Number.isFinite(Number(brightnessSrc))
                ? Number(brightnessSrc)
                : NaN;

            let fromRaw = NaN;
            const rawPayload =
              (typeof rec?.raw === "string" && rec.raw) ||
              (typeof rec?.esp?.raw === "string" && rec.esp.raw) ||
              "";
            if (rawPayload) {
              const m = rawPayload.match(/"brightness_pct"\s*:\s*([\d.]+)/);
              if (m?.[1]) fromRaw = parseFloat(m[1]);
            }

            const brightness_pct = Number.isFinite(fromField)
              ? fromField
              : Number.isFinite(fromRaw)
              ? fromRaw
              : 0;

            const accelSrc =
              rec?.accel_mag ?? rec?.rpi?.accel_mag ?? rec?.esp?.accel_mag;
            const accel =
              typeof accelSrc === "number" ? accelSrc : Number(accelSrc) || 1;

            const soundSrc = rec?.sound_db ?? rec?.esp?.sound_db;
            const sound_db =
              typeof soundSrc === "number" ? soundSrc : Number(soundSrc) || 0;

            const distanceSrc =
              rec?.distance_cm ??
              rec?.rpi?.distance_cm ??
              rec?.esp?.distance_cm;
            const distance_cm =
              typeof distanceSrc === "number"
                ? distanceSrc
                : Number(distanceSrc) || 0;

            const flameRaw = rec?.flame ?? rec?.esp?.flame;
            const flame =
              typeof flameRaw === "string" ? flameRaw : undefined;
            const flameDetected = parseFlameBool(
              rec?.flame_detected ?? rec?.esp?.flame_detected,
              flame
            );

            const gasRaw = rec?.gas ?? rec?.esp?.gas;
            const gas = typeof gasRaw === "string" ? gasRaw : undefined;
            const gasDetected =
              parseBoolLike(rec?.gas_detected ?? rec?.esp?.gas_detected, {
                trueHints: [/gas\s*detected/, /alert/],
                falseHints: [/no\s*gas/, /clear/],
              }) ??
              (typeof gas === "string"
                ? /detected|alert/i.test(gas) &&
                  !/no\s*gas|none|clear/i.test(gas)
                : null);
            const face_status =
              parseFaceStatus(
                rec?.face_status ??
                  rec?.rpi?.face_status ??
                  rec?.rpi?.face_status_debounced
              ) ?? undefined;
            const faceDetected =
              parseFaceBool(
                rec?.face_detected ?? rec?.rpi?.face_detected
              ) ??
              (face_status
                ? face_status === "face_detected"
                : null);
            const knownFace = parseFaceBool(
              rec?.known_face ?? rec?.rpi?.known_face
            );

            const faces_count = parseNumber(
              rec?.faces_count ?? rec?.rpi?.faces_count
            );
            const recognized_faces = parseRecognizedFaces(
              rec?.recognized_faces ?? rec?.rpi?.recognized_faces
            );

            const lastSeenIsoRaw =
              rec?.face_last_seen_iso ?? rec?.rpi?.face_last_seen_iso;
            const face_last_seen_iso =
              typeof lastSeenIsoRaw === "string" ? lastSeenIsoRaw : undefined;
            const lastSeenTs = face_last_seen_iso
              ? Date.parse(face_last_seen_iso)
              : NaN;

            if (!Number.isFinite(t)) return null;

            return {
              t,
              brightness_pct,
              sound_db,
              distance_cm,
              accel_mag: accel,
              quake_status: Math.abs(accel - 1) > 0.5 ? "ALARM" : "IDLE",
              gas,
              gas_detected: gasDetected ?? undefined,
              flame,
              flame_detected: flameDetected ?? undefined,
              face_status,
              face_detected: faceDetected ?? undefined,
              known_face: knownFace ?? undefined,
              faces_count,
              recognized_faces,
              face_last_seen_iso,
              face_last_seen_ts: Number.isFinite(lastSeenTs)
                ? lastSeenTs
                : undefined,
              raw: typeof rec?.raw === "string" ? rec.raw : undefined,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (a!.t as number) - (b!.t as number)) as Sample[];

        setData(samples);
        setLatest(samples[samples.length - 1] ?? null);
      },
      (err) => {
        console.error("onValue error:", err);
        setData([]);
        setLatest(null);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        off(dbRef);
      }
    };
  }, [deviceId, live]);

  return { data, latest };
}
