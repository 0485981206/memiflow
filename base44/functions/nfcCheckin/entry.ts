import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nfc_id } = await req.json();

    if (!nfc_id) {
      return Response.json({ error: 'Geen NFC ID opgegeven' }, { status: 400 });
    }

    // Find werknemer by nfc_id
    const werknemers = await base44.asServiceRole.entities.Werknemer.filter({ nfc_id, status: 'actief' });
    const werknemer = werknemers?.[0];

    if (!werknemer) {
      return Response.json({ error: 'Werknemer niet gevonden voor deze badge' }, { status: 404 });
    }

    // Find active plaatsing to determine eindklant
    const plaatsingen = await base44.asServiceRole.entities.Plaatsing.filter({ 
      werknemer_id: werknemer.id, 
      status: 'actief' 
    });

    if (!plaatsingen || plaatsingen.length === 0) {
      return Response.json({ error: 'Geen actieve plaatsing gevonden voor deze werknemer' }, { status: 404 });
    }

    const plaatsing = plaatsingen[0];
    const now = new Date();
    const offset = 1; // CET offset
    const localNow = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const today = localNow.toISOString().split('T')[0];
    const currentTime = localNow.toTimeString().slice(0, 5);
    const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
    const dag = days[localNow.getDay()];

    // Check if already started today for this eindklant
    const bestaande = await base44.asServiceRole.entities.Klokregistratie.filter({
      werknemer_id: werknemer.id,
      eindklant_id: plaatsing.eindklant_id,
      datum: today,
      status: 'gestart'
    });

    const werknemerNaam = `${werknemer.voornaam} ${werknemer.achternaam}`;

    if (bestaande && bestaande.length > 0) {
      // Already started → STOP
      const reg = bestaande[0];
      await base44.asServiceRole.entities.Klokregistratie.update(reg.id, {
        status: 'gestopt',
        stop_tijd: currentTime,
      });

      // Calculate hours
      const [sh, sm] = reg.start_tijd.split(':').map(Number);
      const [eh, em] = currentTime.split(':').map(Number);
      const totalUren = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100;

      // Create prestatie
      const prestatie = await base44.asServiceRole.entities.Prestatie.create({
        werknemer_id: werknemer.id,
        werknemer_naam: werknemerNaam,
        eindklant_id: plaatsing.eindklant_id,
        eindklant_naam: plaatsing.eindklant_naam,
        plaatsing_id: plaatsing.id,
        datum: today,
        dag,
        code: 'R',
        totaal_uren: totalUren,
        in_1: reg.start_tijd,
        uit_1: currentTime,
        status: 'ingevoerd',
        maand: today.slice(0, 7),
        bron: 'nfc',
      });

      await base44.asServiceRole.entities.Klokregistratie.update(reg.id, {
        prestatie_id: prestatie.id,
      });

      return Response.json({
        action: 'stop',
        werknemer_naam: werknemerNaam,
        eindklant_naam: plaatsing.eindklant_naam,
        start_tijd: reg.start_tijd,
        stop_tijd: currentTime,
        totaal_uren: totalUren,
      });
    } else {
      // Not started → START
      await base44.asServiceRole.entities.Klokregistratie.create({
        werknemer_id: werknemer.id,
        werknemer_naam: werknemerNaam,
        eindklant_id: plaatsing.eindklant_id,
        eindklant_naam: plaatsing.eindklant_naam,
        datum: today,
        start_tijd: currentTime,
        status: 'gestart',
      });

      return Response.json({
        action: 'start',
        werknemer_naam: werknemerNaam,
        eindklant_naam: plaatsing.eindklant_naam,
        start_tijd: currentTime,
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});