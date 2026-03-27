import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { werknemer_id, werknemer_naam, eindklant_id, eindklant_naam, werkspot_id, werkspot_naam, reden } = body;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hours = String(now.getUTCHours() + 1).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Stop the klokregistratie if active
      const actieve = await base44.asServiceRole.entities.Klokregistratie.filter({
        werknemer_id,
        eindklant_id,
        datum: today,
        status: 'gestart'
      });

      if (actieve.length > 0) {
        const klok = actieve[0];
        await base44.asServiceRole.entities.Klokregistratie.update(klok.id, {
          stop_tijd: currentTime,
          status: 'gestopt',
        });

        // Create prestatie
        const dagNamen = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
        const dag = dagNamen[now.getDay()];
        const maand = today.slice(0, 7);
        const [startH, startM] = klok.start_tijd.split(':').map(Number);
        const [stopH, stopM] = currentTime.split(':').map(Number);
        const totalMinutes = (stopH * 60 + stopM) - (startH * 60 + startM);
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

        const prestatie = await base44.asServiceRole.entities.Prestatie.create({
          werknemer_id,
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
          opmerking: `Afwijking: ${reden}`,
        });

        await base44.asServiceRole.entities.Klokregistratie.update(klok.id, {
          prestatie_id: prestatie.id,
        });
      }

      // Create afwijking record
      const afwijking = await base44.asServiceRole.entities.Afwijking.create({
        werknemer_id,
        werknemer_naam: werknemer_naam || '',
        eindklant_id,
        eindklant_naam: eindklant_naam || '',
        werkspot_id: werkspot_id || '',
        werkspot_naam: werkspot_naam || '',
        datum: today,
        reden,
        stop_tijd: currentTime,
        status: 'open',
      });

      return Response.json({ success: true, afwijking_id: afwijking.id, stop_tijd: currentTime });
    }

    if (action === "transfer") {
      const { werknemer_id, werknemer_naam, eindklant_id, eindklant_naam, van_werkspot_id, van_werkspot_naam, naar_werkspot_id, naar_werkspot_naam } = body;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hours = String(now.getUTCHours() + 1).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Remove from old werkspot
      if (van_werkspot_id) {
        const oldWs = await base44.asServiceRole.entities.Werkspot.filter({ id: van_werkspot_id });
        if (oldWs.length > 0) {
          const updated = (oldWs[0].toegewezen_werknemers || []).filter(id => id !== werknemer_id);
          await base44.asServiceRole.entities.Werkspot.update(oldWs[0].id, { toegewezen_werknemers: updated });
        }
      }

      // Add to new werkspot
      if (naar_werkspot_id) {
        const newWs = await base44.asServiceRole.entities.Werkspot.filter({ id: naar_werkspot_id });
        if (newWs.length > 0) {
          const existing = newWs[0].toegewezen_werknemers || [];
          if (!existing.includes(werknemer_id)) {
            await base44.asServiceRole.entities.Werkspot.update(newWs[0].id, { toegewezen_werknemers: [...existing, werknemer_id] });
          }
        }
      }

      // Log as afwijking with transfer info
      const afwijking = await base44.asServiceRole.entities.Afwijking.create({
        werknemer_id,
        werknemer_naam: werknemer_naam || '',
        eindklant_id,
        eindklant_naam: eindklant_naam || '',
        werkspot_id: van_werkspot_id || '',
        werkspot_naam: van_werkspot_naam || '',
        datum: today,
        reden: `Verplaatst van ${van_werkspot_naam || '?'} naar ${naar_werkspot_naam || '?'} om ${currentTime}`,
        stop_tijd: currentTime,
        status: 'behandeld',
      });

      return Response.json({ success: true, afwijking_id: afwijking.id, tijd: currentTime });
    }

    if (action === "list") {
      const { eindklant_id } = body;
      const afwijkingen = await base44.asServiceRole.entities.Afwijking.filter({ eindklant_id });
      return Response.json({ afwijkingen });
    }

    if (action === "update_status") {
      const { afwijking_id, status } = body;
      await base44.asServiceRole.entities.Afwijking.update(afwijking_id, { status });
      return Response.json({ success: true });
    }

    return Response.json({ error: "Ongeldige actie" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});