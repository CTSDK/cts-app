# Område: Playmobil

Eget område, ikke Lego. Kører ikke gennem CTS-appen eller Lego-arket *cts-app*.

## Sæt 5142 Prinsesseslot – sortering af dele (startet 14-11-2026)
Formål: tjekke at alle dele er der, ud fra manualens stykliste.

### Hvor det ligger
- **Drive-mappe CTS/Playmobil:** id `1GMWYxrs8T8cvRCSUxSWs5MaaExXHgxXQ`.
- **Regneark "Playmobil 5142 Prinsesseslot"** (den eneste kilde): `1m1KBMvgFHQnmQqJ6DmQbCkDBkqTSPqL2OFjGOIHsq6s`, fane **Dele** (sheetId 449130092).
  - Række 1: søgefelt **B1** (gult), C1 = antal træf. Række 2–12: op til 10 træf med link "Gå til". Række 1–13 er frosset.
  - Række 13 = overskrift. **Række 14–188 = de 175 varenumre**, sorteret efter varenr.
  - Kolonner: A Varenr. · B Del · C Skal være · **D Fundet** · E Mangler (formel) · **F ✓** (afkrydsningsfelt) · G Side · H skjult hjælpekolonne · **I Note** (fri tekst, tilføjet 14-11 i begge ark).
  - Arket er dansk (formler bruger `;`). Afkrydsede rækker er grønne, og søgetræf er gule og fede.
  - Søgeregel: små bogstaver og ingen mellemrum, leder i varenr.+del (så "30 22 9002", "229002", "9002" og "guld" alle virker).
- **Sorteringsside (ny, 14-11):** https://claude.ai/artifact/4epV2FkKY4MBv1NZ76kbq9. Den læser og skriver arket via Google Sheets-forbindelsen
  (get_values A14:I188, update_values D/F/I{række}). Notefelt under hver del (gemmer i kolonne I, søgbart på siden). Søg øverst, træf lige under, −/+/talfelt/✓, filtre Alle/Mangler/Afkrydset.
  **Bygget, ikke testet mod det rigtige ark.** Notefeltet er testet i browser med falske data (5135-siden; 5142 er samme kode).
  Thomas skal åbne den i claude.ai (CTS-kontoen), trykke Tillad, prøve +/✓/note og derefter tjekke arket.
- Gammel sorteringsside fra chatten (https://claude.ai/artifact/22aHokqH6ji8CA7AxWrxPx, database `parts`): **urørt, bruges ikke**.
  Den kan slettes, når den nye side virker. Det gamle Claude Sheets-regneark bruges heller ikke.
- Manual-PDF (kun billeder, ingen tekst): https://playmobil.scene7.com/is/content/Playmobil/5142pdf.pdf. Side 22–26 er styklisten, og side 21 er tilbehør.

### Beslutninger
- "Skal være" = antal af varenummeret, som manualen viser det. Et sæt/en pose tæller som 1 ("sæt med N dele" står i beskrivelsen). I alt 561 enheder på 175 numre.
- Ingen dobbelttælling: 30 22 9332, 30 28 7720 og 30 28 7730 står på både side 21 og 26 og tælles kun under side 26.
- Usikre antal: 30 22 9962 Tiara-sten = 3 (talt fra tegningen) og 30 62 7183 Kjoledele = 1 sæt. 30 22 9002 Guldkuppel = 1 (bekræftet).
- Navnene på delene er Claudes egne. Ret dem, når Thomas giver bedre navne.
- "Fundet" tomt = ikke talt (ikke 0).

### Status pr. 14-11-2026
74 af 175 numre afkrydset, 101 mangler: side 21: 8 · 22: 11 · 23: 4 · 24: 5 · 25: 22 · 26: 51.

### Sådan arbejder vi
Thomas tæller på sorteringssiden, eller skriver til Claude fx "fundet 30 22 9002: 1", "afkryds 30 25 6590" eller "mangler 2 af 30 09 6900"
(= fundet skal−2, intet kryds). Claude læser rækken i arket først, skriver D/F og bekræfter i én linje.

## Sæt 5135 Piratskib – sortering af dele (startet 14-11-2026)
Samme fremgangsmåde som 5142. Navnet står ikke på forsiden; "5135 Pirate Ship" står på manualens side 11 (Thomas sagde ja til "Piratskib").
- **Regneark "Playmobil 5135 Piratskib"**: `1dzRA-XnTaA-b0_-ZxJvMVVmr3oIvj4Wyou-TfjEBuCo` i CTS/Playmobil, fane **Dele** (sheetId 449130092).
  Lavet som kopi af 5142-arket, så søgefelt, kolonner, farver og formler er de samme. Kolonne I Note som i 5142. **Række 14–98 = de 85 varenumre** (150 enheder).
  Søgning testet ("kanon" gav 6 træf). Søgefeltets hjælpetekst i arket nævner stadig "rose" (fra 5142).
- Manual: Thomas' PDF (16 sider, kun billeder). Side 13–16 er styklisten. Side 11–12 er tilbehør, der sælges separat, og er ikke med.
- Beslutninger (Thomas, 14-11): poser og numre med flere dele uden antal = 1 (antallet af dele står i beskrivelsen).
  Kanon-boksen "2x" gælder alle 4 numre (30 65 6322, 30 22 8070, 30 27 4240, 30 03 0600 = 2 hver). 30 60 1382 = 2.
  30 27 4240 og 30 25 6230 står på både side 13 og 16 og tælles kun under side 16.
- Delenes navne er Claudes egne ud fra tegningerne.
- **Sorteringsside:** https://claude.ai/artifact/KQHh2MMnrn597CaNtBX5DT (blå). Samme kode som 5142-siden inkl. notefelt, men bruger 5135-arket
  (række 14–98). **Bygget; notefelt testet med falske data; ikke testet mod det rigtige ark.**
- **Opslag 14-11 (kun søgeresuméer, sider kunne ikke åbnes):** 5135 = "Pirate Prize Ship" / "Piraten-Beuteschiff", 2011–2015
  ([Klickypedia](https://www.klickypedia.com/sets/5135-pirate-prize-ship/?elang=de), [V&A](https://collections.vam.ac.uk/item/O1388991)). Arket hedder stadig "Piratskib".
  Lignende skib: **3940** Großes Piratenflaggschiff har samme skrog ifølge én anmeldelse (Klickypedia), men sandsynligvis andre sejl (uden tryk).
  Intet sæt bekræftet med samme skrog + klistermærker + sejl. Uafklaret: en eBay-annonce siger skrog 30 22 8412 (manualen: 30 23 2852).
  eBay, Klickypedia og playmodb.org kan ikke åbnes fra sessionen.
- Status: 0 af 85 afkrydset.

## Næste
1. Thomas tester den nye sorteringsside (se ovenfor). Virker den, slettes den gamle side.
2. Sortering fortsætter (101 numre).
3. 5135 Piratskib: Thomas tester sorteringssiden (se ovenfor). Derefter kan der sorteres (85 numre).
4. Lignende skibe (samme skrog/klistermærker/sejl): Thomas vælger (a) sende 3940-manualen som PDF → Claude sammenligner numre (anbefalet),
   eller (b) tillade ebay.de, klickypedia.com, playmodb.org i sessionens netværk. Evt. omdøbe arket til "Pirate Prize Ship" (spurgt, ikke svaret).
5. `synkNoter` (Code.gs linje 84) kopierer ikke playmobil.md til Drive endnu. Den kan tilføjes ved næste maskinrumsopdatering.
