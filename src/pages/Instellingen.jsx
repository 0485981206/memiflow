import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Zap } from "lucide-react";
import EndklantTemplateAgent from "@/components/instellingen/EndklantTemplateAgent";

export default function Instellingen() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-accent" />
        Instellingen
      </h1>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
            <TabsTrigger
              value="templates"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
            >
              <Zap className="w-4 h-4 mr-2" />
              Eindklant Template Agent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="p-6">
            <EndklantTemplateAgent />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}