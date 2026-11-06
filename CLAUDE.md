# CTS-appen – overdragelse til næste session

Ejer: Thomas, Copenhagen Treasures & Services (CTS). **Sprog i svar og app: dansk.** Thomas koder ikke selv:
forklar trin i almindeligt dansk, ét trin ad gangen, med præcise klik. Korte, direkte svar.

## Arbejdsregler (fra Thomas)
- Alle spørgsmål samlet FØR der bygges. Ikke gæt-og-flag bagefter.
- Skeln mellem planlagt, bygget og testet. Påstå ikke, at noget virker, før det er testet.
- **Samme fremgangsmåde hver gang.** Ny maskinrumskode gives ALTID via linket
  https://raw.githubusercontent.com/CTSDK/cts-app/main/apps-script/Code.gs med de faste trin: (1) åbn linket, (2) Ctrl+F5 og tjek
  versionsnummeret, (3) Ctrl+A → Ctrl+C → Apps Script → Ctrl+A → Ctrl+V → Ctrl+S, (4) Implementer → Administrer implementeringer →
  blyanten → Ny version → Implementer, (5) evt. test i regnearket. Send ikke filer i stedet. Skal noget gøres anderledes:
  forklar først hvorfor og vent på Thomas' ja.
- **Aldrig fakta fra hukommelsen i data** (fx sætnavn/tema/år i DB). Kun det Thomas giver (fx Rebrickable-skærmbillede)
  eller et opslag, hvor kilden vises. Uoverensstemmelse (fx 31000 vs. 31100) → spørg FØR der skrives.
  Før der skrives i arket: vis præcis hvad, og vent på Thomas' ja. (Fejl 06-11: 31100 skrevet som "Sushi Animals" fra hukommelsen – rigtigt er Sports Car.)
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

## Status 1.5.0 (06-11-2026, bygget – ikke testet hos Thomas)
- Nummerorden: `sorterKoeb_` flytter hele rækker (moveRows) efter sætnummer ved opretBatch/tilfoejSaet/retSaet; menu "Sortér alle køb i nummerorden".
  App: `Beregn.saetOrden` sorterer Lager/køb (tal, endelse, nyeste køb). Test: tests/sortering.test.js.
- Menubjælke i bunden (Hjem · Nyt køb · Lager · Salg · Mere); "Mere" = udbakke + indstillinger. Cache v9.
- Lager: temafelt (tema fra lokal DB-kopi, antal pr. tema, søgning finder tema; ingen undertema endnu – Thomas). Solgte sæt vises ikke i Lager (Thomas 06-11). Store køb (>12 sæt):
  søgefelt i klargøring i stedet for alle knapper, 'Vis alle'. Test: tests/stortkoeb.js. Cache v10.
- Logo (Drive-mappe Logo, zip med 4 SVG; skrift Cormorant/EB Garamond) tegnet som PNG i icons/: logo-segl.png (Hjem), logo-ikon.png
  (lille foran overskrifter), app-ikon = invers ikon på navy. Cache v12. Hjemmeskærms-app: sletning af ikonet sletter appens lager
  (URL/nøgle + udbakke) – tjek 'Alt er sendt' først.
- Fotos: forbliver 1600 px / JPG 85 % (Thomas 06-11: kun en tanke). Forslag hvis nødvendigt: 2400 px / 90 % + bed om 4K fra live-kamera.
- Rettet (v13): "Ikke forbundet" blev hængende på Hjem efter indtastning af adresse/nøgle (test: tests/forbindelse.js).
  Geninstallation på iPhone 06-11: forbundet til 1.5.0, logo vises.
- Rettet: efter "Ret" hoppede appen til forkert sæt (valgte efter indeks).
- DB: tilføjet 30343, 30577, 31100 (fra Thomas' Rebrickable-skærmbilleder). 6 tomme rækker i Indkøb (261015/260916) slettet efter aftale.
- 261028 har nu 7 sæt (Tilføj sæt testet i rigtigt ark, sum 600 ✓). Ret/Fjern endnu ikke testet i rigtigt ark.

## Status (06-11-2026)
- **Testet og virker:** nyt køb (3 sider), købsprisfordeling, klargøring med live-kamera + fri beskæring, Lager, offline-tilstand,
  import af hele Excel-projektmappen (Kontrol-fanen: 5232/5232 tal = Excel). Sheets er nu det rigtige regneark; Excel er arkiv.
- **Bygget, ikke testet hos Thomas (maskinrum 1.4.6. LISTINGS TESTET i rigtigt ark og i appen på iPhone (lav listings + Kopiér) med 260830 06-11 – godkendt af Thomas. Ret køb og Registrér salg kun testet i simulering):** Registrér salg; ret køb (tilføj/ret/fjern sæt,
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
- Flag-emojis vises forkert (ð©ðª), når Claude læser Docs via connectoren – de er rigtige i selve dokumentet (tjekket af Thomas).
- Fotos kan i princippet hentes (download_file_content), men som base64 ~1 MB pr. foto – brug kun ved enkelte fotos.
- Rør ikke data uden aftale; test i midlertidige faner.
