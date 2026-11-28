# CTS – hovednote (læses først, hver gang)

Ejer: Thomas, **Copenhagen Treasures & Services (CTS)**, Danmark. **Sprog i svar og app: dansk.**
Thomas koder ikke selv: forklar i almindeligt dansk, ét trin ad gangen, med præcise klik. Korte, direkte svar.

## Områder – find den rigtige note
| Område | Hvad | Note |
|---|---|---|
| **Lego** | Køb, klargøring, lager, salg af LEGO. CTS-appen + regnearket *cts-app* | `docs/noter/lego.md` |
| **Retro Design** | Salg af andre ting end LEGO (brødskærere, lamper …) + **Playmobil** (børnenes gamle sæt, sorteres og sælges samlet) | `docs/noter/retro.md` |
| *Vejledning* | Sådan arbejder Thomas med Claude (start, afslut, hukommelse) | `docs/SAADAN.md` |
| **CTS Web** | Hjemmeside for hele CTS (forside + LEGO / Retro Design / Copenhagen Services), repo `CTSDK/cts-web` | `docs/noter/web.md` |
| **Økonomi** | Overordnet for hele CTS: Lego + Retro + andre udgifter (Claude, emballage, Excel …), skat | `docs/noter/okonomi.md` |

Thomas skriver bare, hvad dagen handler om. Claude er hovedagent: læser hovednoten + områdets note og laver opgaven.
Store, opdelelige opgaver kan sendes til hjælpe-agenter (de læser samme noter). Små skridt laves direkte.
**Hjælpe-agenter til læsning/opslag** (PDF'er, mails, Sheets-opslag, gennemgang) startes med `model: "sonnet"`; kode og planlægning bruger den store model.

## Arbejdsregler (Thomas)
- **Læg ALDRIG noget ud (hjemmeside/app) før Thomas har sagt "læg det ud".** **Gør præcis det, der bedes om – ikke mere** (20-11: "fjern bread slicers" ≠ fjern hele teksten).
- **Byg ALDRIG før Thomas har sagt ja** (20-11: Claude startede for tidligt). **Alle spørgsmål samlet FØR der bygges.** Ikke gæt-og-flag bagefter. Diskutér muligheder før der bygges.
- **Skeln mellem planlagt, bygget og testet.** Påstå ikke, at noget virker, før det er testet.
- **Aldrig fakta fra hukommelsen i data** (fx sætnavn/tema/år). Kun det Thomas giver, eller et opslag hvor kilden vises.
  Uoverensstemmelse → spørg før der skrives. **Før der skrives i arket: vis præcis hvad, og vent på Thomas' ja.**
- **Samme fremgangsmåde hver gang** ved ny maskinrumskode (se lego.md). Skal noget gøres anderledes: forklar hvorfor og vent på ja.
- Ingen data, nøgler eller regnearksfiler i GitHub. Rør ikke data uden aftale.
- **Én godkendelse pr. opgave:** Claude samler alt (hvad der skrives, flyttes, omdøbes, slettes) i ét samlet forslag → Thomas siger ja én gang →
  hele opgaven udføres uden flere spørgsmål. Spørg ikke igen om dele af en godkendt opgave.
- **Anbefal kun det, der virker.** Råd om programmer/apps/fremgangsmåder skal være tjekket (kilde vist) – ellers sig tydeligt "ikke tjekket".
  (08-11: Ctrl+P i Messenger gav ikke hele tråden.)
- Thomas' ASUS: F5 er lysstyrke – brug **Ctrl+Shift+R** til genindlæsning.

## Arbejdsform
- **Ny samtale efter hver "afslut" (fra 08-11, for at spare forbrug).** Noterne er overleveringen (handoff): en ny samtale læser hovednoten +
  områdets note og fortsætter derfra. Alt vigtigt skal derfor stå i noterne ved afslut. Midt i en opgave bliver vi i samme samtale.
- **Start:** Thomas skriver bare, hvad dagen handler om. Claude læser denne note + områdets note og går i gang.
- **Uddeling (sparer hukommelse):** opgaver der kræver meget læsning – store opslag i Sheets, PDF'er/billeder, gennemgang af kode,
  undersøgelser – sendes til en hjælpe-agent med hovednoten + områdets note, og kun resultatet kommer tilbage.
  Små skridt og dialog med Thomas laves direkte.
- **Afslut:** Thomas skriver **"afslut"** → fast rutine i `.claude/commands/afslut.md` (noter opdateres, GitHub + Drive, kort opsummering).
- Noterne beskriver kun, hvordan det ER nu, og hvad der er NÆSTE – forældet historik slettes ved hver afslutning.
- Slå præcist op i Sheets (små områder), ikke hele faner.

## Google-forbindelse (CTS-kontoen)
Connectors Google Drive + Google Sheets virker. Regneark **cts-app**: `1cCBaGigDN0c5UK3iIKL8GDtNKwNqVHq-PnuEclieGvw`.
Drive-mappe **CTS/Noter** (læse-kopi af noterne): id `1dCTDB4xGkJTLc7bL156aiNAGqDjHkxJ0`. Maskinrummet (1.7.0, `synkNoter`) henter noterne fra GitHub
hver nat kl. ~3 og ved CTS → Kopiér noter til Drive. Kopiér ikke noterne gennem samtalen (koster hukommelse).
- **Gmail (CTS-kontoen ctsdanmark@gmail.com):** ✓ forbundet 07-11 (søgning testet). Kun til CTS – Thomas har givet lov til at Claude læser den.
  Thomas' private mail er t.clifford.pejtersen@gmail.com – derfra videresender han bilag (fx CoolRunner-mail 07-11, tråd-id 1a1b5f1995767b0a, ikke læst endnu).
- ✓ Læse/skrive celler, oprette/slette faner og rækker. ✓ Søge, oprette, omdøbe, flytte filer i Drive.
- ✗ Apps Script-koden kan ikke opdateres via forbindelsen – Thomas kopierer koden ind.
- **Del aldrig regneark/mapper med "alle med linket"** – id'erne står på GitHub (offentligt).
- Flag-emojis ser forkerte ud, når Claude læser Docs via forbindelsen – de er rigtige i dokumentet.

## Næste (pr. 28-11-2026)
00. **Nyt LEGO (nye, forseglede sæt til videresalg) – se lego.md → "Nyt LEGO".** "Nyt LEGO køb" 97 linjer (K001–K097), **160 sæt, 59 lagernumre**.
   Maskinrum **2.6.2** ✅ indkopieret hos Thomas 28-11. Næste: Thomas videresender de **9 manglende LEGO.com-fakturaer** (ordrer i lego.md) → Claude henter PDF
   fra CTS-Gmail, laver bilag (konto 2020, **B184…**) og fylder Fakturanr. **Første køb fra appen med 2.6.2: tjek at ny række får formler i V/W og N.**
   **Fejl at undersøge:** Udfør bilagsplan tilføjer ikke rækker i fanen Bilag (27-11 og 28-11; Claude skrev B169–B183 selv). 2.6.2 viser nu
   "Fanen Bilag: X tilføjet" + grund → bed Thomas om skærmbillede ved næste kørsel. Se okonomi.md.
   Cashback 1.784,26 kr afventer (op til 12 uger) → bogføres ved udbetaling. Skat af insiderpoint: venter (Thomas 28-11) – revisor senere.
   Senere: fotos af kasser (appen), salgspriser (≥ vejl. +30 %), anslået salgspris.
0. **CTS Web:** live; 3 brugte sæt med pris + 54 nye sæt uden pris/fotos, 25 tema-cirkler (lagt ud 27-11). Næste i web.md.
1. **Lego-sortering:** app v29 ✅. Køb 261118: Thomas sorterer i appen. **Første rigtige "Færdig – overfør" mangler** – tjek Indkøb bagefter.
   App v25 (Lager: "Alle købsdatoer") ikke testet hos Thomas.
2. **Playmobil (Retro):** Lot 1 afsluttet 22-11 (ikke på eBay endnu). Resten (8 sæt) → lot 2. Måden i appen skal laves om (spørg Thomas). Se retro.md.
3. **Retro:** Thomas tester et rigtigt køb i appen → Claude tjekker "CTS Retro". Derefter Lager + annoncer. Se retro.md.
4. **Løbende bilag:** Thomas videresender til CTS-Gmail (eller lægger i Drive `CTS/Indbakke til Claude`) → Claude henter selv + laver Bilagsplan → Thomas kører Udfør bilagsplan.
5. **Thomas, når der er tid:** gamle bilag (Område) i CTS Økonomi → Bilag; 2 manglende San Martino-kvitteringer.
6. Senere: "Salg fra eBay-PDF i appen" + kolonne Q Sporingsnr (okonomi.md); webshop (web.md).
7. **Ikke hastende – repoet er offentligt:** noterne (mails, id'er, bilag/skat) kan læses af alle. Plan: noter → privat repo `cts-noter` (se tidligere aftale i git-historik 22-11).

## Status pr. 28-11-2026
- ✅ **App v30** (27-11) + **maskinrum 2.6.2** (28-11, indkopieret og versionen tjekket af Thomas). Nyt LEGO i appen testet i browser (mock); ikke testet mod rigtigt ark.
  Versionen står nederst under Mere. Appen virker på iPhone, iPad og computer (https://ctsdk.github.io/cts-app/).
- ✅ **Maskinrum** (Code.gs): Gem bilag fra Gmail, Udfør bilagsplan, økonomi-ark, Retro, Playmobil, Lego-sortering, Nyt LEGO.
- ✅ Netværk: Rebrickable (API-nøgle som netværkshemmelighed) + img.bricklink.com tilladt. Brickset-sider kan læses via web-fetch-agent.
- ✅ **CTS Økonomi** (`1hZYLXBu1lneLP0l5JD09HI2ah1_-k4sZSxRDi-HtxLM`): Overblik, Bilag (til B183), Udgifter, Skat, Kontoplan (ny konto 2020), Bilagsplan.
- ✅ Drive: `CTS/Indbakke til Claude` (flyttet/omdøbt 27-11, samme id). Claude kan selv hente bilag fra CTS-Gmailen og lægge dem i Drive.
- ✅ **CTS Retro** (`1FQh_UuorscBSh59KYfhB4x6ufyJT5nNeRyA1renVpbc`); ingen rigtige køb endnu.
- ✅ Bilagsnr: 2026 næste **B184**; 2025 næste B029.
- ✅ **CTS Web** live: https://ctsdk.github.io/cts-web/ (EN+DE). Thomas har set LEGO-siden 27-11.
- ✅ Noter kopieres til Drive CTS/Noter hver nat. Gmail-forbindelse virker.
