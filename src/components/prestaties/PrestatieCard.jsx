import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, X } from "lucide-react";

function InlineEdit({ value, onSave, type = "text", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  const save = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  if (!editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-accent/10 px-0.5 py-0.5 rounded ${className}`}
        onClick={() => { setVal(value || ""); setEditing(true); }}
        title="Klik om te bewerken"
      >
        {value || "?"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="border rounded px-1 py-0.5 text-xs w-14"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      />
      <button onClick={save} className="text-green-600 p-0.5"><Check className="w-3 h-3" /></button>
      <button onClick={() => setEditing(false)} className="text-red-500 p-0.5"><X className="w-3 h-3" /></button>
    </span>
  );
}

export default function PrestatieCard({ p, onDelete, onUpdate }) {
  const [editUren, setEditUren] = useState(false);
  const [uren, setUren] = useState(p.totaal_uren ?? p.uren ?? 0);

  const slots = [1, 2, 3, 4, 5, 6].map(n => {
    const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
    return (inn || uit) ? { n, inn: inn || "", uit: uit || "" } : null;
  }).filter(Boolean);

  const handleUrenSave = () => {
    setEditUren(false);
    const parsed = parseFloat(uren) || 0;
    if (onUpdate) onUpdate(p.id, { totaal_uren: parsed, uren: parsed });
  };

  const handleCheckinSave = (slotNum, type, value) => {
    const field = `${type}_${slotNum}`;
    if (onUpdate) onUpdate(p.id, { [field]: value });
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium">{p.werknemer_naam}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{p.eindklant_naam || p.firma || "—"}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            {editUren ? (
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  value={uren}
                  onChange={(e) => setUren(e.target.value)}
                  className="border rounded px-1.5 py-0.5 text-xs w-16"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleUrenSave(); if (e.key === "Escape") setEditUren(false); }}
                />
                <button onClick={handleUrenSave} className="text-green-600 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditUren(false)} className="text-red-500 p-0.5"><X className="w-3.5 h-3.5" /></button>
              </span>
            ) : (
              <div
                className="text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded cursor-pointer hover:bg-blue-600"
                onClick={() => { setUren(p.totaal_uren ?? p.uren ?? 0); setEditUren(true); }}
                title="Klik om uren te wijzigen"
              >
                {p.totaal_uren ?? p.uren ?? 0}u
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(p.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {slots.length > 0 && (
        <div className="text-[11px] text-muted-foreground space-y-0.5 bg-muted/50 rounded px-2 py-1.5">
          {slots.map((s) => (
            <div key={s.n} className="flex items-center gap-0.5 font-mono">
              <InlineEdit
                value={s.inn}
                onSave={(v) => handleCheckinSave(s.n, "in", v)}
              />
              <span>–</span>
              <InlineEdit
                value={s.uit}
                onSave={(v) => handleCheckinSave(s.n, "uit", v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}