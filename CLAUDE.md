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
- **Bygget, ikke testet hos Thomas:** Registrér salg (app + `registrerSalg` i maskinrum 1.3.0). Thomas skal opdatere koden til 1.3.0
  og lave ny version, før appen kan gemme salg.
- **Næste:** (1) undersøg Google Drive/Sheets-forbindelsen (se nedenfor), (2) test Registrér salg med første rigtige salg,
  (3) fase 2: listingtekster (Titel "LEGO {Tema} {Setnr} {Navn} ({År}) Vintage OVP", Zustandsbeschreibung, Beschreibung DE/EN).
  Kendt datafejl: i DB står årstal i Subtheme-kolonnen for bl.a. 41711/41714.

## Google-forbindelse (testet 06-11-2026)
Connectors Google Drive + Google Sheets (CTS-kontoen) virker. Regneark-id for **cts-app**: `1cCBaGigDN0c5UK3iIKL8GDtNKwNqVHq-PnuEclieGvw`.
- ✓ Læse faner (Sheets get_values), ✓ oprette/slette faner og skrive celler (Sheets update_*).
- ✓ Søge, omdøbe og flytte filer i Drive (Drive search_files / update_file med title/parentId). Mappe `_Ikke matchet`: `10hAXFRmL3Jr6PgoJzOMXHB5j2fSTi6LR`.
- ✗ Apps Script-koden kan IKKE opdateres via connectoren (bundet script er ikke en Drive-fil) – Thomas kopierer stadig koden ind.
- Fotos kan i princippet hentes (download_file_content), men som base64 ~1 MB pr. foto – brug kun ved enkelte fotos.
- Rør ikke data uden aftale; test i midlertidige faner.
