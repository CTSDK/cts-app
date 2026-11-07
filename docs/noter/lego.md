# Område: Lego (CTS-appen + regnearket cts-app)

Status pr. 07-11-2026. Beskriver hvordan det ER nu. Brugervejledning: `docs/GUIDE.md`.

## Arkitektur
- **App:** statisk webapp i roden (`index.html`, `css/`, `js/`) på GitHub Pages: https://ctsdk.github.io/cts-app/ (testtilstand `?mock=1`).
  Hjemmeskærms-app på iPhone (iOS 27.2). Offline: service worker (`sw.js`), lokal kopi + udbakke i IndexedDB (`js/lokal.js`, `js/data.js`).
  Cache-version i `sw.js` og `?v=` i index.html hæves ved hver app-ændring (nu v14).
- **Maskinrum:** Google Apps Script bundet til regnearket **cts-app** (Drive-mappen `CTS`). Kode: `apps-script/Code.gs`, version i `VERSION` (nu **1.6.0**).
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
- **Tests:** `node tests/beregn.test.js`, `tests/listing.test.js`, `tests/sortering.test.js`; Playwright (server: `python3 -m http.server 8765`):
  `tests/e2e.js`, `tests/stortkoeb.js`, `tests/forbindelse.js`, `tests/tilfoejdb.js`.

## Regnearket cts-app
- **Indkøb:** A SKU, B Købsdato, C Set nr., D Navn, E Værdi €, F Købspris, G Salg for, H OVP, I Sorteret, J Fotos, K Klar, L Stand, M Platform,
  N Lagerstatus, O Salgsdato, P Salgspris, Q Noter, R Værdikilde, S Vejledning, T Komplet, U Fast købspris, V Foto-SKU, W Listet. Data fra række 3.
  A, D, F, N er formler. SKU = ÅÅMMDD-setnr (+ -a/-b ved ens sæt i samme køb).
- **Indkøbslog:** A dato, B pris, C skattepligt, D noter, E–L formler, M mappe-id.
- **Salg 2025/2026:** data fra række 4. **DB:** A Lego number, B navn, C tema, D undertema, E år, F "Tilføjet i appen <dato>". Header række 2.
- Også: Lager, Udgifter 2025/26, Skat 2025/26, DB Salgspriser, Kontoplan, eBay-afstemning, Kontrol, Foto-import, Ikke matchet.

## Funktioner – testet hos Thomas
Nyt køb (3 sider) + købsprisfordeling · klargøring med live-kamera + fri beskæring · Lager med søgning, tema-felt, filtre, nummerorden,
solgte sæt skjult · store køb (>12 sæt) med søgefelt · offline + udbakke · import fra Excel (5232/5232) · listings (Google Doc pr. køb + Kopiér) ·
Registrér salg (rigtigt salg 251009-6041) · Tilføj sæt og Ret i et køb · Tilføj sæt til DB (10367) · menubjælke · logo og app-ikon.

**Ikke testet hos Thomas endnu:** **Fjern** et sæt fra et køb.

## Regler og beslutninger (Thomas)
- **Købspriser er dynamiske** – ingen låsning, heller ikke ved salg. Tages op igen, når CTS får CVR-nummer.
- **Åbent/lukket køb:** åbent indtil alle sæt er klar eller solgt; åbent køb kan tilføjes/rettes/fjernes; lukket kan genåbnes med bekræftelse.
- **Batch 250000** (privat/familiens LEGO, pris 0, Skattepligt Nej) er altid åben; ingen værdi kræves.
- **Nummerorden** efter sætnummer i køb og Lager. **Solgte sæt vises ikke i Lager.**
- **Fotos:** 1600 px / JPG 85 %. Forslag hvis nødvendigt: 2400 px / 90 % + 4K fra live-kamera.
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

## Kendte forhold / næste i Lego
- Tom række 5 i Salg 2026 (sandsynligvis fra importen) – ikke rørt; spørg før sletning.
- DB-fejl: årstal står i undertema-kolonnen for bl.a. 41711/41714.
- **Statustælling** (senere): optælling i appen → liste over afvigelser (gamle salg med forkert SKU) → Claude retter Salg-fanen efter Thomas' ja.
- **Idé (diskuteres):** salg registreres automatisk ud fra eBay-mails/fakturaer – se okonomi.md.
