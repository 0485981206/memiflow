import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";

import DashboardFilters from "../components/dashboard/DashboardFilters";
import QuickBar from "../components/dashboard/QuickBar";
import KPICards from "../components/dashboard/KPICards";
import MaandTrendCard from "../components/dashboard/MaandTrendCard";
import DagVerdeling from "../components/dashboard/DagVerdeling";
import TopKlantenCard from "../components/dashboard/TopKlantenCard";
import TopWerknemersCard from "../components/dashboard/TopWerknemersCard";
import DruksteDagen from "../components/dashboard/DruksteDagen";
import CodeVerdeling from "../components/dashboard/CodeVerdeling";
import BronVerdeling from "../components/dashboard/BronVerdeling";

export default function Dashboard() {
  // Filters
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedKlant, setSelectedKlant] = useState("");
  const [selectedWerknemer, setSelectedWerknemer] = useState("");

  // Data
  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list(),
  });

  const { data: eindklanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.list(),
  });

  const { data: allePrestaties = [] } = useQuery({
    queryKey: ["prestaties"],
    queryFn: () => base44.entities.Prestatie.list(),
  });

  // Apply filters
  const prestaties = useMemo(() => {
    return allePrestaties.filter((p) => {
      if (!p.datum) return false;

      // Date range
      const d = parseISO(p.datum);
      if (dateRange.from && d < startOfDay(dateRange.from)) return false;
      if (dateRange.to && d > endOfDay(dateRange.to)) return false;

      // Klant
      if (selectedKlant) {
        const klant = eindklanten.find((k) => k.id === selectedKlant);
        if (klant && p.eindklant_id !== selectedKlant && (p.eindklant_naam || "").toLowerCase() !== klant.naam.toLowerCase()) {
          return false;
        }
      }

      // Werknemer
      if (selectedWerknemer && p.werknemer_id !== selectedWerknemer) return false;

      return true;
    });
  }, [allePrestaties, dateRange, selectedKlant, selectedWerknemer, eindklanten]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <QuickBar />
      </div>

      {/* Filters */}
      <DashboardFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedKlant={selectedKlant}
        setSelectedKlant={setSelectedKlant}
        klanten={eindklanten}
        selectedWerknemer={selectedWerknemer}
        setSelectedWerknemer={setSelectedWerknemer}
        werknemers={werknemers.filter((w) => w.status === "actief")}
      />

      {/* KPI's */}
      <KPICards prestaties={prestaties} werknemers={werknemers} klanten={eindklanten} />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MaandTrendCard prestaties={prestaties} />
        <DagVerdeling prestaties={prestaties} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopKlantenCard prestaties={prestaties} />
        <TopWerknemersCard prestaties={prestaties} />
        <CodeVerdeling prestaties={prestaties} />
      </div>

      {/* Drukste dagen + bron */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DruksteDagen prestaties={prestaties} />
        <BronVerdeling prestaties={prestaties} />
      </div>
    </div>
  );
}