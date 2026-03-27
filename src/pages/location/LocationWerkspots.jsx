import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, MapPin, Loader2, Users, Play, Square, Clock, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import LocationSidebar from "../../components/location/LocationSidebar";

export default function LocationWerkspots({ klant, werknemers = [], onNavigate, onLogout }) {
  const [werkspots, setWerkspots] = useState([]);
  const [actieveRegistraties, setActieveRegistraties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [saving, setSaving] = useState(false);
  const [collapsedSpots, setCollapsedSpots] = useState({});
  const [selectedPerSpot, setSelectedPerSpot] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [wsRes, regRes] = await Promise.all([
      base44.functions.invoke("locationWerkspots", { action: "list", eindklant_id: klant.id }),
      base44.functions.invoke("locationRecords", { eindklant_id: klant.id })
    ]);
    setWerkspots(wsRes.data.werkspots || []);
    setActieveRegistraties((regRes.data.records || []).filter(r => r.status === "gestart"));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [klant.id]);

  const actieveMap = {};
  actieveRegistraties.forEach(r => { actieveMap[r.werknemer_id] = r; });

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
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.functions.invoke("locationWerkspots", { action: "delete", werkspot_id: id });
    loadData();
  };

  const toggleCollapse = (id) => {
    setCollapsedSpots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelect = (spotId, werknemerId) => {
    setSelectedPerSpot(prev => {
      const current = prev[spotId] || [];
      const updated = current.includes(werknemerId)
        ? current.filter(id => id !== werknemerId)
        : [...current, werknemerId];
      return { ...prev, [spotId]: updated };
    });
  };

  const toggleSelectAll = (spotId, werknemerIds) => {
    setSelectedPerSpot(prev => {
      const current = prev[spotId] || [];
      const allSelected = werknemerIds.every(id => current.includes(id));
      return { ...prev, [spotId]: allSelected ? [] : werknemerIds };
    });
  };

  const handleAction = async (spotId, action) => {
    const selected = selectedPerSpot[spotId] || [];
    const ids = action === "start"
      ? selected.filter(id => !actieveMap[id])
      : selected.filter(id => !!actieveMap[id]);
    if (ids.length === 0) return;

    setActionLoading(`${spotId}-${action}`);
    await base44.functions.invoke("klokRegistratie", {
      action,
      werknemer_ids: ids,
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
    });
    setSelectedPerSpot(prev => ({ ...prev, [spotId]: [] }));
    setActionLoading(null);
    loadData();
  };

  const now = new Date();
  const totalActief = Object.keys(actieveMap).length;

  // Build werknemer lookup
  const werknemerMap = {};
  werknemers.forEach(w => { werknemerMap[w.id] = w; });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="werkspots" onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 ml-16">
        <div className="bg-[#0f2744] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Planning — {klant.naam}</h1>
            <p className="text-xs text-white/60">
              {format(now, "EEEE d MMMM yyyy", { locale: nl })} — {format(now, "HH:mm")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{totalActief} actief</span>
            </div>
            <Button size="sm" className="gap-1 bg-white/10 hover:bg-white/20 text-white" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Nieuwe werkspot
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : werkspots.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nog geen werkspots aangemaakt</p>
              <p className="text-sm mt-1">Maak werkspots aan om werknemers te plannen</p>
            </div>
          ) : (
            werkspots.map((ws) => {
              const werknemerIds = ws.toegewezen_werknemers || [];
              const wsWerknemers = werknemerIds.map(id => werknemerMap[id]).filter(Boolean);
              const isCollapsed = collapsedSpots[ws.id];
              const selected = selectedPerSpot[ws.id] || [];
              const allSelected = wsWerknemers.length > 0 && wsWerknemers.every(w => selected.includes(w.id));
              const someSelected = wsWerknemers.some(w => selected.includes(w.id));
              const activeCount = wsWerknemers.filter(w => actieveMap[w.id]).length;
              const canStart = selected.some(id => !actieveMap[id]);
              const canStop = selected.some(id => !!actieveMap[id]);

              return (
                <div key={ws.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* Werkspot header */}
                  <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-3">
                    <button onClick={() => toggleCollapse(ws.id)} className="flex items-center gap-2 flex-1 text-left">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-800">{ws.naam}</span>
                      <span className="text-xs text-gray-400">({wsWerknemers.length})</span>
                      {activeCount > 0 && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{activeCount} actief</span>
                      )}
                    </button>
                    <button onClick={() => handleDelete(ws.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Werkspot content */}
                  {!isCollapsed && (
                    <div className="p-4">
                      {wsWerknemers.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Geen werknemers toegewezen aan deze werkspot</p>
                      ) : (
                        <>
                          {/* Action bar */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                onChange={() => toggleSelectAll(ws.id, wsWerknemers.map(w => w.id))}
                                className="w-4 h-4 accent-blue-500"
                              />
                              <span className="text-xs text-gray-500">Selecteer alles</span>
                            </div>
                            <div className="flex-1" />
                            {selected.length > 0 && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 gap-1 h-8"
                                  onClick={() => handleAction(ws.id, "start")}
                                  disabled={!canStart || actionLoading === `${ws.id}-start`}
                                >
                                  {actionLoading === `${ws.id}-start` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                  Start ({selected.filter(id => !actieveMap[id]).length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1 h-8"
                                  onClick={() => handleAction(ws.id, "stop")}
                                  disabled={!canStop || actionLoading === `${ws.id}-stop`}
                                >
                                  {actionLoading === `${ws.id}-stop` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                                  Stop ({selected.filter(id => !!actieveMap[id]).length})
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Werknemers grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {wsWerknemers.map((w) => {
                              const isCheckedIn = !!actieveMap[w.id];
                              const reg = actieveMap[w.id];
                              const isSelected = selected.includes(w.id);

                              return (
                                <div
                                  key={w.id}
                                  onClick={() => toggleSelect(ws.id, w.id)}
                                  className={`rounded-xl border-2 p-3 text-center cursor-pointer transition-all relative ${
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
                                    onChange={() => {}}
                                    className="absolute top-2 left-2 w-4 h-4 accent-blue-500 pointer-events-none"
                                  />
                                  <div className={`w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-sm ${isCheckedIn ? "bg-green-500" : "bg-gray-300"}`}>
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
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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
      </div>
    </div>
  );
}