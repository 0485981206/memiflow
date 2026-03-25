import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

export default function MaandTrendCard({ prestaties }) {
  const data = React.useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      if (!p.datum) return;
      const maand = p.datum.slice(0, 7); // yyyy-MM
      map[maand] = (map[maand] || 0) + (p.totaal_uren || p.uren || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([maand, uren]) => ({
        maand: format(parseISO(maand + "-01"), "MMM yy", { locale: nl }),
        uren: +uren.toFixed(1),
      }));
  }, [prestaties]);

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="w-4 h-4 text-accent" />
          Uren per maand
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="maand" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v) => [`${v}u`, "Uren"]}
              />
              <Line type="monotone" dataKey="uren" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}