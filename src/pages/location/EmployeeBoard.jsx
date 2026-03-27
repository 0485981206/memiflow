import React, { useState, useMemo } from "react";
import { Play, Square, LogOut, Loader2, Clock, CheckCircle2, Search, X, UserPlus, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import LocationSidebar from "../../components/location/LocationSidebar";
import EmployeeDetailSheet from "../../components/location/EmployeeDetailSheet";

export default function EmployeeBoard({ klant, werknemers = [], werkspots = [], actieveRegistraties = [], tijdelijkeWerknemers = [], onAction, onLogout, onNavigate, actionLoading, onTijdelijkAdded }) {
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
  const [localWerknemers, setLocalWerknemers] = useState(werknemers);
  const [collapsedGroups, setCollapsedGroups] = useState({});

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

  // Build werkspot groups
  const { groups, ongewijzigd, inactieveWerknemers } = useMemo(() => {
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

    // Build a map of werknemer_id -> werkspot names
    const werknemerWerkspotMap = {};
    werkspots.forEach(ws => {
      (ws.toegewezen_werknemers || []).forEach(wId => {
        if (!werknemerWerkspotMap[wId]) werknemerWerkspotMap[wId] = [];
        werknemerWerkspotMap[wId].push(ws.naam);
      });
    });

    // Group active werknemers by werkspot
    const spotGroups = {};
    const unassigned = [];

    actief.forEach(w => {
      const spots = werknemerWerkspotMap[w.id];
      if (spots && spots.length > 0) {
        spots.forEach(spotName => {
          if (!spotGroups[spotName]) spotGroups[spotName] = [];
          spotGroups[spotName].push(w);
        });
      } else {
        unassigned.push(w);
      }
    });

    // Sort groups by name
    const sortedGroups = Object.entries(spotGroups).sort((a, b) => a[0].localeCompare(b[0]));

    return { groups: sortedGroups, ongewijzigd: unassigned, inactieveWerknemers: inactief };
  }, [localWerknemers, werkspots, search]);

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

  const toggleGroupSelect = (werknemersInGroup) => {
    const ids = werknemersInGroup.map(w => w.id);
    const allSelected = ids.every(id => selected.includes(id));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const toggleCollapse = (groupName) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleAction = async (action) => {
    const ids = action === "start"
      ? selected.filter((id) => !actieveMap[id])
      : selected.filter((id) => !!actieveMap[id]);
    if (ids.length === 0) return;
    setMode(action);
    await onAction(action, ids);
    setSelected([]);
    setMode(null);
  };

  const gestartCount = Object.keys(actieveMap).length;
  const now = new Date();

  const renderEmployeeCard = (w) => {
    const isCheckedIn = !!actieveMap[w.id];
    const reg = actieveMap[w.id];
    const isSelected = selected.includes(w.id);

    return (
      <div
        key={w.id}
        onClick={() => setSelectedEmployee(w)}
        className={`rounded-xl border-2 p-3 text-center transition-all duration-200 cursor-pointer relative group ${
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
          className={`w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-sm ${
            isCheckedIn ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          {(w.naam || "?").charAt(0)}
        </div>
        <p className="text-xs font-semibold text-gray-800 truncate">{w.naam || "Onbekend"}</p>
        {w.functie && <p className="text-[10px] text-gray-400 truncate">{w.functie}</p>}
        {isCheckedIn && reg && (
          <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-green-700 font-medium">
            <Clock className="w-3 h-3" /> {reg.start_tijd}
          </div>
        )}
      </div>
    );
  };

  const renderGroupHeader = (name, werknemersInGroup) => {
    const isCollapsed = collapsedGroups[name];
    const groupIds = werknemersInGroup.map(w => w.id);
    const allSelected = groupIds.length > 0 && groupIds.every(id => selected.includes(id));
    const someSelected = groupIds.some(id => selected.includes(id));
    const activeCount = werknemersInGroup.filter(w => actieveMap[w.id]).length;

    return (
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => toggleCollapse(name)} className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          {name}
        </button>
        <span className="text-xs text-gray-400">({werknemersInGroup.length})</span>
        {activeCount > 0 && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{activeCount} actief</span>
        )}
        <div className="flex-1" />
        <input
          type="checkbox"
          checked={allSelected}
          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
          onChange={() => toggleGroupSelect(werknemersInGroup)}
          className="w-4 h-4 accent-blue-500 cursor-pointer"
        />
        <span className="text-[10px] text-gray-400">Alles</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="home" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 ml-16">
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
                  disabled={actionLoading || selected.every((id) => !!actieveMap[id])}
                >
                  {actionLoading && mode === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start ({selected.filter((id) => !actieveMap[id]).length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => handleAction("stop")}
                  disabled={actionLoading || selected.every((id) => !actieveMap[id])}
                >
                  {actionLoading && mode === "stop" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  Stop ({selected.filter((id) => !!actieveMap[id]).length})
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelected([])}>
                  Deselecteer ({selected.length})
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-400">Selecteer werknemers via de checkbox of per werkspot</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">

          {/* Tijdelijke werknemers */}
          {(tijdelijkeWerknemers.filter(t => t.status !== "gekoppeld").length > 0 || true) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">Tijdelijke werknemers</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {tijdelijkeWerknemers.filter(t => t.status !== "gekoppeld").map((t) => {
                  const isUitgecheckt = t.status === "uitgecheckt";
                  return (
                    <div
                      key={`tmp-${t.id}`}
                      className={`rounded-xl border-2 p-3 text-center relative ${isUitgecheckt ? "border-gray-300 bg-gray-50 opacity-70" : "border-orange-300 bg-orange-50"}`}
                    >
                      <div className={`w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-sm ${isUitgecheckt ? "bg-gray-400" : "bg-orange-500"}`}>
                        {(t.voornaam || "?").charAt(0)}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 truncate">{t.voornaam} {t.achternaam}</p>
                      <p className={`text-[10px] font-medium ${isUitgecheckt ? "text-gray-500" : "text-orange-600"}`}>(tijdelijk)</p>
                      <div className={`mt-1 flex items-center justify-center gap-1 text-[10px] font-medium ${isUitgecheckt ? "text-gray-500" : "text-green-700"}`}>
                        <Clock className="w-3 h-3" /> {t.start_tijd}
                        {isUitgecheckt && t.stop_tijd && (
                          <><span className="mx-0.5">→</span>{t.stop_tijd}</>
                        )}
                      </div>
                      {!isUitgecheckt && (
                        <button
                          onClick={() => handleStopTijdelijk(t.id)}
                          className="mt-1.5 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600"
                        >
                          Stop
                        </button>
                      )}
                      {isUitgecheckt && (
                        <p className="mt-1.5 text-[10px] text-gray-400">Wacht op koppeling</p>
                      )}
                    </div>
                  );
                })}
                <div
                  onClick={() => setShowTijdelijkForm(true)}
                  className="rounded-xl border-2 border-dashed border-orange-300 p-3 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-orange-100 text-orange-500">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-semibold text-orange-600">Toevoegen</p>
                </div>
              </div>
            </div>
          )}

          {/* Werkspot groups */}
          {groups.map(([spotName, werknemersInGroup]) => (
            <div key={spotName}>
              {renderGroupHeader(spotName, werknemersInGroup)}
              {!collapsedGroups[spotName] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {werknemersInGroup.map(renderEmployeeCard)}
                </div>
              )}
            </div>
          ))}

          {/* Niet-toegewezen werknemers */}
          {ongewijzigd.length > 0 && (
            <div>
              {renderGroupHeader("Niet toegewezen", ongewijzigd)}
              {!collapsedGroups["Niet toegewezen"] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {ongewijzigd.map(renderEmployeeCard)}
                </div>
              )}
            </div>
          )}

          {/* Niet actieve werknemers */}
          {inactieveWerknemers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Niet actief ({inactieveWerknemers.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {inactieveWerknemers.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedEmployee(w)}
                    className="rounded-xl border-2 border-gray-200 bg-gray-100 p-3 text-center cursor-pointer hover:border-gray-300 relative opacity-60"
                  >
                    <div className="w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-sm bg-gray-400">
                      {(w.naam || "?").charAt(0)}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 truncate">{w.naam || "Onbekend"}</p>
                    <p className="text-[10px] text-gray-400">Niet actief</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Employee detail sheet */}
        <EmployeeDetailSheet
          werknemer={selectedEmployee}
          klant={klant}
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onStatusChange={handleStatusChange}
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
                  {savingTijdelijk ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inchecken"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}