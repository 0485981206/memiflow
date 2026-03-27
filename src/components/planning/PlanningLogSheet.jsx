import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { History, ArrowRight } from "lucide-react";

export default function PlanningLogSheet({ isOpen, onClose, eindklantId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["planning-logs", eindklantId],
    queryFn: () => eindklantId
      ? base44.entities.PlanningLog.filter({ eindklant_id: eindklantId }, "-created_date", 50)
      : base44.entities.PlanningLog.list("-created_date", 50),
    enabled: isOpen,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <SheetTitle>Wijzigingslog</SheetTitle>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Laden...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nog geen wijzigingen</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-3 rounded-lg border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{log.werkspot_naam}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {log.created_date ? format(new Date(log.created_date), "dd MMM HH:mm", { locale: nl }) : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Datum: {log.datum}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">{log.oud_aantal}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">{log.nieuw_aantal}</span>
                </div>
                <p className="text-xs text-muted-foreground">door {log.gewijzigd_door}</p>
                {log.reden && <p className="text-xs text-muted-foreground italic">{log.reden}</p>}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}