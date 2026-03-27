import React, { useState, useMemo } from "react";
import { Play, Square, LogOut, Loader2, Clock, CheckCircle2, Search, X, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import LocationSidebar from "../../components/location/LocationSidebar";
import EmployeeDetailSheet from "../../components/location/EmployeeDetailSheet";
import TijdelijkDetailSheet from "../../components/location/TijdelijkDetailSheet";

export default function EmployeeBoard({ klant, werknemers = [], actieveRegistraties = [], tijdelijkeWerknemers = [], onAction, onLogout, onNavigate, actionLoading, onTijdelijkAdded, onRefresh }) {
  if (!klant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState(null);
  const [search, setSearch] = useState("");
  const [showTijdelijkForm, setShowTijdelijkForm] = useState(false);
  const [tijdelijkForm, setTijdelijkForm] = useState({ voornaam: "", achternaam: "", telefoon: "", opmerking: "" });
  const [savingTijdelijk, setSavingTijdelijk] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTijdelijk, setSelectedTijdelijk] = useState(null);
  const [localWerknemers, setLocalWerknemers] = useState(werknemers);

  // Sync werknemers when props change
  React.useEffect(() => {
    setLocalWerknemers(werknemers);
  }, [werknemers]);

  const handleAddTijdelijk = async () => {
    if (!tijdelijkForm.voornaam.trim() || !tijdelijkForm.achternaam.trim()) return;
    setSavingTijdelijk(true);
    await base44.functions.invoke("tijdelijkeWerknemer", {
      action: "create",
      voornaam: tijdelijkForm.voornaam.trim(),
      achternaam: tijdelijkForm.achternaam.trim(),
      telefoon: tijdelijkForm.telefoon.trim(),
      opmerking: tijdelijkForm.opmerking.trim(),
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
    });
    setTijdelijkForm({ voornaam: "", achternaam: "", telefoon: "", opmerking: "" });
    setShowTijdelijkForm(false);
    setSavingTijdelijk(false);
    onTijdelijkAdded?.();
  };

  const handleStopTijdelijk = async (id) => {
    await base44.functions.invoke("tijdelijkeWerknemer", { action: "stop", id });
    onTijdelijkAdded?.();
  };

  const { actieveWerknemers, inactieveWerknemers } = useMemo(() => {
    let filtered = localWerknemers;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = localWerknemers.filter((w) =>
        (w.naam || "").toLowerCase().includes(q) ||
        (w.functie || "").toLowerCase().includes(q)
      );
    }
    const actief = filtered.filter(w => w.location_status !== "inactief");
    const inactief = filtered.filter(w => w.location_status === "inactief");
    return { actieveWerknemers: actief, inactieveWerknemers: inactief };
  }, [localWerknemers, search]);

  const handleEmployeeClick = (w, e) => {
    e.stopPropagation();
    setSelectedEmployee(w);
  };

  const handleStatusChange = (werknemerId, newStatus) => {
    setLocalWerknemers(prev => prev.map(w => 
      w.id === werknemerId ? { ...w, location_status: newStatus } : w
    ));
  };

  const actieveMap = {};
  actieveRegistraties.forEach((r) => {
    actieveMap[r.werknemer_id] = r;
  });

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAction = async (action) => {
    // Separate regular employees from tijdelijke
    const regularIds = selected.filter(id => !id.startsWith('tmp-'));
    const tijdelijkIds = selected.filter(id => id.startsWith('tmp-')).map(id => id.replace('tmp-', ''));
    
    if (action === "start") {
      const regularToStart = regularIds.filter((id) => !actieveMap[id]);
      if (regularToStart.length > 0) {
        await onAction("start", regularToStart);
      }
      // Start tijdelijke werknemers
      for (const id of tijdelijkIds) {
        const t = tijdelijkeWerknemers.find(tw => tw.id === id);
        if (t && t.status === "nieuw") {
          await base44.functions.invoke("tijdelijkeWerknemer", {
            action: "start",
            id: id,
          });
        }
      }
    } else {
      const regularToStop = regularIds.filter((id) => !!actieveMap[id]);
      if (regularToStop.length > 0) {
        await onAction("stop", regularToStop);
      }
      // Stop tijdelijke werknemers
      for (const id of tijdelijkIds) {
        const t = tijdelijkeWerknemers.find(tw => tw.id === id);
        if (t && t.status === "ingecheckt") {
          await handleStopTijdelijk(id);
        }
      }
    }
    
    setSelected([]);
    setMode(null);
    onTijdelijkAdded?.();
  };

  const gestartCount = Object.keys(actieveMap).length;
  const now = new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="home" onNavigate={onNavigate} onLogout={onLogout} onRefresh={onRefresh} />
      <div className="flex-1 ml-20">
      {/* Header */}
      <div className="bg-[#0f2744] text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{klant.naam}</h1>
          <p className="text-xs text-white/60">
            {format(now, "EEEE d MMMM yyyy", { locale: nl })} — {format(now, "HH:mm")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{gestartCount} actief</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Afmelden
          </Button>
        </div>
      </div>

      {/* Search + Action bar */}
      <div className="bg-white border-b px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek werknemer..."
            className="pl-9 pr-9 h-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selected.length > 0 ? (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-1"
                onClick={() => handleAction("start")}
                disabled={actionLoading || selected.filter(id => {
                  if (id.startsWith('tmp-')) {
                    const t = tijdelijkeWerknemers.find(tw => tw.id === id.replace('tmp-', ''));
                    return t && t.status === "nieuw";
                  }
                  return !actieveMap[id];
                }).length === 0}
              >
                {actionLoading && mode === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start ({selected.filter(id => {
                  if (id.startsWith('tmp-')) {
                    const t = tijdelijkeWerknemers.find(tw => tw.id === id.replace('tmp-', ''));
                    return t && t.status === "nieuw";
                  }
                  return !actieveMap[id];
                }).length})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1"
                onClick={() => handleAction("stop")}
                disabled={actionLoading || selected.filter(id => {
                  if (id.startsWith('tmp-')) {
                    const t = tijdelijkeWerknemers.find(tw => tw.id === id.replace('tmp-', ''));
                    return t && t.status === "ingecheckt";
                  }
                  return !!actieveMap[id];
                }).length === 0}
              >
                {actionLoading && mode === "stop" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Stop ({selected.filter(id => {
                  if (id.startsWith('tmp-')) {
                    const t = tijdelijkeWerknemers.find(tw => tw.id === id.replace('tmp-', ''));
                    return t && t.status === "ingecheckt";
                  }
                  return !!actieveMap[id];
                }).length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected([])}>
                Deselecteer ({selected.length})
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-400">Tik op werknemers om te selecteren</p>
          )}
        </div>
      </div>

      {/* Employee grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {/* Add tijdelijk button - always first */}
        <div
          onClick={() => { if (navigator.vibrate) navigator.vibrate(8); setShowTijdelijkForm(true); }}
          className="rounded-xl border-2 border-dashed border-orange-300 p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-150 active:scale-[0.97] active:brightness-95 select-none touch-manipulation flex flex-col items-center justify-center gap-2"
        >
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-orange-100 text-orange-500">
            <UserPlus className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-orange-600">Tijdelijk toevoegen</p>
        </div>

        {/* Tijdelijke werknemers (nieuw, ingecheckt of uitgecheckt, niet gekoppeld) */}
        {tijdelijkeWerknemers.filter(t => t.status !== "gekoppeld").map((t) => {
          const isNieuw = t.status === "nieuw";
          const isUitgecheckt = t.status === "uitgecheckt";
          const isIngecheckt = t.status === "ingecheckt";
          const isSelected = selected.includes(`tmp-${t.id}`);
          return (
          <div
            key={`tmp-${t.id}`}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setSelectedTijdelijk(t); }}
            className={`rounded-xl border-2 p-4 text-center relative cursor-pointer transition-all duration-150 active:scale-[0.97] active:brightness-95 select-none touch-manipulation ${
              isSelected ? "border-blue-500 bg-blue-50 shadow-md" :
              isNieuw ? "border-orange-200 bg-orange-50/50" :
              isUitgecheckt ? "border-gray-300 bg-gray-50 opacity-70" : "border-orange-300 bg-orange-50"
            }`}
          >
            {/* Checkbox for selection */}
            {(isNieuw || isIngecheckt) && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => { e.stopPropagation(); toggleSelect(`tmp-${t.id}`); }}
                className="absolute top-2 left-2 w-4 h-4 accent-blue-500 cursor-pointer"
              />
            )}
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg ${
              isNieuw ? "bg-orange-400" :
              isUitgecheckt ? "bg-gray-400" : "bg-orange-500"
            }`}>
              {(t.voornaam || "?").charAt(0)}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{t.voornaam} {t.achternaam}</p>
            <p className={`text-[10px] font-medium ${
              isNieuw ? "text-orange-500" :
              isUitgecheckt ? "text-gray-500" : "text-orange-600"
            }`}>(tijdelijk)</p>
            {isNieuw && (
              <p className="mt-2 text-[10px] text-orange-500">Wacht op check-in</p>
            )}
            {isIngecheckt && t.start_tijd && (
              <>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-green-700">
                  <Clock className="w-3 h-3" /> {t.start_tijd}
                </div>
                <button
                  onClick={() => handleStopTijdelijk(t.id)}
                  className="mt-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600"
                >
                  Stop
                </button>
              </>
            )}
            {isUitgecheckt && (
              <>
                {t.start_tijd && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-gray-500">
                    <Clock className="w-3 h-3" /> {t.start_tijd}
                    {t.stop_tijd && <><span className="mx-0.5">→</span>{t.stop_tijd}</>}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-gray-400">Wacht op koppeling</p>
              </>
            )}
          </div>
        );
        })}

        {/* Actieve werknemers */}
        {actieveWerknemers.map((w) => {
          const isCheckedIn = !!actieveMap[w.id];
          const reg = actieveMap[w.id];
          const isSelected = selected.includes(w.id);

          return (
            <div
              key={w.id}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setSelectedEmployee(w); }}
              className={`rounded-xl border-2 p-4 text-center transition-all duration-150 cursor-pointer relative group active:scale-[0.97] active:brightness-95 select-none touch-manipulation ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : isCheckedIn
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => { e.stopPropagation(); toggleSelect(w.id); }}
                className="absolute top-2 left-2 w-4 h-4 accent-blue-500 cursor-pointer"
              />
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg ${
                  isCheckedIn ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                {(w.naam || "?").charAt(0)}
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">{w.naam || "Onbekend"}</p>
              {w.functie && <p className="text-[10px] text-gray-400 truncate">{w.functie}</p>}
              {isCheckedIn && reg && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-700 font-medium">
                  <Clock className="w-3 h-3" /> {reg.start_tijd}
                </div>
              )}
              {isSelected && (
                <div className="mt-1">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mx-auto" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Niet actieve werknemers */}
      {inactieveWerknemers.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Niet actief ({inactieveWerknemers.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {inactieveWerknemers.map((w) => (
              <div
                key={w.id}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setSelectedEmployee(w); }}
                className="rounded-xl border-2 border-gray-200 bg-gray-100 p-4 text-center cursor-pointer hover:border-gray-300 transition-all duration-150 active:scale-[0.97] select-none touch-manipulation relative opacity-60"
              >
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg bg-gray-400">
                  {(w.naam || "?").charAt(0)}
                </div>
                <p className="text-sm font-semibold text-gray-500 truncate">{w.naam || "Onbekend"}</p>
                <p className="text-[10px] text-gray-400">Niet actief</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee detail sheet */}
      <EmployeeDetailSheet
        werknemer={selectedEmployee}
        klant={klant}
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Tijdelijk detail sheet */}
      <TijdelijkDetailSheet
        tijdelijk={selectedTijdelijk}
        klant={klant}
        isOpen={!!selectedTijdelijk}
        onClose={() => setSelectedTijdelijk(null)}
        onStopTijdelijk={handleStopTijdelijk}
      />

      {/* Tijdelijk toevoegen dialog */}
      <Dialog open={showTijdelijkForm} onOpenChange={setShowTijdelijkForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tijdelijke werknemer inchecken</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Voornaam *" value={tijdelijkForm.voornaam} onChange={(e) => setTijdelijkForm({ ...tijdelijkForm, voornaam: e.target.value })} />
              <Input placeholder="Achternaam *" value={tijdelijkForm.achternaam} onChange={(e) => setTijdelijkForm({ ...tijdelijkForm, achternaam: e.target.value })} />
            </div>
            <Input placeholder="Telefoonnummer" value={tijdelijkForm.telefoon} onChange={(e) => setTijdelijkForm({ ...tijdelijkForm, telefoon: e.target.value })} />
            <Input placeholder="Opmerking" value={tijdelijkForm.opmerking} onChange={(e) => setTijdelijkForm({ ...tijdelijkForm, opmerking: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTijdelijkForm(false)}>Annuleren</Button>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAddTijdelijk} disabled={savingTijdelijk || !tijdelijkForm.voornaam.trim() || !tijdelijkForm.achternaam.trim()}>
                {savingTijdelijk ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opslaan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}