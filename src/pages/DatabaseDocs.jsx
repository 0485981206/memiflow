import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Database, GitBranch, Shield, List, Loader2, CheckCircle2, Copy, Navigation } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SchemaSection from "../components/docs/SchemaSection";
import RelationsSection from "../components/docs/RelationsSection";
import PermissionsSection from "../components/docs/PermissionsSection";
import EnumsSection from "../components/docs/EnumsSection";
import NavigatieSection from "../components/docs/NavigatieSection";
import ExportAllButton from "../components/docs/ExportAllButton";

const ENTITIES = [
  "Werknemer", "Eindklant", "Werkspot", "Plaatsing", "Prestatie",
  "PrestatieCode", "PrestatieImportBatch", "PrestatieConceptRegel",
  "AcertaCode", "FinancieelRapport", "Klokregistratie", "TijdelijkeWerknemer", "Afwijking"
];

export default function DatabaseDocs() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState(null);
  const [csvLoading, setCsvLoading] = useState({});
  const { toast } = useToast();

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);
    const res = await base44.functions.invoke("backupToSupabase", {});
    setBackupResult(res.data);
    setBackupLoading(false);
    toast({ title: "Backup voltooid", description: `${Object.values(res.data.results).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)} records gebackupt` });
  };

  const handleCsvExport = async (entity) => {
    setCsvLoading(prev => ({ ...prev, [entity]: true }));
    const res = await base44.functions.invoke("exportCsv", { entity });
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvLoading(prev => ({ ...prev, [entity]: false }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Database Documentatie & Backup</h1>
          <p className="text-sm text-muted-foreground">Volledige documentatie van je database schema, relaties en permissies</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportAllButton />
          <Button onClick={handleBackup} disabled={backupLoading} className="gap-2">
            {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {backupLoading ? "Backup bezig..." : "Backup naar Supabase"}
          </Button>
        </div>
      </div>

      {backupResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Backup resultaat</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {Object.entries(backupResult.results).map(([name, count]) => (
                <div key={name} className="bg-white rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-gray-500">{name}</div>
                  <div className="font-bold text-lg">{typeof count === 'number' ? count : '❌'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="navigatie" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="navigatie" className="gap-1"><Navigation className="w-3 h-3" /> Navigatie</TabsTrigger>
          <TabsTrigger value="csv" className="gap-1"><Download className="w-3 h-3" /> CSV Export</TabsTrigger>
          <TabsTrigger value="schema" className="gap-1"><Database className="w-3 h-3" /> Schema</TabsTrigger>
          <TabsTrigger value="relations" className="gap-1"><GitBranch className="w-3 h-3" /> Relaties</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1"><Shield className="w-3 h-3" /> Permissies</TabsTrigger>
          <TabsTrigger value="enums" className="gap-1"><List className="w-3 h-3" /> Enums</TabsTrigger>
        </TabsList>

        <TabsContent value="navigatie"><NavigatieSection /></TabsContent>

        <TabsContent value="csv">
          <Card>
            <CardHeader><CardTitle>CSV Export per tabel</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ENTITIES.map(e => (
                  <Button key={e} variant="outline" className="gap-2 justify-start" onClick={() => handleCsvExport(e)} disabled={csvLoading[e]}>
                    {csvLoading[e] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {e}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema"><SchemaSection /></TabsContent>
        <TabsContent value="relations"><RelationsSection /></TabsContent>
        <TabsContent value="permissions"><PermissionsSection /></TabsContent>
        <TabsContent value="enums"><EnumsSection /></TabsContent>
      </Tabs>
    </div>
  );
}