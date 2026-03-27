import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, eindklant_id, eindklant_naam, naam, beschrijving, werkspot_id } = await req.json();

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

    return Response.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});