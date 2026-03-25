import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Tags } from "lucide-react";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#8b5cf6", "#ec4899",
];

export default function CodeVerdeling({ prestaties }) {
  const data = React.useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      const code = p.code || "Geen code";
      map[code] = (map[code] || 0) + (p.totaal_uren || p.uren || 0);
    });
    return Object.entries(map)
      .map(([code, uren]) => ({ code, uren: +uren.toFixed(1) }))
      .sort((a, b) => b.uren - a.uren);
  }, [prestaties]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Tags className="w-4 h-4 text-accent" />
          Verdeling per code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="uren" nameKey="code" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v) => [`${v}u`, "Uren"]}
              />
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}