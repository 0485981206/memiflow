import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Building2, Clock, TrendingUp, CalendarDays, Hash } from "lucide-react";

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

export default function KPICards({ prestaties, werknemers, klanten }) {
  const totaalUren = prestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
  const actieveWerknemers = werknemers.filter((w) => w.status === "actief").length;

  const uniqueKlanten = new Set(prestaties.map((p) => p.eindklant_naam).filter(Boolean)).size;
  const uniqueWerknemers = new Set(prestaties.map((p) => p.werknemer_naam).filter(Boolean)).size;
  const uniqueDagen = new Set(prestaties.map((p) => p.datum).filter(Boolean)).size;
  const gemUrenPerDag = uniqueDagen > 0 ? (totaalUren / uniqueDagen).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPI title="Actieve Werknemers" value={actieveWerknemers} icon={Users} color="bg-blue-50" />
      <KPI title="Totaal Uren" value={totaalUren.toFixed(1) + "u"} icon={Clock} color="bg-green-50" />
      <KPI title="Werknemers Actief" value={uniqueWerknemers} sub="in periode" icon={Users} color="bg-purple-50" />
      <KPI title="Klanten Actief" value={uniqueKlanten} sub="in periode" icon={Building2} color="bg-amber-50" />
      <KPI title="Werkdagen" value={uniqueDagen} icon={CalendarDays} color="bg-cyan-50" />
      <KPI title="Gem. uren/dag" value={gemUrenPerDag + "u"} icon={TrendingUp} color="bg-rose-50" />
    </div>
  );
}