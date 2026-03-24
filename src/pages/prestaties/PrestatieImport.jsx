import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Loader2, Upload, AlertTriangle,
  CheckCircle2, X, Clock, Ban, Calendar, Trash2
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ImportKalenderPanel from "@/components/prestaties/ImportKalenderPanel";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const STATUS = { WACHTEN: "wachten", BEZIG: "bezig", KLAAR: "klaar", FOUT: "fout", GEANNULEERD: "geannuleerd" };

const batchStatusConfig = {
  verwerken: { label: "Verwerken", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  klaar_voor_review: { label: "Klaar voor review", color: "bg-amber-100 text-amber-700", icon: Clock },
  goedgekeurd: { label: "Geïmporteerd", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  fout: { label: "Fout", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export default function PrestatieImport() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewBatch, setReviewBatch] = useState(null);
  const [deleteBatchId, setDeleteBatchId] = useState(null);
  const fileInputRef = useRef(null);
  const cancelledRef = useRef(false);
  const queryClient = useQueryClient();

  const { data: werknemers = [] } = useQuery({
    queryKey: ["werknemers"],
    queryFn: () => base44.entities.Werknemer.list("-created_date"),
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ["importbatches"],
    queryFn: () => base44.entities.PrestatieImportBatch.list("-created_date"),
    refetchInterval: isProcessing ? 3000 : false,
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
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setQueue(files.map(f => ({ file: f, status: STATUS.WACHTEN, error: null })));
  };

  const updateQueue = (index, update) => {
    setQueue(prev => prev.map((item, i) => i === index ? { ...item, ...update } : item));
  };

  const handleAnnuleer = () => {
    cancelledRef.current = true;
    setQueue(prev => prev.map(item =>
      item.status === STATUS.WACHTEN ? { ...item, status: STATUS.GEANNULEERD } : item
    ));
  };

  const handleVerwerk = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    cancelledRef.current = false;
    setQueue(selectedFiles.map(f => ({ file: f, status: STATUS.WACHTEN, error: null })));

    for (let i = 0; i < selectedFiles.length; i++) {
      if (cancelledRef.current) {
        updateQueue(i, { status: STATUS.GEANNULEERD });
        continue;
      }
      const file = selectedFiles[i];
      updateQueue(i, { status: STATUS.BEZIG });

      try {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Parse PDF
        const response = await base44.functions.invoke("parsePrestatiePdf", {
          file_url, format: "json", active_only: "true", filename: file.name,
        });
        const json = response.data;
        const records = json.data || [];

        // Create batch in DB
        const batch = await base44.entities.PrestatieImportBatch.create({
          bestandsnaam: file.name,
          bestand_url: file_url,
          status: "klaar_voor_review",
          aantal_prestaties: records.length,
          agent_samenvatting: `${records.length} records geladen uit ${file.name}`,
        });

        // Save concept regels
        const conceptRegels = records.map(r => {
          const werknemer = findWerknemer(r.externe_id, r.employee_name);
          return {
            batch_id: batch.id,
            werknemer_naam: r.employee_name || "",
            werknemer_id: werknemer?.id || null,
            datum: r.date || "",
            dag: r.day_name || "",
            uren: r.total_hours || 0,
            bron: r.source || "",
            externe_id: r.externe_id || "",
            firma: r.firma || "",
            dagschema: r.dagschema || "",
            in_1: r.entries?.[0]?.in || "", uit_1: r.entries?.[0]?.out || "",
            in_2: r.entries?.[1]?.in || "", uit_2: r.entries?.[1]?.out || "",
            in_3: r.entries?.[2]?.in || "", uit_3: r.entries?.[2]?.out || "",
            in_4: r.entries?.[3]?.in || "", uit_4: r.entries?.[3]?.out || "",
            in_5: r.entries?.[4]?.in || "", uit_5: r.entries?.[4]?.out || "",
            in_6: r.entries?.[5]?.in || "", uit_6: r.entries?.[5]?.out || "",
            werknemer_niet_gevonden: !werknemer,
          };
        });

        // Bulk save concept regels
        for (const regel of conceptRegels) {
          await base44.entities.PrestatieConceptRegel.create(regel);
        }

        updateQueue(i, { status: STATUS.KLAAR });
        toast.success(`✓ ${file.name} verwerkt — ${records.length} records opgeslagen`, { duration: 5000 });
      } catch (err) {
        updateQueue(i, { status: STATUS.FOUT, error: err.message });
        toast.error(`Fout bij ${file.name}: ${err.message}`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["importbatches"] });
    setIsProcessing(false);
    setSelectedFiles([]);
    setQueue([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteBatch = async () => {
    const batchId = deleteBatchId;
    setDeleteBatchId(null);
    try {
      const regels = await base44.entities.PrestatieConceptRegel.filter({ batch_id: batchId });
      for (const r of regels) {
        try { await base44.entities.PrestatieConceptRegel.delete(r.id); } catch (_) {}
      }
      await base44.entities.PrestatieImportBatch.delete(batchId);
      queryClient.invalidateQueries({ queryKey: ["importbatches"] });
      toast.success("Batch verwijderd");
    } catch (err) {
      toast.error("Verwijderen mislukt: " + err.message);
    }
  };

  const queueStatusIcon = (status) => {
    if (status === STATUS.BEZIG) return <Loader2 className="w-4 h-4 animate-spin text-accent" />;
    if (status === STATUS.KLAAR) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === STATUS.FOUT) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (status === STATUS.GEANNULEERD) return <Ban className="w-4 h-4 text-muted-foreground" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const queueStatusLabel = (status) => {
    if (status === STATUS.BEZIG) return <span className="text-accent">Verwerken...</span>;
    if (status === STATUS.KLAAR) return <span className="text-green-600">Klaar</span>;
    if (status === STATUS.FOUT) return <span className="text-red-500">Fout</span>;
    if (status === STATUS.GEANNULEERD) return <span className="text-muted-foreground">Geannuleerd</span>;
    return <span className="text-muted-foreground">Wachtrij</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-accent" />
          PDF Import
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload prestatie-PDF's. Geïmporteerde data wordt opgeslagen en kan daarna naar de kalender worden gezet.
        </p>
      </div>

      {/* Upload Card */}
      <Card className="p-6 space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Klik om PDF('s) te selecteren</p>
            <p className="text-sm text-muted-foreground mt-1">Meerdere bestanden zijn toegestaan</p>
          </div>
        </div>
        <input type="file" accept=".pdf" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {/* Queue */}
        {queue.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wachtrij</p>
            {queue.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm p-2.5 rounded-md border ${
                  item.status === STATUS.BEZIG ? "bg-accent/5 border-accent/30" :
                  item.status === STATUS.KLAAR ? "bg-green-50 border-green-200" :
                  item.status === STATUS.FOUT ? "bg-red-50 border-red-200" :
                  "bg-muted/30 border-border"
                }`}
              >
                {queueStatusIcon(item.status)}
                <span className="flex-1 font-medium truncate">{item.file.name}</span>
                <span className="text-muted-foreground text-xs">{(item.file.size / 1024).toFixed(1)} KB</span>
                <span className="text-xs ml-2">{queueStatusLabel(item.status)}</span>
                {item.error && <span className="text-red-500 text-xs ml-1" title={item.error}>(!)</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleVerwerk} disabled={selectedFiles.length === 0 || isProcessing} className="gap-2">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isProcessing ? "Verwerken..." : "Verwerk PDF"}
          </Button>
          {isProcessing && (
            <Button variant="destructive" onClick={handleAnnuleer} className="gap-2">
              <X className="w-4 h-4" /> Annuleren
            </Button>
          )}
        </div>
      </Card>

      {/* Batches list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Geïmporteerde PDFs</h2>
        {batchesLoading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Laden...
          </div>
        ) : batches.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Nog geen PDF's geïmporteerd
          </Card>
        ) : (
          <div className="space-y-2">
            {batches.map(batch => {
              const cfg = batchStatusConfig[batch.status] || batchStatusConfig.fout;
              const Icon = cfg.icon;
              return (
                <Card key={batch.id} className="p-4 flex items-center gap-4">
                  <FileText className="w-8 h-8 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{batch.bestandsnaam}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {batch.created_date ? format(new Date(batch.created_date), "d MMM yyyy HH:mm", { locale: nl }) : ""}
                      {batch.aantal_prestaties ? ` • ${batch.aantal_prestaties} records` : ""}
                      {batch.eindklant_naam ? ` • ${batch.eindklant_naam}` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                    <Icon className={`w-3 h-3 ${batch.status === "verwerken" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </span>
                  {batch.status !== "goedgekeurd" && (
                    <Button
                      size="sm"
                      className="gap-1.5 shrink-0"
                      onClick={() => setReviewBatch(batch)}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Import Kalender
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => setDeleteBatchId(batch.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteBatchId} onOpenChange={open => !open && setDeleteBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batch verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Ben je zeker dat je deze import batch en alle bijhorende records wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteBatch}>Ja, verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {reviewBatch && (
        <ImportKalenderPanel
          batch={reviewBatch}
          onClose={() => setReviewBatch(null)}
          onImported={() => queryClient.invalidateQueries({ queryKey: ["importbatches"] })}
        />
      )}
    </div>
  );
}