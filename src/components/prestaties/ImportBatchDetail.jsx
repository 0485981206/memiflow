import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function ImportBatchDetail({ batch, onClose }) {
  const { data: regels = [], isLoading } = useQuery({
    queryKey: ["batchregels", batch.id],
    queryFn: () => base44.entities.PrestatieConceptRegel.filter({ batch_id: batch.id }),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background border-l shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">{batch.bestandsnaam}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {batch.aantal_prestaties || 0} records • {batch.created_date ? format(new Date(batch.created_date), "d MMM yyyy HH:mm", { locale: nl }) : ""}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Laden...</div>
          ) : regels.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Geen records in deze batch</div>
          ) : (
            <div className="divide-y">
              {regels.map((r) => {
                const tijden = [1,2,3,4,5,6].map(n => {
                  const inn = r[`in_${n}`]; const uit = r[`uit_${n}`];
                  return inn ? `${inn}–${uit || "?"}` : null;
                }).filter(Boolean);

                return (
                  <div key={r.id} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{r.werknemer_naam}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.firma || "—"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.datum}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold bg-blue-500 text-white px-2 py-1 rounded">{r.uren}u</div>
                        {r.werknemer_niet_gevonden && (
                          <div className="text-[10px] text-orange-600 mt-1 bg-orange-50 px-1.5 py-0.5 rounded">Niet gevonden</div>
                        )}
                      </div>
                    </div>
                    {tijden.length > 0 && (
                      <div className="text-[11px] text-muted-foreground space-y-0.5 bg-muted/50 rounded px-2 py-1.5">
                        {tijden.map((t, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {t}
                          </div>
                        ))}
                      </div>
                    )}
                    {r.opmerking && (
                      <div className="text-xs text-muted-foreground italic">"{r.opmerking}"</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}