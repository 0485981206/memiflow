import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Save, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import PlanningSpotRow from "./PlanningSpotRow";

export default function PlanningDayEditor({ datum, werkspots, eindklantId, eindklantNaam, onSaved }) {
  const [aantallen, setAantallen] = useState({});
  const [werknemerSelecties, setWerknemerSelecties] = useState({});
  const [saving, setSaving] = useState(false);
  const datumStr = format(datum, "yyyy-MM-dd");

  const { data: bestaandePlanning = [], isLoading, refetch } = useQuery({
    queryKey: ["werkspot-planning", eindklantId, datumStr],
    queryFn: () => base44.entities.WerkspotPlanning.filter({ eindklant_id: eindklantId, datum: datumStr }),
    enabled: !!eindklantId,
  });

  // Fetch all werknemers for this klant (via plaatsingen)
  const { data: allWerknemers = [] } = useQuery({
    queryKey: ["werknemers-klant", eindklantId],
    queryFn: async () => {
      const plaatsingen = await base44.entities.Plaatsing.filter({ eindklant_id: eindklantId, status: "actief" });
      const ids = [...new Set(plaatsingen.map(p => p.werknemer_id))];
      if (ids.length === 0) return [];
      const werknemers = await base44.entities.Werknemer.filter({ status: "actief" });
      return werknemers.filter(w => ids.includes(w.id)).map(w => ({
        id: w.id,
        naam: `${w.voornaam} ${w.achternaam}`,
      }));
    },
    enabled: !!eindklantId,
  });

  // Sync form state from DB
  useEffect(() => {
    const aantalMap = {};
    const selectieMap = {};
    werkspots.forEach(ws => {
      const existing = bestaandePlanning.find(p => p.werkspot_id === ws.id);
      aantalMap[ws.id] = existing ? existing.gepland_aantal : 0;
      selectieMap[ws.id] = existing?.geselecteerde_werknemers || [];
    });
    setAantallen(aantalMap);
    setWerknemerSelecties(selectieMap);
  }, [bestaandePlanning, werkspots, datumStr]);

  const totaal = useMemo(() => Object.values(aantallen).reduce((sum, v) => sum + (Number(v) || 0), 0), [aantallen]);

  // Get werknemers already selected in OTHER werkspots (to show who's available)
  const getAvailableWerknemers = (currentWsId) => {
    const usedInOthers = new Set();
    Object.entries(werknemerSelecties).forEach(([wsId, ids]) => {
      if (wsId !== currentWsId) ids.forEach(id => usedInOthers.add(id));
    });
    // Show all but mark used ones - actually just filter them out for simplicity
    return allWerknemers.filter(w => !usedInOthers.has(w.id));
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();

    for (const ws of werkspots) {
      const nieuwAantal = Number(aantallen[ws.id]) || 0;
      const existing = bestaandePlanning.find(p => p.werkspot_id === ws.id);
      const oudAantal = existing ? existing.gepland_aantal : 0;
      const selectie = werknemerSelecties[ws.id] || [];

      const hasChanges = nieuwAantal !== oudAantal ||
        JSON.stringify(selectie.sort()) !== JSON.stringify((existing?.geselecteerde_werknemers || []).sort());

      if (hasChanges) {
        if (nieuwAantal !== oudAantal) {
          await base44.entities.PlanningLog.create({
            datum: datumStr,
            werkspot_id: ws.id,
            werkspot_naam: ws.naam,
            eindklant_id: eindklantId,
            eindklant_naam: eindklantNaam,
            oud_aantal: oudAantal,
            nieuw_aantal: nieuwAantal,
            gewijzigd_door: user?.full_name || user?.email || "Onbekend",
          });
        }

        if (existing) {
          await base44.entities.WerkspotPlanning.update(existing.id, {
            gepland_aantal: nieuwAantal,
            geselecteerde_werknemers: selectie,
          });
        } else {
          await base44.entities.WerkspotPlanning.create({
            datum: datumStr,
            werkspot_id: ws.id,
            werkspot_naam: ws.naam,
            eindklant_id: eindklantId,
            eindklant_naam: eindklantNaam,
            gepland_aantal: nieuwAantal,
            geselecteerde_werknemers: selectie,
          });
        }
      }
    }

    await refetch();
    onSaved?.();
    setSaving(false);
    toast.success("Planning opgeslagen");
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">
            {format(datum, "EEEE d MMMM yyyy", { locale: nl })}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="w-4 h-4" /> Totaal gepland: <strong>{totaal}</strong> werknemers
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Opslaan
        </Button>
      </div>

      {werkspots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen actieve werkspots voor deze klant.</p>
      ) : (
        <div className="space-y-2">
          {werkspots.map(ws => (
            <PlanningSpotRow
              key={ws.id}
              werkspot={ws}
              aantal={aantallen[ws.id] ?? 0}
              geselecteerdeWerknemers={werknemerSelecties[ws.id] || []}
              beschikbareWerknemers={getAvailableWerknemers(ws.id)}
              onChangeAantal={(v) => setAantallen(prev => ({ ...prev, [ws.id]: v === "" ? "" : Number(v) }))}
              onChangeWerknemers={(ids) => setWerknemerSelecties(prev => ({ ...prev, [ws.id]: ids }))}
            />
          ))}
        </div>
      )}
    </Card>
  );
}