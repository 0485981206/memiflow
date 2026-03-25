import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";

export default function OmzetPerKlantCard({ prestaties, klanten }) {
  const data = useMemo(() => {
    const klantById = {};
    const klantByNaam = {};
    klanten.forEach(k => {
      klantById[k.id] = k;
      if (k.naam) klantByNaam[k.naam.toLowerCase()] = k;
    });
    const findKlant = (p) => klantById[p.eindklant_id] || (p.eindklant_naam ? klantByNaam[p.eindklant_naam.toLowerCase()] : null);

    const omzetPerKlant = {};
    prestaties.forEach(p => {
      const klant = findKlant(p);
      const tarief = klant?.facturatie_tarief || 0;
      const uren = p.totaal_uren || p.uren || 0;
      const naam = p.eindklant_naam || "Onbekend";
      omzetPerKlant[naam] = (omzetPerKlant[naam] || 0) + uren * tarief;
    });

    return Object.entries(omzetPerKlant)
      .map(([naam, omzet]) => ({ naam: naam.length > 16 ? naam.slice(0, 14) + "…" : naam, omzet: Math.round(omzet * 100) / 100 }))
      .sort((a, b) => b.omzet - a.omzet)
      .slice(0, 8);
  }, [prestaties, klanten]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" /> Omzet per Klant
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tickFormatter={v => `€${v}`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="naam" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`€${v.toFixed(2)}`, "Omzet"]} />
              <Bar dataKey="omzet" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}