import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Building2 } from "lucide-react";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function TopKlantenCard({ prestaties }) {
  const data = React.useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      const naam = p.eindklant_naam || "Onbekend";
      map[naam] = (map[naam] || 0) + (p.totaal_uren || p.uren || 0);
    });
    return Object.entries(map)
      .map(([naam, uren]) => ({ naam: naam.length > 14 ? naam.slice(0, 14) + "…" : naam, uren: +uren.toFixed(1) }))
      .sort((a, b) => b.uren - a.uren)
      .slice(0, 6);
  }, [prestaties]);

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Building2 className="w-4 h-4 text-accent" />
          Top Klanten — Uren
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="naam" tick={{ fontSize: 11 }} width={90} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v) => [`${v}u`, "Uren"]}
              />
              <Bar dataKey="uren" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}