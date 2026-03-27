import React, { useMemo } from "react";
import { MapPin, Clock, User, LogIn, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WerkspotListView({ werkspots = [], werknemers = [], tijdelijkeWerknemers = [], actieveRegistraties = [], onCheckin, onCheckout, onAfwijking }) {
  const werknemerMap = useMemo(() => {
    const map = new Map();
    werknemers.forEach(w => map.set(w.id, w));
    tijdelijkeWerknemers.forEach(t => map.set(t.id, { id: t.id, naam: `${t.voornaam} ${t.achternaam}`, isTijdelijk: true, status: t.status, start_tijd: t.start_tijd }));
    return map;
  }, [werknemers, tijdelijkeWerknemers]);

  const actieveMap = useMemo(() => {
    const map = new Map();
    actieveRegistraties.forEach(r => map.set(r.werknemer_id, r));
    return map;
  }, [actieveRegistraties]);

  return (
    <div className="space-y-4">
      {werkspots.map((ws) => {
        const assigned = ws.toegewezen_werknemers || [];
        const workers = assigned.map(id => werknemerMap.get(id)).filter(Boolean);
        const hasActiveWorker = assigned.some(id => {
          const reg = actieveMap.get(id);
          if (reg) return true;
          const tw = tijdelijkeWerknemers.find(t => t.id === id && t.status === "ingecheckt");
          return !!tw;
        });

        return (
          <div key={ws.id} className={`rounded-xl border overflow-hidden ${hasActiveWorker ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-white"}`}>
            {/* Werkspot header */}
            <div className={`px-4 py-3 flex items-center justify-between ${hasActiveWorker ? "bg-green-100/60" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${hasActiveWorker ? "text-green-600" : "text-gray-400"}`} />
                <span className="font-semibold text-sm">{ws.naam}</span>
                <span className="text-xs text-gray-400">({workers.length} werknemer{workers.length !== 1 ? "s" : ""})</span>
              </div>
              <div className="flex gap-1.5">
                {hasActiveWorker ? (
                  <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => onCheckout?.(ws)}>
                    <LogOut className="w-3 h-3" /> Check-out
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onCheckin?.(ws)} disabled={workers.length === 0}>
                    <LogIn className="w-3 h-3" /> Check-in
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onAfwijking?.(ws)} disabled={workers.length === 0}>
                  <AlertTriangle className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Workers list */}
            {workers.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400 italic">Geen werknemers toegewezen</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {workers.map((w) => {
                  const reg = actieveMap.get(w.id);
                  const isTijdelijk = w.isTijdelijk;
                  const isActive = !!reg || (isTijdelijk && w.status === "ingecheckt");
                  const startTijd = reg?.start_tijd || (isTijdelijk ? w.start_tijd : null);

                  return (
                    <div key={w.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
                          {(w.naam || "?").charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{w.naam}</span>
                          {isTijdelijk && <span className="text-[10px] text-orange-500 font-medium ml-1">(tijdelijk)</span>}
                        </div>
                      </div>
                      {isActive && startTijd && (
                        <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                          <Clock className="w-3 h-3" /> {startTijd}
                        </div>
                      )}
                      {!isActive && (
                        <span className="text-[10px] text-gray-400">Niet gestart</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}