import React, { useMemo, useState } from "react";
import { MapPin, Clock, User, LogIn, LogOut, AlertTriangle, ChevronRight, Loader2, UserX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveTimer from "./LiveTimer";

const SPOT_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-rose-500",
  "bg-teal-500", "bg-indigo-500", "bg-orange-500", "bg-cyan-500",
];
const SPOT_BORDER_COLORS = [
  "border-l-blue-500", "border-l-purple-500", "border-l-amber-500", "border-l-rose-500",
  "border-l-teal-500", "border-l-indigo-500", "border-l-orange-500", "border-l-cyan-500",
];

export default function WerkspotListView({ werkspots = [], allWerkspots, werknemers = [], tijdelijkeWerknemers = [], actieveRegistraties = [], onCheckin, onCheckout, onPauze, onHervatten, onAfwijking, loadingWerkspotId = null, isAnyLoading = false }) {
  const werknemerMap = useMemo(() => {
    const map = new Map();
    werknemers.forEach(w => map.set(w.id, w));
    tijdelijkeWerknemers.forEach(t => map.set(t.id, { id: t.id, naam: t.alias || `${t.voornaam} ${t.achternaam}`, isTijdelijk: true, status: t.status, start_tijd: t.start_tijd }));
    return map;
  }, [werknemers, tijdelijkeWerknemers]);

  const actieveMap = useMemo(() => {
    const map = new Map();
    actieveRegistraties.forEach(r => map.set(r.werknemer_id, r));
    return map;
  }, [actieveRegistraties]);

  // Compute unassigned workers using ALL werkspots (not just filtered)
  const allWs = allWerkspots || werkspots;
  const assignedIds = useMemo(() => {
    const set = new Set();
    allWs.forEach(ws => (ws.toegewezen_werknemers || []).forEach(id => set.add(id)));
    return set;
  }, [allWs]);

  const unassignedWorkers = useMemo(() => {
    const regular = werknemers.filter(w => !assignedIds.has(w.id));
    const tijdelijk = tijdelijkeWerknemers.filter(t => !assignedIds.has(t.id));
    return [...tijdelijk.map(t => ({ id: t.id, naam: t.alias || `${t.voornaam} ${t.achternaam}`, isTijdelijk: true, status: t.status, start_tijd: t.start_tijd })), ...regular];
  }, [werknemers, tijdelijkeWerknemers, assignedIds]);

  return (
    <div className="space-y-4">
      {werkspots.map((ws, idx) => (
        <WerkspotListItem
          key={ws.id}
          ws={ws}
          colorIndex={idx}
          werknemerMap={werknemerMap}
          actieveMap={actieveMap}
          tijdelijkeWerknemers={tijdelijkeWerknemers}
          onCheckin={onCheckin}
          onCheckout={onCheckout}
          onPauze={onPauze}
          onHervatten={onHervatten}
          onAfwijking={onAfwijking}
          isActionLoading={loadingWerkspotId === ws.id}
          isAnyLoading={isAnyLoading}
        />
      ))}

      {/* Niet toegewezen */}
      {unassignedWorkers.length > 0 && (
        <UnassignedGroup workers={unassignedWorkers} actieveMap={actieveMap} />
      )}
    </div>
  );
}

function UnassignedGroup({ workers, actieveMap }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-300 border-l-4 border-l-gray-400 overflow-hidden bg-white">
      <button onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setExpanded(!expanded); }} className="w-full px-4 py-3 flex items-center justify-between transition-all duration-150 active:brightness-95 select-none touch-manipulation bg-gray-50">
        <div className="flex items-center gap-2">
          <ChevronRight className={`w-4 h-4 transition-transform text-gray-400 ${expanded ? "rotate-90" : ""}`} />
          <UserX className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-sm text-gray-500">Niet toegewezen</span>
          <span className="text-xs text-gray-400">({workers.length} werknemer{workers.length !== 1 ? "s" : ""})</span>
        </div>
      </button>

      {expanded && (
        workers.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-400 italic">Geen werknemers</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {workers.map((w) => {
              const reg = actieveMap.get(w.id);
              const isActive = !!reg || (w.isTijdelijk && w.status === "ingecheckt");
              const startTijd = reg?.start_tijd || (w.isTijdelijk ? w.start_tijd : null);
              return (
                <div key={w.id} className="px-4 py-2.5 flex items-center justify-between transition-colors duration-100 hover:bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${isActive ? "bg-green-500" : "bg-gray-300"}`}>
                      {(w.naam || "?").charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{w.alias || w.naam}</span>
                      {w.isTijdelijk && <span className="text-[10px] text-orange-500 font-medium ml-1">(tijdelijk)</span>}
                    </div>
                  </div>
                  {isActive && startTijd ? (
                    <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                      <Clock className="w-3 h-3" /> {startTijd}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">Niet gestart</span>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function WerkspotListItem({ ws, colorIndex = 0, werknemerMap, actieveMap, tijdelijkeWerknemers, onCheckin, onCheckout, onPauze, onHervatten, onAfwijking, isActionLoading = false, isAnyLoading = false }) {
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
    <div className={`rounded-xl border overflow-hidden border-l-4 ${hasActiveWorker ? "border-green-300 bg-green-50/50 border-l-green-500" : `border-gray-200 bg-white ${SPOT_BORDER_COLORS[colorIndex % SPOT_BORDER_COLORS.length]}`}`}>
      <button onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setExpanded(!expanded); }} className={`w-full px-4 py-3 flex items-center justify-between transition-all duration-150 active:brightness-95 select-none touch-manipulation ${hasActiveWorker ? "bg-green-100/60" : "bg-gray-50"}`}>
        <div className="flex items-center gap-2">
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""} ${hasActiveWorker ? "text-green-600" : "text-gray-400"}`} />
          <div className={`w-2.5 h-2.5 rounded-full ${hasActiveWorker ? "bg-green-500" : SPOT_COLORS[colorIndex % SPOT_COLORS.length]}`} />
          <span className="font-semibold text-sm">{ws.naam}</span>
          <span className="text-xs text-gray-400">({workers.length} werknemer{workers.length !== 1 ? "s" : ""})</span>
        </div>
        <div className={`flex gap-1.5 ${isAnyLoading ? "pointer-events-none" : ""}`} onClick={(e) => e.stopPropagation()}>
          {hasActiveWorker ? (
            <>
              {ws.is_gepauzeerd ? (
                <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={() => onHervatten?.(ws)} disabled={isAnyLoading}>
                  <Play className="w-3 h-3" /> Hervatten
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onPauze?.(ws)} disabled={isAnyLoading}>
                  <Pause className="w-3 h-3" /> Pauze
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onCheckin?.(ws)} disabled={workers.length === 0 || isAnyLoading}>
              {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
              {isActionLoading ? "Bezig..." : "Check-in"}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onAfwijking?.(ws)} disabled={workers.length === 0 || isAnyLoading}>
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
                <div key={w.id} className="px-4 py-2.5 flex items-center justify-between transition-colors duration-100 hover:bg-gray-50 active:bg-gray-100">
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
                    <LiveTimer startTijd={startTijd} pauzeTijd={ws.is_gepauzeerd ? ws.pauze_start : null} className={`text-xs font-medium ${ws.is_gepauzeerd ? "text-amber-600" : "text-green-700"}`} />
                  )}
                  {!isActive && (
                    <span className="text-[10px] text-gray-400">Niet gestart</span>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}