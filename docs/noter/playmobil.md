# Område: Playmobil

Eget område, ikke Lego. Kører ikke gennem CTS-appen eller Lego-arket *cts-app*.

## Sæt 5142 Prinsesseslot – sortering af dele (startet 14-11-2026)
Formål: tjekke at alle dele er der, ud fra manualens stykliste.

### Hvor det ligger
- **Drive-mappe CTS/Playmobil:** id `1GMWYxrs8T8cvRCSUxSWs5MaaExXHgxXQ`.
- **Regneark "Playmobil 5142 Prinsesseslot"** (den eneste kilde): `1m1KBMvgFHQnmQqJ6DmQbCkDBkqTSPqL2OFjGOIHsq6s`, fane **Dele** (sheetId 449130092).
  - Række 1: søgefelt **B1** (gult), C1 = antal træf. Række 2–12: op til 10 træf med link "Gå til". Række 1–13 er frosset.
  - Række 13 = overskrift. **Række 14–188 = de 175 varenumre**, sorteret efter varenr.
  - Kolonner: A Varenr. · B Del · C Skal være · **D Fundet** · E Mangler (formel) · **F ✓** (afkrydsningsfelt) · G Side · H skjult hjælpekolonne.
  - Arket er dansk (formler bruger `;`). Afkrydsede rækker er grønne, og søgetræf er gule og fede.
  - Søgeregel: små bogstaver og ingen mellemrum, leder i varenr.+del (så "30 22 9002", "229002", "9002" og "guld" alle virker).
- **Sorteringsside (ny, 14-11):** https://claude.ai/artifact/4epV2FkKY4MBv1NZ76kbq9. Den læser og skriver arket via Google Sheets-forbindelsen
  (get_values A14:G188, update_values D{række} og F{række}). Søg øverst, træf lige under, −/+/talfelt/✓, filtre Alle/Mangler/Afkrydset.
  **Bygget, ikke testet.** Thomas skal åbne den i claude.ai (CTS-kontoen), trykke Tillad og prøve +/✓, og derefter tjekke arket.
- Gammel sorteringsside fra chatten (https://claude.ai/artifact/22aHokqH6ji8CA7AxWrxPx, database `parts`): **urørt, bruges ikke**.
  Den kan slettes, når den nye side virker. Det gamle Claude Sheets-regneark bruges heller ikke.
- Manual-PDF (kun billeder, ingen tekst): https://playmobil.scene7.com/is/content/Playmobil/5142pdf.pdf. Side 22–26 er styklisten, og side 21 er tilbehør.

### Beslutninger
- "Skal være" = antal af varenummeret, som manualen viser det. Et sæt/en pose tæller som 1 ("sæt med N dele" står i beskrivelsen). I alt 561 enheder på 175 numre.
- Ingen dobbelttælling: 30 22 9332, 30 28 7720 og 30 28 7730 står på både side 21 og 26 og tælles kun under side 26.
- Usikre antal: 30 22 9962 Tiara-sten = 3 (talt fra tegningen) og 30 62 7183 Kjoledele = 1 sæt. 30 22 9002 Guldkuppel = 1 (bekræftet).
- Navnene på delene er Claudes egne. Ret dem, når Thomas giver bedre navne.
- "Fundet" tomt = ikke talt (ikke 0).

### Status pr. 14-11-2026
74 af 175 numre afkrydset, 101 mangler: side 21: 8 · 22: 11 · 23: 4 · 24: 5 · 25: 22 · 26: 51.

### Sådan arbejder vi
Thomas tæller på sorteringssiden, eller skriver til Claude fx "fundet 30 22 9002: 1", "afkryds 30 25 6590" eller "mangler 2 af 30 09 6900"
(= fundet skal−2, intet kryds). Claude læser rækken i arket først, skriver D/F og bekræfter i én linje.

## Næste
1. Thomas tester den nye sorteringsside (se ovenfor). Virker den, slettes den gamle side.
2. Sortering fortsætter (101 numre).
3. Thomas har nævnt et nyt emne ("gør det samme med denne"), sandsynligvis et andet sæt. Det tages i en ny samtale med samme fremgangsmåde:
   stykliste → regneark i CTS/Playmobil → sorteringsside.
4. `synkNoter` (Code.gs linje 84) kopierer ikke playmobil.md til Drive endnu. Den kan tilføjes ved næste maskinrumsopdatering.
