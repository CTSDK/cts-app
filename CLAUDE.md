# CTS-appen – overdragelse til næste session

Ejer: Thomas, Copenhagen Treasures & Services (CTS). **Sprog i svar og app: dansk.** Thomas koder ikke selv:
forklar trin i almindeligt dansk, ét trin ad gangen, med præcise klik. Korte, direkte svar.

## Arbejdsregler (fra Thomas)
- Alle spørgsmål samlet FØR der bygges. Ikke gæt-og-flag bagefter.
- Skeln mellem planlagt, bygget og testet. Påstå ikke, at noget virker, før det er testet.
- Ingen data, nøgler eller regnearksfiler i repository'et (.gitignore udelukker *.xlsx, *.csv, cts-import*.json m.m.).

## Arkitektur
- **App:** statisk webapp i roden (`index.html`, `css/`, `js/`), GitHub Pages: https://ctsdk.github.io/cts-app/ (testtilstand: `?mock=1`).
  På iPhone (iOS 27.2) som hjemmeskærms-app. Offline: service worker (`sw.js`), lokal kopi + udbakke i IndexedDB (`js/lokal.js`, `js/data.js`).
- **Maskinrum:** Google Apps Script bundet til Sheets-filen **cts-app** i CTS-kontoens Drive (mappen `CTS`). Kode: `apps-script/Code.gs`
  (version står i `VERSION`). Webapp-udrulning "Udfør som: Mig", adgang "Alle"; alle kald kræver API-nøgle (Script Properties).
  Hidtil har Thomas kopieret koden ind manuelt (Raw → Ctrl+A/C/V → Ctrl+S) og lavet **ny version** under Implementer → Administrer implementeringer,
  når API'et ændres. Menuændringer kræver kun gem.
- **Drive:** `CTS/Lager/<købsdato>/<SKU>.NN.jpg` (én mappe pr. køb, ingen undermapper pr. sæt). `CTS/Import-fotos/_Ikke matchet` = 575 gamle fotos (73 sæt), som Thomas selv sorterer.
- **Formler i Sheets:** lægges i overskriftsrækken som `LET(... INDIRECT("'Fane'!X3:X") ...)` så de tåler rækkeindsættelse.
  Erfaringer: skriv formler mens arket er på `en_US` (`medEngelsk_`), SUMIFS udvider ikke i ARRAYFORMULA (brug MAP+SUMIFS),
  LET-navne må ikke ligne celler (fx `s25`), tekst som "7236-2" skal skrives med apostrof (`tekst_`).

## Status (06-11-2026)
- **Testet og virker:** nyt køb (3 sider), købsprisfordeling, klargøring med live-kamera + fri beskæring, Lager, offline-tilstand,
  import af hele Excel-projektmappen (Kontrol-fanen: 5232/5232 tal = Excel). Sheets er nu det rigtige regneark; Excel er arkiv.
- **Bygget, ikke testet hos Thomas (maskinrum 1.4.1; listings testet i rigtigt ark med 260830 06-11, øvrigt kun i simulering):** Registrér salg; ret køb (tilføj/ret/fjern sæt,
  åbent/lukket, 250000 altid åben); listings (Listet-kolonne W, Google Doc "<batch> Listings", tekstgenerator testet i tests/listing.test.js).
  Thomas skal opdatere koden til 1.4.0, lave ny version og godkende Google Docs-adgang (CTS → Lav listings for et køb).
- **Næste:** (1) undersøg Google Drive/Sheets-forbindelsen (se nedenfor), (2) test Registrér salg med første rigtige salg,
  (3) fase 2: listingtekster (Titel "LEGO {Tema} {Setnr} {Navn} ({År}) Vintage OVP", Zustandsbeschreibung, Beschreibung DE/EN).
  Kendt datafejl: i DB står årstal i Subtheme-kolonnen for bl.a. 41711/41714.

## Beslutninger 06-11-2026 (Thomas)
- **Pause fra eBay**, indtil alt er rigtigt. Rækkefølge: (1) ret/tilføj/fjern sæt i køb, (2) listings, (3) statustælling + rettelse bagud.
- **Købspriser er dynamiske** – der låses IKKE priser (heller ikke ved salg). Tages op igen, når CTS får CVR-nummer.
- **Forslag 2:** et køb er *åbent*, indtil alle sæt er klargjort eller solgt; mens det er åbent kan sæt tilføjes, rettes og fjernes.
  Lukket køb kan genåbnes med bekræftelse.
- **Batch 250000** (privat/familiens LEGO, pris 0, Skattepligt Nej) er ALTID åben – der tilføjes sæt løbende i flere måneder.
- **Listings:** én Google Doc pr. køb ("<batch> Listings" i CTS/Lager/<batch>/), sættene under hinanden; titel, Zustandsbeschreibung,
  Beschreibung DE + "---" + EN. Kun fakta, ingen AI. Noter (dansk) oversættes automatisk med Google Oversæt (LanguageApp);
  "Sort: …"-koder og [tekst i firkantede parenteser] udelades. Antal dele/figurer udelades.
  Titel: `LEGO {Tema} {Setnr} {Navn} ({År}) [Vintage hvis ≥20 år] [OVP hvis æske] [komplett hvis komplet]` – aldrig "ohne OVP"/"unvollständig".
  Zustandsbeschreibung: DE+EN i ét felt, uden standtal: "🇩🇪 {Sehr gut (SG)}, siehe Fotos und Beschreibung. [Komplett.] [Original-Verpackung (OVP)
  vorhanden (æske-note).] [Anleitung vorhanden.] [Hinweis: …] 🇬🇧 …" – betegnelser: 10 Neuwertig/Like new, 8–9 Sehr gut (SG)/Very good (SG),
  6–7 Gut (G)/Good (G), 4–5 Akzeptabel/Acceptable, 1–3 Stark gebraucht/Heavily used. "Æske: …" i Noter → parentes efter OVP.
  KUN det positive skrives (Komplett/OVP/Anleitung), intet om dele. Thomas' eksempel er test i tests/listing.test.js.
  NB: Vejledning/Komplet er false for alle 991 importerede sæt (fandtes ikke i Excel) – Thomas krydser af ved gennemgang.
  Stand-vendinger: 10 neuwertig, 9 sehr gut, 8 sehr guter gebrauchter Zustand, 7 guter, altersgerechter Zustand,
  6 gebrauchter Zustand mit leichten Spuren, 5 deutliche Gebrauchsspuren, 1–4 starke Gebrauchsspuren.
  Thomas' faste tekst (DE/EN, CoolRunner/Homerunner/Bring-forsendelse) står i samtalen 06-11 – spørg Thomas om den igen, hvis den mangler.
- **Statustælling:** gamle salg er nogle gange registreret med forrige sæts SKU. Plan: optælling i appen → liste over afvigelser →
  Claude retter Salg-fanen via Sheets-forbindelsen efter Thomas' godkendelse.

## Google-forbindelse (testet 06-11-2026)
Connectors Google Drive + Google Sheets (CTS-kontoen) virker. Regneark-id for **cts-app**: `1cCBaGigDN0c5UK3iIKL8GDtNKwNqVHq-PnuEclieGvw`.
- ✓ Læse faner (Sheets get_values), ✓ oprette/slette faner og skrive celler (Sheets update_*).
- ✓ Søge, omdøbe og flytte filer i Drive (Drive search_files / update_file med title/parentId). Mappe `_Ikke matchet`: `10hAXFRmL3Jr6PgoJzOMXHB5j2fSTi6LR`.
- ✗ Apps Script-koden kan IKKE opdateres via connectoren (bundet script er ikke en Drive-fil) – Thomas kopierer stadig koden ind.
- Fotos kan i princippet hentes (download_file_content), men som base64 ~1 MB pr. foto – brug kun ved enkelte fotos.
- Rør ikke data uden aftale; test i midlertidige faner.
