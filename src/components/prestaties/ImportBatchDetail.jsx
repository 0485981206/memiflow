import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

function TijdRegel({ t }) {
  const heeftVraagteken = t.includes("?");
  return (
    <div className={`flex items-center gap-1 ${heeftVraagteken ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
      {heeftVraagteken
        ? <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0" />
        : <Clock className="w-2.5 h-2.5 shrink-0" />
      }
      {t}
    </div>
  );
}

export default function ImportBatchDetail({ batch, onClose }) {
  const { data: regels = [], isLoading } = useQuery({
    queryKey: ["batchregels", batch.id],
    queryFn: () => base44.entities.PrestatieConceptRegel.filter({ batch_id: batch.id }),
  });

  // Group by werknemer_naam, then by datum
  const groepen = regels.reduce((acc, r) => {
    const naam = r.werknemer_naam || "Onbekend";
    if (!acc[naam]) acc[naam] = { niet_gevonden: r.werknemer_niet_gevonden, externe_id: r.externe_id, datums: {} };
    const datum = r.datum || "?";
    if (!acc[naam].datums[datum]) acc[naam].datums[datum] = [];
    acc[naam].datums[datum].push(r);
    return acc;
  }, {});

  const werknemerNamen = Object.keys(groepen).sort();

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
              {werknemerNamen.map((naam) => {
                const groep = groepen[naam];
                const datums = Object.keys(groep.datums).sort();
                const totaalUren = Object.values(groep.datums).flat().reduce((s, r) => s + (r.uren || 0), 0);

                return (
                  <div key={naam} className={`${groep.niet_gevonden ? "bg-orange-50/40 border-l-4 border-orange-300" : ""}`}>
                    {/* Werknemer header */}
                    <div className="flex items-start justify-between px-5 py-3 bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {naam}
                          {groep.niet_gevonden && (
                            <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded font-normal">Niet gevonden</span>
                          )}
                        </div>
                        {groep.externe_id && <div className="text-xs text-muted-foreground">ID: {groep.externe_id}</div>}
                      </div>
                      <div className="bg-blue-500 text-white text-sm font-semibold px-2 py-1 rounded shrink-0">
                        {totaalUren.toFixed(2)}u
                      </div>
                    </div>

                    {/* Datums */}
                    <div className="divide-y divide-border/50">
                      {datums.map((datum) => {
                        const dagRegels = groep.datums[datum];
                        const dagUren = dagRegels.reduce((s, r) => s + (r.uren || 0), 0);
                        // Collect all times from all records for this day
                        const tijden = dagRegels.flatMap(r =>
                          [1,2,3,4,5,6].map(n => {
                            const inn = r[`in_${n}`]; const uit = r[`uit_${n}`];
                            return inn ? `${inn}–${uit || "?"}` : null;
                          }).filter(Boolean)
                        );
                        const heeftVraagteken = tijden.some(t => t.includes("?"));

                        return (
                          <div key={datum} className="flex items-start justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors">
                            <div className="flex-1">
                              <div className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${heeftVraagteken ? "text-red-600" : "text-muted-foreground"}`}>
                                {heeftVraagteken && <AlertCircle className="w-3 h-3 text-red-500" />}
                                {datum}
                              </div>
                              {tijden.length > 0 && (
                                <div className="text-[11px] space-y-0.5">
                                  {tijden.map((t, i) => <TijdRegel key={i} t={t} />)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-4 mt-0.5">
                              {dagUren.toFixed(2)}u
                            </span>
                          </div>
                        );
                      })}
                    </div>
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