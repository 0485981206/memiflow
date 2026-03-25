import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function TopWerknemersCard({ prestaties }) {
  const data = React.useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      const naam = p.werknemer_naam || "Onbekend";
      map[naam] = (map[naam] || 0) + (p.totaal_uren || p.uren || 0);
    });
    return Object.entries(map)
      .map(([naam, uren]) => ({ naam, uren: +uren.toFixed(1) }))
      .sort((a, b) => b.uren - a.uren)
      .slice(0, 8);
  }, [prestaties]);

  const max = data[0]?.uren || 1;

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="w-4 h-4 text-accent" />
          Top Werknemers — Uren
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Geen data</p>
        ) : (
          <div className="space-y-2.5">
            {data.map((w, i) => (
              <div key={w.naam}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-medium truncate max-w-[160px]">{w.naam}</span>
                  <span className="text-muted-foreground font-semibold">{w.uren}u</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(w.uren / max) * 100}%`,
                      backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}