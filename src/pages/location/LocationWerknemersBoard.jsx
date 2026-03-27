import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, X, Users, MapPin, LayoutGrid, List, Trash2, AlertTriangle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import LocationSidebar from "../../components/location/LocationSidebar";
import EmployeeDetailSheet from "../../components/location/EmployeeDetailSheet";
import WerknemerAfwijkingSheet from "../../components/location/WerknemerAfwijkingSheet";

const SPOT_ICONS = {
  "Billen": "🍗",
  "Inpakken": "📦",
  "File": "🍖",
  "Filé": "🍖",
  "Hele kip": "🐔",
};
const getSpotIcon = (name) => {
  if (!name) return "📍";
  for (const [key, icon] of Object.entries(SPOT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "📍";
};

export default function LocationWerknemersBoard({ klant, werknemers: initialWerknemers = [], onNavigate, onLogout, onRefresh, onWerknemersChange }) {
  const [werknemers, setWerknemers] = useState(initialWerknemers);
  const [werkspots, setWerkspots] = useState([]);
  const [search, setSearch] = useState("");
  const [filterWerkspot, setFilterWerkspot] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [afwijkingEmployee, setAfwijkingEmployee] = useState(null);
  
  // Add employee dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ voornaam: "", achternaam: "", functie: "" });
  const [saving, setSaving] = useState(false);

  // Assign werkspot dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignEmployee, setAssignEmployee] = useState(null);
  const [assignSelectedSpots, setAssignSelectedSpots] = useState([]);

  useEffect(() => {
    loadWerkspots();
  }, [klant.id]);

  useEffect(() => {
    setWerknemers(initialWerknemers);
  }, [initialWerknemers]);

  const loadWerkspots = async () => {
    const res = await base44.functions.invoke("locationWerkspots", { action: "list", eindklant_id: klant.id });
    setWerkspots(res.data.werkspots || []);
  };

  // Build werknemer -> werkspot map
  const werknemerWerkspotMap = useMemo(() => {
    const map = {};
    werkspots.forEach(ws => {
      (ws.toegewezen_werknemers || []).forEach(wId => {
        if (!map[wId]) map[wId] = [];
        map[wId].push(ws);
      });
    });
    return map;
  }, [werkspots]);

  const filtered = useMemo(() => {
    let list = werknemers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w => (w.naam || "").toLowerCase().includes(q));
    }
    if (filterWerkspot && filterWerkspot !== "all") {
      const ws = werkspots.find(w => w.id === filterWerkspot);
      if (ws) {
        list = list.filter(w => (ws.toegewezen_werknemers || []).includes(w.id));
      }
    }
    return list;
  }, [werknemers, search, filterWerkspot, werkspots]);

  const handleAddEmployee = async () => {
    if (!addForm.voornaam.trim() || !addForm.achternaam.trim()) return;
    setSaving(true);
    
    // Create werknemer
    const werknemer = await base44.entities.Werknemer.create({
      voornaam: addForm.voornaam.trim(),
      achternaam: addForm.achternaam.trim(),
      functie: addForm.functie.trim(),
      status: "actief",
      location_status: "actief",
    });

    // Create plaatsing for this klant
    await base44.entities.Plaatsing.create({
      werknemer_id: werknemer.id,
      werknemer_naam: `${addForm.voornaam.trim()} ${addForm.achternaam.trim()}`,
      eindklant_id: klant.id,
      eindklant_naam: klant.naam,
      status: "actief",
    });

    setSaving(false);
    setAddDialogOpen(false);
    setAddForm({ voornaam: "", achternaam: "", functie: "" });
    toast.success("Werknemer toegevoegd");
    onRefresh?.();
  };

  const handleDeleteEmployee = async (w) => {
    if (!confirm(`${w.naam} verwijderen?`)) return;
    await base44.entities.Werknemer.update(w.id, { status: "inactief", location_status: "inactief" });
    setWerknemers(prev => prev.filter(x => x.id !== w.id));
    toast.success("Werknemer verwijderd");
  };

  // When opening assign dialog, pre-select currently assigned werkspots
  const openAssignDialog = (employee) => {
    setAssignEmployee(employee);
    const currentSpots = (werknemerWerkspotMap[employee.id] || []).map(ws => ws.id);
    setAssignSelectedSpots(currentSpots);
    setAssignDialogOpen(true);
  };

  const toggleAssignSpot = (wsId) => {
    setAssignSelectedSpots(prev => prev.includes(wsId) ? prev.filter(id => id !== wsId) : [...prev, wsId]);
  };

  const handleAssignWerkspot = async () => {
    if (!assignEmployee) return;
    setSaving(true);
    const currentSpots = (werknemerWerkspotMap[assignEmployee.id] || []).map(ws => ws.id);
    const toAdd = assignSelectedSpots.filter(id => !currentSpots.includes(id));
    const toRemove = currentSpots.filter(id => !assignSelectedSpots.includes(id));

    for (const wsId of toAdd) {
      await base44.functions.invoke("locationWerkspots", {
        action: "assign",
        werkspot_id: wsId,
        werknemer_ids: [assignEmployee.id],
      });
    }
    for (const wsId of toRemove) {
      await base44.functions.invoke("locationWerkspots", {
        action: "remove_worker",
        werkspot_id: wsId,
        werknemer_id: assignEmployee.id,
      });
    }

    setSaving(false);
    setAssignDialogOpen(false);
    setAssignEmployee(null);
    setAssignSelectedSpots([]);
    toast.success("Werkplaatsen bijgewerkt");
    loadWerkspots();
  };

  const handleStatusChange = (werknemerId, newStatus) => {
    setWerknemers(prev => prev.map(w => w.id === werknemerId ? { ...w, location_status: newStatus } : w));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LocationSidebar activePage="home" onNavigate={onNavigate} onLogout={onLogout} onRefresh={onRefresh} />
      <div className="flex-1 ml-20">
        <div className="bg-[#0f2744] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Werknemers</h1>
            <p className="text-xs text-white/60">{klant.naam} — {filtered.length} werknemers</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-lg p-0.5">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/20 text-white" : "text-white/50"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/20 text-white" : "text-white/50"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button size="sm" className="gap-1 bg-white/10 hover:bg-white/20 text-white" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Toevoegen
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek werknemer..." className="pl-9 pr-9" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
            </div>
            <Select value={filterWerkspot} onValueChange={setFilterWerkspot}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alle werkplaatsen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle werkplaatsen</SelectItem>
                {werkspots.map(ws => <SelectItem key={ws.id} value={ws.id}>{ws.naam}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* List view */}
          {viewMode === "list" ? (
            <div className="bg-white rounded-xl border divide-y">
              {filtered.length === 0 ? (
                <p className="p-8 text-center text-gray-400">Geen werknemers gevonden</p>
              ) : filtered.map(w => {
                const spots = werknemerWerkspotMap[w.id] || [];
                return (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${w.location_status === "inactief" ? "bg-gray-400" : "bg-blue-500"}`}>
                      {(w.naam || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{w.naam}</p>
                      {spots.length > 0 && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          {spots.map((s, i) => (
                            <span key={s.id} className="inline-flex items-center gap-0.5">
                              {i > 0 && ", "}<span>{getSpotIcon(s.naam)}</span>{s.naam}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openAssignDialog(w)}><MapPin className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-amber-500" onClick={() => setAfwijkingEmployee(w)}><AlertTriangle className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteEmployee(w)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Grid view */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(w => {
                const spots = werknemerWerkspotMap[w.id] || [];
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedEmployee(w)}
                    className="rounded-xl border bg-white p-4 text-center cursor-pointer hover:border-gray-300 transition-all duration-150 active:scale-[0.97] select-none touch-manipulation"
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg ${w.location_status === "inactief" ? "bg-gray-400" : "bg-blue-500"}`}>
                      {(w.naam || "?").charAt(0)}
                    </div>
                    <p className="text-sm font-semibold truncate">{w.naam}</p>
                    {spots.length > 0 && (
                      <p className="text-[10px] text-gray-400 truncate flex items-center gap-0.5 justify-center">
                        {spots.map(s => getSpotIcon(s.naam)).join(" ")} {spots.map(s => s.naam).join(", ")}
                      </p>
                    )}
                    <div className="flex justify-center gap-1 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); openAssignDialog(w); }} className="p-1.5 rounded-lg hover:bg-gray-100"><MapPin className="w-3.5 h-3.5 text-gray-400" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setAfwijkingEmployee(w); }} className="p-1.5 rounded-lg hover:bg-amber-50"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(w); }} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add employee dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Werknemer toevoegen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Voornaam *</Label><Input value={addForm.voornaam} onChange={(e) => setAddForm({ ...addForm, voornaam: e.target.value })} /></div>
                <div><Label>Achternaam *</Label><Input value={addForm.achternaam} onChange={(e) => setAddForm({ ...addForm, achternaam: e.target.value })} /></div>
              </div>
              <div><Label>Functie</Label><Input value={addForm.functie} onChange={(e) => setAddForm({ ...addForm, functie: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Annuleren</Button>
                <Button onClick={handleAddEmployee} disabled={saving || !addForm.voornaam.trim() || !addForm.achternaam.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Toevoegen"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign werkspot dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={(o) => { setAssignDialogOpen(o); if (!o) { setAssignEmployee(null); setAssignSelectedSpots([]); } }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Werkplaatsen toewijzen</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-600 mb-3">Kies werkplaatsen voor <strong>{assignEmployee?.naam}</strong>:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {werkspots.map(ws => {
                const isChecked = assignSelectedSpots.includes(ws.id);
                return (
                  <button
                    key={ws.id}
                    onClick={() => toggleAssignSpot(ws.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm border rounded-lg transition-colors text-left ${isChecked ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{ws.naam}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Annuleren</Button>
              <Button onClick={handleAssignWerkspot} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Toewijzen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Employee detail sheet */}
        <EmployeeDetailSheet
          werknemer={selectedEmployee}
          klant={klant}
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onStatusChange={handleStatusChange}
        />

        {/* Afwijking sheet */}
        <WerknemerAfwijkingSheet
          isOpen={!!afwijkingEmployee}
          onClose={() => setAfwijkingEmployee(null)}
          werknemer={afwijkingEmployee}
          klant={klant}
        />
      </div>
    </div>
  );
}