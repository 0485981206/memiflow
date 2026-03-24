import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, AlertTriangle, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function ImportKalenderPanel({ batch, onClose, onImported }) {
  const [selected, setSelected] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list("-created_date"),
  });

  const { data: regels = [], isLoading } = useQuery({
    queryKey: ["conceptregels", batch.id],
    queryFn: () => base44.entities.PrestatieConceptRegel.filter({ batch_id: batch.id }),
  });

  // Group by werknemer_naam
  const groepen = regels.reduce((acc, r) => {
    const key = r.werknemer_naam || "Onbekend";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const werknemerNamen = Object.keys(groepen).sort();

  useEffect(() => {
    // Pre-select all known werknemers
    const initial = new Set(
      werknemerNamen.filter(n => groepen[n].some(r => r.werknemer_id))
    );
    setSelected(initial);
  }, [regels.length]);

  const toggleAll = () => {
    if (selected.size === werknemerNamen.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(werknemerNamen));
    }
  };

  const toggle = (naam) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(naam) ? next.delete(naam) : next.add(naam);
      return next;
    });
  };

  const handleImport = async () => {
    setIsSaving(true);
    let opgeslagen = 0, overgeslagen = 0, updates = 0;

    const teImporteren = regels.filter(r => selected.has(r.werknemer_naam || "Onbekend"));

    for (const r of teImporteren) {
      if (!r.werknemer_id) { overgeslagen++; continue; }

      const werknemer = werknemers.find(w => w.id === r.werknemer_id);
      if (!werknemer) { overgeslagen++; continue; }

      const payload = {
        werknemer_id: r.werknemer_id,
        werknemer_naam: r.werknemer_naam,
        datum: r.datum,
        dag: r.dag || "",
        bron: r.bron || "",
        externe_id: r.externe_id || "",
        firma: r.firma || "",
        dagschema: r.dagschema || "",
        totaal_uren: r.uren || 0,
        maand: r.datum ? r.datum.substring(0, 7) : "",
        in_1: r.in_1 || "", uit_1: r.uit_1 || "",
        in_2: r.in_2 || "", uit_2: r.uit_2 || "",
        in_3: r.in_3 || "", uit_3: r.uit_3 || "",
        in_4: r.in_4 || "", uit_4: r.uit_4 || "",
        in_5: r.in_5 || "", uit_5: r.uit_5 || "",
        in_6: r.in_6 || "", uit_6: r.uit_6 || "",
      };

      const existing = await base44.entities.Prestatie.filter({ werknemer_id: r.werknemer_id, datum: r.datum });
      if (existing && existing.length > 0) {
        await base44.entities.Prestatie.update(existing[0].id, payload);
        updates++;
      } else {
        await base44.entities.Prestatie.create(payload);
        opgeslagen++;
      }
    }

    // Mark batch as goedgekeurd
    await base44.entities.PrestatieImportBatch.update(batch.id, {
      status: "goedgekeurd",
      aantal_goedgekeurd: opgeslagen + updates,
    });

    toast.success(`✓ ${opgeslagen} nieuw, ${updates} bijgewerkt${overgeslagen > 0 ? `, ${overgeslagen} overgeslagen` : ""}`, { duration: 6000 });
    setIsSaving(false);
    onImported();
    onClose();
  };

  const selectedCount = [...selected].reduce((acc, n) => acc + (groepen[n]?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background border-l shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Import naar Kalender
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{batch.bestandsnaam}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selected.size === werknemerNamen.length ? "Niets selecteren" : "Alles selecteren"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {selected.size} van {werknemerNamen.length} werknemers • {selectedCount} records
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Laden...
            </div>
          ) : werknemerNamen.map(naam => {
            const items = groepen[naam];
            const heeftId = items.some(r => r.werknemer_id);
            const isSelected = selected.has(naam);
            return (
              <div
                key={naam}
                onClick={() => toggle(naam)}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  isSelected ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                } ${!heeftId ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-accent border-accent" : "border-muted-foreground"
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium text-sm">{naam}</span>
                  {!heeftId && (
                    <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-2.5 h-2.5" /> Niet gevonden
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{items.length} records</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                  {items.slice(0, 8).map((r, i) => (
                    <span key={i} className="bg-muted/60 rounded px-1.5 py-0.5 truncate">
                      {r.datum} {r.uren ? `(${r.uren}u)` : ""}
                    </span>
                  ))}
                  {items.length > 8 && <span className="text-muted-foreground">+{items.length - 8} meer</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-5 py-4 flex gap-3">
          <Button onClick={handleImport} disabled={isSaving || selected.size === 0} className="gap-2 flex-1">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {isSaving ? "Importeren..." : `Import ${selectedCount} records naar Kalender`}
          </Button>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
        </div>
      </div>
    </div>
  );
}