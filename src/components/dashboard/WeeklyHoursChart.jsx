import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function WeeklyHoursChart({ prestaties }) {
  // Group prestaties by week
  const weekData = React.useMemo(() => {
    const weeks = {};
    prestaties.forEach((p) => {
      const date = new Date(p.datum);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const key = `${String(weekStart.getDate()).padStart(2, "0")}/${String(
        weekStart.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!weeks[key]) {
        weeks[key] = { week: key, regulier: 0, overuren: 0, nacht: 0 };
      }

      const code = (p.code || "").toUpperCase();
      if (code === "O") {
        weeks[key].overuren += p.uren || 0;
      } else if (code === "N") {
        weeks[key].nacht += p.uren || 0;
      } else if (code === "R") {
        weeks[key].regulier += p.uren || 0;
      }
    });

    return Object.values(weeks).slice(-8);
  }, [prestaties]);

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="w-5 h-5 text-accent" />
          Uren per week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="regulier"
              name="Regulier"
              fill="hsl(var(--chart-1))"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="overuren"
              name="Overuren"
              fill="hsl(var(--chart-2))"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="nacht"
              name="Nacht"
              fill="hsl(var(--chart-3))"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}