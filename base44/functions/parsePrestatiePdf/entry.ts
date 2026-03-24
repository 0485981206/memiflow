import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, format = 'json', active_only = 'true', filename = 'prestatie.pdf' } = await req.json();
    if (!file_url) return Response.json({ error: 'Geen file_url meegestuurd' }, { status: 400 });

    // Download het bestand van de base44 opslag
    const fileResponse = await fetch(file_url);
    const fileBlob = await fileResponse.blob();

    // Stuur door naar de parse API
    const formData = new FormData();
    formData.append('file', fileBlob, filename);

    const apiUrl = `http://31.97.176.25:8000/api/parse?format=${format}&active_only=${active_only}`;
    const response = await fetch(apiUrl, { method: 'POST', body: formData });

    if (format === 'csv') {
      const csvText = await response.text();
      return new Response(csvText, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${filename.replace('.pdf', '.csv')}`,
        },
      });
    }

    const json = await response.json();
    return Response.json(json);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});