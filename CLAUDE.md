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

## Næste (pr. 07-11-2026)
1. **Gamle bilag (Thomas):** lægger den gamle bilagsmappe (lavet af den gamle Claude) i en **midlertidig** Drive-mappe, fx `CTS/Økonomi/Gamle bilag (midlertidig)`.
   Claude (via hjælper) gennemgår og fortæller hvad der er → Thomas beslutter, hvad der bruges → resten slettes. Intet rod må blive liggende.
2. **GLS (Thomas):** videresender en GLS-mail til CTS-Gmailen.
3. **Claude:** læs den videresendte CoolRunner-mail (tråd 1a1b5f1995767b0a) → byg "Bilag → forslag til salg" (plan i okonomi.md).
4. **Årets fragtmails (senere):** Thomas videresender alle årets CoolRunner/GLS-mails → dobbelttjek mod Salg 2026 (se okonomi.md).
5. Bagefter: Økonomi og Retro Design, ét område ad gangen.

## Status pr. 07-11-2026
- ✅ Testet på iPhone: Hjem = områdevalg (Lego · Retro Design · Økonomi); Lego → alt det hidtidige. (App v15.)
- ✅ Noter delt op (hovednote + lego/retro/okonomi + vejledning docs/SAADAN.md). Afslut-rutine: `.claude/commands/afslut.md`.
- ✅ Testet: maskinrum 1.7.0 – noterne kopieres til Drive CTS/Noter (kørt af Thomas 07-11, natlig kopi slået til).
- ✅ Gmail-forbindelse til CTS-kontoen virker.
