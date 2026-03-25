import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Clock, ClipboardCheck, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import StatCard from "../components/dashboard/StatCard";
import WeeklyHoursChart from "../components/dashboard/WeeklyHoursChart";
import StatusPanel from "../components/dashboard/StatusPanel";
import TopKlantenCard from "../components/dashboard/TopKlantenCard";
import TopWerknemersCard from "../components/dashboard/TopWerknemersCard";
import MaandTrendCard from "../components/dashboard/MaandTrendCard";
import DagVerdeling from "../components/dashboard/DagVerdeling";

export default function Dashboard() {
  const { data: werknemers = [], isLoading: loadingW } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list(),
  });

  const { data: eindklanten = [], isLoading: loadingE } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list(),
  });

  const { data: prestaties = [], isLoading: loadingP } = useQuery({
    queryKey: ["prestaties"],
    queryFn: () => base44.entities.Prestatie.list(),
  });

  const actieveWerknemers = werknemers.filter((w) => w.status === "actief").length;
  const actieveKlanten = eindklanten.filter((k) => k.status === "actief").length;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const maandStr = format(now, "yyyy-MM");

  const urenDezeWeek = prestaties
    .filter((p) => new Date(p.datum) >= weekStart)
    .reduce((sum, p) => sum + (p.totaal_uren || p.uren || 0), 0);

  const urenDezeMaand = prestaties
    .filter((p) => p.datum?.startsWith(maandStr))
    .reduce((sum, p) => sum + (p.totaal_uren || p.uren || 0), 0);

  const klantMap = {};
  prestaties.filter((p) => p.datum?.startsWith(maandStr)).forEach((p) => {
    const k = p.eindklant_naam || "?";
    klantMap[k] = (klantMap[k] || 0) + (p.totaal_uren || p.uren || 0);
  });
  const topKlant = Object.entries(klantMap).sort((a, b) => b[1] - a[1])[0];

  const teKeuren = prestaties.filter((p) => p.status === "ingevoerd").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Row 1 — KPI's */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Actieve Werknemers" value={actieveWerknemers} icon={Users} loading={loadingW} />
        <StatCard title="Actieve Klanten" value={actieveKlanten} icon={Building2} loading={loadingE} />
        <StatCard title="Uren deze week" value={urenDezeWeek.toFixed(1) + "u"} icon={Clock} loading={loadingP} />
        <StatCard title="Uren deze maand" value={urenDezeMaand.toFixed(1) + "u"} icon={TrendingUp} loading={loadingP} />
        <StatCard title="Te keuren" value={teKeuren} icon={ClipboardCheck} loading={loadingP} />
        <StatCard title="Top klant (maand)" value={topKlant ? topKlant[0] : "—"} icon={Award} loading={loadingP} />
      </div>

      {/* Row 2 — Maandtrend + weekdag verdeling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MaandTrendCard prestaties={prestaties} />
        <DagVerdeling prestaties={prestaties} />
      </div>

      {/* Row 3 — Top klanten + top werknemers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopKlantenCard prestaties={prestaties} />
        <TopWerknemersCard prestaties={prestaties} />
      </div>

      {/* Row 4 — Weekly chart + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WeeklyHoursChart prestaties={prestaties} />
        <StatusPanel prestaties={prestaties} />
      </div>
    </div>
  );
}