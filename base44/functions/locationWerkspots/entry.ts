import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, eindklant_id, eindklant_naam, naam, beschrijving, werkspot_id, werknemer_ids, werknemer_id } = await req.json();

    if (action === 'list') {
      const werkspots = await base44.asServiceRole.entities.Werkspot.filter({ eindklant_id });
      return Response.json({ werkspots });
    }

    if (action === 'create') {
      const ws = await base44.asServiceRole.entities.Werkspot.create({
        naam,
        eindklant_id,
        eindklant_naam: eindklant_naam || '',
        beschrijving: beschrijving || '',
        status: 'actief',
      });
      return Response.json({ werkspot: ws });
    }

    if (action === 'delete') {
      await base44.asServiceRole.entities.Werkspot.delete(werkspot_id);
      return Response.json({ ok: true });
    }

    if (action === 'assign') {
      const ws = await base44.asServiceRole.entities.Werkspot.filter({ id: werkspot_id });
      if (!ws.length) return Response.json({ error: 'Werkspot niet gevonden' }, { status: 404 });

      const newIds = werknemer_ids || [];
      const newIdSet = new Set(newIds);

      // Remove these workers from other werkspots + add to target in parallel
      const allWerkspots = await base44.asServiceRole.entities.Werkspot.filter({ eindklant_id: ws[0].eindklant_id });
      const updates = [];

      for (const other of allWerkspots) {
        if (other.id === werkspot_id) continue;
        const otherAssigned = other.toegewezen_werknemers || [];
        const cleaned = otherAssigned.filter(id => !newIdSet.has(id));
        if (cleaned.length !== otherAssigned.length) {
          updates.push(base44.asServiceRole.entities.Werkspot.update(other.id, { toegewezen_werknemers: cleaned }));
        }
      }

      // Add to target werkspot
      const current = ws[0].toegewezen_werknemers || [];
      const merged = [...new Set([...current, ...newIds])];
      updates.push(base44.asServiceRole.entities.Werkspot.update(werkspot_id, { toegewezen_werknemers: merged }));

      await Promise.all(updates);
      return Response.json({ ok: true });
    }

    if (action === 'remove_worker') {
      const ws = await base44.asServiceRole.entities.Werkspot.filter({ id: werkspot_id });
      if (!ws.length) return Response.json({ error: 'Werkspot niet gevonden' }, { status: 404 });
      const current = ws[0].toegewezen_werknemers || [];
      const updated = current.filter(id => id !== werknemer_id);
      await base44.asServiceRole.entities.Werkspot.update(werkspot_id, { toegewezen_werknemers: updated });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});