import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pincode, klant_id } = await req.json();

    // Superuser: load werknemers for a specific klant
    if (klant_id) {
      const plaatsingen = await base44.asServiceRole.entities.Plaatsing.filter({ eindklant_id: klant_id, status: 'actief' });
      const werknemerIds = [...new Set(plaatsingen.map(p => p.werknemer_id).filter(Boolean))];
      const alleWerknemers = await base44.asServiceRole.entities.Werknemer.filter({ status: 'actief' });
      const werknemers = alleWerknemers.filter(w => werknemerIds.includes(w.id));
      const today = new Date().toISOString().split('T')[0];
      const klokRegistraties = await base44.asServiceRole.entities.Klokregistratie.filter({
        eindklant_id: klant_id, datum: today, status: 'gestart'
      });
      return Response.json({
        werknemers: werknemers.map(w => ({ id: w.id, naam: `${w.voornaam} ${w.achternaam}`, functie: w.functie || '' })),
        actieveRegistraties: klokRegistraties,
      });
    }

    if (!pincode || pincode.length !== 6) {
      return Response.json({ error: 'Ongeldige pincode' }, { status: 400 });
    }

    // Superuser pincode
    const SUPERUSER_PIN = '048334';
    if (pincode === SUPERUSER_PIN) {
      const alleKlanten = await base44.asServiceRole.entities.Eindklant.filter({});
      const actieveKlanten = alleKlanten.filter(k => k.status?.toLowerCase() === 'actief');
      return Response.json({
        superuser: true,
        klanten: actieveKlanten.map(k => ({ id: k.id, naam: k.naam })),
      });
    }

    // Use service role — this endpoint is public (no user auth needed)
    const klanten = await base44.asServiceRole.entities.Eindklant.filter({ pincode, status: 'actief' });

    // Also check with capitalized status
    let klant = klanten?.[0];
    if (!klant) {
      const klanten2 = await base44.asServiceRole.entities.Eindklant.filter({ pincode });
      klant = klanten2?.find(k => k.status?.toLowerCase() === 'actief');
    }

    if (!klant) {
      return Response.json({ error: 'Ongeldige pincode' }, { status: 200 });
    }

    // Get all active plaatsingen for this klant
    const plaatsingen = await base44.asServiceRole.entities.Plaatsing.filter({ eindklant_id: klant.id, status: 'actief' });
    const werknemerIds = [...new Set(plaatsingen.map(p => p.werknemer_id).filter(Boolean))];

    // Get werknemer details
    const alleWerknemers = await base44.asServiceRole.entities.Werknemer.filter({ status: 'actief' });
    const werknemers = alleWerknemers.filter(w => werknemerIds.includes(w.id));

    // Get active klokregistraties for today
    const today = new Date().toISOString().split('T')[0];
    const klokRegistraties = await base44.asServiceRole.entities.Klokregistratie.filter({
      eindklant_id: klant.id,
      datum: today,
      status: 'gestart'
    });

    return Response.json({
      klant: { id: klant.id, naam: klant.naam },
      werknemers: werknemers.map(w => ({
        id: w.id,
        naam: `${w.voornaam} ${w.achternaam}`,
        functie: w.functie || '',
      })),
      actieveRegistraties: klokRegistraties,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});