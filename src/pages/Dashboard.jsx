import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { format } from "date-fns";
import StatCard from "../components/dashboard/StatCard";
import TopKlantenCard from "../components/dashboard/TopKlantenCard";
import TopWerknemersCard from "../components/dashboard/TopWerknemersCard";
import MaandTrendCard from "../components/dashboard/MaandTrendCard";
import DagVerdeling from "../components/dashboard/DagVerdeling";

export default function Dashboard() {
  const { data: werknemers = [], isLoading: loadingW } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list(),
  });

  const { data: prestaties = [], isLoading: loadingP } = useQuery({
    queryKey: ["prestaties"],
    queryFn: () => base44.entities.Prestatie.list(),
  });

  const actieveWerknemers = werknemers.filter((w) => w.status === "actief").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Row 1 — KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Actieve Werknemers" value={actieveWerknemers} icon={Users} loading={loadingW} />
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
    </div>
  );
}