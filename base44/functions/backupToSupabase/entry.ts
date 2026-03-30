import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function supabaseUpsert(table, rows) {
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

  return res;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all Klokregistratie records
    const records = await base44.asServiceRole.entities.Klokregistratie.filter({});

    if (records.length === 0) {
      return Response.json({ message: "Geen records gevonden om te backuppen", count: 0 });
    }

    // Map records to Supabase format (same field names)
    const rows = records.map(r => ({
      id: r.id,
      werknemer_id: r.werknemer_id || null,
      werknemer_naam: r.werknemer_naam || null,
      eindklant_id: r.eindklant_id || null,
      eindklant_naam: r.eindklant_naam || null,
      datum: r.datum || null,
      start_tijd: r.start_tijd || null,
      stop_tijd: r.stop_tijd || null,
      status: r.status || null,
      prestatie_id: r.prestatie_id || null,
      created_date: r.created_date || null,
      updated_date: r.updated_date || null,
      created_by: r.created_by || null,
    }));

    // Upsert in batches of 500
    const batchSize = 500;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await supabaseUpsert("klokregistratie", batch);
      upserted += batch.length;
    }

    return Response.json({
      message: `Backup succesvol: ${upserted} records naar Supabase gestuurd`,
      count: upserted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});