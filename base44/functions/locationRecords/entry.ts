import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { eindklant_id, action, record_id, field, value } = await req.json();

    // Update time action
    if (action === 'update_time' && record_id && field && value) {
      const record = await base44.asServiceRole.entities.Klokregistratie.filter({ id: record_id });
      if (!record.length) return Response.json({ error: 'Record niet gevonden' }, { status: 404 });
      await base44.asServiceRole.entities.Klokregistratie.update(record_id, { [field]: value });
      return Response.json({ ok: true });
    }

    // Delete action
    if (action === 'delete' && record_id) {
      await base44.asServiceRole.entities.Klokregistratie.delete(record_id);
      return Response.json({ ok: true });
    }

    if (!eindklant_id) {
      return Response.json({ error: 'Missende eindklant_id' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    const records = await base44.asServiceRole.entities.Klokregistratie.filter({
      eindklant_id,
      datum: today,
    });

    // Sort: active first, then by start_tijd desc
    records.sort((a, b) => {
      if (a.status === 'gestart' && b.status !== 'gestart') return -1;
      if (a.status !== 'gestart' && b.status === 'gestart') return 1;
      return (b.start_tijd || '').localeCompare(a.start_tijd || '');
    });

    return Response.json({ records });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});