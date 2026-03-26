import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, werknemer_ids, eindklant_id, eindklant_naam } = await req.json();

    if (!action || !werknemer_ids || !eindklant_id) {
      return Response.json({ error: 'Missende parameters' }, { status: 400 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const maand = today.slice(0, 7);
    const dagNamen = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
    const dag = dagNamen[now.getDay()];

    const results = [];

    if (action === 'start') {
      // Get werknemer names
      const alleWerknemers = await base44.asServiceRole.entities.Werknemer.filter({ status: 'actief' });
      const werknemerMap = {};
      alleWerknemers.forEach(w => { werknemerMap[w.id] = w; });

      for (const wId of werknemer_ids) {
        const w = werknemerMap[wId];
        if (!w) continue;

        const naam = `${w.voornaam} ${w.achternaam}`;

        // Check if already started today
        const existing = await base44.asServiceRole.entities.Klokregistratie.filter({
          werknemer_id: wId,
          eindklant_id,
          datum: today,
          status: 'gestart'
        });

        if (existing.length > 0) {
          results.push({ werknemer_id: wId, naam, status: 'al_gestart' });
          continue;
        }

        // Create klokregistratie
        const klok = await base44.asServiceRole.entities.Klokregistratie.create({
          werknemer_id: wId,
          werknemer_naam: naam,
          eindklant_id,
          eindklant_naam: eindklant_naam || '',
          datum: today,
          start_tijd: currentTime,
          status: 'gestart',
        });

        results.push({ werknemer_id: wId, naam, status: 'gestart', klok_id: klok.id });
      }
    } else if (action === 'stop') {
      for (const wId of werknemer_ids) {
        // Find active klokregistratie
        const actieve = await base44.asServiceRole.entities.Klokregistratie.filter({
          werknemer_id: wId,
          eindklant_id,
          datum: today,
          status: 'gestart'
        });

        if (actieve.length === 0) {
          results.push({ werknemer_id: wId, status: 'niet_gestart' });
          continue;
        }

        const klok = actieve[0];

        // Update klokregistratie with stop time
        await base44.asServiceRole.entities.Klokregistratie.update(klok.id, {
          stop_tijd: currentTime,
          status: 'gestopt',
        });

        // Calculate total hours
        const [startH, startM] = klok.start_tijd.split(':').map(Number);
        const [stopH, stopM] = currentTime.split(':').map(Number);
        const totalMinutes = (stopH * 60 + stopM) - (startH * 60 + startM);
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

        // Create a Prestatie record linked to this klokregistratie
        const prestatie = await base44.asServiceRole.entities.Prestatie.create({
          werknemer_id: wId,
          werknemer_naam: klok.werknemer_naam,
          eindklant_id,
          eindklant_naam: klok.eindklant_naam,
          datum: today,
          dag,
          maand,
          totaal_uren: totalHours > 0 ? totalHours : 0,
          in_1: klok.start_tijd,
          uit_1: currentTime,
          bron: 'klok',
          status: 'ingevoerd',
        });

        // Update klokregistratie with prestatie link
        await base44.asServiceRole.entities.Klokregistratie.update(klok.id, {
          prestatie_id: prestatie.id,
        });

        results.push({
          werknemer_id: wId,
          naam: klok.werknemer_naam,
          status: 'gestopt',
          start: klok.start_tijd,
          stop: currentTime,
          uren: totalHours,
          prestatie_id: prestatie.id,
        });
      }
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});