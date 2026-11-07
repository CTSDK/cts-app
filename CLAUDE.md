# CTS – hovednote (læses først, hver gang)

Ejer: Thomas, **Copenhagen Treasures & Services (CTS)**, Danmark. **Sprog i svar og app: dansk.**
Thomas koder ikke selv: forklar i almindeligt dansk, ét trin ad gangen, med præcise klik. Korte, direkte svar.

## Områder – find den rigtige note
| Område | Hvad | Note |
|---|---|---|
| **Lego** | Køb, klargøring, lager, salg af LEGO. CTS-appen + regnearket *cts-app* | `docs/noter/lego.md` |
| **Retro Design** | Salg af andre ting end LEGO – håndteres anderledes. Ikke beskrevet endnu | `docs/noter/retro.md` |
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
Drive-mappe **CTS/Noter** (kopi af noterne): id `1dCTDB4xGkJTLc7bL156aiNAGqDjHkxJ0`. Ved opdatering: læg den nye fil op og flyt den gamle med samme navn til papirkurven (ingen dubletter).
- ✓ Læse/skrive celler, oprette/slette faner og rækker. ✓ Søge, oprette, omdøbe, flytte filer i Drive.
- ✗ Apps Script-koden kan ikke opdateres via forbindelsen – Thomas kopierer koden ind.
- Flag-emojis ser forkerte ud, når Claude læser Docs via forbindelsen – de er rigtige i dokumentet.

## Næste (rækkefølge aftalt 07-11-2026)
1. ✅ Noterne delt op (denne fil + docs/noter/).
2. ✅ Bygget (v15, testet i simulering, ikke på iPhone endnu): Hjem = **områdevalg** (Lego · Retro Design · Økonomi). Lego → alt det nuværende. Retro/Økonomi "kommer senere".
3. Bilag/fakturaer → forslag til salg i appen: plan godkendt i hovedtræk 07-11 (se okonomi.md). Afventer: bilagsnummer-afklaring, GLS-eksempel.
4. Bagefter: Økonomi og Retro Design, ét område ad gangen.
