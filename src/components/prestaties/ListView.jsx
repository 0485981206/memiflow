import React, { useMemo } from "react";
import { format, parseISO, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { berekenPrestatieCodes, buildCodeMap } from "@/lib/prestatie-codes";
import PrestatieCodeLines from "./PrestatieCodeLines";

const BRON_LABELS = { gps: "GPS", uitsnext: "UitsNext", manueel: "Manueel" };

export default function ListView({ prestaties, codes, onDayClick, werknemerData }) {
  const codeMap = useMemo(() => buildCodeMap(codes), [codes]);
  const sorted = [...prestaties].sort((a, b) => a.datum.localeCompare(b.datum));

  // Group by date
  const grouped = sorted.reduce((acc, p) => {
    if (!acc[p.datum]) acc[p.datum] = [];
    acc[p.datum].push(p);
    return acc;
  }, {});

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Geen prestaties gevonden in deze periode.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([datum, items]) => {
        const dagTotaal = items.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
        return (
          <div key={datum} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2.5 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => onDayClick(parseISO(datum))}
            >
              <span className="text-sm font-semibold capitalize">
                {format(parseISO(datum), "EEEE d MMMM yyyy", { locale: nl })}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{items.length} {items.length === 1 ? "record" : "records"}</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {dagTotaal.toFixed(1)}u
                </span>
              </div>
            </div>
            <div className="divide-y">
              {items.map((p) => {
                const code = codeMap[p.code];
                const tijden = [1, 2, 3, 4, 5, 6]
                  .map((n) => {
                    const inn = p[`in_${n}`];
                    const uit = p[`uit_${n}`];
                    return inn ? `${inn}–${uit || "?"}` : null;
                  })
                  .filter(Boolean);

                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {code && (
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: code.kleur || "#3b82f6" }}
                        />
                      )}
                      {p.code && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {p.code}
                        </Badge>
                      )}
                      {tijden.length > 0 && (
                        <span className="text-xs text-muted-foreground hidden sm:inline truncate">
                          {tijden.join(" | ")}
                        </span>
                      )}
                      {p.bron && (
                        <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 hidden md:inline">
                          {BRON_LABELS[p.bron] || p.bron}
                        </span>
                      )}
                      {p.eindklant_naam && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden lg:inline">
                          {p.eindklant_naam}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-sm shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {(p.totaal_uren || p.uren || 0).toFixed(1)}u
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Acerta codes per dag */}
            {(() => {
              const d = parseISO(datum);
              const totalUren = items.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);
              const lines = berekenPrestatieCodes(datum, getDay(d), totalUren, codeMap, werknemerData);
              if (lines.length === 0) return null;
              return (
                <div className="px-4 py-2 border-t bg-muted/20">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Acerta Codes</p>
                  <PrestatieCodeLines lines={lines} />
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}