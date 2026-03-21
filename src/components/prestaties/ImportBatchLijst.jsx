import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, AlertCircle, Eye, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const STATUS_CONFIG = {
  verwerken: { label: "Verwerken...", color: "bg-yellow-100 text-yellow-700", icon: Loader2, spin: true },
  klaar_voor_review: { label: "Klaar voor review", color: "bg-blue-100 text-blue-700", icon: Eye },
  goedgekeurd: { label: "Goedgekeurd", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  fout: { label: "Fout", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

export default function ImportBatchLijst({ batches, onSelectBatch, onAnnuleer }) {
  if (batches.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Geïmporteerde bestanden
      </h2>
      <div className="space-y-2">
        {batches.map((batch) => {
          const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.verwerken;
          const Icon = cfg.icon;
          return (
            <div
              key={batch.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{batch.bestandsnaam}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {batch.eindklant_naam && (
                      <span className="text-xs text-muted-foreground">{batch.eindklant_naam}</span>
                    )}
                    {batch.created_date && (
                      <span className="text-xs text-muted-foreground">
                        · {format(new Date(batch.created_date), "d MMM HH:mm", { locale: nl })}
                      </span>
                    )}
                    {batch.aantal_prestaties > 0 && (
                      <span className="text-xs text-muted-foreground">
                        · {batch.aantal_prestaties} regels
                      </span>
                    )}
                  </div>
                  {batch.agent_samenvatting && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">{batch.agent_samenvatting}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                  <Icon className={`w-3 h-3 ${cfg.spin ? "animate-spin" : ""}`} />
                  {cfg.label}
                </span>
                {batch.status === "verwerken" && onAnnuleer && (
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onAnnuleer(batch)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
                {batch.status === "klaar_voor_review" && (
                  <Button size="sm" variant="outline" onClick={() => onSelectBatch(batch)}>
                    Bekijken
                  </Button>
                )}
                {batch.status === "goedgekeurd" && (
                  <Button size="sm" variant="ghost" onClick={() => onSelectBatch(batch)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}