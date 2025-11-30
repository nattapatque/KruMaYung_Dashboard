import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function StatCard({
  title,
  icon,
  value,
  unit,
  badge,
  bgColor,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  unit?: string;
  badge?: string;
  bgColor: string;
  note?: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden shadow-sm border-0 ${bgColor} rounded-2xl`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${bgColor}`} />
      <div className="pointer-events-none absolute inset-0 opacity-50 bg-gradient-to-br from-white/10 via-transparent to-emerald-500/15" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
          {icon}
          {title}
        </CardTitle>
        {badge && (
          <span className="text-[11px] px-3 py-1 rounded-full bg-white/15 border border-white/25 uppercase tracking-[0.08em]">
            {badge}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight text-white">
          {value}
          {unit && <span className="text-base ml-1 opacity-80">{unit}</span>}
        </div>
        {note && (
          <p className="text-xs mt-3 text-white/80 leading-relaxed">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}
