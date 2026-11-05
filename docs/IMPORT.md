# Guide: Flyt projektmappen fra Excel til Sheets

Gør trinene i rækkefølge på computeren, logget ind med CTS-kontoen. Tag et skærmbillede, hvis noget ser anderledes ud.

> Efter importen er **Sheets det rigtige regneark**. Excel-filen gemmes som arkiv og opdateres ikke mere.

---

## Trin 1 – Opdatér maskinrummet til version 1.2.0

1. Åbn **github.com/CTSDK/cts-app/blob/main/apps-script/Code.gs** → klik **Raw** → **Ctrl+A** → **Ctrl+C**.
2. Apps Script → klik i koden → **Ctrl+A** → **Ctrl+V** → **Ctrl+S**.
3. **Implementer → Administrer implementeringer** → **blyanten** → **Version: Ny version** → **Implementer**.

## Trin 2 – Læg importfilen i Drive

1. Gem filen **cts-import.json**, som Claude har sendt dig, på computeren.
2. Gå til **drive.google.com → CTS** (samme mappe som regnearket *cts-app*).
3. Træk filen ind i mappen. Den må **ikke** omdøbes.

Filen indeholder dine data. Del den ikke, og læg den ikke andre steder hen.

## Trin 3 – Kør importen

1. Åbn regnearket **cts-app** og genindlæs (Ctrl+R).
2. **CTS → Importér fra Excel (sletter alt)**.
3. Godkend adgang, hvis Google spørger (samme fremgangsmåde som første gang).
4. Skriv **SLET ALT** i feltet og klik **OK**.
5. Vent 2–5 minutter. Luk ikke fanen.
6. Til sidst kommer en besked med **"Kontrol mod Excel: … tal stemmer"**. Send et skærmbillede af den og af fanen **Kontrol**.

## Trin 4 – Flyt fotoene fra OneDrive

1. I Drive: gå til **CTS** → **+ Ny → Ny mappe** → kald den **Import-fotos**.
2. Åbn mappen **Import-fotos**.
3. Åbn OneDrive-mappen med fotoene i Stifinder. Markér alle fotos (**Ctrl+A**) og træk dem over i browservinduet.
   - Tjek først mappens størrelse (højreklik → Egenskaber). Gratis Google-plads er 15 GB.
   - Store mængder kan tage lang tid at uploade. Lad browseren stå åben, til Drive skriver "Upload fuldført".
4. Gå til regnearket → **CTS → Sortér gamle fotos**. Godkend adgang, hvis Google spørger.
5. Fotoene flyttes til **CTS/Lager/<købsdato>/** og omdøbes fra `250000-215-01.jpg` til `250000-215.01.jpg`.
   - Er der mange, fortsætter sorteringen automatisk hvert minut. Du kan lukke regnearket imens.
   - Fotos, der ikke kan matches med et SKU, flyttes til **Import-fotos/_Ikke matchet** og står i fanen **Foto-import**.
   - Fotos af sæt, der er **solgt**, lægges i **papirkurven** (kan fortrydes i 30 dage).
   - Alle fotos får præcis samme SKU som i Indkøb, fx `250000-607B-01.jpg` → `250000-607-b.01.jpg` og `00-1472-03.jpg` → `250000-1472.03.jpg`.

Senere kan **CTS → Fjern fotos af solgte sæt** rydde fotos af solgte sæt i alle købsmapper.

## Trin 5 – Appen

Åbn appen og tryk **Lager → Opdater**. Nu vises alle dine sæt. Nye fotos lægges i købsmappen under **CTS/Lager/<købsdato>/**.

## Oprydning (når Kontrol stemmer)

- Slet mappen **CTS/Test** og filen **CTS Ny - 261103-kopi.xlsx** i Drive.
- Behold **cts-import.json**, indtil vi er færdige med at kontrollere. Den bruges af **CTS → Kør kontrol mod Excel**.
