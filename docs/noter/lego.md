# Område: Lego (CTS-appen + regnearket cts-app)

Status pr. 27-11-2026: app **v30** + maskinrum **2.6.0** lagt ud 27-11 (Nyt LEGO – se nedenfor; testet i browser, ikke bekræftet hos Thomas). v28/v29 (Lego-sortering) ✅. v25 (købsdato-vælger i Lager) ikke testet hos Thomas. Beskriver hvordan det ER nu. Brugervejledning: `docs/GUIDE.md`.

## Arkitektur
- **App:** statisk webapp i roden (`index.html`, `css/`, `js/`) på GitHub Pages: https://ctsdk.github.io/cts-app/ (testtilstand `?mock=1`).
  Hjemmeskærms-app på iPhone (iOS 27.2). ✅ Også installeret og testet 20-11 på **iPad** (Safari → Føj til hjemmeskærm) og **computer**
  (ASUS, Chrome/Edge → Installér): virker uden ny kode; første åbning på ny enhed skal hente alt, før Lager virker. Bredt layout ikke nødvendigt
  (Thomas 20-11). Find computer-appen igen (ikke tjekket – Googles hjælpeside kunne ikke åbnes): Windows-knap → skriv CTS, eller chrome://apps; højreklik på ikonet → Fastgør til proceslinjen. Fotos tages kun med telefonen; computeren bruges til almindeligt arbejde. Offline: service worker (`sw.js`), lokal kopi + udbakke i IndexedDB (`js/lokal.js`, `js/data.js`).
  Cache-version i `sw.js` og `?v=` i index.html hæves ved hver app-ændring (nu **v29**, lagt ud 22-11; versionen står nederst under Mere). v25 (Lager: vælger "Alle købsdatoer") ikke testet hos Thomas.
- **Maskinrum:** Google Apps Script bundet til regnearket **cts-app** (Drive-mappen `CTS`). Kode: `apps-script/Code.gs`, version i `VERSION` (nu **2.5.3** ✅ hos Thomas 22-11: `lgGemAlle` til "Alt i orden"; indeholder også 2.5.2's små fremdriftsbeskeder; Udgifter/Skat/Kontoplan/Bilagsplan ligger i økonomi-arket – se okonomi.md).
  Webapp "Udfør som: Mig", adgang "Alle"; alle kald kræver API-nøgle (Script Properties).
- **Faste kodetrin (altid sådan):** (1) åbn https://raw.githubusercontent.com/CTSDK/cts-app/main/apps-script/Code.gs, (2) Ctrl+Shift+R og tjek versionen,
  (3) Ctrl+A → Ctrl+C → Apps Script → Ctrl+A → Ctrl+V → Ctrl+S, (4) Implementer → Administrer implementeringer → blyanten → Ny version → Implementer,
  (5) evt. test. Menuændringer kræver kun gem. Send ikke filer i stedet.
- **App-opdatering hos Thomas:** luk appen helt og åbn igen, to gange.
- **Sletning af hjemmeskærms-appen sletter appens lager** (adresse/nøgle + udbakke). Tjek "Alt er sendt" under Mere først.
  Adresse: Implementer → Administrer implementeringer (webapp-URL, slutter på /exec). Nøgle: CTS → Vis API-nøgle.
- **Drive:** `CTS/Lager/<købsdato>/<SKU>.NN.jpg` (én mappe pr. køb). Maskinrummet finder `Lager` ved siden af regnearket
  → **flyt ikke regnearket** uden kodeændring. `CTS/Import-fotos/_Ikke matchet` (id `10hAXFRmL3Jr6PgoJzOMXHB5j2fSTi6LR`) = 575 gamle fotos, Thomas sorterer selv.
  Logo: Drive-mappe `Logo` (zip med 4 SVG). Noter-kopi: `CTS/Noter`.
- **Formler i Sheets** ligger i overskriftsrækken som `LET(... INDIRECT("'Fane'!X3:X") ...)` (tåler rækkeindsættelse).
  Skriv formler mens arket er `en_US` (`medEngelsk_`); SUMIFS udvider ikke i ARRAYFORMULA (brug MAP+SUMIFS); LET-navne må ikke ligne celler;
  tekst som "7236-2" skrives med apostrof (`tekst_`).
- **Tests:** `node tests/beregn.test.js`, `tests/listing.test.js`, `tests/sortering.test.js`, `tests/fragtbilag.test.js`; Playwright (server: `python3 -m http.server 8765`):
  `tests/e2e.js`, `tests/stortkoeb.js`, `tests/forbindelse.js`, `tests/tilfoejdb.js`, `tests/retro-e2e.js`, `tests/pm-e2e.js`, `tests/lgs-e2e.js`, `tests/lgs-alle-e2e.js` (v28/v29-knapperne).
  Kendt: `tests/retro.test.js` fejler på en forældet versionskontrol ("VERSION 2.4.x", linje 68) – ikke en fejl i koden; ret testen, når der er tid.

## Regnearket cts-app
- **Indkøb:** A SKU, B Købsdato, C Set nr., D Navn, E Værdi €, F Købspris, G Salg for, H OVP, I Sorteret, J Fotos, K Klar, L Stand, M Platform,
  N Lagerstatus, O Salgsdato, P Salgspris, Q Noter, R Værdikilde, S Vejledning, T Komplet, U Fast købspris, V Foto-SKU, W Listet. Data fra række 3.
  A, D, F, N er formler. SKU = ÅÅMMDD-setnr (+ -a/-b ved ens sæt i samme køb).
- **Indkøbslog:** A dato, B pris, C skattepligt, D noter, E–L formler, M mappe-id.
- **Salg 2025/2026:** data fra række 4. **DB:** A Lego number, B navn, C tema, D undertema, E år, F "Tilføjet i appen <dato>". Header række 2.
- **Nyt LEGO køb** og **Nyt LEGO lager** (fra 27-11) – se afsnittet "Nyt LEGO".
- Også: Lager, DB Salgspriser, eBay-afstemning, Kontrol, Foto-import, Ikke matchet. (Udgifter, Skat, Kontoplan → CTS Økonomi 08-11.)

## App-struktur
Hjem = områdevalg (Lego · Retro Design · Økonomi) – testet på iPhone 07-11. Lego-forsiden (`#v-forside`): Nyt køb, Lager, Registrér salg, Databaser (senere).
Menubjælken: Hjem (områdevalg) · Nyt køb · Lager · Salg · Mere.

## Funktioner – testet hos Thomas
Nyt køb (3 sider) + købsprisfordeling · klargøring med live-kamera + fri beskæring · Lager med søgning, tema-felt, filtre, nummerorden,
solgte sæt skjult · store køb (>12 sæt) med søgefelt · offline + udbakke · import fra Excel (5232/5232) · listings (Google Doc pr. køb + Kopiér) ·
Registrér salg (rigtigt salg 251009-6041) · Tilføj sæt og Ret i et køb · Tilføj sæt til DB (10367) · menubjælke · logo og app-ikon.

**Ikke testet hos Thomas endnu:** **Fjern** et sæt fra et køb · **Lager: købsdato-vælger** (app v25, 20-11: vælg de 6 cifre fra SKU, fx 261028 → kun det køb vises; nyeste øverst, 250000 nederst).

## Regler og beslutninger (Thomas)
- **Købspriser er dynamiske** – ingen låsning, heller ikke ved salg. Tages op igen, når CTS får CVR-nummer.
- **Åbent/lukket køb:** åbent indtil alle sæt er klar eller solgt; åbent køb kan tilføjes/rettes/fjernes; lukket kan genåbnes med bekræftelse.
- **Batch 250000** (privat/familiens LEGO, pris 0, Skattepligt Nej) er altid åben; ingen værdi kræves.
- **Nummerorden** efter sætnummer i køb og Lager. **Solgte sæt vises ikke i Lager.**
- **Fotos:** 3000 px / JPG 92 % (v16, 07-11); live-kameraet beder om 4032×3024 og viser den faktiske opløsning under billedet. ✅ Testet 07-11: Thomas synes kvaliteten er fin (opløsningstallet ikke noteret).
- **DB:** ukendte sæt tilføjes fra appen ("Tilføj til DB"; "-1" fjernes; tema-forslag). Rettelse af eksisterende DB-rækker: senere opgave.
- **Ingen opslag hos BrickLink/eBay** – al data fra egne databaser (Rebrickable-skærmbilleder fra Thomas er ok som kilde).
- **Pause fra eBay**, indtil alt er rigtigt.

## Listings (Google Doc "<købsdato> Listings" i købsmappen)
Kun fakta, ingen AI. Noter oversættes med Google Oversæt; "Sort: …" og [tekst i firkantede parenteser] udelades; antal dele/figurer udelades.
- **Titel:** `LEGO {Tema} {Setnr} {Navn} ({År}) [Vintage hvis ≥20 år] [OVP hvis æske] [komplett hvis komplet]` – aldrig "ohne OVP"/"unvollständig".
- **Zustand:** "🇩🇪 {betegnelse}, siehe Fotos und Beschreibung. [Komplett.] [Original-Verpackung (OVP) vorhanden (æske-note).] [Anleitung vorhanden.] [Hinweis: …]"
  + tom linje + "🇬🇧 …". Betegnelser: 10 Neuwertig/Like new, 8–9 Sehr gut (SG)/Very good (SG), 6–7 Gut (G)/Good (G), 4–5 Akzeptabel/Acceptable,
  1–3 Stark gebraucht/Heavily used. Kun det positive. "Æske: …" i Noter → parentes efter OVP.
- **Beskrivelse:** ">>> English description below <<<", DE-tekst, "---", EN-tekst. Stand-vendinger: 10 neuwertig, 9 sehr gut, 8 sehr guter gebrauchter Zustand,
  7 guter, altersgerechter Zustand, 6 gebrauchter Zustand mit leichten Spuren, 5 deutliche Gebrauchsspuren, 1–4 starke Gebrauchsspuren.
  "manual" → "building instructions". Thomas' eksempel er test i `tests/listing.test.js`.
- Vejledning/Komplet er false for alle importerede sæt – Thomas krydser af ved gennemgang.

## Sortering af dele (i appen siden v23 ✅ 15-11; billeder af dele v27 ✅ 20-11)
Samme måde som Playmobil (antal, −/+, ✓, note pr. del) – til sidst **inde i CTS-appen**.
- **Ren liste pr. sæt (fast, for altid, aldrig udfyldt):** ét regneark pr. sæt i `CTS/Lego/Sorteringslister` (id `1PsC1QepXfrHJKbfdNQJYR9RGjY77y4IR`),
  navn "<setnr> <navn>" (sorteres efter nummer). Fane **Liste**: A Item No (tekst) · B Beskrivelse (BrickLinks navn inkl. farve, uændret engelsk) · C Antal · D Type (Del/Minifigur).
  Med: Regular Items (dele + minifigurer som hele figurer). **Ikke med:** Counterparts og Alternate Items.
  - **6080 Kings Castle** `1qOf7Ual_TOh5WetzWOK3UAsBGM6EfldnzHqY08p61LU`: 99 dele (627 stk.) + 6 minifigurer (12). Tjekket mod BrickLinks Summary og mod Thomas' kopierede tekst (105/105 ens).
  - **Køb 18-11 (8 sæt, lavet 18-11, stk.-tal tjekket mod BrickLink for alle):** 70735 Ronin R.E.X. `1sn_xdz7p9_y81KkvFnAworJ8Pf-XpXH1nXVMwiS4DlA` ·
    8639 Big Bentley Bust Out `1jL_FZEBC06i-T5m9DPAD1VxR8uTqA9iz483403SD20M` · 75135 Obi-Wan's Jedi Interceptor `1FpKUSSuHsPVt22FiHKGkbWT7Lou5nWetm4mtGFYHqYA` ·
    8079 Shadow Snapper `13sMA5n6K20A9XC9FlnwLk5-k6YLnYuIv8Uol0Gn5B2Y` · 70745 Anacondrai Crusher `1NKn-0WWkCHafOxMi67QD9Z5hNiOuHzeeQcpTKv205P0` ·
    3845 Wild Wool / Shave a Sheep `1HSE8LtN762lNHoR7PljWBViwkq2Kn8tD9yEPSnBLNHo` · 70783 Protector of Fire `1AUCc2siYoxLYSu0uleSp4QusVJLib8hbZ5V_c_9x6U8` ·
    70731 Jay Walker One `12Bm1ExD1QlQCfQkylJIU4Cp6yb8Is5wxlnQS9TlqPdk`.
  - **Kolonner E og F (fra 20-11):** E "BL farve-id" (tal) · F "Billede (Rebrickable)" = kort billedadresse, fx `parts/elements/306901.jpg`
    eller `sets/fig-003064/108485.jpg` (maskinrummet sætter `https://cdn.rebrickable.com/media/` foran). Maskinrummet læser A–D til sortering og A, D, E, F til billeder.
    "(inv)" fjernes fra numre; mærkatark er dele (farve 0). (IMAGE-formlen fra 18-11 er fjernet.)
- **Billeder af dele (aftalt med Thomas 20-11; app v27 + maskinrum 2.5.x, ✅ vises hos Thomas på iPad 20-11; mappen komplet: 674 billeder):**
  - Én fælles mappe `CTS/Lego/Sorteringslister/Billeder af dele/` (oprettes af maskinrummet), ét billede pr. del og farve: `<item no>-<BL farve-id>.jpg/png`,
    minifigurer `<nr>-MN.jpg`. Samme del i flere sæt = ét billede (ingen dubletter). Thomas tager ikke selv fotos af dele.
  - **Claude finder billederne, når en ny sorteringsliste lægges ind** (Thomas' krav) og skriver adressen i kolonne F. Kilde = **Rebrickable**
    (BrickLink var nede 20-11; img.bricklink.com afviser/omdirigerer). Netværk: rebrickable.com, cdn.rebrickable.com, img.bricklink.com er tilladt i
    miljøet "Default" (20-11), og Rebrickable-API-nøglen ligger som netværkshemmelighed (Thomas, 20-11) – bruges automatisk.
  - Fremgangsmåde (scripts i scratchpad forsvinder – gør sådan igen): BL farve-id → Rebrickable farve via API `colors/` (external_ids BrickLink);
    BL item no → Rebrickable del via API `parts/?bricklink_id=<nr>`; billede: 1) `parts/elements/<element_id>.jpg` (element_id fra
    `cdn.rebrickable.com/media/downloads/elements.csv.gz`), 2) `parts/ldraw/<rb-farve>/<del>.png`, 3) API `parts/<del>/colors/<farve>/`,
    4) samme del i anden farve (API `parts/<del>/`). Minifigurer: API `sets/<setnr>-1/minifigs/` og navnematch. Tjek hver adresse: HTTP 200 **og at indholdet er et billede** (Rebrickable sender
    nogle gange en "Not Found"-side med status 200 – fx 300551.jpg og 4274194.jpg 20-11).
    Rebrickable tillader ca. 1 API-kald/sek.
  - 20-11 resultat for de 8 sæt: 711 af 720 dele med billede i rigtig farve, 3 i anden farve (58176 Trans-Bright Green/Trans-Red, 75135-mærkatark),
    tomme: 6 mærkatark + 44567u. Minifigurer: 13 af 20 (de 7 Cars-figurer i 8639 har intet billede hos Rebrickable).
  - Maskinrummet henter manglende billeder til mappen: hver nat sammen med noterne (`synkNoter`), når et sæt startes i "Sortér dele" (højst 40 sek.)
    og via menuen **CTS → Hent billeder af Lego-dele**. Kun én kørsel ad gangen; hver kørsel rydder dubletter og filer, der ikke er billeder (2.5.1),
    og viser små beskeder nederst til højre i stedet for OK-boks (2.5.2). API-handlingen `lgBilleder` sender billederne til appen.
  - App v27: "Sortér dele" viser billedet fra mappen (navn = item no + farve-id via `BL_FARVER`), gemmer det på enheden (virker uden net).
    Ingen billeder hentes direkte fra BrickLink. Thomas vil IKKE have billeder inde i masterarkene (fylder) – mappen er nok.
- **Farvenumre (BrickLink):** kilde = BrickLinks Color Guide, kopieret af Thomas 18-11 (176 farver, Modulex udeladt). Tabellen ligger i appen
  (`BL_FARVER` i js/app.js) og bruges til billednavnet. Nye sæt kræver kun BrickLink-listen (List → kopiér ind i samtalen).
- **Fast måde at hente en liste (testet 15-11 på computer):** BrickLink → sættets Inventory → klik **List** → Ctrl+A, Ctrl+C → indsæt i samtalen.
  Claude laver den rene liste og finder billederne (se ovenfor). Ikke "Udskriv til PDF" (bliver billeder).
- **Talformat:** item-numre skrives med apostrof (tekst), ellers kan Sheets lave dem om (sket med Playmobil: "30 03 0600" blev en dato).
- **I appen (v23 + maskinrum 2.4.0, bygget 15-11):** Nyt køb / Lager → **Klargør** → knap **"Sortér dele"** (viser status: ikke startet /
  x af y / sorteret ✓ / ingen liste). Første tryk kopierer sættets rene liste ind i købets ark **"<købsdato> Sortering"** i
  `CTS/Lager/<købsdato>/Sorteringslister/` (fane Dele: A SKU · B Item No · C Del · D Skal være · E Fundet · F ✓ · G Type · H Note). Sæt, der
  tilføjes købet senere, kommer med, når der trykkes "Sortér dele" på dem. Kræver net første gang (lgStart); derefter udbakke (lgGem).
  Samme regler som Playmobil (+/−/talfelt, ✓-regel, søg, note, kamera-ikon → `<SKU>-<ITEMNO>-<DEL>.NN.jpg` i Sorteringslister-mappen).
  Samme item no i flere farver holdes adskilt (nøgle = SKU + item no + beskrivelse).
  **"Færdig – overfør til klargøring"** (når alle ✓): viser først teksten → Overfør: Indkøb **Sorteret ✓**, **Komplet** ✓ hvis intet mangler,
  og tilføjer til **Noter** (eksisterende noter bevares): `Missing: 1 x Black Brick 1 x 2 (3004)` + linje med del-noter. Tomt Fundet = ikke talt.
  Ingen ren liste → besked "kopiér listen fra BrickLink og sæt den ind i samtalen". Kun nye sæt sorteres.
  Testet i browser (`tests/lgs-e2e.js`) og ✅ hos Thomas 15-11. **"Færdig – overfør" er endnu ikke bekræftet kørt på et rigtigt sæt** (tjek Indkøb bagefter).
  **Hurtig-knapper (app v28 + maskinrum 2.5.3, ✅ virker hos Thomas 22-11):** til sæt i nye/uåbnede poser.
  - **"Alt i orden – kryds resten af (N)"** over listen (kun når noget mangler kryds): bekræftelse → alle dele uden kryds får Fundet = Skal være og ✓
    i én omgang (API `lgGemAlle`, skriver kolonne E:F). Allerede afkrydsede dele og noter røres ikke. Virker offline (udbakke).
  - **"Alle"** ved hver del (efter −/+): Fundet = Skal være **og** ✓ i ét tryk; søgefeltet ryddes og får fokus (som ✓).
  - Ikke i Playmobil (Thomas 22-11: Playmobil fjernes fra appen, når den er færdig).
  **Navigation (app v29, lagt ud 22-11, testet i browser – ikke bekræftet hos Thomas):** stor knap "← Tilbage til klargøring – <SKU>" over søgefeltet
  og nederst under listen (den lille pil øverst findes stadig). På Klargør er knappen blå: "Sortér dele i sættet →" med "Tæl og kryds delene af · x af y afkrydset".
  Noter på sættet: Klargør → rul ned til **Noter** (Indkøb kolonne Q); Ret (sætnr./OVP/værdi) via "Ret" ved SKU øverst på Klargør.
  Købet **261118** (8 sæt, 600 kr): 3845, 8079, 70731, 75135 startet i "261118 Sortering" (`CTS/Lager/261118/Sorteringslister`). Testkøbet 261110 er slettet helt 20-11.
- **Senere (ikke besluttet):** SKU-sorteringsark slettes, når sættet er solgt; "Ny sorteringsliste" i appen (indsæt BrickLink-tekst fra telefonen).
- **Test (15-11):** `CTS/Lego/Sorteringslister/Test sortering` (`187NNroSbDSO3h_Bar5j3bEoGBEthKG1HzWGZiLuE__o`, fane Dele, række 14–118, SKU TEST-6080)
  + testside https://claude.ai/artifact/2fqHt1ppFSatTcd8XpMwKy (rød). Testet i browser med falske data; **ikke testet mod arket af Thomas endnu.**
  **✓-regel (Thomas 15-11, begge sider):** + sætter ikke kryds selv. Når Fundet = Skal være, lyser fluebenet grønt omrids ("klar").
  Først når Thomas trykker ✓, bliver det grønt = færdig. ✓ kan også trykkes, når der mangler dele: så er delen færdig, og manglen (Skal−Fundet)
  er selve noten – tom note = intet andet at notere. Efter ✓ ryddes søgefeltet, og markøren springer op i det, så næste nummer kan tastes.
  "Alle sæt"/"Alle SKU" er kun visning; sortering og noter kun under ét valgt sæt/SKU.
  Når testen er færdig, slettes testarket og testsiden.
- **Senere idé (ikke bygget):** "Ny sorteringsliste" direkte i appen (indsæt BrickLink-tekst fra telefonen); i dag kopieres listen ind i samtalen.

## Nyt LEGO – nye, forseglede sæt til videresalg (fra 27-11-2026)
Thomas køber sæt, der er ved at udgå (LEGO.com, BR, Proshop, ToySpace, tulli …) for at sælge dem, når butikkerne er tømt. Mål: mindst 30 % over vejl. pris.
- **Model (Thomas' ønske 27-11): ét lagernummer pr. sætnummer, `N-<sætnr>`** (fx N-21348), med antal på lager. Brugte sæt i Indkøb røres ikke.
- **Fane "Nyt LEGO køb"** (én række pr. ordrelinje): A Linje (K001…), B Købsdato ÅÅMMDD, C Butik, D Ordrenr., E Fakturanr., F Lagernr., G Sæt nr., H Navn, I Antal,
  J Stykpris, K Linjebeløb, L Fragt (andel), M Cashback, N Købspris i alt (=K+L−M), O Købspris pr. stk (=N/I), P Insiderpoint, Q Pointværdi (=P×5/100),
  R Pris pr. stk efter point, S Gave, T Bilagsnr, U Noter. Række 1 har totaler.
- **Fane "Nyt LEGO lager"** (én række pr. lagernummer, sorteret tema → sæt nr.): A Lagernr., B Sæt nr., C Navn, D Tema, E Undertema, F År, G Købt (SUMIF),
  H Solgt (COUNTIF i Salg 2026 på "N-xxx.*"), I På lager, J/K laveste/højeste købspris pr. stk, L Vejl. pris DKK, M Vejl. pris € (Brickset), N/O mål-salgspris (+30 %),
  P Anslået salgspris € (tom – Thomas), Q Udgår (Brickset), R Fotos (antal), S Noter/kilde. Formlerne skrives med `;` (arket er da_DK).
- **Regler (Thomas 27-11):** købspris = faktura minus cashback (Visa Cashback 5 % på LEGO.com, cashback-beløbet fra mailen). Gaver (GWP 40914/40918) og point-gaver = 0 kr.
  Proshop-faktura er ekskl. moms pr. linje → ×1,25. tulli-fragt 50 kr fordelt efter beløb. Insiderpoint = 1 point pr. kr × faktor (insider weekend 20.–22.11:
  4x på D&D/juletræ/Herredet, ellers 2x; Black Friday 26.–27.11: 1x + rabat). **100 point = 5 kr (Thomas' tal, ikke tjekket)**. Pointværdi er kun oplysning –
  skattemæssig behandling af point **ikke tjekket** (spørg SKAT/revisor). Mailtider er 1 time bagud → LEGO-ordrer kl. 23:xx hører til næste dag.
- **Salg (først købt, først solgt):** appen sælger lagernummeret; maskinrummet vælger ældste købslinje med sæt tilbage og skriver SKU `N-21348.K015` i Salg.
  Salg 2026 E (indkøbspris) slår op i "Nyt LEGO køb" via linje-id; N (skattepligtigt) = "Ja" for N-. (Formlerne rettet direkte i arket 27-11 + i Code.gs formlerSalg_.)
- **Indhold 27-11:** 92 linjer, **154 sæt, 54 lagernumre** fra 20.–27.11: LEGO.com 14 ordrer (35.689,31 kr, cashback 1.784,26 afventer – op til 12 uger),
  Proshop 70650451 (14.476), ToySpace ×4 (7.860), tulli DK12489117 (4.703 inkl. fragt), BR ×2 (11.900,80 + 3.101,80). I alt netto 75.946,65 kr.
  Point-gaver (nr. fra kassen): 6607198 Retro Space Explorer (Rebrickable 5009806), 40786, 40910, 6671142 M-Tron, 6671145 Mini Santa's Workshop.
  Vejl. pris DKK kun for 11377/10333/10354 (Thomas' skærmbilleder lego.com). Tema = Brickset (fx 40786 under Ideas, 40910 BrickHeadz, 6671145 Seasonal – Thomas: fint).
  Alt til salg. DB: 50 sæt tilføjet 27-11 (F = "Tilføjet af Claude 27-11-2026 (Rebrickable navn/år, Brickset tema)").
- **App v30:** Lego-forsiden → **"Nyt LEGO – køb"** (dato, butik, ordre-/fakturanr., cashback %, point-faktor; linjer med sæt nr., antal, stykpris, gave) og
  **"Nyt LEGO – lager"** (antal på lager pr. lagernummer → tryk → fotos af kassen, gemmes i `CTS/Lager/Nyt LEGO/<lagernr>/<lagernr>.NN.jpg`).
  Registrér salg: skriv `N-21348` (samme lagernr må stå flere gange, højst antal på lager). Maskinrum-kald: `nytKoeb`, `nytFoto`, `nytLager`; hentAlt giver `nyt`.
  Test: `tests/nyt-e2e.js` (mock) ✅. **Ikke testet mod det rigtige ark** (maskinrum 2.6.0 skal være indkopieret).
- **Bilag:** konto 2020 "Varekøb – nye sæt fra butikker". Claude henter selv faktura-PDF'er fra CTS-Gmailen (Thomas videresender). Se okonomi.md.

## Kendte forhold / næste i Lego
- Tom række 12 i Salg 2026 (var række 5; sandsynligvis fra importen) – ikke rørt; spørg før sletning.
- Køb 261028: fotos slettet 07-11 (for lav opløsning) – Thomas tager dem om med v16.
- DB-fejl: årstal står i undertema-kolonnen for bl.a. 41711/41714.
- **DB 18-11:** 7 sæt tilføjet af Claude (række 2465–2471, F = "Tilføjet af Claude 18-11-2026 (BrickLink)", kilde = BrickLink-sider Thomas kopierede):
  8639 (nyt tema **Cars**/Cars 2), 75135, 8079, 70745, 3845 (nyt tema **Games**), 70783, 70731. 70735 fandtes i forvejen (række 2249).
  DB-fanen havde ingen tomme rækker – nye rækker tilføjes nederst.
- **Statustælling** (senere): optælling i appen → liste over afvigelser (gamle salg med forkert SKU) → Claude retter Salg-fanen efter Thomas' ja.
- **Hjemmeside:** besluttet 20-11 – hele CTS (LEGO-afdeling = katalog over hele brugte sæt, data fra arket). Se `docs/noter/web.md`.
- **Hjemmeside 20-11:** 261118-75135 (Obi-Wan's Jedi Interceptor) vises til salg på https://ctsdk.github.io/cts-web/lego/75135/ til **€60** (Thomas' pris; "Sættes til salg for" i Indkøb er tomt, "Listet" FALSE). Ingen købsknap endnu. Sælges det på eBay → fjern det fra siden.
  Også **261118-3845** (Wild Wool / Shave a Sheep) til **€15** på https://ctsdk.github.io/cts-web/lego/3845/ (lagt ud 20-11; Indkøb "Sættes til salg for" tomt, "Listet" FALSE).
  Sælges et af dem → fjern det fra hjemmesiden.
- **Idé (diskuteres):** salg registreres automatisk ud fra eBay-mails/fakturaer – se okonomi.md.
