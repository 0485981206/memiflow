import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarDays } from "lucide-react";

const DAG_NAMEN = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

export default function DagVerdeling({ prestaties }) {
  const data = React.useMemo(() => {
    const counts = Array(7).fill(0);
    prestaties.forEach((p) => {
      if (!p.datum) return;
      const dag = new Date(p.datum).getDay();
      counts[dag] += (p.totaal_uren || p.uren || 0);
    });
    // Mon-Sun order
    return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
      dag: DAG_NAMEN[d],
      uren: +counts[d].toFixed(1),
    }));
  }, [prestaties]);

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="w-4 h-4 text-accent" />
          Uren per weekdag
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis dataKey="dag" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(v) => [`${v}u`, "Uren"]}
            />
            <Bar dataKey="uren" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}