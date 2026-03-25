import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function OmzetPerWerknemerCard({ prestaties, klanten }) {
  const data = useMemo(() => {
    const klantById = {};
    const klantByNaam = {};
    klanten.forEach(k => {
      klantById[k.id] = k;
      if (k.naam) klantByNaam[k.naam.toLowerCase()] = k;
    });
    const findKlant = (p) => klantById[p.eindklant_id] || (p.eindklant_naam ? klantByNaam[p.eindklant_naam.toLowerCase()] : null);

    const perWn = {};
    prestaties.forEach(p => {
      const klant = findKlant(p);
      const tarief = klant?.facturatie_tarief || 0;
      const uren = p.totaal_uren || p.uren || 0;
      const naam = p.werknemer_naam || "Onbekend";
      perWn[naam] = (perWn[naam] || 0) + uren * tarief;
    });

    return Object.entries(perWn)
      .map(([naam, omzet]) => ({ naam, omzet }))
      .sort((a, b) => b.omzet - a.omzet)
      .slice(0, 8);
  }, [prestaties, klanten]);

  const max = data.length > 0 ? data[0].omzet : 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" /> Omzet per Werknemer
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen data</p>
        ) : (
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={d.naam} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium truncate">{d.naam}</span>
                    <span className="text-xs font-bold shrink-0 ml-2">€{d.omzet.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(d.omzet / max) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}