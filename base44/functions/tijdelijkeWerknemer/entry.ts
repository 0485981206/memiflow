import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, ...params } = await req.json();

    if (action === 'create') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const createData = {
        voornaam: params.voornaam,
        achternaam: params.achternaam,
        telefoon: params.telefoon || '',
        opmerking: params.opmerking || '',
        eindklant_id: params.eindklant_id,
        eindklant_naam: params.eindklant_naam || '',
        datum: today,
        status: 'nieuw',
        aangemaakt_door: params.aangemaakt_door || '',
      };
      if (params.alias) createData.alias = params.alias;
      const record = await base44.asServiceRole.entities.TijdelijkeWerknemer.create(createData);

      return Response.json({ ok: true, record });
    }

    if (action === 'start') {
      const now = new Date();
      const brusselsTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
      const hours = String(brusselsTime.getHours()).padStart(2, '0');
      const minutes = String(brusselsTime.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      await base44.asServiceRole.entities.TijdelijkeWerknemer.update(params.id, {
        start_tijd: currentTime,
        status: 'ingecheckt',
      });
      return Response.json({ ok: true });
    }

    if (action === 'stop') {
      const now = new Date();
      const brusselsTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
      const hours = String(brusselsTime.getHours()).padStart(2, '0');
      const minutes = String(brusselsTime.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      await base44.asServiceRole.entities.TijdelijkeWerknemer.update(params.id, {
        stop_tijd: currentTime,
        status: 'uitgecheckt',
      });
      return Response.json({ ok: true });
    }

    if (action === 'list') {
      const records = await base44.asServiceRole.entities.TijdelijkeWerknemer.filter({
        eindklant_id: params.eindklant_id,
      });
      // Sort: ingecheckt first, then by date desc
      records.sort((a, b) => {
        if (a.status === 'ingecheckt' && b.status !== 'ingecheckt') return -1;
        if (b.status === 'ingecheckt' && a.status !== 'ingecheckt') return 1;
        return (b.datum || '').localeCompare(a.datum || '');
      });
      return Response.json({ records });
    }

    if (action === 'list_all') {
      const records = await base44.asServiceRole.entities.TijdelijkeWerknemer.filter({});
      records.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
      return Response.json({ records });
    }

    if (action === 'koppel') {
      await base44.asServiceRole.entities.TijdelijkeWerknemer.update(params.id, {
        gekoppeld_werknemer_id: params.werknemer_id,
        gekoppeld_werknemer_naam: params.werknemer_naam,
        status: 'gekoppeld',
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});