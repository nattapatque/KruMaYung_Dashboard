export const BRIGHTNESS = {
  toPct: (raw: number) => Math.max(0, Math.min(100, raw)),
  bands: [
    { max: 20, label: "Dark", color: "bg-slate-800/80 text-slate-100" },
    { max: 50, label: "Dim", color: "bg-slate-600/60 text-white" },
    { max: 80, label: "Bright", color: "bg-yellow-300/40 text-yellow-900" },
    {
      max: 100,
      label: "Very Bright",
      color: "bg-yellow-400/60 text-yellow-950",
    },
  ],
  recommend(pct: number) {
    if (pct < 20) return "Too dark — consider turning on lights.";
    if (pct < 50) return "Comfortable ambient light.";
    if (pct < 80) return "Well lit for work/reading.";
    return "Extremely bright — reduce glare if needed.";
  },
};

export const SOUND = {
  bands: [
    { max: 60, label: "Quiet", color: "bg-emerald-200/60 text-emerald-900" },
    { max: 80, label: "Moderate", color: "bg-amber-200/60 text-amber-900" },
    { max: 1000, label: "Loud", color: "bg-rose-300/60 text-rose-950" },
  ],
  recommend(db: number) {
    if (db < 60) return "Noise level is safe.";
    if (db < 80) return "Be mindful — prolonged exposure may tire you.";
    return "Too loud — consider ear protection or reducing sources.";
  },
};

export const ULTRA = {
  bands: [
    { max: 2, label: "Very Close", color: "bg-rose-300/60 text-rose-950" },
    { max: 25, label: "Near", color: "bg-amber-200/60 text-amber-900" },
    { max: 50, label: "Far", color: "bg-emerald-200/60 text-emerald-900" },
  ],
  recommend(cm: number) {
    if (cm < 2) return "Teacher hear!!!!!!!!!!";
    if (cm < 50) return "Teacher is coming.";
    return "No Teacher in this class.";
  },
};

export const GAS = {
  bands: [
    {
      value: "No gas",
      label: "No gas",
      color: "bg-emerald-200/60 text-emerald-900",
    },
    {
      value: "Gas Detected!",
      label: "Gas Detected!",
      color: "bg-rose-300/60 text-rose-950",
    },
  ],
  recommend(val: string) {
    if (val === "No gas") return "Air quality OK.";
    return "Gas detected! Open windows and check the source.";
  },
};

export const MPU6050 = {
  bands: [
    { max: 1.1, label: "Idle", color: "bg-emerald-200/60 text-emerald-900" },
    { max: 10, label: "ALARM", color: "bg-rose-300/60 text-rose-950" },
  ],
  recommend(accel_mag: number) {
    if (accel_mag <= 1.1) return "No significant movement.";
    return "Quake detected! Take caution!";
  },
};

export function bandColor(
  bands: { max: number; label: string; color: string }[],
  v: number
) {
  return bands.find((b) => v <= b.max)?.color ?? "bg-slate-500";
}
export function bandLabel(
  bands: { max: number; label: string; color: string }[],
  v: number
) {
  return bands.find((b) => v <= b.max)?.label ?? "";
}
export function bandColorForStr(
  bands: { value: string; label: string; color: string }[],
  v: string
) {
  return bands.find((b) => b.value === v)?.color ?? "bg-slate-500";
}
export function bandLabelForStr(
  bands: { value: string; label: string; color: string }[],
  v: string
) {
  return bands.find((b) => b.value === v)?.label ?? "";
}
