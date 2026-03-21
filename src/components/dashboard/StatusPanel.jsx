import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function StatusPanel({ prestaties }) {
  const goedgekeurd = prestaties.filter((p) => p.status === "goedgekeurd").length;
  const ingevoerd = prestaties.filter((p) => p.status === "ingevoerd").length;
  const afgekeurd = prestaties.filter((p) => p.status === "afgekeurd").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <RefreshCw className="w-5 h-5 text-accent" />
            Prestatie Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Goedgekeurd</span>
            <Badge variant="secondary" className="bg-chart-5/10 text-chart-5 font-semibold">
              {goedgekeurd}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending</span>
            <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 font-semibold">
              {ingevoerd}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Afgekeurd</span>
            <Badge variant="destructive" className="font-semibold">
              {afgekeurd}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="w-5 h-5 text-chart-4" />
            Waarschuwingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-chart-5" />
            Geen waarschuwingen.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}