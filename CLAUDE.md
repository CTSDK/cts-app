# CTS – hovednote (læses først, hver gang)

Ejer: Thomas, **Copenhagen Treasures & Services (CTS)**, Danmark. **Sprog i svar og app: dansk.**
Thomas koder ikke selv: forklar i almindeligt dansk, ét trin ad gangen, med præcise klik. Korte, direkte svar.

## Områder – find den rigtige note
| Område | Hvad | Note |
|---|---|---|
| **Lego** | Køb, klargøring, lager, salg af LEGO. CTS-appen + regnearket *cts-app* | `docs/noter/lego.md` |
| **Retro Design** | Salg af andre ting end LEGO – håndteres anderledes. Ikke beskrevet endnu | `docs/noter/retro.md` |
| *Vejledning* | Sådan arbejder Thomas med Claude (start, afslut, hukommelse) | `docs/SAADAN.md` |
| **Økonomi** | Overordnet for hele CTS: Lego + Retro + andre udgifter (Claude, emballage, Excel …), skat | `docs/noter/okonomi.md` |

Thomas skriver bare, hvad dagen handler om. Claude er hovedagent: læser hovednoten + områdets note og laver opgaven.
Store, opdelelige opgaver kan sendes til hjælpe-agenter (de læser samme noter). Små skridt laves direkte.

## Arbejdsregler (Thomas)
- **Alle spørgsmål samlet FØR der bygges.** Ikke gæt-og-flag bagefter. Diskutér muligheder før der bygges.
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
- **Vi bliver i samme samtale.** Thomas skal ikke starte nye samtaler eller flytte noget.
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
- **Gmail (CTS-kontoen ctsdanmark@gmail.com):** ✓ forbundet 07-11 og virker i denne samtale (søgning testet). Kun til CTS – Thomas har givet lov til at Claude læser den.
  Thomas' private mail er t.clifford.pejtersen@gmail.com – derfra videresender han bilag (fx CoolRunner-mail 07-11, tråd-id 1a1b5f1995767b0a, ikke læst endnu).
- ✓ Læse/skrive celler, oprette/slette faner og rækker. ✓ Søge, oprette, omdøbe, flytte filer i Drive.
- ✗ Apps Script-koden kan ikke opdateres via forbindelsen – Thomas kopierer koden ind.
- Flag-emojis ser forkerte ud, når Claude læser Docs via forbindelsen – de er rigtige i dokumentet.

## Næste (pr. 08-11-2026)
1. **Løbende bilag:** nyt i `Bilag/Indbakke` (Gmail → Gem bilag, eller direkte i Drive) → Claude laver Bilagsplan → Thomas kører Udfør bilagsplan.
2. **Thomas:** vælg Område (Lego/Retro Design/Fælles/Privat) for gamle bilag i CTS Økonomi → Bilag; 2 manglende San Martino-kvitteringer.
3. **Byg (Økonomi):** "Bilag → forslag i appen" + kolonne Q Sporingsnr i Salg 2026 (plan i okonomi.md).
4. Bagefter: Retro Design.

## Status pr. 08-11-2026
- ✅ **CTS Økonomi** (eget regneark, id `1hZYLXBu1lneLP0l5JD09HI2ah1_-k4sZSxRDi-HtxLM`): Overblik, Bilag (196), Udgifter, Skat, Kontoplan, Bilagsplan.
  Flyttet fra Lego-arket 08-11, tal tjekket ens. Lego-arket = priser/lager/salg.
- ✅ Maskinrum 2.1.1 hos Thomas (bilagsplan → også fanen Bilag; MobilePay-PDF'er gemmes). App v16 (fotos 3000 px / 92 %).
- ✅ Alle salg 2026 har bilagsnr (næste B169; 2025 næste B029). eBay sep+okt afstemt.
- ✅ Noter kopieres til Drive CTS/Noter hver nat. Gmail-forbindelse til CTS-kontoen virker.
