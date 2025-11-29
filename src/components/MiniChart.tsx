import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import type { Sample } from "../hooks/useSensorStream";

export function MiniChart({ data, k }: { data: Sample[]; k: keyof Sample }) {
  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`g-${String(k)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.6} />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ borderRadius: 12 }}
            labelFormatter={() => ""}
          />
          <Area
            type="monotone"
            dataKey={k as string}
            stroke="currentColor"
            fill={`url(#g-${String(k)})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
