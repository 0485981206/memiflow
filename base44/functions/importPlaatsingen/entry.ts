import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CSV_DATA = `1935797;van hoornweder
1935840;van hoornweder
1935860;van hoornweder
1935863;van hoornweder
1935867;Artislach
1935876;Artislach
1939416;van hoornweder
1939516;van hoornweder
1940626;Westvlees
1941016;Westvlees
1941235;Smits
1945085;van hoornweder
1945087;van hoornweder
1945212;Artislach
1948437;van hoornweder
1948445;van hoornweder
1948452;van hoornweder
1948633;Westvlees
1952427;Smits
1952459;van hoornweder
1952474;van hoornweder
1953252;Van nieuwe huize
1953255;Bert Maes
1955550;Bert Maes
1955567;Bert Maes
1955579;Smits
1960652;van hoornweder
1960735;van hoornweder
1696414;van hoornweder
1696416;van hoornweder
1704703;Smits
1708817;van hoornweder
1712714;Artislach
1737299;Smits
1737329;van hoornweder
1770772;Artislach
1770776;Artislach
1770778;Artislach
1779451;Artislach
1779523;Artislach
1789307;Van nieuwe huize
1789311;Meat and More
1799595;Artislach
1839898;van hoornweder
1841225;van hoornweder
1862298;Van nieuwe huize
1878862;van hoornweder
1878866;Bert Maes
1879647;Jademo
1879649;Bert Maes
1885082;Artislach
1885089;Jademo
1887580;Artislach
1896851;Artislach
1900490;Westvlees
1900495;Bert Maes
1903226;Smits
1917466;Hofkip
1923408;Hofkip
1924372;van hoornweder
1926808;Jademo
1927084;van hoornweder
1929053;Meat and More
1930010;Westvlees
1930018;Westvlees
1931700;Westvlees
1931702;Artislach
1933280;van hoornweder
1692426;Hemelaer
1694822;Smits
1696413;van hoornweder
1628017;van hoornweder
1637784;Artislach
1649002;van hoornweder
1649057;Meat and More
1650623;Hofkip
1650629;Bert Maes
1650786;Bert Maes
1650799;Artislach
1650815;Artislach
1650836;Artislach
1650875;Artislach
1650932;Artislach
1650934;Artislach
1650938;Westvlees
1650944;Smits
1650950;Artislach
1650960;Artislach
1650961;Artislach
1650968;Bert Maes
1650971;Westvlees
1650975;Hofkip
1650979;Artislach
1650984;Bert Maes
1650986;Artislach
1650993;Smits
1650994;Artislach
1651027;Bert Maes
1651049;Artislach
1651153;Artislach
1651192;Hofkip
1651194;Artislach
1651195;Artislach
1651225;Smits
1651366;Artislach
1651367;Artislach
1651370;van hoornweder
1651378;Bert Maes
1651427;Artislach
1651612;Artislach
1651613;Smits
1651616;Hofkip
1651617;Smits
1651618;Hofkip
1651619;Artislach
1651620;Artislach
1651621;Artislach
1651625;Smits
1653311;Artislach
1653444;Artislach
1653497;Artislach
1653559;Bert Maes
1654138;van hoornweder
1654357;Artislach
1654374;Meat and More
1654384;Artislach
1654430;Smits
1654823;Hofkip
1654824;Artislach
1654829;Smits
1660415;Artislach
1661344;Artislach
1664667;Smits
1665230;van hoornweder
1666087;Van nieuwe huize
1666092;Van nieuwe huize
1667674;Artislach
1671593;Smits
1671594;Bert Maes
1671597;Bert Maes
1672247;van hoornweder
1674277;Artislach
1678548;Artislach
1679455;Artislach
1685315;Smits
1689712;Hemelaer
1444998;Jademo
1449676;Meat and More
1458868;Jademo
1487323;van hoornweder
1541206;Leemput
1546562;Leemput
1548521;Leemput
1550823;van hoornweder
1552111;Jademo
1572060;Hemelaer
1572070;Van nieuwe huize
1589561;van hoornweder
1590698;van hoornweder
1606427;Bens
1611520;Meat and More
1611524;adriaens
1624645;Van nieuwe huize
1624646;Van nieuwe huize
1135647;Leemput
1135651;Leemput
1135657;Leemput
1135668;Leemput
1135673;Leemput
1135679;Leemput
1139227;delemeat
1140821;Hemelaer
1140822;Hemelaer
1146938;Artislach
1146994;Leemput
1158125;Artislach
1179206;Hemelaer
1185479;Hemelaer
1185498;Meat and More
1201547;Artislach
1203093;van hoornweder
1209256;adriaens
1275476;Jademo
1295035;van hoornweder
1297240;MATANZA
1297242;MATANZA
1334432;van hoornweder
1334433;van hoornweder
1339930;Jademo
1359583;Meat and More
1367101;Hemelaer
1367119;Hemelaer
1369966;van hoornweder
1381737;van hoornweder
1390192;van hoornweder
1393805;van hoornweder
1393813;van hoornweder
1422693;Hemelaer
1424796;Jademo
1424797;Hofkip
1430917;Hemelaer
1431964;Artislach
1432057;Van nieuwe huize
874592;adriaens
874594;Hemelaer
874597;Hemelaer
874598;MATANZA
874599;Hemelaer
874600;MATANZA
874601;Hemelaer
874602;Hemelaer
874866;MATANZA
874869;Hemelaer
881306;Meat and More
881308;van hoornweder
881311;Westvlees
881330;Meat and More
881333;Meat and More
881334;Meat and More
881349;Meat and More
881351;Hemelaer
881353;Meat and More
881676;Van nieuwe huize
929925;Hemelaer
935530;Jademo
935534;Jademo
939915;Meat and More
944990;Meat and More
954535;van hoornweder
954538;van hoornweder
954549;van hoornweder
954565;van hoornweder
954772;van hoornweder
954855;van hoornweder
954865;van hoornweder
954893;van hoornweder
955246;van hoornweder
955287;van hoornweder
955305;van hoornweder
955306;van hoornweder
955309;van hoornweder
955314;van hoornweder
955319;van hoornweder
955340;Meat and More
963405;van hoornweder
963417;Hemelaer
963423;Hemelaer
969703;van hoornweder
999175;van hoornweder
1000731;Jademo
1004844;van hoornweder
1014436;Hemelaer
1014459;Jademo
1017238;Hemelaer
1075931;van hoornweder
1098341;Hemelaer
1135603;delemeat
1135618;Hemelaer
1135640;Leemput
1135643;Leemput`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all werknemers (paginate)
    let allWerknemers = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.Werknemer.filter({}, '-created_date', 50, skip);
      allWerknemers = allWerknemers.concat(batch);
      if (batch.length < 50) break;
      skip += 50;
    }

    // Get all eindklanten
    const klanten = await base44.asServiceRole.entities.Eindklant.filter({});

    // Build lookup maps
    const werknemerByOvereenkomst = {};
    allWerknemers.forEach(w => {
      if (w.overeenkomstnummer) {
        werknemerByOvereenkomst[w.overeenkomstnummer.trim()] = w;
      }
    });

    const klantByName = {};
    klanten.forEach(k => {
      klantByName[k.naam.toLowerCase()] = k;
    });

    // Parse CSV
    const lines = CSV_DATA.trim().split('\n');
    const mappings = lines.map(line => {
      const [overeenkomst, klantNaam] = line.split(';');
      return { overeenkomst: overeenkomst.trim(), klantNaam: klantNaam.trim() };
    });

    const created = [];
    const notFound = [];

    // Create plaatsingen in batches
    const toCreate = [];
    for (const { overeenkomst, klantNaam } of mappings) {
      const werknemer = werknemerByOvereenkomst[overeenkomst];
      const klant = klantByName[klantNaam.toLowerCase()];

      if (!werknemer) {
        notFound.push({ overeenkomst, klantNaam, reason: 'werknemer_niet_gevonden' });
        continue;
      }
      if (!klant) {
        notFound.push({ overeenkomst, klantNaam, reason: 'klant_niet_gevonden' });
        continue;
      }

      toCreate.push({
        werknemer_id: werknemer.id,
        werknemer_naam: `${werknemer.voornaam} ${werknemer.achternaam}`,
        eindklant_id: klant.id,
        eindklant_naam: klant.naam,
        functie: werknemer.functie || '',
        status: 'actief',
        startdatum: werknemer.startdatum || '',
      });
    }

    // Bulk create in batches of 25
    for (let i = 0; i < toCreate.length; i += 25) {
      const batch = toCreate.slice(i, i + 25);
      const results = await base44.asServiceRole.entities.Plaatsing.bulkCreate(batch);
      created.push(...results);
    }

    return Response.json({
      success: true,
      created: created.length,
      not_found: notFound.length,
      not_found_details: notFound,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});