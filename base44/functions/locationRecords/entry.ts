import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { eindklant_id, action, record_id, field, value, days } = await req.json();

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

    // Fetch multiple days if requested, otherwise just today
    const numDays = Math.min(days || 1, 14);
    const allRecords = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = await base44.asServiceRole.entities.Klokregistratie.filter({
        eindklant_id,
        datum: dateStr,
      });
      allRecords.push(...dayRecords);
    }

    // Sort: by datum desc, then active first, then by start_tijd desc
    allRecords.sort((a, b) => {
      if (a.datum !== b.datum) return (b.datum || '').localeCompare(a.datum || '');
      if (a.status === 'gestart' && b.status !== 'gestart') return -1;
      if (a.status !== 'gestart' && b.status === 'gestart') return 1;
      return (b.start_tijd || '').localeCompare(a.start_tijd || '');
    });

    return Response.json({ records: allRecords });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});