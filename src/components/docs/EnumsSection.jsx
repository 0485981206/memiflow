import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ENUMS = [
  { table: "Werknemer", field: "status", values: ["actief", "inactief", "ziekteverlof"], default: "actief" },
  { table: "Werknemer", field: "location_status", values: ["actief", "inactief"], default: "actief" },
  { table: "Werknemer", field: "ploeg_type", values: ["dagploeg", "dag_nacht"], default: "dagploeg" },
  { table: "Eindklant", field: "status", values: ["actief", "inactief"], default: "actief" },
  { table: "Werkspot", field: "status", values: ["actief", "inactief"], default: "actief" },
  { table: "Plaatsing", field: "status", values: ["actief", "beeindigd", "gepland"], default: "actief" },
  { table: "Prestatie", field: "status", values: ["ingevoerd", "goedgekeurd", "afgekeurd"], default: "ingevoerd" },
  { table: "Prestatie", field: "code", values: ["R (Regulier)", "O (Overuren)", "N (Nacht)", "Z (Ziekte)", "V (Verlof)", "...custom codes"], default: "-" },
  { table: "PrestatieCode", field: "type", values: ["werk", "afwezigheid", "overig"], default: "-" },
  { table: "PrestatieImportBatch", field: "status", values: ["verwerken", "klaar_voor_review", "goedgekeurd", "fout"], default: "verwerken" },
  { table: "PrestatieConceptRegel", field: "status", values: ["concept", "goedgekeurd", "afgekeurd"], default: "concept" },
  { table: "AcertaCode", field: "status", values: ["berekend", "handmatig_aangepast", "goedgekeurd"], default: "berekend" },
  { table: "AcertaCode", field: "ploeg_type", values: ["dagploeg", "nachtploeg"], default: "-" },
  { table: "AcertaCode", field: "code", values: ["100 (Gewone prestaties)", "4003 (Overuren 150%)", "428 (Tekort)", "220 (Feestdag)", "230 (Verlof)", "104 (Nachtploeg)", "..."], default: "-" },
  { table: "FinancieelRapport", field: "status", values: ["berekend", "handmatig_aangepast", "goedgekeurd"], default: "berekend" },
  { table: "Klokregistratie", field: "status", values: ["gestart", "gestopt"], default: "gestart" },
  { table: "TijdelijkeWerknemer", field: "status", values: ["nieuw", "ingecheckt", "uitgecheckt", "gekoppeld"], default: "nieuw" },
  { table: "Afwijking", field: "status", values: ["open", "behandeld"], default: "open" },
  { table: "User", field: "role", values: ["admin", "user"], default: "user" },
];

export default function EnumsSection() {
  // Group by table
  const grouped = {};
  ENUMS.forEach(e => {
    if (!grouped[e.table]) grouped[e.table] = [];
    grouped[e.table].push(e);
  });

  return (
    <Card>
      <CardHeader><CardTitle>Enums, Dropdowns & Status Velden</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(grouped).map(([table, fields]) => (
            <div key={table}>
              <h3 className="font-semibold text-sm mb-2 font-mono text-blue-700">{table}</h3>
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono font-bold text-purple-700 whitespace-nowrap mt-0.5">{f.field}</code>
                    <div className="flex flex-wrap gap-1">
                      {f.values.map((v, j) => (
                        <span key={j} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v === f.default ? "bg-green-100 text-green-700 ring-1 ring-green-300" : "bg-gray-100 text-gray-700"
                        }`}>
                          {v} {v === f.default && "(default)"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}