import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // When called by a scheduled automation, there's no authenticated user.
    // Only verify admin role when called manually by a user.
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_authErr) {
      // No authenticated user = called by automation, proceed
    }

    // Get current date/time in Brussels timezone
    const now = new Date();
    const brusselsFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' });
    const today = brusselsFormatter.format(now); // YYYY-MM-DD

    const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', hour: 'numeric', hour12: false });
    const brusselsHour = parseInt(hourFormatter.format(now), 10);

    // Only run at 08:00 Brussels time (handles summer/winter automatically)
    if (brusselsHour !== 8) {
      return Response.json({ message: `Niet 08:00 in België (huidig uur: ${brusselsHour}), overgeslagen`, skipped: true });
    }

    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', weekday: 'short' });
    const dayOfWeek = dayFormatter.format(now);

    // Skip weekends
    if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
      return Response.json({ message: 'Weekend - geen auto check-in', skipped: true });
    }

    // Get all werkspots with auto_checkin enabled
    const werkspots = await base44.asServiceRole.entities.Werkspot.filter({ auto_checkin: true, status: 'actief' });

    if (werkspots.length === 0) {
      return Response.json({ message: 'Geen werkspots met auto check-in', count: 0 });
    }

    // Get all active werknemers
    const alleWerknemers = await base44.asServiceRole.entities.Werknemer.filter({ status: 'actief' });
    const werknemerMap = {};
    alleWerknemers.forEach(w => { werknemerMap[w.id] = w; });

    const results = [];
    const startTijd = '08:00';

    for (const ws of werkspots) {
      const ids = ws.toegewezen_werknemers || [];
      if (ids.length === 0) continue;

      for (const wId of ids) {
        const w = werknemerMap[wId];
        if (!w) continue;

        const naam = `${w.voornaam} ${w.achternaam}`;

        // Check if already started today
        const existing = await base44.asServiceRole.entities.Klokregistratie.filter({
          werknemer_id: wId,
          eindklant_id: ws.eindklant_id,
          datum: today,
          status: 'gestart'
        });

        if (existing.length > 0) {
          results.push({ werknemer_id: wId, naam, werkspot: ws.naam, status: 'al_gestart' });
          continue;
        }

        await base44.asServiceRole.entities.Klokregistratie.create({
          werknemer_id: wId,
          werknemer_naam: naam,
          eindklant_id: ws.eindklant_id,
          eindklant_naam: ws.eindklant_naam || '',
          datum: today,
          start_tijd: startTijd,
          status: 'gestart',
        });

        results.push({ werknemer_id: wId, naam, werkspot: ws.naam, status: 'gestart', start_tijd: startTijd });
      }
    }

    return Response.json({ 
      message: `Auto check-in voltooid: ${results.filter(r => r.status === 'gestart').length} werknemers ingecheckt`,
      results 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});