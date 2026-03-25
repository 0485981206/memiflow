import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Database } from "lucide-react";

const BRON_LABELS = { gps: "GPS", uitsnext: "UitsNext", manueel: "Manueel" };

export default function BronVerdeling({ prestaties }) {
  const data = React.useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      const bron = BRON_LABELS[p.bron] || p.bron || "Onbekend";
      map[bron] = (map[bron] || 0) + (p.totaal_uren || p.uren || 0);
    });
    return Object.entries(map)
      .map(([bron, uren]) => ({ bron, uren: +uren.toFixed(1) }))
      .sort((a, b) => b.uren - a.uren);
  }, [prestaties]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Database className="w-4 h-4 text-accent" />
          Uren per bron
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="bron" tick={{ fontSize: 11 }} width={80} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v) => [`${v}u`, "Uren"]}
              />
              <Bar dataKey="uren" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}