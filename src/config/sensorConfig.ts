export const BRIGHTNESS = {
  bands: [
    {
      max: 300,
      label: "Dark",
      color: "bg-emerald-950/80 text-emerald-50 border border-emerald-500/25",
    },
    {
      max: 500,
      label: "Cozy",
      color: "bg-emerald-800/70 text-emerald-50 border border-emerald-400/30",
    },
    {
      max: 1000,
      label: "Bright",
      color: "bg-amber-200/80 text-amber-900 border border-amber-500/30",
    },
    {
      max: 2000,
      label: "Very Bright",
      color: "bg-amber-300/80 text-amber-900 border border-amber-600/30",
    },
  ],
  recommend(pct: number) {
    if (pct < 300) return "Too dark — consider turning on lights.";
    if (pct < 500) return "Comfortable ambient light.";
    if (pct < 1000) return "Well lit for work/reading.";
    return "Extremely bright — reduce glare if needed.";
  },
};

export const SOUND = {
  bands: [
    {
      max: 60,
      label: "Quiet",
      color: "bg-emerald-600/60 text-emerald-50 border border-emerald-300/30",
    },
    {
      max: 80,
      label: "Moderate",
      color: "bg-amber-300/70 text-amber-900 border border-amber-500/30",
    },
    {
      max: 1000,
      label: "Loud",
      color: "bg-rose-500/70 text-rose-50 border border-rose-200/40",
    },
  ],
  recommend(db: number) {
    if (db < 60) return "Noise level is safe.";
    if (db < 80) return "Be mindful — prolonged exposure may tire you.";
    return "Too loud — consider ear protection or reducing sources.";
  },
};

export const ULTRA = {
  bands: [
    {
      max: 2,
      label: "Very Close",
      color: "bg-rose-500/70 text-rose-50 border border-rose-200/40",
    },
    {
      max: 25,
      label: "Near",
      color: "bg-amber-400/70 text-amber-950 border border-amber-600/30",
    },
    {
      max: 50,
      label: "Far",
      color: "bg-emerald-500/60 text-emerald-50 border border-emerald-300/40",
    },
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
      color: "bg-emerald-500/50 text-emerald-50 border border-emerald-200/40",
    },
    {
      value: "Gas Detected!",
      label: "Gas Detected!",
      color: "bg-rose-600/70 text-rose-50 border border-rose-200/40",
    },
  ],
  recommend(val: string) {
    if (val === "No gas") return "Air quality OK.";
    return "Gas detected! Open windows and check the source.";
  },
};

export const MPU6050 = {
  bands: [
    {
      max: 1.1,
      label: "Idle",
      color: "bg-emerald-500/60 text-emerald-50 border border-emerald-300/40",
    },
    {
      max: 10,
      label: "ALARM",
      color: "bg-rose-600/70 text-rose-50 border border-rose-200/40",
    },
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
  const normalized = v?.toLowerCase?.().trim?.() ?? "";
  const match = bands.find(
    (b) => b.value?.toLowerCase?.().trim?.() === normalized
  );
  return match?.color ?? "bg-slate-500 text-white";
}
export function bandLabelForStr(
  bands: { value: string; label: string; color: string }[],
  v: string
) {
  const normalized = v?.toLowerCase?.().trim?.() ?? "";
  return bands.find((b) => b.value?.toLowerCase?.().trim?.() === normalized)
    ?.label;
}
