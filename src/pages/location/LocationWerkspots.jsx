import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin, Loader2, Search, X, User, AlertCircle, UserPlus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LocationSidebar from "../../components/location/LocationSidebar";
import WerkspotCard from "../../components/location/WerkspotCard";
import WerkspotListView from "../../components/location/WerkspotListView";
import AfwijkingSheet from "../../components/location/AfwijkingSheet";
import AfwijkingWorkerSelector from "../../components/location/AfwijkingWorkerSelector";

export default function LocationWerkspots({ klant, werknemers = [], onNavigate, onLogout, onRefresh }) {
  const [werkspots, setWerkspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [loadingWerkspotId, setLoadingWerkspotId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // Afwijking state
  const [afwijkingSelectorOpen, setAfwijkingSelectorOpen] = useState(false);
  const [afwijkingOpen, setAfwijkingOpen] = useState(false);
  const [afwijkingWerkspot, setAfwijkingWerkspot] = useState(null);
  const [afwijkingWerknemer, setAfwijkingWerknemer] = useState(null);
  const [tijdelijkeWerknemers, setTijdelijkeWerknemers] = useState([]);

  // Quick assign state
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [quickAssignWorker, setQuickAssignWorker] = useState(null);
  const [actieveRegistraties, setActieveRegistraties] = useState([]);

  const loadWerkspots = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("locationWerkspots", {
      action: "list",
      eindklant_id: klant.id,
    });
    setWerkspots(res.data.werkspots || []);
    setLoading(false);
  };

  useEffect(() => { loadWerkspots(); loadTijdelijkeWerknemers(); loadRegistraties(); }, [klant.id]);

  const loadRegistraties = async () => {
    const res = await base44.functions.invoke("locationRecords", { eindklant_id: klant.id });
    setActieveRegistraties((res.data.records || []).filter(r => r.status === "gestart"));
  };

  const loadTijdelijkeWerknemers = async () => {
    const res = await base44.functions.invoke("tijdelijkeWerknemer", { action: "list", eindklant_id: klant.id });
    setTijdelijkeWerknemers((res.data.records || []).filter(t => t.status === "nieuw" || t.status === "ingecheckt"));
  };

  const handleCreate = async () => {
    if (!naam.trim()) return;
    setSaving(true);
    await base44.functions.invoke("locationWerkspots", {
      action: "create",
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
      naam: naam.trim(),
      beschrijving: beschrijving.trim(),
    });
    setSaving(false);
    setNaam("");
    setBeschrijving("");
    setDialogOpen(false);
    loadWerkspots();
  };

  const handleDelete = async (id) => {
    await base44.functions.invoke("locationWerkspots", { action: "delete", werkspot_id: id });
    loadWerkspots();
  };

  const handleAssign = async (werkspotId, werknemer_ids) => {
    setAssignLoading(true);
    await base44.functions.invoke("locationWerkspots", { action: "assign", werkspot_id: werkspotId, werknemer_ids });
    await loadWerkspots();
    setAssignLoading(false);
  };

  const handleRemoveWorker = async (werkspotId, werknemerId) => {
    await base44.functions.invoke("locationWerkspots", { action: "remove_worker", werkspot_id: werkspotId, werknemer_id: werknemerId });
    loadWerkspots();
  };

  // Check-in: all assigned werknemers of the werkspot
  const handleCheckin = async (werkspot) => {
    const ids = werkspot.toegewezen_werknemers || [];
    if (ids.length === 0) return;
    setCheckinLoading(true);
    setLoadingWerkspotId(werkspot.id);

    // Build sets for classification
    const tijdelijkMap = new Map(tijdelijkeWerknemers.map(t => [t.id, t]));
    const werknemerIdSet = new Set(werknemers.map(w => w.id));

    const regularIds = [];
    const tijdelijkToStart = [];

    for (const id of ids) {
      const tijdelijk = tijdelijkMap.get(id);
      if (tijdelijk) {
        // Only start if status is "nieuw" (not already ingecheckt)
        if (tijdelijk.status === "nieuw") {
          tijdelijkToStart.push(id);
        }
      } else if (werknemerIdSet.has(id)) {
        // Only include if it's a known regular werknemer
        regularIds.push(id);
      }
    }

    if (regularIds.length > 0) {
      await base44.functions.invoke("klokRegistratie", {
        action: "start",
        werknemer_ids: regularIds,
        eindklant_id: klant.id,
        eindklant_naam: klant.naam,
      });
    }

    for (const id of tijdelijkToStart) {
      await base44.functions.invoke("tijdelijkeWerknemer", {
        action: "start",
        id,
      });
    }

    setCheckinLoading(false);
    setLoadingWerkspotId(null);
    await loadRegistraties();
    loadTijdelijkeWerknemers();
  };

  // Check-out: stop all assigned werknemers of the werkspot
  const handleCheckout = async (werkspot) => {
    const ids = werkspot.toegewezen_werknemers || [];
    if (ids.length === 0) return;
    setCheckinLoading(true);
    setLoadingWerkspotId(werkspot.id);

    const tijdelijkMap = new Map(tijdelijkeWerknemers.map(t => [t.id, t]));
    const regularToStop = [];
    const tijdelijkToStop = [];

    for (const id of ids) {
      const tijdelijk = tijdelijkMap.get(id);
      if (tijdelijk) {
        if (tijdelijk.status === "ingecheckt") {
          tijdelijkToStop.push(id);
        }
      } else if (actieveRegistraties.some(r => r.werknemer_id === id)) {
        regularToStop.push(id);
      }
    }

    if (regularToStop.length > 0) {
      await base44.functions.invoke("klokRegistratie", {
        action: "stop",
        werknemer_ids: regularToStop,
        eindklant_id: klant.id,
        eindklant_naam: klant.naam,
      });
    }

    for (const id of tijdelijkToStop) {
      await base44.functions.invoke("tijdelijkeWerknemer", {
        action: "stop",
        id,
      });
    }

    setCheckinLoading(false);
    setLoadingWerkspotId(null);
    await loadRegistraties();
    loadTijdelijkeWerknemers();
  };

  // Afwijking: open worker selector first
  const handleAfwijking = (werkspot) => {
    const ids = werkspot.toegewezen_werknemers || [];
    if (ids.length === 0) return;
    setAfwijkingWerkspot(werkspot);
    setAfwijkingSelectorOpen(true);
  };

  const handleAfwijkingWorkerSelected = (worker) => {
    setAfwijkingSelectorOpen(false);
    setAfwijkingWerknemer(worker);
    setAfwijkingOpen(true);
  };

  const handleAfwijkingDone = () => {
    setAfwijkingOpen(false);
    setAfwijkingWerkspot(null);
    setAfwijkingWerknemer(null);
    loadRegistraties();
    loadTijdelijkeWerknemers();
  };

  const handleAfwijkingClose = () => {
    setAfwijkingOpen(false);
    setAfwijkingWerkspot(null);
    setAfwijkingWerknemer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="werkspots" onNavigate={onNavigate} onLogout={onLogout} onRefresh={onRefresh} />
      <div className="flex-1 ml-20">
        <div className="bg-[#0f2744] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Werkspots — {klant.naam}</h1>
            <p className="text-xs text-white/60">Beheer werkplekken voor deze locatie</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button size="sm" className="gap-1 bg-white/10 hover:bg-white/20 text-white" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Nieuwe werkspot
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek werkspot of werknemer..."
              className="pl-9 pr-9 h-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Employee search results */}
          {search.trim() && (() => {
            const q = search.toLowerCase();
            const matchedEmployees = werknemers.filter(w => (w.naam || "").toLowerCase().includes(q));
            const matchedTijdelijk = tijdelijkeWerknemers.filter(t => `${t.voornaam} ${t.achternaam}`.toLowerCase().includes(q));
            if (matchedEmployees.length === 0 && matchedTijdelijk.length === 0) return null;
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" /> Gevonden werknemers ({matchedEmployees.length + matchedTijdelijk.length})
                </p>
                <div className="space-y-1">
                  {matchedTijdelijk.map(t => {
                    const ws = werkspots.find(ws => (ws.toegewezen_werknemers || []).includes(t.id));
                    return (
                      <div key={`t-${t.id}`} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium">{t.voornaam} {t.achternaam} <span className="text-[10px] text-orange-500 font-medium">(tijdelijk)</span></span>
                        {ws ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ws.naam}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => { setQuickAssignWorker({ id: t.id, naam: `${t.voornaam} ${t.achternaam}`, isTijdelijk: true }); setQuickAssignOpen(true); }}
                          >
                            <UserPlus className="w-3 h-3" /> Toewijzen
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {matchedEmployees.map(w => {
                    const assignedWerkspot = werkspots.find(ws => (ws.toegewezen_werknemers || []).includes(w.id));
                    return (
                      <div key={w.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium">{w.naam}</span>
                        {assignedWerkspot ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {assignedWerkspot.naam}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => { setQuickAssignWorker({ id: w.id, naam: w.naam }); setQuickAssignOpen(true); }}
                          >
                            <UserPlus className="w-3 h-3" /> Toewijzen
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nog geen werkspots aangemaakt</p>
            </div>
          ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {werkspots
                  .filter((ws) => !search.trim() || ws.naam.toLowerCase().includes(search.toLowerCase()))
                  .map((ws, idx) => (
                  <WerkspotCard
                    key={ws.id}
                    werkspot={ws}
                    colorIndex={idx}
                    werknemers={werknemers}
                    tijdelijkeWerknemers={tijdelijkeWerknemers}
                    actieveRegistraties={actieveRegistraties}
                    onDelete={handleDelete}
                    onAssign={handleAssign}
                    onRemoveWorker={handleRemoveWorker}
                    onCheckin={handleCheckin}
                    onCheckout={handleCheckout}
                    onAfwijking={handleAfwijking}
                    isActionLoading={loadingWerkspotId === ws.id}
                    isAnyLoading={!!loadingWerkspotId || assignLoading}
                  />
                ))}
              </div>
            ) : (
              <WerkspotListView
                werkspots={werkspots.filter((ws) => !search.trim() || ws.naam.toLowerCase().includes(search.toLowerCase()))}
                werknemers={werknemers}
                tijdelijkeWerknemers={tijdelijkeWerknemers}
                actieveRegistraties={actieveRegistraties}
                onCheckin={handleCheckin}
                onCheckout={handleCheckout}
                onAfwijking={handleAfwijking}
                loadingWerkspotId={loadingWerkspotId}
                isAnyLoading={!!loadingWerkspotId || assignLoading}
              />
            )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nieuwe werkspot</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Naam *</Label>
                <Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="bijv. Hal A, Kantoor 3" />
              </div>
              <div>
                <Label>Beschrijving</Label>
                <Input value={beschrijving} onChange={(e) => setBeschrijving(e.target.value)} placeholder="Optioneel" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuleren</Button>
                <Button onClick={handleCreate} disabled={saving || !naam.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Toevoegen"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Afwijking worker selector */}
        <AfwijkingWorkerSelector
          isOpen={afwijkingSelectorOpen}
          onClose={() => { setAfwijkingSelectorOpen(false); setAfwijkingWerkspot(null); }}
          werkspot={afwijkingWerkspot}
          werknemers={werknemers}
          tijdelijkeWerknemers={tijdelijkeWerknemers}
          onSelect={handleAfwijkingWorkerSelected}
        />

        {/* Afwijking Sheet */}
        <AfwijkingSheet
          isOpen={afwijkingOpen}
          onClose={handleAfwijkingClose}
          werknemer={afwijkingWerknemer}
          klant={klant}
          werkspot={afwijkingWerkspot}
          onAfwijkingDone={handleAfwijkingDone}
        />

        {/* Quick assign dialog */}
        <Dialog open={quickAssignOpen} onOpenChange={(o) => { setQuickAssignOpen(o); if (!o) setQuickAssignWorker(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Toewijzen aan werkspot</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-3">Kies een werkspot voor <strong>{quickAssignWorker?.naam}</strong>:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {werkspots.map(ws => (
                <button
                  key={ws.id}
                  onClick={async () => {
                    await handleAssign(ws.id, [quickAssignWorker.id]);
                    setQuickAssignOpen(false);
                    setQuickAssignWorker(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border rounded-lg transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {ws.naam}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}