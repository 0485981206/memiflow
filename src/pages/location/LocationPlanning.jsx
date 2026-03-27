import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Save, Loader2, Copy, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import LocationSidebar from "../../components/location/LocationSidebar";
import PlanningSpotRow from "../../components/planning/PlanningSpotRow";

export default function LocationPlanning({ klant, onNavigate, onLogout, onRefresh }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [werkspots, setWerkspots] = useState([]);
  const [planning, setPlanning] = useState({});
  const [aantallen, setAantallen] = useState({});
  const [werknemerSelecties, setWerknemerSelecties] = useState({});
  const [allWerknemers, setAllWerknemers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const vandaag = startOfDay(new Date());
  const datumStr = format(selectedDate, "yyyy-MM-dd");
  const isPast = isBefore(startOfDay(selectedDate), vandaag);

  // Generate next 14 days
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(vandaag, i)), []);

  useEffect(() => {
    loadData();
  }, [klant.id, datumStr]);

  const loadData = async () => {
    setLoading(true);
    const wsRes = await base44.functions.invoke("locationWerkspots", { action: "list", eindklant_id: klant.id });
    setWerkspots(wsRes.data.werkspots || []);

    const planRes = await base44.entities.WerkspotPlanning.filter({ eindklant_id: klant.id, datum: datumStr });
    const map = {};
    planRes.forEach(p => { map[p.werkspot_id] = p; });
    setPlanning(map);

    const aantalMap = {};
    const selectieMap = {};
    wsRes.data.werkspots?.forEach(ws => {
      aantalMap[ws.id] = map[ws.id]?.gepland_aantal || 0;
      selectieMap[ws.id] = map[ws.id]?.geselecteerde_werknemers || [];
    });
    setAantallen(aantalMap);
    setWerknemerSelecties(selectieMap);

    // Load werknemers
    const plaatsingen = await base44.entities.Plaatsing.filter({ eindklant_id: klant.id, status: "actief" });
    const ids = [...new Set(plaatsingen.map(p => p.werknemer_id))];
    if (ids.length > 0) {
      const werknemers = await base44.entities.Werknemer.filter({ status: "actief" });
      setAllWerknemers(werknemers.filter(w => ids.includes(w.id)).map(w => ({ id: w.id, naam: `${w.voornaam} ${w.achternaam}` })));
    } else {
      setAllWerknemers([]);
    }
    setLoading(false);
  };

  const getAvailableWerknemers = (currentWsId) => {
    const ws = werkspots.find(w => w.id === currentWsId);
    const toegewezen = ws?.toegewezen_werknemers || [];
    if (toegewezen.length === 0) return allWerknemers;
    return allWerknemers.filter(w => toegewezen.includes(w.id));
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();

    for (const ws of werkspots) {
      const nieuw = Number(aantallen[ws.id]) || 0;
      const existing = planning[ws.id];
      const oud = existing?.gepland_aantal || 0;
      const selectie = werknemerSelecties[ws.id] || [];

      const hasChanges = nieuw !== oud ||
        JSON.stringify(selectie.sort()) !== JSON.stringify((existing?.geselecteerde_werknemers || []).sort());

      if (hasChanges) {
        if (nieuw !== oud) {
          await base44.entities.PlanningLog.create({
            datum: datumStr,
            werkspot_id: ws.id,
            werkspot_naam: ws.naam,
            eindklant_id: klant.id,
            eindklant_naam: klant.naam,
            oud_aantal: oud,
            nieuw_aantal: nieuw,
            gewijzigd_door: user?.full_name || "Teamleader",
          });
        }

        if (existing) {
          await base44.entities.WerkspotPlanning.update(existing.id, {
            gepland_aantal: nieuw,
            geselecteerde_werknemers: selectie,
          });
        } else {
          await base44.entities.WerkspotPlanning.create({
            datum: datumStr,
            werkspot_id: ws.id,
            werkspot_naam: ws.naam,
            eindklant_id: klant.id,
            eindklant_naam: klant.naam,
            gepland_aantal: nieuw,
            geselecteerde_werknemers: selectie,
          });
        }
      }
    }

    await loadData();
    setSaving(false);
    toast.success("Planning opgeslagen");
  };

  const handleCopyToTomorrow = async () => {
    const morgen = format(addDays(selectedDate, 1), "yyyy-MM-dd");
    setSaving(true);

    for (const ws of werkspots) {
      const aantal = Number(aantallen[ws.id]) || 0;
      const selectie = werknemerSelecties[ws.id] || [];
      if (aantal > 0) {
        const existing = await base44.entities.WerkspotPlanning.filter({ eindklant_id: klant.id, datum: morgen, werkspot_id: ws.id });
        if (existing.length > 0) {
          await base44.entities.WerkspotPlanning.update(existing[0].id, { gepland_aantal: aantal, geselecteerde_werknemers: selectie });
        } else {
          await base44.entities.WerkspotPlanning.create({
            datum: morgen,
            werkspot_id: ws.id,
            werkspot_naam: ws.naam,
            eindklant_id: klant.id,
            eindklant_naam: klant.naam,
            gepland_aantal: aantal,
            geselecteerde_werknemers: selectie,
          });
        }
      }
    }

    setSaving(false);
    toast.success("Planning gekopieerd naar morgen");
  };

  const totaal = useMemo(() => Object.values(aantallen).reduce((sum, v) => sum + (Number(v) || 0), 0), [aantallen]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="planning" onNavigate={onNavigate} onLogout={onLogout} onRefresh={onRefresh} />
      <div className="flex-1 ml-20">
        <div className="bg-[#0f2744] text-white px-6 py-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Agendaplanning
          </h1>
          <p className="text-xs text-white/60">{klant.naam}</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Day selector - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {days.map(day => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex-shrink-0 w-16 p-2 rounded-xl text-center transition-all duration-150 active:scale-95 select-none touch-manipulation border ${
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : isTodayDay
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase">{format(day, "EEE", { locale: nl })}</p>
                  <p className="text-lg font-bold">{format(day, "d")}</p>
                  <p className="text-[10px]">{format(day, "MMM", { locale: nl })}</p>
                </button>
              );
            })}
          </div>

          {/* Planning editor */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-semibold capitalize">{format(selectedDate, "EEEE d MMMM", { locale: nl })}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" /> Totaal: <strong>{totaal}</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyToTomorrow} disabled={saving} className="gap-1">
                  <Copy className="w-4 h-4" /> Kopieer naar morgen
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || isPast} className="gap-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Opslaan
                </Button>
              </div>
            </div>

            {isPast && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Je kan geen planning van het verleden wijzigen.</p>
            )}

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : werkspots.length === 0 ? (
              <p className="text-sm text-gray-400">Geen werkspots gevonden.</p>
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
                    disabled={isPast}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}