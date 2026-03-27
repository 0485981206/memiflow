import React, { useState } from "react";
import { MapPin, ChevronDown, ChevronUp, Check, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PlanningSpotRow({ werkspot, aantal, geselecteerdeWerknemers = [], beschikbareWerknemers = [], onChangeAantal, onChangeWerknemers, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const aantalNum = Number(aantal) || 0;
  const selectedCount = geselecteerdeWerknemers.length;

  const toggleWerknemer = (id) => {
    const next = geselecteerdeWerknemers.includes(id)
      ? geselecteerdeWerknemers.filter(x => x !== id)
      : [...geselecteerdeWerknemers, id];
    onChangeWerknemers(next);
  };

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <MapPin className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium flex-1 min-w-0 truncate">{werkspot.naam}</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={aantal ?? 0}
            onChange={(e) => onChangeAantal(e.target.value)}
            disabled={disabled}
            className="w-20 h-9 text-center"
          />
          {aantalNum > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCount > 0 && selectedCount >= aantalNum
                  ? "bg-green-100 text-green-700"
                  : selectedCount > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Users className="w-3 h-3" />
              {selectedCount}/{aantalNum}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {expanded && aantalNum > 0 && (
        <div className="border-t px-3 py-2 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Selecteer werknemers ({selectedCount}/{aantalNum}):</p>
            <div className="flex gap-2">
              {selectedCount > 0 && (
                <button
                  onClick={() => !disabled && onChangeWerknemers([])}
                  disabled={disabled}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Wis alles
                </button>
              )}
              <button
                onClick={() => {
                  if (disabled) return;
                  const allIds = beschikbareWerknemers.map(w => w.id);
                  onChangeWerknemers(allIds);
                }}
                disabled={disabled}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Selecteer alle
              </button>
            </div>
          </div>
          {beschikbareWerknemers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Geen werknemers beschikbaar</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {beschikbareWerknemers.map(w => {
                const isSelected = geselecteerdeWerknemers.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => !disabled && toggleWerknemer(w.id)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left select-none touch-manipulation active:scale-[0.98] ${
                      isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-primary border-primary" : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(w.naam || w.voornaam || "?").charAt(0)}
                    </div>
                    <span className="truncate">{w.naam || `${w.voornaam} ${w.achternaam}`}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}