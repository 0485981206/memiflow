import React from "react";
import { format, startOfWeek, addDays, getDay, isToday, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";

const DAY_NAMES = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function WeekView({ currentDate, prestaties, codes, onDayClick, selectedWerknemer }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getCodeColor = (code) => codes.find(c => c.code === code)?.kleur || "#3b82f6";

  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {days.map((day, i) => (
          <div key={i} className="bg-muted/50 py-2 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase">{DAY_NAMES[i]}</div>
            <div className={`text-sm font-bold mt-0.5 ${isToday(day) ? "text-accent" : "text-foreground"}`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden">
        {days.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayPrestaties = prestaties.filter(p => p.datum === dateStr);
          const weekend = i >= 5;
          return (
            <div
              key={i}
              className={`bg-card min-h-[140px] p-1.5 cursor-pointer hover:bg-muted/30 transition-colors ${weekend ? "bg-muted/20" : ""} ${isToday(day) ? "ring-2 ring-inset ring-accent" : ""}`}
              onClick={() => onDayClick(day)}
            >
              <div className="space-y-0.5">
                {dayPrestaties.slice(0, 6).map((p, j) => (
                  <div
                    key={j}
                    className="text-[10px] leading-tight font-medium px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: getCodeColor(p.code) }}
                    title={`${p.code} - ${p.uren}u ${p.werknemer_naam || ""}`}
                  >
                    {selectedWerknemer ? `${p.code} ${p.uren}u` : `${p.werknemer_naam?.split(" ")[0] || ""} ${p.code}`}
                  </div>
                ))}
                {dayPrestaties.length > 6 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayPrestaties.length - 6} meer</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}