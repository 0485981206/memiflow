import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImportBatchLijst from "../../components/prestaties/ImportBatchLijst";
import ReviewOffCanvas from "../../components/prestaties/ReviewOffCanvas";
import { extractTextFromPdf, parsePrestatiesFromText } from "@/lib/ocr-processor";

export default function PrestatieImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedEindklantId, setSelectedEindklantId] = useState("");
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: batches = [] } = useQuery({
    queryKey: ["importbatches"],
    queryFn: () => base44.entities.PrestatieImportBatch.list("-created_date", 50),
    refetchInterval: 5000,
  });

  const { data: eindklanten = [] } = useQuery({
    queryKey: ["eindklanten"],
    queryFn: () => base44.entities.Eindklant.filter({ status: "actief" }),
  });

  const selectedEindklant = eindklanten.find(k => k.id === selectedEindklantId);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Extract text via OCR
    let ocrText = "";
    try {
      ocrText = await extractTextFromPdf(file);
    } catch (err) {
      console.error("OCR failed:", err);
    }

    const batch = await base44.entities.PrestatieImportBatch.create({
      bestandsnaam: file.name,
      bestand_url: file_url,
      eindklant_naam: selectedEindklant?.naam || "",
      status: "verwerken",
    });

    const conversation = await base44.agents.createConversation({
      agent_name: "prestatie_import",
    });

    await base44.entities.PrestatieImportBatch.update(batch.id, {
      conversation_id: conversation.id,
    });

    // Bouw het bericht op met OCR tekst en klant-specifieke instructies
    let bericht = `Verwerk de bijgevoegde prestatie-PDF en maak concept-regels aan. batch_id: ${batch.id}`;
    if (ocrText) {
      bericht += `\n\n=== OCR GEËXTRAHEERDE TEKST ===\n${ocrText}\n=== EINDE OCR ===`;
    }
    if (selectedEindklant) {
      bericht += `\nEindklant: ${selectedEindklant.naam} (id: ${selectedEindklant.id})`;
      if (selectedEindklant.pdf_instructies) {
        bericht += `\n\nKlant-specifieke instructies:\n${selectedEindklant.pdf_instructies}`;
      }
    }

    await base44.agents.addMessage(conversation, {
      role: "user",
      content: bericht,
      file_urls: [file_url],
    });

    queryClient.invalidateQueries({ queryKey: ["importbatches"] });
    setIsUploading(false);
    e.target.value = "";
  };

  const readyCount = batches.filter(b => b.status === "klaar_voor_review").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            PDF Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload prestatie-PDF's van eindklanten voor automatische verwerking.
          </p>
        </div>
      </div>

      {readyCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <span className="font-semibold">{readyCount} bestand{readyCount > 1 ? "en" : ""} klaar voor review.</span>
          <span className="text-blue-600">Klik op "Bekijken" om te controleren en goed te keuren.</span>
        </div>
      )}

      {/* Upload zone */}
      <Card className="p-6 space-y-5">
        {/* Eindklant selectie */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Eindklant (optioneel)
          </Label>
          <Select value={selectedEindklantId} onValueChange={setSelectedEindklantId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Selecteer eindklant..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>— Geen specifieke klant —</SelectItem>
              {eindklanten.map(k => (
                <SelectItem key={k.id} value={k.id}>{k.naam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEindklant?.pdf_instructies && (
            <div className="mt-2 p-3 rounded-md bg-green-50 border border-green-200 text-xs text-green-800">
              <span className="font-semibold">✓ Klant-instructies gevonden</span> — de agent gebruikt deze bij de verwerking.
            </div>
          )}
          {selectedEindklant && !selectedEindklant.pdf_instructies && (
            <p className="text-xs text-muted-foreground mt-1">
              Nog geen instructies voor deze klant. Voeg ze toe via <span className="font-medium">Eindklanten → bewerken → PDF-instructies</span>.
            </p>
          )}
        </div>

        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <div
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-4 py-10 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground">Bestand uploaden en verwerken...</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Klik om een PDF te uploaden</p>
                <p className="text-sm text-muted-foreground mt-1">Ondersteunt Nextmemis/Centrale en GPS/Hofkip formaten</p>
              </div>
              <Button variant="outline" className="gap-2" disabled={isUploading}>
                <Upload className="w-4 h-4" /> PDF selecteren
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Lijst van batches */}
      {batches.length > 0 && (
        <Card className="p-5">
          <ImportBatchLijst
            batches={batches}
            onSelectBatch={setSelectedBatch}
            onAnnuleer={async (batch) => {
              await base44.entities.PrestatieImportBatch.update(batch.id, { status: "fout" });
              queryClient.invalidateQueries({ queryKey: ["importbatches"] });
            }}
          />
        </Card>
      )}

      {/* Review off-canvas */}
      {selectedBatch && (
        <ReviewOffCanvas
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
          onGoedgekeurd={() => {
            setSelectedBatch(null);
            queryClient.invalidateQueries({ queryKey: ["importbatches"] });
          }}
        />
      )}
    </div>
  );
}