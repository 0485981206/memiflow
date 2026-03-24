import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function parseDate(str) {
  if (!str) return "";
  const parts = str.split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  return "";
}

function parseCsvLine(line) {
  return line.split(";").map((v) => v.trim());
}

function parseCSV(text) {
  // Remove BOM
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  }).filter((r) => r["overeenkomstnummer"] || r["\uFEFFovereenkomstnummer"]);
}

function rowToWerknemer(row) {
  // Handle BOM on first column
  const overeenkomstnummer = row["overeenkomstnummer"] || row["\uFEFFovereenkomstnummer"] || "";
  const adres = [row["Straat"], row["Huisnummer"]].filter(Boolean).join(" ")
    + (row["Postcode"] || row["Gemeente"] ? ", " + [row["Postcode"], row["Gemeente"]].filter(Boolean).join(" ") : "");

  return {
    overeenkomstnummer,
    voornaam: row["Voornaam"] || "",
    achternaam: row["familienaam"] || "",
    rijksregisternummer: row["Rijksregisternummer"] || "",
    geboortedatum: parseDate(row["Geboortedatum"]),
    geslacht: row["Geslacht"] || "",
    nationaliteit: row["Nationaliteit"] || "",
    officiele_taal: row["Officiële taal"] || "",
    adres,
    land: row["Land"] || "",
    burgerlijke_staat: row["Burgerlijke staat"] || "",
    aantal_kinderen_ten_laste: row["Aantal kinderen ten laste"] || "",
    personen_65_plus_ten_laste: row["Personen 65+ ten laste"] || "",
    persoon_met_handicap: row["Persoon met handicap"] || "",
    startdatum: parseDate(row["Datum in dienst"]),
    type_overeenkomst: row["Type overeenkomst"] || "",
    werknemerstypering: row["Werknemerstypering"] || "",
    paritair_comite: row["Paritair Comité"] || "",
    functie: row["Functie"] || "",
    type_werktijd: row["Type werktijd"] || "",
    werkregime: row["Werkregime"] || "",
    tewerkstellingsbreuk: row["Tewerkstellingsbreuk"] || "",
    berekeningswijze: row["Berekeningswijze"] || "",
    barema_type: row["Barema type"] || "",
    barema_code: row["Barema code"] || "",
    looncode_411: row["Looncode 411 (Kledij)"] || "",
    looncode_591: row["Looncode 591 (Maaltijdcheques)"] || "",
    looncode_691: row["Looncode 691 (Werkgeversbijdr. MC)"] || "",
    looncode_104: row["Looncode 104 (nachtploeg)"] || "",
    sturingsgroep: row["Sturingsgroep"] || "",
    kostenplaats: row["Kostenplaats"] || "",
    status: "actief",
  };
}

export default function UploadWerknemersDialog({ open, onClose }) {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | importing | done | error
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      setPreview(rows.map(rowToWerknemer));
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleImport = async () => {
    setStatus("importing");
    let success = 0, failed = 0;
    for (const w of preview) {
      try {
        await base44.entities.Werknemer.create(w);
        success++;
      } catch {
        failed++;
      }
    }
    setResult({ success, failed });
    setStatus("done");
    queryClient.invalidateQueries({ queryKey: ["werknemers"] });
  };

  const handleClose = () => {
    setPreview(null);
    setStatus("idle");
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Werknemers uploaden via CSV</DialogTitle>
        </DialogHeader>

        {status === "idle" && !preview && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload een CSV-bestand geëxporteerd vanuit Acerta (puntkomma als scheidingsteken).
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Klik om CSV te selecteren</span>
              <span className="text-xs text-muted-foreground mt-1">.csv bestanden</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          </div>
        )}

        {preview && status === "idle" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{preview.length} werknemers gevonden</Badge>
            </div>
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Naam</th>
                    <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Overeenkomstnr.</th>
                    <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Functie</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((w, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5">{w.voornaam} {w.achternaam}</td>
                      <td className="px-3 py-1.5 text-muted-foreground font-mono text-xs hidden sm:table-cell">{w.overeenkomstnummer}</td>
                      <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">{w.functie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>Annuleren</Button>
              <Button onClick={handleImport} className="gap-2">
                <Upload className="w-4 h-4" /> {preview.length} werknemers importeren
              </Button>
            </div>
          </div>
        )}

        {status === "importing" && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Werknemers worden geïmporteerd...</p>
          </div>
        )}

        {status === "done" && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-4 gap-3">
              <CheckCircle className="w-10 h-10 text-chart-5" />
              <p className="font-semibold text-lg">Import voltooid</p>
              <div className="flex gap-3">
                <Badge className="bg-chart-5/10 text-chart-5">{result.success} geslaagd</Badge>
                {result.failed > 0 && <Badge variant="destructive">{result.failed} mislukt</Badge>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Sluiten</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}