import React from "react";
import { format, isToday } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock } from "lucide-react";

export default function DayView({ currentDate, prestaties, codes, onDayClick }) {
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const dayPrestaties = prestaties.filter(p => p.datum === dateStr);

  const getCodeColor = (code) => codes.find(c => c.code === code)?.kleur || "#3b82f6";

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className={`px-4 py-3 border-b bg-muted/40 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors`}
        onClick={() => onDayClick(currentDate)}
      >
        <div className="font-semibold capitalize text-sm">
          {format(currentDate, "EEEE d MMMM yyyy", { locale: nl })}
        </div>
        {isToday(currentDate) && (
          <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Vandaag</span>
        )}
      </div>

      {dayPrestaties.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          Geen prestaties voor deze dag
        </div>
      ) : (
        <div className="divide-y">
          {dayPrestaties.map((p, i) => {
            const color = getCodeColor(p.code);
            const tijden = [1,2,3,4,5,6].map(n => {
              const inn = p[`in_${n}`]; const uit = p[`uit_${n}`];
              return inn ? `${inn}–${uit || "?"}` : null;
            }).filter(Boolean).join(" | ");

            return (
              <div key={p.id || i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.werknemer_naam || "—"}</div>
                  {tijden && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {tijden}
                    </div>
                  )}
                  {p.firma && <div className="text-xs text-muted-foreground">{p.firma}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: color }}>
                    {p.code || "—"}
                  </span>
                  {p.totaal_uren != null && (
                    <div className="text-xs text-muted-foreground mt-0.5">{p.totaal_uren}u</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}