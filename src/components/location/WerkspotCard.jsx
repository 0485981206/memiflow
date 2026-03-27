import React, { useState, useMemo } from "react";
import { MapPin, Trash2, Users, UserPlus, X, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function WerkspotCard({ werkspot, werknemers = [], onDelete, onAssign, onRemoveWorker }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const assigned = werkspot.toegewezen_werknemers || [];

  const assignedWerknemers = useMemo(() => {
    return werknemers.filter((w) => assigned.includes(w.id));
  }, [werknemers, assigned]);

  const available = useMemo(() => {
    const q = search.toLowerCase();
    return werknemers
      .filter((w) => !assigned.includes(w.id))
      .filter((w) => !q || (w.naam || "").toLowerCase().includes(q));
  }, [werknemers, assigned, search]);

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

  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">{werkspot.naam}</span>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(werkspot.id)}>
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

          <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(""); setSelected([]); } }}>
            <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-base">Toewijzen — {werkspot.naam}</SheetTitle>
              </SheetHeader>

              <div className="py-4 space-y-4">
                {/* Huidige toewijzingen */}
                {assignedWerknemers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Toegewezen ({assignedWerknemers.length})</p>
                    <div className="space-y-1">
                      {assignedWerknemers.map((w) => (
                        <div key={w.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-sm">{w.naam}</span>
                          <button onClick={() => onRemoveWorker(werkspot.id, w.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zoek en voeg toe */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Werknemer toevoegen</p>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Zoek werknemer..."
                      className="pl-9"
                    />
                  </div>
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0 ${isChecked ? "bg-blue-50" : ""}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{w.naam}</span>
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

        {assignedWerknemers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {assignedWerknemers.map((w) => (
              <span key={w.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-700">
                {w.naam}
                <button onClick={() => onRemoveWorker(werkspot.id, w.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}