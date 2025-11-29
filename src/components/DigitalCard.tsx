import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function DigitalCard({
  title,
  icon,
  value,
  badge,
  bgColor,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  badge?: string;
  bgColor: string;
  note?: string;
}) {
  return (
    <Card className={`shadow-sm border-0 ${bgColor} rounded-2xl`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
          {icon}
          {title}
        </CardTitle>
        {badge && (
          <span className="text-xs px-2 py-1 rounded-full bg-black/10 dark:bg-white/10">
            {badge}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {note && <p className="text-xs mt-2 opacity-90">{note}</p>}
      </CardContent>
    </Card>
  );
}
