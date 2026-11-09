# Tutorial: Sådan hænger Lego-setuppet sammen

*En forklaring fra bunden af de dele, som Lego-arbejdet bygger på, og af hvordan de arbejder sammen.*

---

## Før du starter: hvad tutorialen handler om

Lego-arbejdet består af **fem dele**, der hver har sin opgave:

1. **Appen på telefonen**: der hvor du registrerer køb, tager fotos og registrerer salg.
2. **GitHub**: der hvor appens kode og noterne opbevares, og hvor appen bliver gjort tilgængelig på nettet.
3. **Google Drive**: firmaets "skab i skyen" med mapper til fotos og dokumenter.
4. **Google Sheets** (regnearket): firmaets "kartotek", hvor alle sæt, køb og salg står.
5. **Maskinrummet**: et lille program, der sidder fast på regnearket. Det modtager alt fra appen og skriver det de rigtige steder.

Ved siden af de fem dele står **Claude**. Claude bygger og retter de fire første dele, slår op og hjælper med at holde orden, men er ikke selv en del af den daglige drift.

Tutorialen forklarer hver del for sig, først helt grundlæggende og derefter mere konkret. Til sidst følger vi ét Lego-sæt hele vejen fra køb til salg, så du kan se, hvordan delene arbejder sammen.

Nye ord er skrevet med **fed**, første gang de bruges, og forklares med det samme. Bagerst er der en ordliste.

---

## Del 1 – Det store billede

### 1.1 En sammenligning: en lille butik

Forestil dig en lille butik:

- **Ekspedienten** står ude foran og tager imod varer og kunder. Det er **appen** på telefonen.
- **Kartoteket** bag disken har et kort for hver vare: hvad den er, hvad den kostede, og om den er solgt. Det er **regnearket**.
- **Lageret** bagved er der, hvor tingene og billederne af dem ligger. Det er **Google Drive**.
- **Kontormedarbejderen** i baglokalet tager sedlerne fra ekspedienten og fører dem ind i kartoteket og på lageret. Det er **maskinrummet**.
- **Tegnestuen** opbevarer tegningerne til, hvordan butikken er bygget og indrettet. Det er **GitHub**.
- **Håndværkeren og rådgiveren** ændrer indretningen efter tegningerne, hjælper med at holde orden og slår op i kartoteket. Det er **Claude**.

### 1.2 Tegningen

```
        ┌────────────────────┐
        │  APPEN (telefonen) │   ← her arbejder du til daglig
        └─────────┬──────────┘
                  │  sender og henter data over internettet
                  ▼          (kræver hemmelig nøgle)
        ┌────────────────────┐
        │   MASKINRUMMET     │   ← lille program, der sidder på regnearket
        └────┬──────────┬────┘
             │          │
             ▼          ▼
   ┌──────────────┐  ┌──────────────┐
   │  REGNEARKET  │  │ GOOGLE DRIVE │
   │ (kartoteket) │  │ (fotos, docs)│
   └──────────────┘  └──────────────┘

        ┌────────────────────┐
        │      GITHUB        │   ← opbevarer appens kode, maskinrummets kode og noterne
        └────────────────────┘     og viser appen på nettet

        ┌────────────────────┐
        │      CLAUDE        │   ← retter koden i GitHub, læser/skriver i regnearket
        └────────────────────┘     og i Drive (efter dit ja), læser noterne
```

Den vigtigste pointe: **appen taler aldrig direkte med regnearket.** Den taler med maskinrummet, og det er maskinrummet, der skriver i regnearket og lægger fotos i Drive.

---

## Del 2 – GitHub: hvor koden og noterne bor

### 2.1 Hvad er "kode"?

Et program, fx en app, er i bund og grund **tekst**: instruktioner skrevet i et sprog, som en computer forstår. Den tekst kaldes **kode**. Koden ligger i almindelige tekstfiler, ligesom et Word-dokument bare er tekst med formatering.

Appen på din telefon er en lille samling af den slags filer. Maskinrummet er én stor fil med kode.

### 2.2 Hvad er GitHub?

**GitHub** er en hjemmeside (en tjeneste på internettet), hvor man opbevarer kode og andre tekstfiler. Man kan sammenligne det med Google Drive, men det er specielt lavet til kode og kan tre ting, som Drive ikke kan:

1. Det husker **hver eneste ændring**, der nogensinde er lavet, og hvem der lavede den.
2. Man kan altid gå tilbage til en tidligere udgave.
3. Det kan gøre koden til en hjemmeside, som alle kan åbne (se 2.6).

### 2.3 Hvad er et repository?

Et **repository** (udtales "ri-PÅ-si-to-ri", på dansk "depot" og ofte forkortet **repo**) er **én projektmappe på GitHub**. Den indeholder alle filerne til ét projekt plus hele historikken over, hvordan filerne har ændret sig.

Vi har ét repository til appen. Det indeholder:

| Mappe / fil | Hvad det er |
|---|---|
| Appens filer (`index.html`, mapperne `css` og `js`) | Selve appen: hvordan den ser ud (`css`), og hvad den gør (`js`) |
| Mappen `apps-script` | Maskinrummets kode (én fil) |
| Hovednoten (`CLAUDE.md`) og mappen `docs/noter` | Noterne, dvs. Claudes "hukommelse" (se del 6) |
| Mappen `tests` | Små prøveprogrammer, der tjekker, at appen regner rigtigt |
| Mappen `icons` | Appens ikoner og logo |

Der ligger **ingen data** i repositoryet: ingen sæt, priser, fotos eller nøgler. Alt det ligger hos Google.

### 2.4 Hvad er en commit?

Hver gang Claude har ændret noget og gemmer det på GitHub, sker det som en **commit**. Det er et **øjebliksbillede** af ændringen med en kort besked om, hvad der er lavet, fx *"Retter datofeltet i Nyt køb"*.

Sammenligning: det svarer til at gemme et dokument som "version 2", "version 3" osv. og skrive en seddel på hver om, hvad der blev ændret. Commits stables oven på hinanden og danner historikken.

At **pushe** betyder at sende sine commits op til GitHub, så de ligger i skyen og ikke kun på den computer, hvor ændringen blev lavet.

### 2.5 Hvad er en branch?

En **branch** (på dansk "gren") er en **parallel udgave** af projektet.

- Hovedgrenen hedder **main**. Det er den "rigtige" udgave, som appen på din telefon bygger på.
- Når Claude arbejder på noget nyt, kan det ske på en sidegren. Så kan man arbejde og prøve ting af uden at røre den udgave, der er i brug.
- Når arbejdet er færdigt og godkendt, **flettes** sidegrenen ind i main. Først da kommer ændringen ud til appen.

Sammenligning: main er den trykte udgave af en bog, og en branch er et kladdehæfte ved siden af. Kladden bliver først til bogen, når man er tilfreds.

### 2.6 GitHub Pages: sådan kommer appen på nettet

**GitHub Pages** er en gratis funktion i GitHub. Den tager filerne i repositoryet og viser dem som en **hjemmeside** med en fast adresse.

Det er sådan, appen kommer ud til din telefon:

1. Claude ændrer appens filer og gemmer dem i main.
2. GitHub Pages opdaterer hjemmesiden af sig selv (det tager 1–2 minutter).
3. Næste gang appen på telefonen åbnes med net, henter den den nye udgave.

Den gratis udgave af GitHub Pages kræver, at repositoryet er **offentligt**, dvs. at alle i princippet kan se filerne. Det er i orden, fordi der ingen data eller nøgler ligger i det. Det er også derfor, reglen er: **ingen data, nøgler eller regnearksfiler i GitHub**.

### 2.7 Maskinrummets kode ligger også på GitHub, men kører hos Google

Maskinrummets kode **gemmes** på GitHub (så historikken er der), men den **kører** hos Google. Når der er en ny udgave, skal den derfor kopieres over til Google i hånden. Claude kan ikke selv gøre det. Det beskrives i del 4.5.

---

## Del 3 – Google-delen: Drive og regnearket

### 3.1 Firmaets Google-konto

Alt hos Google ligger under **firmaets egen Google-konto**, adskilt fra din private. Det er den konto, der:

- ejer mapperne i Drive og regnearket,
- "er" maskinrummet (maskinrummet handler på kontoens vegne),
- og som Claude har fået lov til at arbejde i.

### 3.2 Hvad er Google Drive?

**Google Drive** er en **harddisk i skyen**: mapper og filer, som ligger hos Google i stedet for på din computer. Du kan nå dem fra computer, telefon eller hvor som helst med net.

Hver fil og mappe i Drive har et **id**: en lang, unik kode af bogstaver og tal, som en slags cpr-nummer for filen. Navnet kan ændres, men id'et er det samme for altid. Maskinrummet og Claude finder filerne via deres id.

### 3.3 Mapperne til Lego

```
Firmaets hovedmappe
├── Lego-regnearket                       ← kartoteket (se 3.4)
├── Lager                                 ← fotos af alle sæt
│   ├── 261028                            ← én mappe pr. køb (købsdato ÅÅMMDD)
│   │   ├── 261028-10271.01.jpg           ← foto 1 af sættet
│   │   ├── 261028-10271.02.jpg           ← foto 2 af sættet
│   │   └── 261028 Listings               ← Google-dokument med annoncetekster
│   └── …
├── Import-fotos                          ← gamle fotos fra før appen (til sortering)
├── Logo                                  ← logofiler
└── Noter                                 ← læse-kopi af noterne (opdateres hver nat)
```

**Vigtigt:** maskinrummet finder mappen **Lager** ved at kigge "ved siden af" regnearket. Derfor må **regnearket ikke flyttes** til en anden mappe, uden at koden ændres først.

### 3.4 Hvad er Google Sheets, og hvad er et regneark?

**Google Sheets** er Googles regnearksprogram, ligesom Excel, men i skyen. Et **regneark** er en fil med rækker og kolonner. Hvert lille felt kaldes en **celle** og har en adresse ud fra kolonnens bogstav og rækkens nummer, fx **B3** = kolonne B, række 3.

Et regneark kan have flere **faner** (kaldes også ark). De ligger som faneblade nederst på skærmen, og hver fane er en side for sig.

### 3.5 Fanerne i Lego-regnearket

| Fane | Hvad den indeholder |
|---|---|
| **Indkøb** | Én række pr. sæt, du har købt: SKU, købsdato, sætnummer, navn, værdi, købspris, stand, OVP, fotos, klar, lagerstatus, salgsdato, salgspris, noter m.m. |
| **Indkøbslog** | Én række pr. **køb** (ét køb kan rumme mange sæt): dato, samlet pris, skattepligt, noter og fotomappens id |
| **Salg 2025 / Salg 2026** | Én række pr. solgt sæt: dato, platform, køber, priser, fragt, gebyr, fortjeneste, bilagsnummer |
| **Lager** | Oversigt over det, der er på lager |
| **DB** | **Databasen** over LEGO-sæt: sætnummer, navn, tema, undertema og år. Appen slår op her, når du skriver et sætnummer |
| **DB Salgspriser** | Dine egne tidligere salgspriser pr. sæt, som bruges til at foreslå en værdi |
| **eBay-afstemning, Kontrol m.fl.** | Hjælpefaner til at tjekke, at tallene stemmer |

**Hvad er en database?** En **database** er bare en ordnet samling af oplysninger, som man kan slå op i, ligesom en telefonbog. Fanen DB er vores "telefonbog" over LEGO-sæt.

### 3.6 Formler: de kolonner, man ikke skriver i

En **formel** er en lille regneopskrift i en celle, fx "læg købsprisen og fragten sammen". Cellen viser resultatet, ikke opskriften.

I Lego-regnearket står formlerne i **overskriftsrækken øverst** og regner **hele kolonnen** ud på én gang. For eksempel bliver navnet på sættet slået op i DB automatisk, og købsprisen fordeles automatisk.

**Regel:** skriv aldrig selv noget i en formelkolonne. En værdi skrevet i hånden stopper formlen for resten af kolonnen. I Indkøb er det fx kolonnerne **A (SKU), D (Navn), F (Købspris) og N (Lagerstatus)**.

### 3.7 SKU: sættets personnummer

En **SKU** (fra engelsk *Stock Keeping Unit*, "lagervareenhed") er et **unikt nummer for hver enkelt vare på lager**. To ens sæt har samme sætnummer, men forskellig SKU.

Vores SKU er bygget sådan: **købsdato (ÅÅMMDD) + bindestreg + sætnummer**.

- Eksempel: `261028-10271` = sæt 10271, købt 28-10-2026.
- Er der to ens sæt i samme køb, får de **-a** og **-b**: `261028-10271-a` og `261028-10271-b`.
- Fotos navngives efter SKU'en plus et løbenummer: `261028-10271.01.jpg`, `.02.jpg` osv.

Fordi SKU'en indeholder købsdatoen, kan man altid se, hvilket køb og hvilken fotomappe sættet hører til.

### 3.8 Hvordan købsprisen fordeles

Et køb har én samlet pris, fx 600 kr for fire sæt. Den deles ikke ligeligt. Den fordeles efter **værdien** af hvert sæt (den pris i €, sættet forventes at kunne sælges for). Et sæt, der er dobbelt så meget værd, får dobbelt så stor en del af købsprisen.

Købspriserne er **dynamiske**: tilføjer eller fjerner du et sæt fra et køb, fordeles prisen forfra.

---

## Del 4 – Maskinrummet (Google Apps Script)

### 4.1 Hvad er Apps Script?

**Google Apps Script** er Googles eget værktøj til at lave små programmer, der arbejder **inde i** Google: i regneark, Drive, Gmail og Docs. Programmet sidder fast på et bestemt regneark, ligesom en makro i Excel, og kan gøre alt det, firmaets Google-konto må.

Vores Apps Script-program kalder vi **maskinrummet**, fordi det er det, der får tingene til at køre i baggrunden. Koden ligger i én fil, der hedder **Code.gs**.

Du finder det i regnearket under **Udvidelser → Apps Script**.

### 4.2 Hvad maskinrummet gør

- **Modtager alt fra appen**: nye køb, fotos, klargøring og salg. Det skriver dem i regnearket og lægger fotos i den rigtige mappe i Drive.
- **Sender data til appen**: DB, lageret og salgspriserne, så appen kan slå op (også uden net, se del 5).
- **Laver annoncetekster**: et Google-dokument med titler og beskrivelser på tysk og engelsk for et køb.
- **Lægger en egen menu ind i regnearket** med knapper til opgaver, der skal udføres på kommando (se 4.4).
- **Kører automatiske opgaver** på faste tidspunkter (se 4.6).

### 4.3 Hvordan appen taler med maskinrummet: webapp, adresse og nøgle

For at appen kan "ringe" til maskinrummet over internettet, er maskinrummet udgivet som en **webapp**. Det betyder, at det har fået sin egen **internetadresse**. Den adresse slutter på `/exec`.

- **Adressen** er som maskinrummets telefonnummer. Den står i appen under **Mere → Indstillinger**.
- **API-nøglen** er en lang hemmelig kode, som appen sender med hvert opkald. Maskinrummet tjekker koden og **afviser alle opkald uden den rigtige nøgle**. (**API** betyder "programmernes måde at tale sammen på", og en API-nøgle er altså adgangskoden til den samtale.)
- **"Udfør som: Mig"** betyder, at maskinrummet altid arbejder som firmaets Google-konto, uanset hvem der ringer. **"Adgang: Alle"** betyder, at alle kan *ringe* til adressen, men uden nøglen bliver der ikke svaret.

Nøglen findes i regnearkets egen menu under **Vis API-nøgle**. Adressen findes i Apps Script under **Implementer → Administrer implementeringer**. Del aldrig nøglen med nogen.

### 4.4 Den egne menu i regnearket

Når regnearket åbnes, lægger maskinrummet en ekstra menu ind øverst, til højre for **Hjælp**. De vigtigste punkter for Lego:

| Menupunkt | Hvad det gør | Hvor ofte |
|---|---|---|
| **Lav listings for et køb** | Laver/opdaterer annoncedokumentet for et køb | Ved behov (kan også gøres fra appen) |
| **Fjern fotos af solgte sæt** | Rydder fotos af solgte sæt ud af Drive | Når du vil rydde op |
| **Sortér alle køb i nummerorden** | Sorterer alle køb efter sætnummer | Sjældent (sker ellers automatisk) |
| **Vis API-nøgle** | Viser nøglen, som appen skal bruge | Når appen skal sættes op igen |
| **Opdatér formler (bevarer data)** | Skriver formlerne i overskriftsrækken forfra | Når Claude beder om det |
| **Tjek opsætning** | Tjekker, at faner og mapper er i orden | Ved fejlfinding |
| **Lav ny API-nøgle** | Laver en ny nøgle. Den gamle holder op med at virke | Kun hvis nøglen er blevet kendt af andre |
| **Kopiér noter til Drive** | Kopierer noterne fra GitHub til Drive med det samme | Når det haster (sker ellers hver nat) |
| **Sortér gamle fotos / valgliste / flyt valgte** | Værktøjer til de gamle fotos fra før appen | Sjældent |
| **Importér fra Excel (sletter alt)** | Engangsflytningen fra det gamle Excel-ark | **Aldrig mere.** Den sletter alt |

Første gang et menupunkt bruges, beder Google om lov ("Godkendelse påkrævet"). Det er firmaets eget program, så det er i orden at give lov.

### 4.5 Når der kommer en ny udgave af maskinrummet

Claude kan ændre maskinrummets kode på GitHub, men **kan ikke selv lægge den ind hos Google**. Det gør du med de samme faste trin hver gang:

1. Åbn linket, som Claude giver (den rå kode på GitHub).
2. Tryk **Ctrl+Shift+R** for at være sikker på at se den nyeste udgave, og tjek versionsnummeret øverst.
3. **Ctrl+A** (markér alt) → **Ctrl+C** (kopiér) → gå til Apps Script → **Ctrl+A** → **Ctrl+V** (sæt ind) → **Ctrl+S** (gem).
4. **Implementer → Administrer implementeringer → blyanten → Version: Ny version → Implementer.**
5. Test eventuelt det, der er ændret.

Hvorfor trin 4? En **implementering** er den udgave af koden, som appen ringer til. Gemmer man bare (trin 3), bruger regnearkets menu den nye kode, men appen taler stadig med den gamle, indtil man laver en ny version. Adressen forbliver den samme, så der skal ikke ændres noget i appen.

Er ændringen kun i menuen, er trin 3 nok.

### 4.6 De automatiske processer

Nogle ting sker af sig selv. I Apps Script kaldes det en **trigger** (på dansk "udløser"): en indstilling om, at en bestemt del af koden skal køre på et bestemt tidspunkt eller ved en bestemt hændelse.

| Hvad | Hvornår | Hvorfor |
|---|---|---|
| **Noterne kopieres fra GitHub til Drive** | Hver nat ca. kl. 3 | Så du altid har en læsbar kopi i Drive-mappen Noter, og en sikkerhedskopi |
| **Menuen lægges ind** | Hver gang regnearket åbnes | Så menuen altid er der |
| **Store opgaver fortsætter i bidder** (fx sortering af mange gamle fotos) | Ét minut efter, at en bid er færdig | Google tillader kun, at et program kører ca. 6 minutter ad gangen. Store opgaver deles derfor op og starter sig selv igen |

---

## Del 5 – Appen på telefonen

### 5.1 Hvad er en webapp?

Der er to slags apps:

- **Almindelige apps** hentes i App Store.
- **Webapps** er hjemmesider, der opfører sig som apps.

Vores app er en **webapp**. Den er en hjemmeside (fra GitHub Pages), som du har lagt på iPhonens hjemmeskærm via Safari → **Del → Føj til hjemmeskærm**. Når du åbner den fra ikonet, ser den ud og opfører sig som en rigtig app, uden adresselinje.

Fordelen er, at den ikke skal godkendes af Apple, og at en ny udgave kommer ud i det øjeblik, Claude har lagt den på GitHub.

### 5.2 Offline: når der ikke er net

Appen virker også uden net, fx i en kælder eller hos en sælger. To ting gør det muligt:

1. **Service worker** er et lille stykke kode, der gemmer appens egne filer på telefonen, så appen kan starte uden net.
2. **Lokalt lager på telefonen.** Appen gemmer en **kopi** af DB, salgspriserne og lageret, hver gang der er net. Alt, hvad du laver uden net, lægges i en **udbakke**.

**Udbakken** fungerer som udbakken i en mail: alt, hvad du gør (nyt køb, fotos, klargøring, salg), lægges først i kø på telefonen og sendes til maskinrummet **i rækkefølge**, så snart der er net. En mørk bjælke øverst viser fx *"Offline · 12 venter på net"*. Fejler noget hos Google, står det med rødt under **Mere → Venter på at blive sendt** med knapperne **Prøv igen** og **Slet**.

**Vigtigt:**

- Åbn appen **med net mindst én gang**, før du tager den med et sted uden net. Så har den en frisk kopi.
- **Sletter du appen fra hjemmeskærmen, slettes dens lager**: adressen, nøglen **og udbakken**. Tjek derfor altid, at der står **"Alt er sendt"** under Mere, før du sletter appen.

### 5.3 Når appen bliver opdateret

Telefonen holder fast i den gamle udgave et stykke tid (det er service workeren, der passer på den). Gør sådan for at få den nye:

1. Luk appen **helt** (stryg den væk i app-oversigten).
2. Åbn den igen med net.
3. Gentag én gang til.

Versionsnummeret står nederst under **Mere**. Claude fortæller, hvilket nummer du skal se.

### 5.4 Rundtur i appen (Lego)

- **Hjem**: vælg område. Lego fører til Lego-forsiden.
- **Nyt køb**: registrér et køb i tre trin: købsdato og samlet pris → sætnumre (navnet dukker op fra DB) → værdier og kilde. Appen viser købsprisfordelingen.
- **Klargør**: for hvert sæt: live-kamera med beskæring, stand (1–10), OVP, sorteret, komplet, vejledning, noter og "Klar til salg". Her kan du også **tilføje, rette og fjerne** sæt i købet og **lave listings** (annoncetekster).
- **Lager**: søg på nummer, navn eller tema, og filtrér på Alle, Klar, Ikke klar og På eBay. Sorteret efter sætnummer. Solgte sæt vises ikke.
- **Salg**: registrér et salg: dato, platform, køber, SKU, pris, fragt og gebyr. Appen viser en anslået fortjeneste.
- **Mere**: versionsnummer, udbakken ("Venter på at blive sendt") og **Indstillinger** (adresse og nøgle).

**Testtilstand:** tilføjer man `?mock=1` efter appens adresse, kører appen med opdigtede data og skriver intet i regnearket. Den bruges til at prøve ting af. En gul bjælke viser, at det er testtilstand.

---

## Del 6 – Claude: hvordan Claude er en del af processen

### 6.1 Hvad er Claude, og hvor arbejder Claude?

**Claude** er en AI-assistent, dvs. et computerprogram, der kan læse, skrive, forstå almindeligt sprog og skrive kode. Du taler med Claude i **Claude-appen** under **Code**.

Når du starter en samtale med projektet valgt, sker der følgende:

1. Der startes en **midlertidig computer i skyen** (en "container") kun til den samtale.
2. Repositoryet fra GitHub **kopieres** ned på den computer. Det kaldes at **klone**.
3. Claude læser **hovednoten** og den relevante **områdenote** og ved derefter, hvor I slap.
4. Når samtalen er slut, **slettes** den midlertidige computer. Kun det, der er gemt på GitHub eller hos Google, overlever.

Det er derfor, alt vigtigt skal stå i noterne og være sendt til GitHub, før samtalen slutter.

### 6.2 Noterne er Claudes hukommelse

Claude husker **ikke** tidligere samtaler. Det eneste, der går fra én samtale til den næste, er **noterne** i repositoryet:

- **Hovednoten** (`CLAUDE.md`): firmaet, arbejdsreglerne, forbindelserne og hvad der er næste. Den læses automatisk hver gang.
- **Områdenoten for Lego** (`docs/noter/lego.md`): hvordan appen, regnearket og maskinrummet er skruet sammen lige nu, regler og beslutninger, og hvad der er næste i Lego.
- **Vejledningen** (`docs/SAADAN.md`): hvordan du arbejder med Claude.

Noterne beskriver kun, hvordan det **er nu**, og hvad der er **næste**. Gammel historik slettes, så de ikke vokser sig store.

Når du skriver **"afslut"**, kører en fast rutine: Claude opdaterer noterne, gemmer dem på GitHub og giver dig en kort opsummering. Om natten kopierer maskinrummet noterne til Drive-mappen **Noter**, så du kan læse dem dér. Ret ikke i Drive-kopien, for den bliver overskrevet. Bed Claude rette originalen.

Efter hver "afslut" startes en **ny samtale**. Det sparer forbrug, fordi en ny samtale starter med en tom hukommelse og kun læser noterne.

### 6.3 Claudes forbindelser (connectors)

En **connector** (på dansk "forbindelse") er en tilladelse, der giver Claude adgang til en bestemt tjeneste på firmaets vegne. Claude har disse forbindelser:

| Forbindelse | Hvad Claude kan | Hvad Claude ikke kan |
|---|---|---|
| **GitHub** | Læse og ændre appens kode, maskinrummets kode og noterne. Gemme (commit) og sende (push) | — |
| **Google Sheets** | Læse og skrive i celler, oprette/slette faner og rækker | — |
| **Google Drive** | Søge, oprette, omdøbe og flytte filer og mapper | — |
| **Apps Script** | — | **Lægge ny maskinrumskode ind.** Det gør du (del 4.5) |

### 6.4 Hvem gør hvad i en typisk ændring

Sådan forløber det, når appen skal have en ny funktion:

1. **Du** beskriver i almindeligt dansk, hvad du ønsker.
2. **Claude** stiller **alle spørgsmål først**, før der bygges noget.
3. **Claude** ændrer koden og afprøver den på den midlertidige computer: kører prøveprogrammerne i `tests` og prøver appen i testtilstand i en indbygget browser.
4. **Claude** gemmer på GitHub. Er det app-kode, kommer den ud via GitHub Pages. Er det maskinrumskode, giver Claude dig linket.
5. **Du** opdaterer (lukker appen to gange, og/eller lægger maskinrumskoden ind) og prøver det af i virkeligheden.
6. Først når **du** har prøvet det, kaldes det **testet**. Indtil da er det kun **bygget**.

### 6.5 Arbejdsreglerne kort

- **Alle spørgsmål samlet først.** Ikke gæt og ret bagefter.
- **Planlagt, bygget og testet er tre forskellige ting.** Claude påstår ikke, at noget virker, før det er prøvet hos dig.
- **Ingen fakta fra hukommelsen i data.** Sætnavn, tema og år skrives kun ind, hvis du har givet dem, eller de kommer fra et opslag, hvor kilden vises.
- **Før Claude skriver i regnearket**, ser du præcis hvad, og Claude venter på dit ja.
- **Én godkendelse pr. opgave**: Claude samler alt i ét forslag, du siger ja én gang, og så udføres det hele.
- **Hjælpe-agenter**: store opslag eller meget læsning (fx gennemgang af mange rækker) sendes til en "hjælper", der arbejder for sig selv og kun sender resultatet tilbage. Så fyldes hovedsamtalens hukommelse ikke op.

---

## Del 7 – Et Lego-sæt fra køb til salg

Her følger vi ét sæt hele vejen og ser, hvilken del der gør hvad.

### Trin 1 – Du køber et parti LEGO

Du køber fire sæt for 600 kr den 28-10-2026.

**I appen:** Nyt køb → dato 28-10-2026, pris 600 → sætnumre 10271, 10295, 41711, 41714 → værdier i € → **Gem**.

**Bag kulisserne:**
1. Appen slår navnene op i sin lokale kopi af **DB**.
2. Købet lægges i **udbakken** og sendes til **maskinrummet** (med nøglen).
3. Maskinrummet skriver én række i **Indkøbslog** og fire rækker i **Indkøb** med SKU'erne `261028-10271` osv.
4. Maskinrummet opretter mappen **Lager/261028** i **Drive** og skriver mappens id i Indkøbslog.
5. **Formlerne** i regnearket fordeler de 600 kr efter værdi og slår navnene op.

Står et sætnummer ikke i DB, kan du trykke **Tilføj til DB** og skrive navn, tema og år, fx fra et opslag. Så lægger maskinrummet det ind i fanen DB.

### Trin 2 – Du klargør sættet

**I appen:** åbn sættet → **Start kamera** → tag fotos og beskær → stand, OVP, sorteret, noter → **Klar til salg**.

**Bag kulisserne:**
1. Hvert foto gøres til en JPG-fil (3000 punkter bred, høj kvalitet) og lægges i **udbakken**.
2. Maskinrummet gemmer fotoet som `261028-10271.01.jpg` i mappen **Lager/261028** i Drive.
3. Maskinrummet skriver stand, OVP, klar osv. i sættets række i **Indkøb**.
4. Når alle sæt i købet er klar (eller solgt), regnes købet som **lukket**.

### Trin 3 – Du laver annoncen

**I appen:** **Lav listings for købet**.

**Bag kulisserne:** Maskinrummet laver Google-dokumentet **"261028 Listings"** i købsmappen med titel, tilstandsbeskrivelse og beskrivelse på **tysk og engelsk** for alle sæt, der er klar, ikke solgt og ikke listet. Teksterne bygges **kun ud fra fakta** i regnearket (ingen AI), og noterne oversættes med Google Oversæt.

Du kopierer teksterne over i eBay (eller med **Kopiér** i appen) og sætter flueben i **Listet på eBay**.

### Trin 4 – Sættet bliver solgt

**I appen:** **Salg** → dato, platform, køber, SKU, pris, fragt, gebyr → **Gem salg**.

**Bag kulisserne:**
1. Maskinrummet tjekker, at SKU'en findes i **Indkøb** og ikke allerede er solgt, og skriver salget i fanen **Salg 2026**.
2. **Formlen** i Indkøbs kolonne Lagerstatus ser salget og skifter sættet til solgt. Sættet forsvinder derefter fra **Lager** i appen.
3. Fotos af solgte sæt bliver liggende, indtil du bruger menupunktet **Fjern fotos af solgte sæt**.

### Trin 5 – Claude hjælper med at holde orden

Undervejs kan Claude slå op i regnearket (fx *"hvilke sæt fra køb 261028 er ikke klar?"*), finde uoverensstemmelser og foreslå rettelser. Rettelser skrives først, når du har sagt ja til præcis det, der skal skrives.

---

## Del 8 – Gode råd og fejlfinding

### 8.1 Det man aldrig gør

- **Deler** regnearket eller mapperne med "alle med linket".
- **Flytter** regnearket til en anden mappe (maskinrummet finder så ikke Lager).
- **Skriver** i formelkolonner (A, D, F og N i Indkøb).
- **Sletter** appen fra hjemmeskærmen uden først at tjekke "Alt er sendt".
- **Bruger** "Importér fra Excel (sletter alt)".
- **Lægger** nøgler, adgangskoder eller data på GitHub.

### 8.2 Når noget driller

| Problem | Gør sådan |
|---|---|
| Appen viser en gammel udgave | Luk appen helt og åbn den igen, to gange. Tjek versionen under Mere |
| Bjælken siger, at noget venter på at blive sendt | Sørg for net, og vent. Står noget med rødt under Mere → Venter: tryk **Prøv igen** eller send et skærmbillede til Claude |
| Appen kan ikke få forbindelse | Mere → Indstillinger → **Gem og test forbindelse**. Står adresse og nøgle der stadig? |
| Menuen i regnearket mangler | Genindlæs regnearket med **Ctrl+Shift+R** og vent et par sekunder |
| Ny maskinrums-funktion virker ikke i appen | Er trin 4 (**Ny version**) i del 4.5 glemt? |
| Kameraet bliver afvist | iPhone: Indstillinger → Apps → Safari → Kamera → **Tillad**. Luk appen helt og åbn igen |
| Samtalen med Claude er væk | Start en ny i Claude-appen → Code, med projektet valgt, og skriv *"Læs CLAUDE.md og fortsæt."* |

---

## Ordliste

| Ord | Betydning |
|---|---|
| **API** | Måden, to programmer taler sammen på. Her: appen og maskinrummet |
| **API-nøgle** | Hemmelig kode, som appen sender med hvert opkald, så maskinrummet ved, at det er os |
| **Apps Script** | Googles værktøj til små programmer inde i Google (regneark, Drive …). Vores hedder maskinrummet |
| **Branch (gren)** | En parallel udgave af projektet på GitHub. Hovedgrenen hedder **main** |
| **Celle** | Ét felt i et regneark, fx B3 |
| **Claude** | AI-assistenten, der bygger, retter og slår op |
| **Clone (klone)** | At kopiere et repository fra GitHub ned på en computer |
| **Code.gs** | Filen med maskinrummets kode |
| **Commit** | Et gemt øjebliksbillede af en ændring, med en kort beskrivelse |
| **Connector (forbindelse)** | En tilladelse, der giver Claude adgang til en tjeneste, fx Sheets |
| **Container** | Den midlertidige computer i skyen, som Claude arbejder på i én samtale |
| **Database (DB)** | Ordnet samling af oplysninger. Her: fanen med alle LEGO-sæt |
| **Fane** | Én side i et regneark (fanebladene nederst) |
| **Formel** | Regneopskrift i en celle. Her står de i overskriftsrækken og regner hele kolonnen |
| **GitHub** | Tjeneste på nettet, der opbevarer kode og husker alle ændringer |
| **GitHub Pages** | Gratis funktion, der viser filerne i et repository som en hjemmeside. Det er sådan appen kommer på nettet |
| **Google Drive** | Harddisk i skyen med mapper og filer |
| **Google Sheets** | Googles regnearksprogram |
| **Id** | Unik kode for en fil eller mappe i Drive. Ændres aldrig, heller ikke når navnet ændres |
| **Implementering** | Den udgave af maskinrummet, som appen ringer til. Opdateres med **Ny version** |
| **Kode** | Tekst med instruktioner, som en computer kan udføre |
| **Listing** | Annoncetekst til eBay (titel, tilstand, beskrivelse) |
| **main** | Hovedgrenen på GitHub, dvs. den udgave, der er i brug |
| **Maskinrummet** | Vores Apps Script-program, der forbinder appen med regnearket og Drive |
| **Mock / testtilstand** | Appen med opdigtede data (`?mock=1`), der ikke skriver i regnearket |
| **Noter** | Tekstfilerne på GitHub, der er Claudes hukommelse fra samtale til samtale |
| **Offline** | Uden internetforbindelse |
| **OVP** | Original-Verpackung: sættet har sin originale æske |
| **Push** | At sende sine commits op til GitHub |
| **Repository (repo)** | Én projektmappe på GitHub med alle filer og hele historikken |
| **Service worker** | Lille stykke kode, der gemmer appen på telefonen, så den kan starte uden net |
| **SKU** | Unikt lagernummer for hver enkelt vare. Her: købsdato-sætnummer, fx 261028-10271 |
| **Trigger (udløser)** | Indstilling om, at kode skal køre automatisk på et bestemt tidspunkt |
| **Udbakke** | Kø på telefonen med det, der venter på at blive sendt til maskinrummet |
| **Webapp** | En hjemmeside, der opfører sig som en app, og som ligger på hjemmeskærmen |
