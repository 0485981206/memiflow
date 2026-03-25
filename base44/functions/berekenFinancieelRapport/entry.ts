import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function r2(n) { return Math.round(n * 100) / 100; }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { maand } = body; // "2026-01"

    if (!maand) {
      return Response.json({ error: "maand parameter is verplicht (formaat: YYYY-MM)" }, { status: 400 });
    }

    // 1. Haal prestaties, werknemers, eindklanten, plaatsingen op
    const [prestaties, werknemers, eindklanten, plaatsingen] = await Promise.all([
      base44.asServiceRole.entities.Prestatie.filter({ maand }),
      base44.asServiceRole.entities.Werknemer.filter({}),
      base44.asServiceRole.entities.Eindklant.filter({}),
      base44.asServiceRole.entities.Plaatsing.filter({}),
    ]);

    const werknemerMap = {};
    werknemers.forEach(w => { werknemerMap[w.id] = w; });

    const eindklantMap = {};
    eindklanten.forEach(e => { eindklantMap[e.id] = e; });

    // 2. Verwijder bestaande berekende rapporten voor deze maand
    const bestaande = await base44.asServiceRole.entities.FinancieelRapport.filter({ maand, status: "berekend" });
    for (const r of bestaande) {
      await base44.asServiceRole.entities.FinancieelRapport.delete(r.id);
    }

    // 3. Groepeer prestaties per werknemer + eindklant
    const groep = {}; // key: "werknemerId|eindklantId"
    for (const p of prestaties) {
      const eklantId = p.eindklant_id || "onbekend";
      const key = `${p.werknemer_id}|${eklantId}`;
      if (!groep[key]) {
        groep[key] = {
          werknemer_id: p.werknemer_id,
          werknemer_naam: p.werknemer_naam || "",
          eindklant_id: eklantId,
          eindklant_naam: p.eindklant_naam || "",
          totaal_uren: 0,
          overuren: 0,
          tekort_uren: 0,
          werkdagen: new Set(),
          feestdagen: 0,
          ziektedagen: 0,
        };
      }
      groep[key].totaal_uren += (p.totaal_uren || p.uren || 0);
      groep[key].werkdagen.add(p.datum);

      // Check voor ziekte codes
      if (p.code && (p.code === "Z" || p.code === "50" || p.code === "51")) {
        groep[key].ziektedagen++;
      }
    }

    // 4. Haal AcertaCodes op voor overuren/tekort
    let acertaCodes = [];
    try {
      acertaCodes = await base44.asServiceRole.entities.AcertaCode.filter({ maand });
    } catch (e) {
      // AcertaCode might not exist yet
    }

    // Verrijk met overuren/tekort uit AcertaCode
    for (const ac of acertaCodes) {
      const eklantId = ac.eindklant_id || "onbekend";
      const key = `${ac.werknemer_id}|${eklantId}`;
      if (groep[key]) {
        if (ac.is_overuren) groep[key].overuren += (ac.uren || 0);
        if (ac.is_tekort) groep[key].tekort_uren += (ac.uren || 0);
        if (ac.code === "220") groep[key].feestdagen++;
      }
    }

    // 5. Bereken financiële data
    const records = [];
    for (const [key, g] of Object.entries(groep)) {
      const werknemer = werknemerMap[g.werknemer_id];
      const eindklant = eindklantMap[g.eindklant_id];

      // Zoek tarief: eerst plaatsing, dan eindklant
      let tarief = 0;
      const plaatsing = plaatsingen.find(
        p => p.werknemer_id === g.werknemer_id && p.eindklant_id === g.eindklant_id && p.status === "actief"
      );
      if (plaatsing?.tarief) {
        tarief = plaatsing.tarief;
      } else if (eindklant?.facturatie_tarief) {
        tarief = eindklant.facturatie_tarief;
      }

      const uurloon = werknemer?.uurloon || 0;
      const totaalUren = r2(g.totaal_uren);
      const omzet = r2(totaalUren * tarief);
      const loonkost = r2(totaalUren * uurloon);
      const marge = r2(omzet - loonkost);
      const margePct = omzet > 0 ? r2((marge / omzet) * 100) : 0;

      records.push({
        maand,
        werknemer_id: g.werknemer_id,
        werknemer_naam: g.werknemer_naam,
        eindklant_id: g.eindklant_id,
        eindklant_naam: g.eindklant_naam,
        totaal_uren: totaalUren,
        overuren: r2(g.overuren),
        tekort_uren: r2(g.tekort_uren),
        facturatie_tarief: tarief,
        uurloon: uurloon,
        omzet,
        loonkost,
        marge,
        marge_percentage: margePct,
        werkdagen: g.werkdagen.size,
        feestdagen: g.feestdagen,
        ziektedagen: g.ziektedagen,
        status: "berekend",
      });
    }

    // 6. Bulk create
    let created = 0;
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      await base44.asServiceRole.entities.FinancieelRapport.bulkCreate(batch);
      created += batch.length;
    }

    // 7. Totalen
    const totaalOmzet = r2(records.reduce((s, r) => s + r.omzet, 0));
    const totaalLoonkost = r2(records.reduce((s, r) => s + r.loonkost, 0));
    const totaalMarge = r2(totaalOmzet - totaalLoonkost);

    return Response.json({
      success: true,
      maand,
      rapporten_aangemaakt: created,
      totalen: {
        omzet: totaalOmzet,
        loonkost: totaalLoonkost,
        marge: totaalMarge,
        marge_percentage: totaalOmzet > 0 ? r2((totaalMarge / totaalOmzet) * 100) : 0,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});