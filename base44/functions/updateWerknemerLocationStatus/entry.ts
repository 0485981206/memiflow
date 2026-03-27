import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { werknemer_id, location_status } = await req.json();

    if (!werknemer_id || !location_status) {
      return Response.json({ error: 'Missende parameters' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Werknemer.update(werknemer_id, {
      location_status,
    });

    return Response.json({ ok: true, location_status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});