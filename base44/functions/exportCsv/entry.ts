import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ENTITY_NAMES = [
  "Werknemer", "Eindklant", "Werkspot", "Plaatsing", "Prestatie",
  "PrestatieCode", "PrestatieImportBatch", "PrestatieConceptRegel",
  "AcertaCode", "FinancieelRapport", "Klokregistratie", "TijdelijkeWerknemer", "Afwijking"
];

function toCsv(records) {
  if (records.length === 0) return "";
  const headers = Object.keys(records[0]);
  const lines = [headers.join(",")];
  for (const r of records) {
    const vals = headers.map(h => {
      let v = r[h];
      if (v === null || v === undefined) return "";
      if (Array.isArray(v)) v = JSON.stringify(v);
      v = String(v).replace(/"/g, '""');
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v}"`;
      }
      return v;
    });
    lines.push(vals.join(","));
  }
  return lines.join("\n");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { entity } = await req.json();

    if (entity && ENTITY_NAMES.includes(entity)) {
      const records = await base44.asServiceRole.entities[entity].filter({});
      const csv = toCsv(records);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=${entity}.csv`,
        },
      });
    }

    // Return all as JSON with CSV strings
    const result = {};
    for (const name of ENTITY_NAMES) {
      const records = await base44.asServiceRole.entities[name].filter({});
      result[name] = { count: records.length, csv: toCsv(records) };
    }
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});