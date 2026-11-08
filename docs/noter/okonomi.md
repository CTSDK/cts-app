# Område: Økonomi (overordnet for hele CTS)

Status pr. 07-11-2026: **bilag og fragt kører** (maskinrum 1.9.0). Fælles økonomi-ark: planlagt, ikke bygget.

## Sådan er det nu
- Udgifter og skat ligger i Lego-regnearket **cts-app**: fanerne Udgifter 2025/2026, Skat 2025/2026, Kontoplan, eBay-afstemning, **Bilagsplan**.
- Salg 2025/2026 (kun Lego) ligger også dér. Salgsdato = datoen kunden betalte.
- **Plan (Thomas' tegning):** Økonomi samler Lego, Retro Design og andre udgifter (Claude, emballage, Excel). CTS er ét firma (CVR kommer) → én skatteopgørelse.
  Udgifter/Skat flyttes på sigt op i et fælles økonomi-ark – separat opgave, aftales først.
- **Moms:** CTS er ikke momsregistreret → hele beløbet inkl. moms er udgiften. Købsmoms bygges til, når CTS bliver momsregistreret.

## Bilag i Drive: `CTS/Økonomi/Bilag`
- `Indbakke` (17xqS57VoqpSHcmY0AuKGmouoCnRiR-t7): alt nyt lander her (Thomas' eBay-PDF'er + maskinrummets fragtbilag). Tom pr. 07-11.
- `2025` (1tAEpFv5WH62PRmJEO4n_kpGLFBl1Olou) og `2026` (1PaUb_K1AwHbSDeC3A9VNOauzqLzJhoZR), hver med Salg, Fragt, Udgifter, eBay-rapporter, Afregningsbilag
  + Bilagsjournal <år>.csv (gammel journal fra den tidligere Claude; filnavn-kolonnen peger på gamle stier). 2025 har også `Privat før CTS` (fragt før 07-07-2025, intet nr).
  2026 Fragt 12itNKTOELmSr1TNIQR3V2oy4NRPLzLAE · 2026 Salg 1wsJRYQnIQpmh5jCKQxhDnqRcqEB1gRST · 2025 Fragt 1pFhj2wAjespGcBo43wHQM_qs7WT41xfq.
- Gamle bilag (før 07-11) har gamle navne (`2026-09-02 - 3030 - CoolRunner Latina IT - 191,53 DKK.pdf`). Nye: **bilagsnr forrest**,
  fx `B159 261012 Fragt CoolRunner 000110673818 01-15293-04134.pdf`, `B155 261009 eBay 01-15293-04134 251001-6695.pdf`.
- Regler (fra gammelt Bilagssystem): ét bilag = én PDF; gem i 5 år; køb fra private kræver afregningsbilag (skabelon i Bilag-roden);
  eBay-månedsrapport/trackingside er ikke bilag alene.

## Bilagsnumre
- **B001, B002 …, én serie pr. år, starter forfra.** Fælles for salg, fragt, udgifter, varekøb. Salg: kolonne P (fx "B155, B159" = eBay + fragt). Udgifter: kolonne A.
- 2025: B001–B028 brugt → næste **B029**. 2026: B001–B165 brugt → næste **B166**. Alle salg 2026 har bilagsnr (pr. 07-11).
- Uafklaret: kalenderår eller regnskabsår (spørg revisor).

## Sådan arbejder vi (testet 07-11)
0. **Andre bilag (1.10.0, bygget 08-11, ikke testet):** mails fra Thomas' private mail med PDF/billede (fx MobilePay-kvittering, emne "Lego køb 261028")
   gemmes som `<emne>.pdf` i Indbakke af samme menupunkt (nu "Gem bilag fra Gmail (fragt + andre)").
1. **Fragt:** Thomas videresender CoolRunner/GLS-mails til CTS-Gmailen → **CTS → Gem bilag fra Gmail** gemmer dem i Indbakke og sætter etiketten
   *CTS/Bilag behandlet*. CoolRunner-mail → PDF; GLS → faktura-PDF. Labels gemmes ikke. Tryk kun én gang (1.8.1 forhindrer dobbeltkørsel).
2. **eBay:** Thomas gemmer hver ordreside ("Einzelheiten zum Kauf") som PDF i Indbakke, navn "eBay <ordrenr>.pdf".
3. **Claude** (via hjælper) kobler bilag ↔ salg (sporingsnr/by/dato/beløb), fjerner dubletter, foreslår numre → skriver planen i fanen **Bilagsplan**
   (A Bilagsnr, B Fil-id, C Nyt filnavn, D Mappe-id, E Celle, F Status) med ét kald.
4. **Thomas** godkender én gang og kører **CTS → Udfør bilagsplan** (1.9.0): omdøber, flytter, fletter numre ind i cellerne, skriver "OK". Kan køres igen.
5. **Månedlig:** eBays månedsoversigt ("<Mon> 2026 statement.pdf") → `Bilag/<år>/eBay-rapporter` → afstemning mod Salg-fanen (sep+okt 2026 gjort 07-11).
- Returfragt (pakke ikke afhentet) lægges til det oprindelige salgs Udgift Fragt i samme år; ellers i Udgifter (konto 3030). Fx Bielefeld 06-08-2026 F = 317,81;
  Brünzow-retur 07-02-2026 = Udgifter 2026 række 18 (B136).
- Delvise refusioner = som regel fragt refunderet ved køb i flere omgange. Står nogle gange netto uden kolonne J – Thomas: lad det være.

## Åbne punkter (Thomas tjekker)
- ✅ Afklaret 08-11: Feucht 6083 = 260217-6083-1 (eneste i Indkøb; "-1" er sætnummerets version, ikke a/b). 6846/6881 = 260906 (solgt før de blev gjort klar –
  det sker: en kunde spørger til et sæt, der lige er kommet hjem). Amöneburg: 6678-a og 6630-a er rigtige (B er på lager).
- **San Martino jan. 2026:** 3 salg à 169,85 (P167–169), kun 1 CoolRunner-kvittering (B135 på P168 – gæt). 2 kvitteringer mangler (Thomas' private mail?).
- **CoolRunner-mail 08-09-2026:** pakke ikke hentet 17.–26. aug., på vej retur → der kan komme en returregning.
- Siltakylä 2025: 3 GLS-ordrer på 3 ens salgsrækker – fordelingen er vilkårlig (private, før CTS).

## Næste i Økonomi
- **Økonomi-arket "CTS Økonomi"** (Thomas' ja 08-11; maskinrum 2.0.0 bygget 08-11, IKKE kørt hos Thomas endnu):
  1. CTS → **Opret økonomi-ark** opretter arket i `CTS/Økonomi` med Overblik, Bilag, Udgifter 2025/2026 (+ B133 kørsel 385,32 kr), Skat 2025/2026,
     Kontoplan (+ 1010/1020/2010/9010), Bilagsplan (kopieret, med kolonne G–N: dato, type, konto, modpart, beløb, valuta, område, note)
     og skjulte "Salg 2025/2026" (IMPORTRANGE fra Lego-arket, så Skat/Udgifter-formlerne virker uændret). Arkets id gemmes i Script Properties (OEKONOMI_ID).
  2. Thomas klikker Overblik B3 → "Tillad adgang" (IMPORTRANGE).
  3. CTS → **Afslut flytning** sammenligner Udgifter Q3 og Skat B18 i begge ark (2026 forventet forskel = B133) → ved ja slettes Udgifter, Skat,
     Kontoplan og Bilagsplan i Lego-arket. eBay-afstemning bliver i Lego-arket (lager).
  - Fanen Bilag: gammel journal (Område "Ukendt" – Thomas gennemgår; nogle er Retro Design) + nye bilag fra Bilagsplan (Område Lego).
  - Efter flytningen skriver Claude bilagsplaner i økonomi-arkets Bilagsplan; Udfør bilagsplan finder selv celler i begge ark.
- MobilePay-kvitteringer for køb 260916, 261015, 261028 ligger i CTS-Gmailen → gemmes med 1.10.0 → bilagsnr (varekøb) i fanen Bilag.
- **Bilag → forslag i appen** (plan, ikke bygget): maskinrummet læser Indbakke selv og viser forslag i appen, som Thomas godkender.
  Salg 2026 skal have kolonne Q "Sporingsnr" (Thomas' ja 07-11, ikke lavet).
- Videresendelse fra Thomas' private mail til CTS-Gmailen automatisk (senere).
