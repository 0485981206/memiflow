import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function WorkTimer({ startTijd }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startTijd) return;

    const calculateElapsed = () => {
      const [startH, startM] = startTijd.split(":").map(Number);
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      
      let diffMinutes = (currentH * 60 + currentM) - (startH * 60 + startM);
      if (diffMinutes < 0) diffMinutes = 0;
      
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      
      return `${hours}u${mins.toString().padStart(2, "0")}m`;
    };

    setElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTijd]);

  if (!startTijd) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      <span>{startTijd}</span>
      <span className="text-green-500">•</span>
      <span className="text-green-800 font-bold">{elapsed}</span>
    </div>
  );
}