import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Clock, Users, CalendarDays, TrendingUp, LogIn, BarChart3 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

function StatBox({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function KlantStatistieken({ prestaties, werknemers }) {
  const stats = useMemo(() => {
    const totaalUren = prestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
    const uniekeDagen = new Set(prestaties.map(p => p.datum)).size;
    const uniekeWerknemers = new Set(prestaties.map(p => p.werknemer_naam || p.werknemer_id)).size;
    const gemPerDag = uniekeDagen > 0 ? totaalUren / uniekeDagen : 0;
    const gemPerWerknemer = uniekeWerknemers > 0 ? totaalUren / uniekeWerknemers : 0;

    const totaalCheckins = prestaties.reduce((count, p) => {
      return count + [1,2,3,4,5,6].filter(n => p[`in_${n}`]).length;
    }, 0);

    // Top werknemers
    const werknemerUren = {};
    prestaties.forEach(p => {
      const naam = p.werknemer_naam || "Onbekend";
      werknemerUren[naam] = (werknemerUren[naam] || 0) + (p.totaal_uren || p.uren || 0);
    });
    const topWerknemers = Object.entries(werknemerUren)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Drukste dagen
    const dagUren = {};
    prestaties.forEach(p => {
      if (!p.datum) return;
      dagUren[p.datum] = (dagUren[p.datum] || 0) + (p.totaal_uren || p.uren || 0);
    });
    const druksteDagen = Object.entries(dagUren)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Code verdeling
    const codeUren = {};
    prestaties.forEach(p => {
      const code = p.code || "Geen";
      codeUren[code] = (codeUren[code] || 0) + (p.totaal_uren || p.uren || 0);
    });
    const codeVerdeling = Object.entries(codeUren).sort(([,a], [,b]) => b - a);

    return { totaalUren, uniekeDagen, uniekeWerknemers, gemPerDag, gemPerWerknemer, totaalCheckins, topWerknemers, druksteDagen, codeVerdeling };
  }, [prestaties]);

  const maxWerknemerUren = stats.topWerknemers[0]?.[1] || 1;

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox icon={Clock} label="Totaal Uren" value={`${stats.totaalUren.toFixed(1)}u`} />
        <StatBox icon={Users} label="Werknemers" value={stats.uniekeWerknemers} />
        <StatBox icon={CalendarDays} label="Werkdagen" value={stats.uniekeDagen} />
        <StatBox icon={TrendingUp} label="Gem. per dag" value={`${stats.gemPerDag.toFixed(1)}u`} />
        <StatBox icon={TrendingUp} label="Gem. per werknemer" value={`${stats.gemPerWerknemer.toFixed(1)}u`} />
        <StatBox icon={LogIn} label="Check-ins" value={stats.totaalCheckins} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top werknemers */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" /> Top Werknemers
          </h3>
          <div className="space-y-2.5">
            {stats.topWerknemers.map(([naam, uren], i) => (
              <div key={naam}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-medium truncate max-w-[150px]">{naam}</span>
                  <span className="text-muted-foreground font-semibold">{uren.toFixed(1)}u</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(uren / maxWerknemerUren) * 100}%` }} />
                </div>
              </div>
            ))}
            {stats.topWerknemers.length === 0 && <p className="text-xs text-muted-foreground">Geen data</p>}
          </div>
        </Card>

        {/* Drukste dagen */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-accent" /> Drukste Dagen
          </h3>
          <div className="space-y-2">
            {stats.druksteDagen.map(([datum, uren], i) => (
              <div key={datum} className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">
                  {format(parseISO(datum), "EEE d MMM", { locale: nl })}
                </span>
                <span className="font-bold">{uren.toFixed(1)}u</span>
              </div>
            ))}
            {stats.druksteDagen.length === 0 && <p className="text-xs text-muted-foreground">Geen data</p>}
          </div>
        </Card>

        {/* Code verdeling */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" /> Code Verdeling
          </h3>
          <div className="space-y-2">
            {stats.codeVerdeling.map(([code, uren]) => (
              <div key={code} className="flex items-center justify-between text-xs">
                <span className="font-medium">{code}</span>
                <span className="text-muted-foreground font-semibold">{uren.toFixed(1)}u</span>
              </div>
            ))}
            {stats.codeVerdeling.length === 0 && <p className="text-xs text-muted-foreground">Geen data</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}