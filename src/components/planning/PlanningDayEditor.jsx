import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Save, Loader2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function PlanningDayEditor({ datum, werkspots, eindklantId, eindklantNaam, onSaved }) {
  const [aantallen, setAantallen] = useState({});
  const [saving, setSaving] = useState(false);
  const datumStr = format(datum, "yyyy-MM-dd");

  const { data: bestaandePlanning = [], isLoading, refetch } = useQuery({
    queryKey: ["werkspot-planning", eindklantId, datumStr],
    queryFn: () => base44.entities.WerkspotPlanning.filter({ eindklant_id: eindklantId, datum: datumStr }),
    enabled: !!eindklantId,
  });

  // Sync form state from DB
  useEffect(() => {
    const map = {};
    werkspots.forEach(ws => {
      const existing = bestaandePlanning.find(p => p.werkspot_id === ws.id);
      map[ws.id] = existing ? existing.gepland_aantal : 0;
    });
    setAantallen(map);
  }, [bestaandePlanning, werkspots, datumStr]);

  const totaal = useMemo(() => Object.values(aantallen).reduce((sum, v) => sum + (Number(v) || 0), 0), [aantallen]);

  const handleChange = (werkspotId, value) => {
    setAantallen(prev => ({ ...prev, [werkspotId]: value === "" ? "" : Number(value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();

    for (const ws of werkspots) {
      const nieuwAantal = Number(aantallen[ws.id]) || 0;
      const existing = bestaandePlanning.find(p => p.werkspot_id === ws.id);
      const oudAantal = existing ? existing.gepland_aantal : 0;

      if (nieuwAantal !== oudAantal) {
        // Log the change
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

        if (existing) {
          await base44.entities.WerkspotPlanning.update(existing.id, { gepland_aantal: nieuwAantal });
        } else {
          await base44.entities.WerkspotPlanning.create({
            datum: datumStr,
            werkspot_id: ws.id,
            werkspot_naam: ws.naam,
            eindklant_id: eindklantId,
            eindklant_naam: eindklantNaam,
            gepland_aantal: nieuwAantal,
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
            <div key={ws.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <span className="text-sm font-medium flex-1 min-w-0 truncate">{ws.naam}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={aantallen[ws.id] ?? 0}
                  onChange={(e) => handleChange(ws.id, e.target.value)}
                  className="w-20 h-9 text-center"
                />
                <span className="text-xs text-muted-foreground w-16">werkn.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}