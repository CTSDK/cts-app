# Guide: Sæt CTS-appen i gang (fase 1)

Følg trinene i rækkefølge. Hvert trin tager 2–10 minutter. Hvis noget ser anderledes ud end beskrevet, så tag et skærmbillede og send det til Claude.

Du skal bruge en **computer**, hvor du er logget ind med **CTS-Gmailen**, og din **iPhone**.

---

## Trin 1 – Slå GitHub Pages til (appens adresse)

1. Gå til **github.com/CTSDK/cts-app** (logget ind som CTSDK).
2. Klik på **Settings** (tandhjul øverst i repository'et).
3. Klik på **Pages** i menuen til venstre.
4. Under **Build and deployment → Source** vælger du **Deploy from a branch**.
5. Under **Branch** vælger du **main** og **/ (root)**. Klik **Save**.
6. Vent 1–2 minutter og genindlæs siden. Øverst står der nu: *"Your site is live at https://ctsdk.github.io/cts-app/"*.

**Prøv appen med det samme uden Sheets:** Åbn `https://ctsdk.github.io/cts-app/?mock=1`. En gul bjælke viser, at det er testtilstand. Her gemmes intet i Sheets.

---

## Trin 2 – Indsæt scriptet i regnearket

1. Åbn **drive.google.com** og åbn Sheets-filen **cts-app**.
2. Vælg **Udvidelser → Apps Script** i menuen. En ny fane åbner.
3. Klik på "Unavngivet projekt" øverst til venstre og kald projektet **CTS maskinrum**.
4. Til venstre står filen **Kode.gs** (eller Code.gs). Klik på den, markér al teksten (Ctrl+A) og slet den.
5. Åbn i en ny fane: **github.com/CTSDK/cts-app/blob/main/apps-script/Code.gs**
6. Klik på knappen **Copy raw file**. Den ligner to små firkanter og sidder øverst til højre over koden.
7. Gå tilbage til Apps Script og sæt teksten ind (Ctrl+V).
8. Gem med **Ctrl+S** eller diskette-ikonet.

---

## Trin 3 – Byg testarket

1. Gå tilbage til fanen med regnearket **cts-app** og genindlæs siden (Ctrl+R eller den runde pil ↻; på ASUS er F5 lysstyrke).
2. Efter et par sekunder dukker menuen **CTS** op til højre for "Hjælp".
3. Vælg **CTS → 1. Opsæt testark**.
4. Første gang beder Google om lov:
   - **Godkendelse påkrævet** → klik **Fortsæt**.
   - Vælg **CTS-kontoen**.
   - *"Google har ikke bekræftet denne app"* → klik **Avanceret** → **Gå til CTS maskinrum (usikker)**. Det er dit eget script, så det er i orden.
   - Klik **Tillad** eller **Fortsæt**.
5. Vælg **CTS → 1. Opsæt testark** igen. Svar **Ja**, når den spørger, om den må slette fanerne.
   - Alle faner undtagen **DB** slettes og bygges forfra tomme. Det rammer **kun** testkopien. Din Excel-fil er ikke berørt.
6. Til sidst står der **Færdig**. I Drive findes nu mapperne **CTS/Test** og **CTS/Lager**.
7. Tjek fanerne. De skal være tomme, men **uden** røde fejl som #NAME? eller #ERROR!. Tag et skærmbillede af **Indkøb**, **Lager** og **DB Salgspriser** og send dem til Claude.

---

## Trin 4 – Udrul maskinrummet (giver appen en adresse at ringe til)

1. Gå til **Apps Script**-fanen.
2. Klik på den blå knap **Implementer** (kan også hedde "Udrul") øverst til højre og vælg **Ny implementering**.
3. Klik på tandhjulet ved "Vælg type" og vælg **Webapp**.
4. Udfyld:
   - **Beskrivelse:** `v1`
   - **Udfør som:** **Mig (CTS-Gmailen)**
   - **Hvem har adgang:** **Alle**

   "Alle" betyder, at adressen kan nås udefra. Uden den hemmelige nøgle bliver alle kald dog afvist.
5. Klik **Implementer**. Hvis Google beder om godkendelse igen, så gør som i trin 3.4.
6. Kopiér **Webapp-URL'en**. Den slutter på **/exec**.

---

## Trin 5 – Send adresse og nøgle til telefonen

1. Find nøglen i regnearket under **CTS → 2. Vis API-nøgle**.
2. Send **både** URL'en fra trin 4 og nøglen til dig selv, fx i en mail fra CTS-Gmailen eller med AirDrop til Noter. Slet beskeden, når de er indtastet i appen.

---

## Trin 6 – Læg appen på iPhonens hjemmeskærm

1. Åbn **Safari** på iPhonen og gå til **https://ctsdk.github.io/cts-app/**
2. Tryk på **Del**-knappen (firkant med pil op) og vælg **Føj til hjemmeskærm** → **Tilføj**.
3. Åbn appen fra **ikonet** på hjemmeskærmen, ikke fra Safari.
4. Tryk på **Indstillinger** nederst på forsiden. Indsæt adresse og nøgle og tryk **Gem og test forbindelse**.
5. Der skal stå **✓ Forbundet til "cts-app"**.

---

## Trin 7 – Test med batch 261028

1. **Registrér nyt køb**: Købsdato **28-10-2026**, samlet pris **600**.
2. Indtast sættene **10271, 10295, 41711, 41714**, alle med **OVP**. Navnene skal dukke op under hvert nummer.
3. Tryk **Færdig – til værdier**. Alle fire skal stå som *Ikke offentliggjort*.
4. Indtast værdier: **45 / 75 / 40 / 55 €**, og vælg en kilde for hvert sæt.
5. Facit for købspris: **125,58 / 209,30 / 111,63 / 153,49 kr**, i alt **600,00 kr ✓**.
6. Tryk **Gem i Sheets**. Tjek bagefter i regnearket, at fanen Indkøb viser de samme tal, og at SKU'erne er `261028-10271` osv.
7. På **Klargør**-siden:
   - Tryk **Start kamera**. iPhonen spørger om lov til kameraet. Tryk **Tillad**.
   - Tag 2–3 fotos med **Tag foto**. De sendes ét ad gangen, og under hvert foto står **.01.jpg**, **.02.jpg** osv.
   - Virker live-kameraet ikke, så brug knappen **Tag foto med telefonens kamera** og skriv til Claude, hvad der skete.
   - Sæt **Stand**, sæt flueben i **Sorteret**, og tryk **Klar til salg**.
8. Tjek i Drive, at fotoene ligger i **CTS/Test/261028-10271/**.
9. Åbn **Lager** i appen og prøv søgning og filtre.

Send Claude en kort melding om hvert punkt: virkede / virkede ikke, gerne med skærmbillede.

---

## Når scriptet opdateres senere

Claude giver dig besked, når der er en ny version af `Code.gs`. Så gør du sådan her:

1. Sæt den nye kode ind som i trin 2 og gem.
2. Vælg **Implementer → Administrer implementeringer** → klik på **blyanten** → under **Version** vælger du **Ny version** → **Implementer**.

Adressen forbliver den samme, så du skal ikke ændre noget i appen.
