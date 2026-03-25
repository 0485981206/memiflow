import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FEESTDAGEN = new Set([
  "2025-01-01","2025-04-21","2025-05-01","2025-05-29","2025-06-09",
  "2025-07-21","2025-08-15","2025-11-01","2025-11-11","2025-12-25",
  "2026-01-01","2026-04-06","2026-05-01","2026-05-14","2026-05-25",
  "2026-07-21","2026-08-15","2026-11-01","2026-11-11","2026-12-25",
  "2027-01-01","2027-03-29","2027-05-01","2027-05-06","2027-05-17",
  "2027-07-21","2027-08-15","2027-11-01","2027-11-11","2027-12-25",
]);

const DAGMAX = { 0: 0, 1: 8, 2: 8, 3: 8, 4: 8, 5: 6, 6: 0 };

const CODE_NAMEN = {
  "100": "Gewone prestaties",
  "104": "Nachtploeg",
  "4003": "Netto vrijwillige overuren",
  "428": "Gerechtvaardigde afwezigheid",
  "220": "Wettelijke feestdag",
  "230": "Inhaalrust",
};

function getDayOfWeek(dateStr) {
  return new Date(dateStr + "T12:00:00").getDay();
}

function r2(n) { return Math.round(n * 100) / 100; }

function berekenCodes(datumStr, totalUren, werknemer) {
  const dow = getDayOfWeek(datumStr);
  const dagmax = DAGMAX[dow] || 0;
  
  if (dagmax === 0) return []; // weekend

  if (FEESTDAGEN.has(datumStr)) {
    return [{ code: "220", code_naam: CODE_NAMEN["220"], uren: dagmax, dagmax, is_overuren: false, is_tekort: false, ploeg_type: "dagploeg" }];
  }

  if (totalUren === null || totalUren === undefined || totalUren === 0) {
    return [
      { code: "230", code_naam: CODE_NAMEN["230"], uren: dagmax, dagmax, is_overuren: false, is_tekort: false, ploeg_type: "dagploeg" },
      { code: "100", code_naam: CODE_NAMEN["100"], uren: dagmax, dagmax, is_overuren: false, is_tekort: false, ploeg_type: "dagploeg" },
    ];
  }

  const uren = r2(totalUren);
  const lines = [];

  const ploegType = werknemer?.ploeg_type || "dagploeg";

  if (ploegType === "dag_nacht") {
    const isVr = dow === 5;
    const dpUren = isVr ? (werknemer.dagploeg_uren_vr ?? 3) : (werknemer.dagploeg_uren_mado ?? 5);
    const npUren = isVr ? (werknemer.nachtploeg_uren_vr ?? 3) : (werknemer.nachtploeg_uren_mado ?? 3);
    lines.push({ code: "100", code_naam: CODE_NAMEN["100"], uren: r2(dpUren), dagmax, is_overuren: false, is_tekort: false, ploeg_type: "dagploeg" });
    if (npUren > 0) {
      lines.push({ code: "104", code_naam: CODE_NAMEN["104"], uren: r2(npUren), dagmax, is_overuren: false, is_tekort: false, ploeg_type: "nachtploeg" });
    }
  } else {
    const basisUren = Math.min(uren, dagmax);
    lines.push({ code: "100", code_naam: CODE_NAMEN["100"], uren: r2(basisUren), dagmax, is_overuren: false, is_tekort: false, ploeg_type: "dagploeg" });
  }

  if (uren > dagmax) {
    lines.push({ code: "4003", code_naam: CODE_NAMEN["4003"], uren: r2(uren - dagmax), dagmax, is_overuren: true, is_tekort: false, ploeg_type: "dagploeg" });
  } else if (uren < dagmax) {
    lines.push({ code: "428", code_naam: CODE_NAMEN["428"], uren: r2(dagmax - uren), dagmax, is_overuren: false, is_tekort: true, ploeg_type: "dagploeg" });
  }

  return lines;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { maand } = body; // format: "2026-01"

    if (!maand) {
      return Response.json({ error: "maand parameter is verplicht (formaat: YYYY-MM)" }, { status: 400 });
    }

    // 1. Haal alle prestaties op voor deze maand
    const prestaties = await base44.asServiceRole.entities.Prestatie.filter({ maand });
    
    // 2. Haal alle werknemers op
    const werknemers = await base44.asServiceRole.entities.Werknemer.filter({});
    const werknemerMap = {};
    werknemers.forEach(w => { werknemerMap[w.id] = w; });

    // 3. Verwijder bestaande berekende codes voor deze maand
    const bestaandeCodes = await base44.asServiceRole.entities.AcertaCode.filter({ maand, status: "berekend" });
    for (const c of bestaandeCodes) {
      await base44.asServiceRole.entities.AcertaCode.delete(c.id);
    }

    // 4. Groepeer prestaties per werknemer per dag
    const dagMap = {}; // key: "werknemerId|datum"
    for (const p of prestaties) {
      const key = `${p.werknemer_id}|${p.datum}`;
      if (!dagMap[key]) {
        dagMap[key] = { 
          werknemer_id: p.werknemer_id, 
          werknemer_naam: p.werknemer_naam,
          eindklant_id: p.eindklant_id,
          eindklant_naam: p.eindklant_naam,
          datum: p.datum,
          totaal_uren: 0,
          prestatie_ids: []
        };
      }
      dagMap[key].totaal_uren += (p.totaal_uren || p.uren || 0);
      dagMap[key].prestatie_ids.push(p.id);
    }

    // 5. Bereken codes per dag en sla op
    const records = [];
    for (const [key, dag] of Object.entries(dagMap)) {
      const werknemer = werknemerMap[dag.werknemer_id] || null;
      const lines = berekenCodes(dag.datum, dag.totaal_uren, werknemer);
      
      for (const line of lines) {
        records.push({
          werknemer_id: dag.werknemer_id,
          werknemer_naam: dag.werknemer_naam,
          eindklant_id: dag.eindklant_id || "",
          eindklant_naam: dag.eindklant_naam || "",
          datum: dag.datum,
          maand: maand,
          code: line.code,
          code_naam: line.code_naam,
          uren: line.uren,
          totaal_gewerkte_uren: r2(dag.totaal_uren),
          dagmax: line.dagmax,
          is_overuren: line.is_overuren,
          is_tekort: line.is_tekort,
          ploeg_type: line.ploeg_type,
          bron_prestatie_id: dag.prestatie_ids[0] || "",
          status: "berekend"
        });
      }
    }

    // Bulk create in batches of 50
    let created = 0;
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      await base44.asServiceRole.entities.AcertaCode.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ 
      success: true, 
      maand,
      prestaties_verwerkt: Object.keys(dagMap).length,
      codes_aangemaakt: created,
      samenvatting: {
        totaal_werkdagen: Object.keys(dagMap).length,
        totaal_code_regels: created,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});