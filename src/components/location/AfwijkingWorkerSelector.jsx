import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle, User } from "lucide-react";

export default function AfwijkingWorkerSelector({ isOpen, onClose, werkspot, werknemers = [], tijdelijkeWerknemers = [], onSelect }) {
  if (!werkspot) return null;

  const assigned = werkspot.toegewezen_werknemers || [];

  const workers = assigned.map((id) => {
    const w = werknemers.find((w) => w.id === id);
    if (w) return { id: w.id, naam: w.alias || w.naam, subtext: w.alias ? w.naam : null, isTijdelijk: false };
    const t = tijdelijkeWerknemers.find((t) => t.id === id);
    if (t) return { id: t.id, naam: t.alias || `${t.voornaam} ${t.achternaam}`, subtext: t.alias ? `${t.voornaam} ${t.achternaam}` : null, isTijdelijk: true };
    return null;
  }).filter(Boolean);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <SheetTitle className="text-base">Afwijking melden</SheetTitle>
              <p className="text-sm text-muted-foreground">{werkspot.naam}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-gray-600">Selecteer de werknemer waarvoor je een afwijking wilt melden.</p>
          <div className="space-y-2">
            {workers.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Geen werknemers toegewezen</p>
            ) : (
              workers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onSelect(w)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left active:scale-[0.98] select-none touch-manipulation"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {(w.naam || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{w.naam}</p>
                    {w.subtext && <p className="text-[10px] text-gray-400 truncate">{w.subtext}</p>}
                    {w.isTijdelijk && <span className="text-[10px] text-orange-500 font-medium">(tijdelijk)</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}