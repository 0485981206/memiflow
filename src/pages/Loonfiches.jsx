import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Loonfiches() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6 text-accent" />
        Loonfiches
      </h1>
      <Card>
        <CardContent className="py-16 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Loonfiches module komt binnenkort
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Hier kun je loonfiches genereren op basis van goedgekeurde prestaties.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}