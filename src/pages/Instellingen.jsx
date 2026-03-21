import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import EndklantTemplateAgent from "@/components/instellingen/EndklantTemplateAgent";

export default function Instellingen() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-accent" />
        Instellingen
      </h1>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "templates" ? "default" : "ghost"}
          onClick={() => setActiveTab("templates")}
          className="rounded-none gap-2"
        >
          <Zap className="w-4 h-4" />
          Eindklant Template Agent
        </Button>
      </div>

      <Card className="p-6">
        {activeTab === "templates" && <EndklantTemplateAgent />}
      </Card>
    </div>
  );
}