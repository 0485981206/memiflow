import React, { useState, useMemo } from "react";
import { Play, Square, LogOut, Loader2, Clock, CheckCircle2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function EmployeeBoard({ klant, werknemers = [], actieveRegistraties = [], onAction, onLogout, actionLoading }) {
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

  const filteredWerknemers = useMemo(() => {
    if (!search.trim()) return werknemers;
    const q = search.toLowerCase();
    return werknemers.filter((w) =>
      (w.naam || "").toLowerCase().includes(q) ||
      (w.functie || "").toLowerCase().includes(q)
    );
  }, [werknemers, search]);

  const actieveMap = {};
  actieveRegistraties.forEach((r) => {
    actieveMap[r.werknemer_id] = r;
  });

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
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
            <p className="text-sm text-gray-400">Tik op werknemers om te selecteren</p>
          )}
        </div>
      </div>

      {/* Employee grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredWerknemers.map((w) => {
          const isActive = !!actieveMap[w.id];
          const reg = actieveMap[w.id];
          const isSelected = selected.includes(w.id);

          return (
            <div
              key={w.id}
              onClick={() => toggleSelect(w.id)}
              className={`rounded-xl border-2 p-4 text-center transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : isActive
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg ${
                  isActive ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                {(w.naam || "?").charAt(0)}
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">{w.naam || "Onbekend"}</p>
              {w.functie && <p className="text-[10px] text-gray-400 truncate">{w.functie}</p>}
              {isActive && reg && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-700 font-medium">
                  <Clock className="w-3 h-3" /> {reg.start_tijd}
                </div>
              )}
              {isSelected && (
                <div className="mt-1">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mx-auto" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}