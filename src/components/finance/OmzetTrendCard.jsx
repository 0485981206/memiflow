import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

export default function OmzetTrendCard({ prestaties, klanten }) {
  const data = useMemo(() => {
    const klantById = {};
    const klantByNaam = {};
    klanten.forEach(k => {
      klantById[k.id] = k;
      if (k.naam) klantByNaam[k.naam.toLowerCase()] = k;
    });
    const findKlant = (p) => klantById[p.eindklant_id] || (p.eindklant_naam ? klantByNaam[p.eindklant_naam.toLowerCase()] : null);

    const perMaand = {};
    prestaties.forEach(p => {
      if (!p.datum) return;
      const maand = p.datum.slice(0, 7);
      const klant = findKlant(p);
      const tarief = klant?.facturatie_tarief || 0;
      const uren = p.totaal_uren || p.uren || 0;
      perMaand[maand] = (perMaand[maand] || 0) + uren * tarief;
    });

    return Object.entries(perMaand)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([maand, omzet]) => ({ maand, omzet: Math.round(omzet * 100) / 100 }));
  }, [prestaties, klanten]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" /> Omzet Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="maand" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`€${v.toFixed(2)}`, "Omzet"]} />
              <Line type="monotone" dataKey="omzet" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}