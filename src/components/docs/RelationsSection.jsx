import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RELATIONS = [
  { parent: "Eindklant", child: "Werkspot", fk: "eindklant_id", type: "1:N", desc: "Een eindklant kan meerdere werkspots hebben" },
  { parent: "Eindklant", child: "Plaatsing", fk: "eindklant_id", type: "1:N", desc: "Een eindklant kan meerdere plaatsingen hebben" },
  { parent: "Eindklant", child: "Prestatie", fk: "eindklant_id", type: "1:N", desc: "Prestaties worden per eindklant geregistreerd" },
  { parent: "Eindklant", child: "Klokregistratie", fk: "eindklant_id", type: "1:N", desc: "Klokregistraties zijn per eindklant" },
  { parent: "Eindklant", child: "TijdelijkeWerknemer", fk: "eindklant_id", type: "1:N", desc: "Tijdelijke werknemers worden per eindklant aangemaakt" },
  { parent: "Eindklant", child: "Afwijking", fk: "eindklant_id", type: "1:N", desc: "Afwijkingen worden per eindklant geregistreerd" },
  { parent: "Eindklant", child: "AcertaCode", fk: "eindklant_id", type: "1:N", desc: "Acerta codes per eindklant" },
  { parent: "Eindklant", child: "FinancieelRapport", fk: "eindklant_id", type: "1:N", desc: "Financiële rapporten per eindklant" },
  { parent: "Werknemer", child: "Plaatsing", fk: "werknemer_id", type: "1:N", desc: "Een werknemer kan meerdere plaatsingen hebben" },
  { parent: "Werknemer", child: "Prestatie", fk: "werknemer_id", type: "1:N", desc: "Prestaties worden per werknemer geregistreerd" },
  { parent: "Werknemer", child: "Klokregistratie", fk: "werknemer_id", type: "1:N", desc: "Klokregistraties per werknemer" },
  { parent: "Werknemer", child: "AcertaCode", fk: "werknemer_id", type: "1:N", desc: "Acerta codes per werknemer" },
  { parent: "Werknemer", child: "FinancieelRapport", fk: "werknemer_id", type: "1:N", desc: "Financiële rapporten per werknemer" },
  { parent: "Werknemer", child: "Afwijking", fk: "werknemer_id", type: "1:N", desc: "Afwijkingen per werknemer" },
  { parent: "Werknemer", child: "TijdelijkeWerknemer", fk: "gekoppeld_werknemer_id", type: "1:N", desc: "Tijdelijke werknemers kunnen gekoppeld worden aan vaste werknemers" },
  { parent: "Plaatsing", child: "Prestatie", fk: "plaatsing_id", type: "1:N", desc: "Prestaties worden aan een plaatsing gekoppeld" },
  { parent: "Plaatsing", child: "PrestatieConceptRegel", fk: "plaatsing_id", type: "1:N", desc: "Concept regels worden aan een plaatsing gekoppeld" },
  { parent: "Prestatie", child: "Klokregistratie", fk: "prestatie_id", type: "1:1", desc: "Een klokregistratie wordt aan een prestatie gekoppeld na stop" },
  { parent: "Prestatie", child: "AcertaCode", fk: "bron_prestatie_id", type: "1:N", desc: "Acerta codes worden berekend vanuit prestaties" },
  { parent: "PrestatieImportBatch", child: "PrestatieConceptRegel", fk: "batch_id", type: "1:N", desc: "Concept regels horen bij een import batch" },
  { parent: "Werkspot", child: "Afwijking", fk: "werkspot_id", type: "1:N", desc: "Afwijkingen kunnen aan een werkspot gekoppeld zijn" },
  { parent: "Werkspot", child: "Werknemer", fk: "toegewezen_werknemers (array)", type: "N:M", desc: "Werkspots bevatten een array van werknemer IDs" },
];

export default function RelationsSection() {
  return (
    <Card>
      <CardHeader><CardTitle>Tabel Relaties & Foreign Keys</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2 border font-semibold">Parent Tabel</th>
                <th className="text-left p-2 border font-semibold">Child Tabel</th>
                <th className="text-left p-2 border font-semibold">Foreign Key</th>
                <th className="text-left p-2 border font-semibold">Type</th>
                <th className="text-left p-2 border font-semibold">Beschrijving</th>
              </tr>
            </thead>
            <tbody>
              {RELATIONS.map((r, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="p-2 border font-mono text-xs font-semibold text-blue-700">{r.parent}</td>
                  <td className="p-2 border font-mono text-xs font-semibold text-purple-700">{r.child}</td>
                  <td className="p-2 border font-mono text-xs">{r.fk}</td>
                  <td className="p-2 border">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.type === "1:N" ? "bg-blue-100 text-blue-700" : r.type === "1:1" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="p-2 border text-xs text-muted-foreground">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}