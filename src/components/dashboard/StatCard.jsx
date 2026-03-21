import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, loading }) {
  return (
    <Card className="p-5 flex items-start justify-between hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1.5 text-foreground">
          {loading ? "—" : value}
        </p>
      </div>
      {Icon && (
        <div className="p-2.5 rounded-lg bg-muted">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </Card>
  );
}