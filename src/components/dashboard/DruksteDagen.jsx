import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

export default function DruksteDagen({ prestaties }) {
  const data = React.useMemo(() => {
    const map = {};
    prestaties.forEach((p) => {
      if (!p.datum) return;
      if (!map[p.datum]) map[p.datum] = { datum: p.datum, uren: 0, taken: 0, klanten: new Set(), werknemers: new Set() };
      map[p.datum].uren += (p.totaal_uren || p.uren || 0);
      map[p.datum].taken += 1;
      if (p.eindklant_naam) map[p.datum].klanten.add(p.eindklant_naam);
      if (p.werknemer_naam) map[p.datum].werknemers.add(p.werknemer_naam);
    });
    return Object.values(map)
      .sort((a, b) => b.taken - a.taken)
      .slice(0, 5)
      .map((d) => ({ ...d, klanten: [...d.klanten], werknemers: [...d.werknemers] }));
  }, [prestaties]);

  const rankColors = ["text-yellow-500", "text-gray-400", "text-orange-400", "text-muted-foreground", "text-muted-foreground"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Award className="w-4 h-4 text-accent" />
          Drukste Dagen
        </CardTitle>
        <p className="text-xs text-muted-foreground">Topactiviteit in geselecteerde periode</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Geen data</p>
        ) : (
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={d.datum} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className={`text-sm font-bold w-6 text-center ${rankColors[i]}`}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {format(parseISO(d.datum), "d MMM yyyy", { locale: nl })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.uren.toFixed(1)}u
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {d.werknemers.length} werknemers
                    </span>
                    {d.klanten.length > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {d.klanten.join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold bg-card border rounded-full px-2.5 py-0.5 shrink-0">
                  {d.taken} taken
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}