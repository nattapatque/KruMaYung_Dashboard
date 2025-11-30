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
  face_last_seen_iso?: string;
  face_last_seen_ts?: number;
  raw?: string;
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
