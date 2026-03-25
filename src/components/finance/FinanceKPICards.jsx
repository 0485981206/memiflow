import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Euro, Clock, Building2, Users, TrendingUp, CalendarDays } from "lucide-react";

function KPI({ title, value, sub, icon: Icon, color }) {
  return (
    <Card className="p-4 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {Icon && (
        <div className={`p-2 rounded-lg ${color || "bg-muted"}`}>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  );
}

export default function FinanceKPICards({ prestaties, klanten }) {
  const stats = useMemo(() => {
    const klantById = {};
    const klantByNaam = {};
    klanten.forEach(k => {
      klantById[k.id] = k;
      if (k.naam) klantByNaam[k.naam.toLowerCase()] = k;
    });

    const findKlant = (p) => klantById[p.eindklant_id] || (p.eindklant_naam ? klantByNaam[p.eindklant_naam.toLowerCase()] : null);

    let totaalOmzet = 0;
    let totaalUren = 0;
    const klantenSet = new Set();
    const werknemersSet = new Set();
    const dagenSet = new Set();

    prestaties.forEach(p => {
      const uren = p.totaal_uren || p.uren || 0;
      const klant = findKlant(p);
      const tarief = klant?.facturatie_tarief || 0;
      totaalOmzet += uren * tarief;
      totaalUren += uren;
      if (p.eindklant_naam) klantenSet.add(p.eindklant_naam);
      if (p.werknemer_naam) werknemersSet.add(p.werknemer_naam);
      if (p.datum) dagenSet.add(p.datum);
    });

    const gemPerUur = totaalUren > 0 ? totaalOmzet / totaalUren : 0;
    const gemPerDag = dagenSet.size > 0 ? totaalOmzet / dagenSet.size : 0;

    return { totaalOmzet, totaalUren, klantenCount: klantenSet.size, werknemersCount: werknemersSet.size, dagenCount: dagenSet.size, gemPerUur, gemPerDag };
  }, [prestaties, klanten]);

  const fmt = (n) => "€" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPI title="Totaal Omzet" value={fmt(stats.totaalOmzet)} icon={Euro} color="bg-green-50" />
      <KPI title="Totaal Uren" value={stats.totaalUren.toFixed(1) + "u"} icon={Clock} color="bg-blue-50" />
      <KPI title="Gem. €/uur" value={fmt(stats.gemPerUur)} icon={TrendingUp} color="bg-purple-50" />
      <KPI title="Gem. €/dag" value={fmt(stats.gemPerDag)} icon={CalendarDays} color="bg-cyan-50" />
      <KPI title="Klanten" value={stats.klantenCount} sub="in periode" icon={Building2} color="bg-amber-50" />
      <KPI title="Werknemers" value={stats.werknemersCount} sub="in periode" icon={Users} color="bg-rose-50" />
    </div>
  );
}