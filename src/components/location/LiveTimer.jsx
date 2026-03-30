import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function LiveTimer({ startTijd, pauzeTijd, className = "" }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startTijd) { setElapsed(""); return; }

    const calcElapsed = () => {
      const now = new Date();
      const [h, m] = startTijd.split(":").map(Number);
      const start = new Date(now);
      start.setHours(h, m, 0, 0);

      // If pauzeTijd is set, count up to pause time instead of now
      let end = now;
      if (pauzeTijd) {
        const [ph, pm] = pauzeTijd.split(":").map(Number);
        end = new Date(now);
        end.setHours(ph, pm, 0, 0);
      }

      let diffMs = end - start;
      if (diffMs < 0) diffMs = 0;

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    setElapsed(calcElapsed());

    // Only tick if not paused
    if (!pauzeTijd) {
      const interval = setInterval(() => setElapsed(calcElapsed()), 1000);
      return () => clearInterval(interval);
    }
  }, [startTijd, pauzeTijd]);

  if (!startTijd || !elapsed) return null;

  return (
    <span className={`inline-flex items-center gap-1 font-mono tabular-nums ${className}`}>
      <Clock className="w-3 h-3" />
      {elapsed}
    </span>
  );
}