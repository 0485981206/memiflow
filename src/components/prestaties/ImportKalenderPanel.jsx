import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, AlertTriangle, Loader2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

const BRON_MAP = {
  gps: "Hofkip",
  uitsnext: "Meat and More",
};

function mapBron(bron) {
  return BRON_MAP[bron?.toLowerCase()] || bron || "";
}

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
    
    // Pass selected werknemer names to backend — it handles all DB updates
    const geselecteerdeNamen = [...selected];
    
    base44.functions.invoke('importPrestaties', { 
      batchId: batch.id,
      geselecteerdeNamen 
    }).catch(err => {
      console.error('Background import failed:', err);
    });
    
    toast.success(`✓ Import gestart op achtergrond — je kunt nu verder werken`, { duration: 5000 });
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
                <div className="space-y-1.5">
                  {items.slice(0, 4).map((r, i) => {
                    const tijden = [1,2,3,4,5,6].map(n => {
                      const inn = r[`in_${n}`]; const uit = r[`uit_${n}`];
                      return inn ? `${inn}–${uit || "?"}` : null;
                    }).filter(Boolean).join(" | ");
                    return (
                      <div key={i} className="text-[10px] bg-muted/40 rounded px-2 py-1.5 space-y-0.5">
                        <div className="flex justify-between gap-1">
                          <span className="font-medium">{r.datum}</span>
                          <span className="text-muted-foreground">{r.uren}u</span>
                        </div>
                        {tijden && <div className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{tijden}</div>}
                        {r.firma && <div className="text-muted-foreground"><strong>Klant:</strong> {r.firma}</div>}
                        {r.bron && <div className="text-muted-foreground"><strong>Bron:</strong> {mapBron(r.bron)}</div>}
                      </div>
                    );
                  })}
                  {items.length > 4 && <div className="text-[10px] text-muted-foreground pl-1">+{items.length - 4} meer records</div>}
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