import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Loader2, Upload, Download, Save, AlertTriangle, CheckCircle2 } from "lucide-react";

function formatEntries(entries) {
  if (!entries || entries.length === 0) return "—";
  return entries.map(e => `${e.in || "?"}-${e.out || "?"}`).join(" | ");
}

export default function PrestatieImport() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [werknemerMap, setWerknemerMap] = useState({});
  const fileInputRef = useRef(null);

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list("-created_date"),
  });

  const findWerknemer = (externeId, naam) => {
    if (externeId) {
      const match = werknemers.find(w => w.externe_id === String(externeId));
      if (match) return match;
    }
    if (naam) {
      const parts = naam.toLowerCase().trim().split(/\s+/);
      return werknemers.find(w => {
        const full = `${w.voornaam || ""} ${w.achternaam || ""}`.toLowerCase();
        const rev = `${w.achternaam || ""} ${w.voornaam || ""}`.toLowerCase();
        return parts.every(p => full.includes(p) || rev.includes(p));
      });
    }
    return null;
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
    setResult(null);
    setSaveResult(null);
  };

  const uploadAndParse = async (file, format = "json") => {
    // Upload naar base44 opslag
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    // Stuur door via backend proxy
    const response = await base44.functions.invoke("parsePrestatiePdf", {
      file_url,
      format,
      active_only: "true",
      filename: file.name,
    });
    return response.data;
  };

  const handleVerwerk = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    setResult(null);
    setSaveResult(null);

    const allData = [];
    let totalHours = 0;
    const allEmployees = new Set();

    for (const file of selectedFiles) {
      const json = await uploadAndParse(file, "json");
      if (json.data) {
        allData.push(...json.data);
        json.data.forEach(r => {
          allEmployees.add(r.employee_name);
          totalHours += r.total_hours || 0;
        });
      }
    }

    const map = {};
    allData.forEach(r => {
      const key = r.externe_id || r.employee_name;
      if (!(key in map)) {
        map[key] = findWerknemer(r.externe_id, r.employee_name);
      }
    });
    setWerknemerMap(map);

    setResult({
      data: allData,
      unique_employees: allEmployees.size,
      total_records: allData.length,
      total_hours: Math.round(totalHours * 100) / 100,
    });
    setIsProcessing(false);
  };

  const handleOpslaan = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveResult(null);

    let opgeslagen = 0;
    let overgeslagen = 0;
    let updates = 0;

    for (const record of result.data) {
      const key = record.externe_id || record.employee_name;
      const werknemer = werknemerMap[key];
      if (!werknemer) { overgeslagen++; continue; }

      const maand = record.date ? record.date.substring(0, 7) : "";
      const payload = {
        werknemer_id: werknemer.id,
        werknemer_naam: `${werknemer.voornaam || ""} ${werknemer.achternaam || ""}`.trim(),
        datum: record.date,
        dag: record.day_name || "",
        bron: record.source || "",
        externe_id: record.externe_id || "",
        firma: record.firma || "",
        dagschema: record.dagschema || "",
        totaal_uren: record.total_hours || 0,
        maand,
        in_1: record.entries?.[0]?.in || "", uit_1: record.entries?.[0]?.out || "",
        in_2: record.entries?.[1]?.in || "", uit_2: record.entries?.[1]?.out || "",
        in_3: record.entries?.[2]?.in || "", uit_3: record.entries?.[2]?.out || "",
        in_4: record.entries?.[3]?.in || "", uit_4: record.entries?.[3]?.out || "",
        in_5: record.entries?.[4]?.in || "", uit_5: record.entries?.[4]?.out || "",
        in_6: record.entries?.[5]?.in || "", uit_6: record.entries?.[5]?.out || "",
      };

      const existing = await base44.entities.Prestatie.filter({
        werknemer_id: werknemer.id,
        datum: record.date,
      });

      if (existing && existing.length > 0) {
        await base44.entities.Prestatie.update(existing[0].id, payload);
        updates++;
      } else {
        await base44.entities.Prestatie.create(payload);
        opgeslagen++;
      }
    }

    setSaveResult({ opgeslagen, overgeslagen, updates });
    setIsSaving(false);
  };

  const handleDownloadCsv = async () => {
    if (selectedFiles.length === 0) return;
    for (const file of selectedFiles) {
      const csvText = await uploadAndParse(file, "csv");
      const blob = new Blob([csvText], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".pdf", ".csv");
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-accent" />
          PDF Import
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload prestatie-PDF's voor directe verwerking via de parse API.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Klik om PDF('s) te selecteren</p>
            <p className="text-sm text-muted-foreground mt-1">Meerdere bestanden zijn toegestaan</p>
          </div>
        </div>
        <input type="file" accept=".pdf" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {selectedFiles.length > 0 && (
          <div className="space-y-1">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                <FileText className="w-4 h-4 text-accent shrink-0" />
                <span className="font-medium">{f.name}</span>
                <span className="text-muted-foreground ml-auto">{(f.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleVerwerk} disabled={selectedFiles.length === 0 || isProcessing} className="gap-2">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isProcessing ? "Verwerken..." : "Verwerk PDF"}
          </Button>
          {selectedFiles.length > 0 && (
            <Button variant="outline" onClick={handleDownloadCsv} className="gap-2" disabled={isProcessing}>
              <Download className="w-4 h-4" /> Download CSV
            </Button>
          )}
        </div>
      </Card>

      {result && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-accent">{result.unique_employees}</p>
              <p className="text-xs text-muted-foreground mt-1">Werknemers</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-accent">{result.total_records}</p>
              <p className="text-xs text-muted-foreground mt-1">Dagrecords</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-accent">{result.total_hours}</p>
              <p className="text-xs text-muted-foreground mt-1">Totaal uren</p>
            </div>
          </div>

          <div className="overflow-auto max-h-[500px] border rounded-lg">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/90">
                <tr>
                  <th className="text-left p-2 font-semibold">Werknemer</th>
                  <th className="text-left p-2 font-semibold">Extern ID</th>
                  <th className="text-left p-2 font-semibold">Firma</th>
                  <th className="text-left p-2 font-semibold">Datum</th>
                  <th className="text-left p-2 font-semibold">Dag</th>
                  <th className="text-right p-2 font-semibold">Uren</th>
                  <th className="text-left p-2 font-semibold">Boekingen</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((r, i) => {
                  const key = r.externe_id || r.employee_name;
                  const gevonden = werknemerMap[key];
                  return (
                    <tr key={i} className={`border-t ${!gevonden ? "bg-orange-50" : "hover:bg-muted/30"}`}>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {!gevonden && <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />}
                          <span className={!gevonden ? "text-orange-700 font-medium" : ""}>{r.employee_name}</span>
                        </div>
                        {!gevonden && <p className="text-orange-500 text-[10px]">Onbekende werknemer - wordt niet opgeslagen</p>}
                      </td>
                      <td className="p-2 text-muted-foreground font-mono">{r.externe_id || "—"}</td>
                      <td className="p-2 text-muted-foreground">{r.firma || "—"}</td>
                      <td className="p-2">{r.date}</td>
                      <td className="p-2 text-muted-foreground">{r.day_name}</td>
                      <td className="p-2 text-right font-medium">{r.total_hours}</td>
                      <td className="p-2 text-muted-foreground font-mono">{formatEntries(r.entries)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!saveResult && (
            <Button onClick={handleOpslaan} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Opslaan..." : "Opslaan in Database"}
            </Button>
          )}

          {saveResult && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm space-y-0.5">
                <p className="font-semibold">Opgeslagen!</p>
                <p>✓ {saveResult.opgeslagen} nieuwe records aangemaakt</p>
                {saveResult.updates > 0 && <p>↻ {saveResult.updates} bestaande records bijgewerkt</p>}
                {saveResult.overgeslagen > 0 && (
                  <p className="text-orange-600">⚠ {saveResult.overgeslagen} overgeslagen (onbekende werknemers)</p>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}