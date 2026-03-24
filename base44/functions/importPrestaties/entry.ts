import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { batchId } = await req.json();

    if (!batchId) {
      return Response.json({ error: 'Batch ID missing' }, { status: 400 });
    }

    // Get concept rules
    const regels = await base44.entities.PrestatieConceptRegel.filter({ batch_id: batchId });
    
    if (regels.length === 0) {
      return Response.json({ imported: 0 });
    }

    // Get unique firmas and resolve eindklanten
    const firmaSet = [...new Set(regels.map(r => r.firma).filter(Boolean))];
    const bestaandeEindklanten = await base44.entities.Eindklant.list();
    const eindklantMap = {};

    for (const firma of firmaSet) {
      let ek = bestaandeEindklanten.find(e => e.naam?.toLowerCase() === firma.toLowerCase());
      if (!ek) {
        ek = await base44.entities.Eindklant.create({
          naam: firma,
          facturatie_tarief: 29,
          status: "actief"
        });
      }
      eindklantMap[firma] = ek;
    }

    // Create Prestatie records
    let imported = 0;
    for (const r of regels) {
      try {
        const ek = r.firma ? eindklantMap[r.firma] : null;
        await base44.entities.Prestatie.create({
          werknemer_id: r.werknemer_id,
          werknemer_naam: r.werknemer_naam,
          eindklant_id: ek?.id || r.eindklant_id || "",
          eindklant_naam: ek?.naam || r.eindklant_naam || r.firma || "",
          datum: r.datum,
          dag: r.dag || "",
          code: "R",
          bron: r.firma || "",
          firma: r.firma || "",
          dagschema: r.dagschema || "",
          totaal_uren: r.uren || 0,
          externe_id: r.externe_id || "",
          maand: r.datum ? r.datum.substring(0, 7) : "",
          in_1: r.in_1 || "", uit_1: r.uit_1 || "",
          in_2: r.in_2 || "", uit_2: r.uit_2 || "",
          in_3: r.in_3 || "", uit_3: r.uit_3 || "",
          in_4: r.in_4 || "", uit_4: r.uit_4 || "",
          in_5: r.in_5 || "", uit_5: r.uit_5 || "",
          in_6: r.in_6 || "", uit_6: r.uit_6 || "",
        });
        imported++;
      } catch (err) {
        console.error("Create error:", err);
      }
    }

    // Update batch status
    await base44.entities.PrestatieImportBatch.update(batchId, {
      status: "goedgekeurd",
      aantal_goedgekeurd: imported,
    });

    return Response.json({ imported });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});