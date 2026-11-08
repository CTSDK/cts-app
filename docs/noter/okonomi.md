# Område: Økonomi (overordnet for hele CTS)

Status pr. 08-11-2026: **økonomi-arket "CTS Økonomi" kører** (maskinrum 2.1.1 hos Thomas). 196 bilag. Bilag og fragt kører.

## Sådan er det nu
- **CTS Økonomi** (id `1hZYLXBu1lneLP0l5JD09HI2ah1_-k4sZSxRDi-HtxLM`, mappe `CTS/Økonomi`): Overblik, Bilag, Udgifter 2025/2026, Skat 2025/2026,
  Kontoplan, Bilagsplan + skjulte "Salg 2025/2026" (IMPORTRANGE fra Lego-arket, så Skat/Udgifter-formlerne virker uændret; adgang givet 08-11).
  Flyttet 08-11; tallene tjekket ens (2026 forskel = B133 kørsel 385,32, som kun står i økonomi-arket). Arkets id står i Script Properties (OEKONOMI_ID).
- **Lego-arket cts-app** beholder Indkøb, Indkøbslog, Salg 2025/2026 (bilagsnr i P), Lager, DB, DB Salgspriser, eBay-afstemning (lager). Salgsdato = betalingsdato.
- **Fanen Bilag:** én række pr. bilag (Bilagsnr, År, Dato, Type, Konto, Kontonavn, Modpart, Beløb, Valuta, Beløb DKK, Moms, Skattepligtigt, Område,
  Kobling, Fil-link, Note). 193 bilag pr. 08-11. Gamle journal-bilag har Område "Ukendt" – Thomas vælger Lego/Retro Design/Fælles/Privat (nogle er Retro).
- **Plan (Thomas' tegning):** Økonomi samler Lego, Retro Design og andre udgifter (Claude, emballage, Excel). CTS er ét firma (CVR kommer) → én skatteopgørelse.
- **Moms:** CTS er ikke momsregistreret → hele beløbet inkl. moms er udgiften. Købsmoms bygges til, når CTS bliver momsregistreret.

## Bilag i Drive: `CTS/Økonomi/Bilag`
- `Indbakke` (17xqS57VoqpSHcmY0AuKGmouoCnRiR-t7): alt nyt lander her (Thomas' eBay-PDF'er + maskinrummets fragtbilag). Tom pr. 07-11.
- `2025` (1tAEpFv5WH62PRmJEO4n_kpGLFBl1Olou) og `2026` (1PaUb_K1AwHbSDeC3A9VNOauzqLzJhoZR), hver med Salg, Fragt, Udgifter, eBay-rapporter (afregningsbilag slettet 08-11 – bruges ikke)
  + Bilagsjournal <år>.csv (gammel journal – kun arkiv). 2025 har også `Privat før CTS` (fragt før 07-07-2025, intet nr).
  2026 Fragt 12itNKTOELmSr1TNIQR3V2oy4NRPLzLAE · 2026 Salg 1wsJRYQnIQpmh5jCKQxhDnqRcqEB1gRST · 2025 Fragt 1pFhj2wAjespGcBo43wHQM_qs7WT41xfq.
- Gamle bilag (før 07-11) har gamle navne (`2026-09-02 - 3030 - CoolRunner Latina IT - 191,53 DKK.pdf`). Nye: **bilagsnr forrest**,
  fx `B159 261012 Fragt CoolRunner 000110673818 01-15293-04134.pdf`, `B155 261009 eBay 01-15293-04134 251001-6695.pdf`.
- **Dokumentation til et bilag** (fx DBA-/Messenger-samtale om et køb): samme bilagsnr, filnavn `B166 260916 Varekøb DBA-tråd.pdf`, samme mappe.
  Thomas laver hele samtalen som én PDF med Chrome-udvidelsen **GoFullPage** (virker, testet af Thomas 08-11) og lægger den direkte i Drive Indbakke.
- **Vi starter på en frisk (Thomas 08-11):** den gamle Claudes regler (Bilagssystem, afregningsbilag osv.) gælder IKKE. Gamle filer bevares kun som arkiv.
- **Varekøb dokumenteres med:** (1) betalingskvitteringen (fx MobilePay) og (2) samtalen om købet (DBA/Messenger, én PDF via GoFullPage) – samme bilagsnr.
- **Intet CVR-nummer endnu** → køb og salg er Thomas' private. Når CTS ApS oprettes med CVR, sælger Thomas det resterende lager direkte til CTS ApS.

## Bilagsnumre
- **B001, B002 …, én serie pr. år, starter forfra.** Fælles for salg, fragt, udgifter, varekøb. Salg: kolonne P (fx "B155, B159" = eBay + fragt). Udgifter: kolonne A.
- 2025: B001–B028 brugt → næste **B029**. 2026: B001–B168 brugt (B166–B168 = MobilePay-varekøb 260916/261015/261028 + samtaler, ✅ udført 08-11) → næste **B169**. Alle salg 2026 har bilagsnr (pr. 07-11).
- Uafklaret: kalenderår eller regnskabsår (spørg revisor).

## Sådan arbejder vi (testet 07-11)
0. **Andre bilag (2.1.1, ✅ testet 08-11):** mails fra Thomas' private mail med PDF/billede (fx MobilePay-kvittering, emne "Lego køb 261028") gemmes som
   `<emne>.pdf` i Indbakke af samme menupunkt. Findes uden etiket (sidste 120 dage); gemte beskeder huskes i Script Properties (ANDRE_BILAG_GEMT).
   PDF'er tages fra den rå mail (iPhone lægger dem ind i mailen). 2.0/2.1.0 gemte dem ikke (fejl rettet 08-11).
1. **Fragt:** Thomas videresender CoolRunner/GLS-mails til CTS-Gmailen → **CTS → Gem bilag fra Gmail** gemmer dem i Indbakke og sætter etiketten
   *CTS/Bilag behandlet*. CoolRunner-mail → PDF; GLS → faktura-PDF. Labels gemmes ikke. Tryk kun én gang (1.8.1 forhindrer dobbeltkørsel).
2. **eBay:** Thomas gemmer hver ordreside ("Einzelheiten zum Kauf") som PDF i Indbakke, navn "eBay <ordrenr>.pdf".
3. **Claude** (via hjælper) kobler bilag ↔ salg (sporingsnr/by/dato/beløb), fjerner dubletter, foreslår numre → skriver planen i **økonomi-arkets Bilagsplan**
   (A Bilagsnr, B Fil-id, C Nyt filnavn, D Mappe-id, E Celle fx "Salg 2026!P111" eller "Udgifter 2026!A18", F Status (tom), G Dato ÅÅÅÅ-MM-DD,
   H Type, I Konto, J Modpart, K Beløb, L Valuta, M Område, N Note) med ét kald.
4. **Thomas** godkender én gang og kører **CTS → Udfør bilagsplan**: omdøber, flytter, fletter numre ind i cellerne (Lego- eller økonomi-arket), skriver "OK"
   og (fra 2.1.0) tilføjer bilaget i fanen Bilag. Kan køres igen.
5. **Månedlig:** eBays månedsoversigt ("<Mon> 2026 statement.pdf") → `Bilag/<år>/eBay-rapporter` → afstemning mod Salg-fanen (sep+okt 2026 gjort 07-11).
- **Udgifter: skriv ALDRIG i D, H og K** (regnes af formlen i række 2 – en værdi dér stopper hele kolonnen; skete 07-11, rettet 08-11).
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
- Thomas gennemgår Område i fanen Bilag (gamle bilag "Ukendt").
- **Bilag → forslag i appen** (plan, ikke bygget): maskinrummet læser Indbakke selv og viser forslag i appen, som Thomas godkender.
  Salg 2026 skal have kolonne Q "Sporingsnr" (Thomas' ja 07-11, ikke lavet).
- Videresendelse fra Thomas' private mail til CTS-Gmailen automatisk (senere).
