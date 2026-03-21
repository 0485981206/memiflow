import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Instellingen() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-accent" />
        Instellingen
      </h1>
      <Card>
        <CardContent className="py-16 text-center">
          <Settings className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Instellingen module komt binnenkort
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Beheer bedrijfsgegevens, gebruikers en systeeminstellingen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}