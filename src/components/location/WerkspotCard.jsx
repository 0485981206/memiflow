import React, { useState, useMemo } from "react";
import { Trash2, Users, UserPlus, X, Check, Search, LogIn, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const SPOT_COLORS = [
  { border: "border-l-blue-500", dot: "bg-blue-500" },
  { border: "border-l-purple-500", dot: "bg-purple-500" },
  { border: "border-l-amber-500", dot: "bg-amber-500" },
  { border: "border-l-rose-500", dot: "bg-rose-500" },
  { border: "border-l-teal-500", dot: "bg-teal-500" },
  { border: "border-l-indigo-500", dot: "bg-indigo-500" },
  { border: "border-l-orange-500", dot: "bg-orange-500" },
  { border: "border-l-cyan-500", dot: "bg-cyan-500" },
];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function WerkspotCard({ werkspot, werknemers = [], tijdelijkeWerknemers = [], actieveRegistraties = [], colorIndex = 0, onDelete, onAssign, onRemoveWorker, onCheckin, onCheckout, onAfwijking, isActionLoading = false, isAnyLoading = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const assigned = werkspot.toegewezen_werknemers || [];

  const assignedWerknemers = useMemo(() => {
    const regular = werknemers.filter((w) => assigned.includes(w.id));
    const tijdelijk = tijdelijkeWerknemers
      .filter((t) => assigned.includes(t.id))
      .map((t) => ({ id: t.id, naam: `${t.voornaam} ${t.achternaam}`, isTijdelijk: true }));
    return [...regular, ...tijdelijk];
  }, [werknemers, tijdelijkeWerknemers, assigned]);

  const isCheckedIn = useMemo(() => {
    if (assigned.length === 0) return false;
    // Check regular registrations
    const hasActiveReg = assigned.some(id => actieveRegistraties.some(r => r.werknemer_id === id));
    // Check tijdelijke werknemers with status "ingecheckt"
    const hasActiveTijdelijk = assigned.some(id => tijdelijkeWerknemers.some(t => t.id === id && t.status === "ingecheckt"));
    return hasActiveReg || hasActiveTijdelijk;
  }, [assigned, actieveRegistraties, tijdelijkeWerknemers]);

  const filteredAssigned = useMemo(() => {
    if (!assignedSearch.trim()) return assignedWerknemers;
    const q = assignedSearch.toLowerCase();
    return assignedWerknemers.filter((w) => (w.naam || "").toLowerCase().includes(q));
  }, [assignedWerknemers, assignedSearch]);

  const available = useMemo(() => {
    const q = search.toLowerCase();
    const regularAvailable = werknemers
      .filter((w) => !assigned.includes(w.id))
      .filter((w) => !q || (w.naam || "").toLowerCase().includes(q));
    const tijdelijkAvailable = tijdelijkeWerknemers
      .filter((t) => !assigned.includes(t.id))
      .filter((t) => !q || `${t.voornaam} ${t.achternaam}`.toLowerCase().includes(q))
      .map((t) => ({ id: t.id, naam: `${t.voornaam} ${t.achternaam}`, isTijdelijk: true }));
    return [...tijdelijkAvailable, ...regularAvailable];
  }, [werknemers, tijdelijkeWerknemers, assigned, search]);

  const handleConfirm = () => {
    if (selected.length > 0) {
      onAssign(werkspot.id, selected);
      setSelected([]);
    }
    setOpen(false);
    setSearch("");
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const spotColor = SPOT_COLORS[colorIndex % SPOT_COLORS.length];

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all duration-150 border-l-4 ${
      isCheckedIn
        ? "bg-green-50 border-green-300 border-l-green-500"
        : `bg-white border-gray-200 ${spotColor.border}`
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? "bg-green-500" : spotColor.dot}`} />
          <span className="font-semibold text-sm">{werkspot.naam}</span>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {werkspot.beschrijving && <p className="text-xs text-gray-500">{werkspot.beschrijving}</p>}

      {/* Assigned employees */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" /> {assignedWerknemers.length} werknemer{assignedWerknemers.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 gap-1" onClick={() => setOpen(true)}>
            <UserPlus className="w-3 h-3" /> Toewijzen
          </Button>

          <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(""); setSelected([]); setAssignedSearch(""); } }}>
            <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-base">Toewijzen — {werkspot.naam}</SheetTitle>
              </SheetHeader>

              <div className="py-4 space-y-4">
                {/* Search bar for entire sheet */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={assignedSearch}
                    onChange={(e) => { setAssignedSearch(e.target.value); setSearch(e.target.value); }}
                    placeholder="Zoek werknemer..."
                    className="pl-9 pr-9"
                  />
                  {assignedSearch && (
                    <button onClick={() => { setAssignedSearch(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {assignedWerknemers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Toegewezen ({assignedWerknemers.length})</p>
                    <div className="space-y-1">
                      {filteredAssigned.map((w) => (
                        <div key={w.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-sm">{w.naam} {w.isTijdelijk && <span className="text-[10px] text-orange-500 font-medium">(tijdelijk)</span>}</span>
                          <button onClick={() => onRemoveWorker(werkspot.id, w.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Werknemer toevoegen</p>

                  <div className="max-h-64 overflow-y-auto rounded-lg border">
                    {available.length === 0 ? (
                      <p className="text-sm text-gray-400 p-4 text-center">Geen beschikbare werknemers</p>
                    ) : (
                      available.map((w) => {
                        const isChecked = selected.includes(w.id);
                        return (
                          <button
                            key={w.id}
                            onClick={() => toggleSelect(w.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-all duration-100 active:bg-gray-100 select-none touch-manipulation border-b last:border-b-0 ${isChecked ? "bg-blue-50" : ""}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{w.naam}</span>
                            {w.isTijdelijk && <span className="text-[10px] text-orange-500 font-medium">(tijdelijk)</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {selected.length > 0 && (
                  <Button className="w-full" onClick={handleConfirm}>
                    {selected.length} werknemer{selected.length !== 1 ? "s" : ""} toewijzen
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>


      </div>

      {/* Action buttons */}
      <div className={`flex gap-2 pt-2 border-t ${isAnyLoading ? "pointer-events-none" : ""}`}>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setOpen(true)} disabled={isAnyLoading}>
          <UserPlus className="w-3.5 h-3.5" /> Toewijzen
        </Button>
        {isCheckedIn ? (
          <Button variant="destructive" size="sm" className="flex-1 gap-1.5" onClick={() => onCheckout?.(werkspot)} disabled={assigned.length === 0 || isAnyLoading}>
            {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            {isActionLoading ? "Bezig..." : "Check-out"}
          </Button>
        ) : (
          <Button variant="default" size="sm" className="flex-1 gap-1.5" onClick={() => onCheckin?.(werkspot)} disabled={assigned.length === 0 || isAnyLoading}>
            {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
            {isActionLoading ? "Bezig..." : "Check-in"}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          onClick={() => onAfwijking?.(werkspot)}
          disabled={assigned.length === 0 || isAnyLoading}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Werkspot verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{werkspot.naam}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(werkspot.id)}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}