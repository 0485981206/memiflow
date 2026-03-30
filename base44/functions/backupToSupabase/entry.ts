import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// All entity configs: entity name -> supabase table name + fields
const ENTITY_CONFIGS = {
  Werknemer: {
    table: "werknemer",
    fields: ["voornaam","achternaam","alias","overeenkomstnummer","externe_id","email","telefoon","contactnummer","noodcontact","functie","status","location_status","startdatum","einddatum","uurloon","rijksregisternummer","adres","geboortedatum","geslacht","nationaliteit","officiele_taal","land","burgerlijke_staat","aantal_kinderen_ten_laste","personen_65_plus_ten_laste","persoon_met_handicap","type_overeenkomst","werknemerstypering","paritair_comite","type_werktijd","werkregime","tewerkstellingsbreuk","berekeningswijze","barema_type","barema_code","looncode_411","looncode_591","looncode_691","looncode_104","sturingsgroep","kostenplaats","ploeg_type","dagploeg_uren_mado","nachtploeg_uren_mado","dagploeg_uren_vr","nachtploeg_uren_vr","nfc_id"],
  },
  Eindklant: {
    table: "eindklant",
    fields: ["naam","contactpersoon","email","telefoon","adres","btw_nummer","status","facturatie_tarief","prestatie_pdf_url","prestatie_pdf_naam","pdf_instructies","pincode"],
  },
  Werkspot: {
    table: "werkspot",
    fields: ["naam","eindklant_id","eindklant_naam","beschrijving","toegewezen_werknemers","status","auto_checkin","is_gepauzeerd","pauze_reden","pauze_start"],
  },
  Plaatsing: {
    table: "plaatsing",
    fields: ["werknemer_id","werknemer_naam","eindklant_id","eindklant_naam","startdatum","einddatum","functie","uurrooster","status","tarief"],
  },
  Prestatie: {
    table: "prestatie",
    fields: ["werknemer_id","werknemer_naam","eindklant_id","eindklant_naam","plaatsing_id","datum","dag","code","uren","totaal_uren","bron","externe_id","firma","dagschema","in_1","uit_1","in_2","uit_2","in_3","uit_3","in_4","uit_4","in_5","uit_5","in_6","uit_6","opmerking","status","maand"],
  },
  PrestatieCode: {
    table: "prestatiecode",
    fields: ["code","naam","kleur","type","standaard_uren"],
  },
  PrestatieImportBatch: {
    table: "prestatieimportbatch",
    fields: ["bestandsnaam","bestand_url","eindklant_naam","status","conversation_id","agent_samenvatting","prestatie_ids","aantal_prestaties","aantal_goedgekeurd"],
  },
  PrestatieConceptRegel: {
    table: "prestatieconceptregel",
    fields: ["batch_id","werknemer_naam","werknemer_id","datum","dag","uren","code","eindklant_id","eindklant_naam","plaatsing_id","status","opmerking","werknemer_niet_gevonden","bron","externe_id","firma","dagschema","in_1","uit_1","in_2","uit_2","in_3","uit_3","in_4","uit_4","in_5","uit_5","in_6","uit_6"],
  },
  AcertaCode: {
    table: "acertacode",
    fields: ["werknemer_id","werknemer_naam","eindklant_id","eindklant_naam","datum","maand","code","code_naam","uren","totaal_gewerkte_uren","dagmax","is_overuren","is_tekort","ploeg_type","bron_prestatie_id","status"],
  },
  FinancieelRapport: {
    table: "financieelrapport",
    fields: ["maand","werknemer_id","werknemer_naam","eindklant_id","eindklant_naam","totaal_uren","overuren","tekort_uren","facturatie_tarief","uurloon","omzet","loonkost","marge","marge_percentage","werkdagen","feestdagen","ziektedagen","status"],
  },
  Klokregistratie: {
    table: "klokregistratie",
    fields: ["werknemer_id","werknemer_naam","eindklant_id","eindklant_naam","datum","start_tijd","stop_tijd","status","prestatie_id"],
  },
  TijdelijkeWerknemer: {
    table: "tijdelijkewerknemer",
    fields: ["voornaam","achternaam","alias","telefoon","opmerking","eindklant_id","eindklant_naam","datum","start_tijd","stop_tijd","status","gekoppeld_werknemer_id","gekoppeld_werknemer_naam","aangemaakt_door"],
  },
  Afwijking: {
    table: "afwijking",
    fields: ["werknemer_id","werknemer_naam","eindklant_id","eindklant_naam","werkspot_id","werkspot_naam","datum","reden","stop_tijd","status"],
  },
};

async function supabaseUpsert(table, rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase upsert to ${table} failed: ${res.status} - ${errorText}`);
  }
}

function mapRecords(records, fields) {
  return records.map(r => {
    const row = {
      id: r.id,
      created_date: r.created_date || null,
      updated_date: r.updated_date || null,
      created_by: r.created_by || null,
    };
    for (const f of fields) {
      const val = r[f];
      // Convert arrays to JSON strings for Supabase text columns
      if (Array.isArray(val)) {
        row[f] = JSON.stringify(val);
      } else {
        row[f] = val !== undefined ? val : null;
      }
    }
    return row;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {};
    const errors = [];

    for (const [entityName, config] of Object.entries(ENTITY_CONFIGS)) {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({});
        const rows = mapRecords(records, config.fields);

        // Upsert in batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          await supabaseUpsert(config.table, rows.slice(i, i + 500));
        }

        results[entityName] = rows.length;
      } catch (err) {
        errors.push({ entity: entityName, error: err.message });
        results[entityName] = `FOUT: ${err.message}`;
      }
    }

    return Response.json({
      message: "Backup voltooid",
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});