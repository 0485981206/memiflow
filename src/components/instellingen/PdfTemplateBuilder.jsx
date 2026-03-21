import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function PdfTemplateBuilder({ klant, onFieldsExtracted }) {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [markings, setMarkings] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsUploading(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setPdfUrl(file_url);
    setIsUploading(false);
  };

  const analyzeWithAI = async () => {
    if (!pdfUrl) return;

    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Je bent een expert in document parsing. Analyseer deze PDF en identificeer alle mogelijke velden die nuttig zijn voor timesheet/prestatie data:
        
        Zoek naar:
        - Werknemersnamen (formaat, positie)
        - Datums (welke datumformaten gebruikt)
        - Uren/urentotalen
        - Prestatiecodes (werk, verlof, ziekte, etc.)
        - Andere relevante velden
        
        Voor elk veld dat je vindt, geef:
        1. Veldnaam
        2. Positie/beschrijving waar het staat
        3. Formaat (bijv. DD-MM-YYYY, getal met decimalen)
        4. Een regex patroon als dat nuttig is
        
        Formatteer het antwoord als JSON met array van velden.`,
        file_urls: [pdfUrl],
        response_json_schema: {
          type: "object",
          properties: {
            velden: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  naam: { type: "string" },
                  beschrijving: { type: "string" },
                  formaat: { type: "string" },
                  regex: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalysisResult(result);
    } catch (error) {
      console.error("AI analyse fout:", error);
    }
    setIsAnalyzing(false);
  };

  const addMarking = (fieldName) => {
    if (!selectedRegion) return;
    setMarkings([...markings, { id: Date.now(), name: fieldName, region: selectedRegion }]);
    setSelectedRegion(null);
  };

  const removeMarking = (id) => {
    setMarkings(markings.filter((m) => m.id !== id));
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Maak een klein rechthoek rond het klikpunt
    setSelectedRegion({
      x: Math.max(0, x - 50),
      y: Math.max(0, y - 20),
      width: 100,
      height: 40,
      displayText: `(${Math.round(x)}, ${Math.round(y)})`
    });
  };

  const confirmFields = () => {
    const extractedFields = markings.map((m) => ({
      fieldType: m.name,
      beschrijving: m.region.displayText,
      regex: ""
    }));

    if (analysisResult?.velden) {
      const aiFields = analysisResult.velden.map((f) => ({
        fieldType: f.naam.toLowerCase().replace(/\s+/g, "_"),
        beschrijving: f.beschrijving,
        regex: f.regex || ""
      }));
      onFieldsExtracted([...extractedFields, ...aiFields]);
    } else {
      onFieldsExtracted(extractedFields);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Template Builder voor {klant?.naam}</CardTitle>
        <CardDescription>
          Upload een PDF, analyseer velden automatisch, of markeer ze handmatig
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload */}
        {!pdfUrl ? (
          <div>
            <Label>PDF Upload</Label>
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Uploaden..." : "PDF uploaden"}
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">
                <p className="font-medium">{file?.name}</p>
                <p className="text-muted-foreground">PDF geladen</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  setPdfUrl(null);
                  setMarkings([]);
                  setAnalysisResult(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* AI Analyse */}
            <Button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              variant="outline"
              className="w-full gap-2 mb-4"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isAnalyzing ? "Analyseren..." : "Velden analyseren met AI"}
            </Button>

            {/* AI Resultaten */}
            {analysisResult?.velden && (
              <div className="p-4 bg-accent/10 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">AI vond {analysisResult.velden.length} velden:</h4>
                <div className="space-y-2">
                  {analysisResult.velden.map((veld, idx) => (
                    <div key={idx} className="p-2 bg-background rounded border text-sm">
                      <p className="font-medium">{veld.naam}</p>
                      <p className="text-xs text-muted-foreground">{veld.beschrijving}</p>
                      {veld.regex && (
                        <code className="text-xs bg-muted p-1 rounded block mt-1">
                          {veld.regex}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas voor visueel marking */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Of klik op gebieden in de preview:</p>
              <div className="border rounded-lg overflow-auto max-h-96 bg-muted/30">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-96"
                  title="PDF Preview"
                />
              </div>
            </div>

            {/* Gemarkeerde velden */}
            {markings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Gemarkeerde gebieden:</h4>
                <div className="space-y-2">
                  {markings.map((marking) => (
                    <div
                      key={marking.id}
                      className="flex items-center justify-between p-2 border rounded bg-muted/30"
                    >
                      <div className="text-sm">
                        <Badge>{marking.name}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{marking.region.displayText}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeMarking(marking.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm */}
            <div className="flex gap-2">
              <Button
                onClick={confirmFields}
                disabled={!analysisResult?.velden && markings.length === 0}
                className="flex-1"
              >
                Velden bevestigen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}