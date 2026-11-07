# Område: Økonomi (overordnet for hele CTS)

Status pr. 07-11-2026: **planlagt, ikke bygget.**

## Sådan er det nu
- Udgifter og skat ligger i Lego-regnearket **cts-app**: fanerne Udgifter 2025/2026, Skat 2025/2026, Kontoplan, eBay-afstemning.
- Salg 2025/2026 (kun Lego) ligger også dér.

## Plan (Thomas' tegning 07-11)
- Økonomi står øverst og samler: **Lego**, **Retro Design** og **andre udgifter** (fx Claude, emballage, Excel).
- CTS er ét firma (CVR-nummer kommer) → én samlet skatteopgørelse.
- Udgifter/Skat flyttes på sigt fra Lego-regnearket op i et fælles økonomi-ark. Separat opgave – aftales først.

## Moms
CTS er ikke momsregistreret endnu → hele beløbet inkl. moms er udgiften (fx fragt 144,63 kr). Når CTS bliver momsregistreret, skal købsmoms
kunne trækkes fra – bygges til, når vi kommer dertil.

## Bilagsnumre (fundet i regnearket 07-11)
- Format **B001, B002 …**, fælles serie for salg og udgifter. Udgifter 2025 bruger B006–B019; Udgifter 2026 bruger B001–B127
  (B001 = 01-07-2026, B028 = 27-06-2026). Det er **uafklaret**, om serien starter forfra pr. kalenderår eller pr. regnskabsår – spørg Thomas/revisor.
- Hvert salg har typisk to bilag i Salg-fanen kolonne P: eBay-ordren + fragtfakturaen, fx "B125, B130".
- Højeste brugte nummer i 2026: **B131** → næste er **B132** (salget 251009-6041 fra 06-11 har endnu intet bilagsnr).
- Udgifter: bilagsnr i Udgifter-fanen kolonne A.

## Bilag → forslag til salg (plan, godkendt i hovedtræk af Thomas 07-11 – IKKE bygget)
- **Mapper:** `CTS/Økonomi/Bilag/Indbakke` (alt nyt lander her) og `CTS/Økonomi/Bilag/<år>/Salg | Fragt | Udgifter | eBay-rapporter`.
- **Filnavne:** `B132 251009 eBay 20-15256-09193 251009-6041.pdf`, `B133 251012 Fragt CoolRunner 000110671492 20-15256-09193.pdf`.
- **Forløb:** maskinrummet tjekker Indbakke hver dag → læser bilaget (billed-PDF via Google Drive OCR, mails som tekst) → **forslag i appen**,
  som Thomas godkender eller retter → salget registreres, bilaget omdøbes, flyttes og bilagsnr skrives i Salg kolonne P.
- **Kobling:** fragtfaktura ↔ salg via **sporingsnummeret** (står både i eBay-ordren og hos CoolRunner, fx JJD149990200062288889).
- **eBay:** salgsmailen indeholder ingen data → Thomas gemmer ordresiden ("Einzelheiten zum Kauf" i Verkäufer-Cockpit) som PDF.
  Den indeholder ordrenr, salgsdato, SKU, varepris, fragt, gebyr, køber (by, land) og sporingsnr.
- **Fragt:** CoolRunner og GLS sender mails til Thomas' private mail → han videresender (senere automatisk) til CTS-Gmailen; maskinrummet læser mailene (GmailApp).
  Claude har også Gmail-forbindelse til CTS-kontoen (07-11). Første videresendte CoolRunner-mail ligger der (ikke læst endnu).
  CoolRunner-mailen indeholder ordrenr, dato, sporingsnr, pris ekskl./inkl. moms. GLS-eksempel mangler. Gamle bilag (lavet af den gamle Claude) skal kopieres til Drive, så navngivning/numre kan tjekkes.
- **Månedlig:** eBays salgsrapport i Indbakke → afstemning mod registrerede salg (fanen eBay-afstemning findes).
- Eksempelbilag ligger i `CTS/`: "eBay 20-15256-09193.pdf" og "Coolrunner 000110671492.pdf" (begge billed-PDF'er).
