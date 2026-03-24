import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Settings, Zap, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import EndklantTemplateAgent from "@/components/instellingen/EndklantTemplateAgent";
import { getUISetting, setUISetting } from "@/lib/ui-settings";

export default function Instellingen() {
  const [activeTab, setActiveTab] = useState("templates");
  const [showUploadWerknemers, setShowUploadWerknemers] = useState(
    () => getUISetting("showUploadWerknemers", true)
  );

  const handleToggle = (value) => {
    setShowUploadWerknemers(value);
    setUISetting("showUploadWerknemers", value);
  };

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
        <Button
          variant={activeTab === "ui" ? "default" : "ghost"}
          onClick={() => setActiveTab("ui")}
          className="rounded-none gap-2"
        >
          <Monitor className="w-4 h-4" />
          User Interface
        </Button>
      </div>

      <Card className="p-6">
        {activeTab === "templates" && <EndklantTemplateAgent />}
        {activeTab === "ui" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">User Interface instellingen</h2>
              <p className="text-sm text-muted-foreground">Pas de zichtbaarheid van knoppen en elementen aan.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Knop "Werknemers uploaden"</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">Toon of verberg de upload-knop op de werknemerspagina.</p>
                </div>
                <Switch checked={showUploadWerknemers} onCheckedChange={handleToggle} />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}