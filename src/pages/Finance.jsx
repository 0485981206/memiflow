import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import { Euro } from "lucide-react";

import DashboardFilters from "../components/dashboard/DashboardFilters";
import FinanceKPICards from "../components/finance/FinanceKPICards";
import OmzetTrendCard from "../components/finance/OmzetTrendCard";
import OmzetPerKlantCard from "../components/finance/OmzetPerKlantCard";
import OmzetPerWerknemerCard from "../components/finance/OmzetPerWerknemerCard";

export default function Finance() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedKlant, setSelectedKlant] = useState("");
  const [selectedWerknemer, setSelectedWerknemer] = useState("");

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



  const prestaties = useMemo(() => {
    return allePrestaties.filter((p) => {
      if (!p.datum) return false;
      const d = parseISO(p.datum);
      if (dateRange.from && d < startOfDay(dateRange.from)) return false;
      if (dateRange.to && d > endOfDay(dateRange.to)) return false;
      if (selectedKlant) {
        const klant = eindklanten.find((k) => k.id === selectedKlant);
        if (klant && p.eindklant_id !== selectedKlant && (p.eindklant_naam || "").toLowerCase() !== klant.naam.toLowerCase()) return false;
      }
      if (selectedWerknemer && p.werknemer_id !== selectedWerknemer) return false;
      return true;
    });
  }, [allePrestaties, dateRange, selectedKlant, selectedWerknemer, eindklanten]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Euro className="w-6 h-6 text-accent" /> Finance
      </h1>

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

      <FinanceKPICards prestaties={prestaties} klanten={eindklanten} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OmzetTrendCard prestaties={prestaties} klanten={eindklanten} />
        <OmzetPerKlantCard prestaties={prestaties} klanten={eindklanten} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OmzetPerWerknemerCard prestaties={prestaties} klanten={eindklanten} />
      </div>
    </div>
  );
}