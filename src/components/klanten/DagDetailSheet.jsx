import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Clock, User, LogIn } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

export default function DagDetailSheet({ open, onClose, datum, prestaties }) {
  if (!datum) return null;

  // Group by werknemer
  const groepen = prestaties.reduce((acc, p) => {
    const key = p.werknemer_naam || p.werknemer_id || "Onbekend";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const sorted = Object.entries(groepen).sort(([a], [b]) => a.localeCompare(b));
  const totaalUren = prestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="capitalize">
            {format(parseISO(datum), "EEEE d MMMM yyyy", { locale: nl })}
          </SheetTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {sorted.length} werknemers</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totaalUren.toFixed(1)}u totaal</span>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Geen prestaties op deze dag.</p>
          )}
          {sorted.map(([naam, items]) => {
            const uren = items.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
            const checkins = items.reduce((count, p) => {
              return count + [1,2,3,4,5,6].filter(n => p[`in_${n}`]).length;
            }, 0);

            return (
              <div key={naam} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                  <span className="font-semibold text-sm">{naam}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><LogIn className="w-3 h-3" /> {checkins} check-ins</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {uren.toFixed(1)}u
                    </span>
                  </div>
                </div>
                <div className="divide-y">
                  {items.map((p) => {
                    const tijden = [1,2,3,4,5,6].map(n => {
                      const inn = p[`in_${n}`]; 
                      const uit = p[`uit_${n}`];
                      return inn ? `${inn}–${uit || "?"}` : null;
                    }).filter(Boolean);

                    return (
                      <div key={p.id} className="px-4 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            {p.code && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{p.code}</Badge>}
                            {tijden.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {tijden.map((t, i) => (
                                  <span key={i} className={t.includes("?") ? "text-red-500 font-medium" : ""}>
                                    {i > 0 && " | "}{t}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-xs shrink-0">
                            {(p.totaal_uren || p.uren || 0).toFixed(1)}u
                          </span>
                        </div>
                        {p.opmerking && (
                          <p className="text-xs text-muted-foreground mt-1">{p.opmerking}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}