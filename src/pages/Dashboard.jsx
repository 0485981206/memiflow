import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Clock, ClipboardCheck } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import WeeklyHoursChart from "../components/dashboard/WeeklyHoursChart";
import StatusPanel from "../components/dashboard/StatusPanel";

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

  const urenDezeWeek = prestaties
    .filter((p) => new Date(p.datum) >= weekStart)
    .reduce((sum, p) => sum + (p.uren || 0), 0);

  const teKeuren = prestaties.filter((p) => p.status === "ingevoerd").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Actieve Werknemers"
          value={actieveWerknemers}
          icon={Users}
          loading={loadingW}
        />
        <StatCard
          title="Eindklanten"
          value={actieveKlanten}
          icon={Building2}
          loading={loadingE}
        />
        <StatCard
          title="Uren deze week"
          value={urenDezeWeek}
          icon={Clock}
          loading={loadingP}
        />
        <StatCard
          title="Te keuren"
          value={teKeuren}
          icon={ClipboardCheck}
          loading={loadingP}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WeeklyHoursChart prestaties={prestaties} />
        <StatusPanel prestaties={prestaties} />
      </div>
    </div>
  );
}