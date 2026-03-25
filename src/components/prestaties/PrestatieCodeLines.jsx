import React from "react";

function fmt(n) {
  return n.toFixed(2).replace(".", ",");
}

export default function PrestatieCodeLines({ lines }) {
  if (!lines || lines.length === 0) return null;
  return (
    <div className="space-y-px">
      {lines.map((l, i) => (
        <div key={i} className="flex items-center gap-1 text-[9px] leading-tight">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: l.kleur }} />
          <span className="font-semibold" style={{ color: l.kleur }}>{fmt(l.uren)}</span>
          <span className="text-muted-foreground">{l.code}</span>
        </div>
      ))}
    </div>
  );
}