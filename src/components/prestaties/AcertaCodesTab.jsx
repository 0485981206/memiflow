import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RotateCcw } from "lucide-react";
import { PRESTATIE_CODES } from "@/lib/prestatie-codes";

function fmt(n) {
  return n.toFixed(2).replace(".", ",");
}

export default function AcertaCodesTab({ lines, onChange, dbCodes, onReset }) {
  // Build allCodes from DB codes if available, fallback to hardcoded
  const allCodes = (dbCodes && dbCodes.length > 0)
    ? dbCodes.map(c => ({ code: c.code, naam: c.naam, kleur: c.kleur || "#999" }))
    : Object.entries(PRESTATIE_CODES).map(([code, info]) => ({ code, naam: info.naam, kleur: info.kleur }));

  const codeMap = {};
  allCodes.forEach(c => { codeMap[c.code] = c; });
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newUren, setNewUren] = useState("");

  const updateLine = (index, field, value) => {
    const updated = lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    onChange(updated);
  };

  const removeLine = (index) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    onChange(updated);
  };

  const removeLine = (index) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  const addLine = () => {
    if (!newCode || !newUren) return;
    const info = codeMap[newCode] || PRESTATIE_CODES[newCode];
    onChange([
      ...lines,
      {
        code: newCode,
        naam: info?.naam || newCode,
        uren: parseFloat(newUren) || 0,
        kleur: info?.kleur || "#999",
        isSecondary: false,
      },
    ]);
    setNewCode("");
    setNewUren("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Bewerk de automatisch berekende Acerta-codes voor deze dag.
        </p>
        {onReset && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onReset}>
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>

      {lines.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Geen codes — weekend of geen werknemer geselecteerd.
        </p>
      )}

      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2 border rounded-lg p-2.5 bg-muted/20">
            {line.isSecondary && <span className="text-muted-foreground font-bold text-xs">↓</span>}
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: line.kleur }}
            />
            {/* Code selector */}
            <select
              value={line.code}
              onChange={(e) => {
                const info = codeMap[e.target.value];
                const updated = lines.map((l, idx) => idx === i ? { ...l, code: e.target.value, kleur: info?.kleur || l.kleur, naam: info?.naam || l.naam } : l);
                onChange(updated);
              }}
              className="text-xs bg-transparent border rounded px-2 py-1.5 min-w-[80px]"
            >
              {allCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.naam}
                </option>
              ))}
            </select>
            {/* Uren input */}
            <Input
              type="number"
              step="0.01"
              min="0"
              max="24"
              value={line.uren}
              onChange={(e) => updateLine(i, "uren", parseFloat(e.target.value) || 0)}
              className="w-20 h-8 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">u</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive shrink-0"
              onClick={() => removeLine(i)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new */}
      {showAdd ? (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/10">
          <p className="text-xs font-medium">Nieuwe code toevoegen</p>
          <div className="flex items-center gap-2">
            <select
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="text-xs bg-transparent border rounded px-2 py-1.5 flex-1"
            >
              <option value="">Kies code...</option>
              {allCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.naam}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="24"
              value={newUren}
              onChange={(e) => setNewUren(e.target.value)}
              placeholder="Uren"
              className="w-20 h-8 text-xs"
            />
            <Button size="sm" className="h-8 text-xs" onClick={addLine} disabled={!newCode || !newUren}>
              Toevoegen
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAdd(false)}>
              Annuleer
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Code toevoegen
        </Button>
      )}

      {/* Summary */}
      {lines.length > 0 && (
        <div className="border-t pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{lines.length} code{lines.length !== 1 ? "s" : ""}</span>
          <span className="font-semibold text-foreground">
            Totaal: {fmt(lines.reduce((s, l) => s + (l.uren || 0), 0))} u
          </span>
        </div>
      )}
    </div>
  );
}