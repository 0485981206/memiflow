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

  if (dagmax === 0) return [];

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
    const body = await req.json();
    const { event, data, old_data } = body;

    if (!event || !event.entity_name || event.entity_name !== "Prestatie") {
      return Response.json({ skipped: true });
    }

    // Determine which werknemer + datum to recalculate
    const werknemerId = data?.werknemer_id || old_data?.werknemer_id;
    const datum = data?.datum || old_data?.datum;

    if (!werknemerId || !datum) {
      return Response.json({ skipped: true, reason: "no werknemer_id or datum" });
    }

    const maand = datum.substring(0, 7); // "YYYY-MM"

    // 1. Get all prestaties for this werknemer on this date
    const allPrestaties = await base44.asServiceRole.entities.Prestatie.filter({ werknemer_id: werknemerId, datum });

    // 2. Get werknemer data for ploeg config
    let werknemer = null;
    try {
      const werknemers = await base44.asServiceRole.entities.Werknemer.filter({ id: werknemerId });
      werknemer = werknemers[0] || null;
    } catch (e) {
      // Continue without werknemer data
    }

    // 3. Delete existing AcertaCode records for this werknemer + datum
    const bestaande = await base44.asServiceRole.entities.AcertaCode.filter({ werknemer_id: werknemerId, datum });
    for (const c of bestaande) {
      await base44.asServiceRole.entities.AcertaCode.delete(c.id);
    }

    // 4. Calculate total hours for this day
    const totalUren = allPrestaties.reduce((s, p) => s + (p.totaal_uren || p.uren || 0), 0);

    // 5. Calculate codes
    const hasData = allPrestaties.length > 0;
    const lines = berekenCodes(datum, hasData ? totalUren : null, werknemer);

    // 6. Save new AcertaCode records
    if (lines.length > 0) {
      const firstPrestatie = allPrestaties[0];
      const records = lines.map(line => ({
        werknemer_id: werknemerId,
        werknemer_naam: firstPrestatie?.werknemer_naam || data?.werknemer_naam || "",
        eindklant_id: firstPrestatie?.eindklant_id || data?.eindklant_id || "",
        eindklant_naam: firstPrestatie?.eindklant_naam || data?.eindklant_naam || "",
        datum,
        maand,
        code: line.code,
        code_naam: line.code_naam,
        uren: line.uren,
        totaal_gewerkte_uren: r2(totalUren),
        dagmax: line.dagmax,
        is_overuren: line.is_overuren,
        is_tekort: line.is_tekort,
        ploeg_type: line.ploeg_type,
        bron_prestatie_id: firstPrestatie?.id || "",
        status: "berekend",
      }));

      await base44.asServiceRole.entities.AcertaCode.bulkCreate(records);
    }

    return Response.json({
      success: true,
      werknemer_id: werknemerId,
      datum,
      codes_aangemaakt: lines.length,
      totaal_uren: totalUren,
    });
  } catch (error) {
    console.error("onPrestatieChange error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});