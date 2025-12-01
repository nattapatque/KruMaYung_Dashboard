import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "../config/firebase";

export type Sample = {
  t: number;
  brightness_pct: number;
  sound_db: number;
  gas: string;
  distance_cm: number;
  accel_mag: number;
  quake_status: "IDLE" | "ALARM";
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

    const parseFaceBool = (v: unknown) => {
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") {
        const normalized = v.trim().toLowerCase();
        if (["true", "1", "yes", "y", "detected"].includes(normalized)) {
          return true;
        }
        if (["false", "0", "no", "n", "clear"].includes(normalized)) {
          return false;
        }
      }
      return null;
    };

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

            const fromField =
              typeof rec?.brightness_pct === "number"
                ? rec.brightness_pct
                : Number.isFinite(Number(rec?.brightness_pct))
                ? Number(rec.brightness_pct)
                : NaN;

            let fromRaw = NaN;
            if (typeof rec?.raw === "string") {
              const m = rec.raw.match(/"brightness_pct"\s*:\s*([\d.]+)/);
              if (m?.[1]) fromRaw = parseFloat(m[1]);
            }

            const brightness_pct = Number.isFinite(fromField)
              ? fromField
              : Number.isFinite(fromRaw)
              ? fromRaw
              : 0;

            const accel =
              typeof rec?.accel_mag === "number"
                ? rec.accel_mag
                : Number(rec?.accel_mag) || 1;

            const sound_db =
              typeof rec?.sound_db === "number"
                ? rec.sound_db
                : Number(rec?.sound_db) || 0;

            const distance_cm =
              typeof rec?.distance_cm === "number"
                ? rec.distance_cm
                : Number(rec?.distance_cm) || 0;

            const gas = rec?.gas ?? "";
            const faceDetected = parseFaceBool(
              rec?.face_detected ?? rec?.rpi?.face_detected
            );
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
              gas,
              distance_cm,
              accel_mag: accel,
              quake_status: Math.abs(accel - 1) > 0.5 ? "ALARM" : "IDLE",
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
