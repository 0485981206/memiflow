import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Rapporten() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-accent" />
        Rapporten
      </h1>
      <Card>
        <CardContent className="py-16 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Rapporten module komt binnenkort
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Genereer rapportages per werknemer, eindklant of periode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}