import React, { useMemo, useState } from "react";
import { MapPin, Clock, LogIn, LogOut, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function WerkspotListView({ werkspots = [], werknemers = [], tijdelijkeWerknemers = [], actieveRegistraties = [], onCheckin, onCheckout, onAfwijking, onWerknemerAction }) {
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
      {werkspots.map((ws) => (
        <WerkspotListItem
          key={ws.id}
          ws={ws}
          werknemerMap={werknemerMap}
          actieveMap={actieveMap}
          tijdelijkeWerknemers={tijdelijkeWerknemers}
          onCheckin={onCheckin}
          onCheckout={onCheckout}
          onAfwijking={onAfwijking}
          onWerknemerAction={onWerknemerAction}
        />
      ))}
    </div>
  );
}

function WerkspotListItem({ ws, werknemerMap, actieveMap, tijdelijkeWerknemers, onCheckin, onCheckout, onAfwijking, onWerknemerAction }) {
  const [expanded, setExpanded] = useState(false);
  const assigned = ws.toegewezen_werknemers || [];
  const workers = assigned.map(id => werknemerMap.get(id)).filter(Boolean);
  const hasActiveWorker = assigned.some(id => {
    const reg = actieveMap.get(id);
    if (reg) return true;
    const tw = tijdelijkeWerknemers.find(t => t.id === id && t.status === "ingecheckt");
    return !!tw;
  });

  return (
    <div className={`rounded-xl border overflow-hidden ${hasActiveWorker ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-white"}`}>
      <button onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setExpanded(!expanded); }} className={`w-full px-4 py-3 flex items-center justify-between transition-all duration-150 active:brightness-95 select-none touch-manipulation ${hasActiveWorker ? "bg-green-100/60" : "bg-gray-50"}`}>
        <div className="flex items-center gap-2">
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""} ${hasActiveWorker ? "text-green-600" : "text-gray-400"}`} />
          <span className="text-lg">{getSpotIcon(ws.naam)}</span>
          <span className="font-semibold text-sm">{ws.naam}</span>
          <span className="text-xs text-gray-400">({workers.length} werknemer{workers.length !== 1 ? "s" : ""})</span>
        </div>
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
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
      </button>

      {expanded && (
        workers.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-400 italic">Geen werknemers toegewezen</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {workers.map((w) => {
              const reg = actieveMap.get(w.id);
              const isTijdelijk = w.isTijdelijk;
              const isActive = !!reg || (isTijdelijk && w.status === "ingecheckt");
              const startTijd = reg?.start_tijd || (isTijdelijk ? w.start_tijd : null);

              return (
                <button
                  key={w.id}
                  onClick={() => onWerknemerAction?.(w, ws)}
                  className="w-full px-4 py-2.5 flex items-center justify-between transition-colors duration-100 hover:bg-gray-50 active:bg-gray-100 text-left select-none touch-manipulation"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
                      {(w.naam || "?").charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{w.naam}</span>
                      {isTijdelijk && <span className="text-[10px] text-orange-500 font-medium ml-1">(tijdelijk)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && startTijd && (
                      <div className="flex items-center gap-1 text-xs text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> {startTijd}
                      </div>
                    )}
                    {isActive && (
                      <span className="text-lg">{getSpotIcon(ws.naam)}</span>
                    )}
                    {!isActive && (
                      <span className="text-[10px] text-gray-400">Niet gestart</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}