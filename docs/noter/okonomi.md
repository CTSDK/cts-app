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

## Bilagsnumre (besluttet af Thomas 07-11)
- Format **B001, B002 …**, **én serie pr. år, starter forfra** (som den gamle Claudes system). Fælles serie for salg, fragt, udgifter, varekøb.
- 2025: B001–B019. 2026: B001–B133 brugt (gammel journal: B132 = varekøb fra privat 06-09, B133 = kørsel 06-09, ikke bogført)
  → **næste er B134**. Kalenderår eller regnskabsår: uafklaret (spørg revisor).
- Hvert salg har typisk to bilag i Salg-fanen kolonne P: eBay-ordren + fragtfakturaen, fx "B125, B130". Udgifter: bilagsnr i kolonne A.
- Sidste salg med bilagsnr: 03-09-2026. Salgene 27-09 → 09-10 har intet bilagsnr endnu.

## Gammel bilagsmappe (Drive: "Gammelt CTS Regnskab - Skal slettes efter brug")
- Gennemgået 07-11. Ca. 160 rigtige bilag (2025/2026), 14 afregningsbilag + skabelon, Bilagsjournal 2025/2026.csv (nøgle bilagsnr ↔ fil, med sporings-/ordrenr),
  kørselsregnskaber, 2025-perioderapporter. Regler stod i Bilagssystem.md (fx ét bilag = én PDF, gem i 5 år, køb fra private kræver afregningsbilag).
- **Thomas' ja 07-11:** bilag, afregningsbilag og journaler flyttes til `CTS/Økonomi/Bilag/2025|2026` (gamle filnavne beholdes); resten slettes. **Ikke gjort endnu.**

## Månedlig dobbelttjek mod eBay (besluttet 07-11)
- Thomas lægger **hvert salg op som PDF** (eBay-ordreside) → salget registreres med SKU (vigtigt for lageret).
- Hver måned: eBays månedsoversigt ("<Mon> 2026 statement.pdf") gemmes i `CTS/Økonomi/Bilag/<år>/eBay-rapporter` og afstemmes mod Salg-fanen.
- Afstemning sep+okt 2026 (07-11): alt passer undtagen **3 manglende salg** (eBay-ordre 01-15293-04134 sæt 6695, 17-15260-01184 sæt 6929,
  08-15271-75175 sæt 6806/6678/6017/6630/6532) – Thomas lægger PDF'erne op. Ordrenr skrevet i kolonne O for Feucht, Frederiksberg, Bovolone, Münster.
- Delvise refusioner står nogle gange netto uden kolonne J – Thomas: lad det være.
- Filerne "Sep/Oct 2026 statement.pdf" ligger i `CTS/` indtil Bilag-mapperne oprettes.

## Bilag → forslag til salg (plan, godkendt i hovedtræk af Thomas 07-11 – IKKE bygget)
- **Salg 2026 får ny kolonne Q "Sporingsnr"** (ja 07-11). Fragtbilag = PDF af mailen. Første omgang: fragtmails + eBay-PDF (GLS senere).
- **Mapper:** `CTS/Økonomi/Bilag/Indbakke` (alt nyt lander her) og `CTS/Økonomi/Bilag/<år>/Salg | Fragt | Udgifter | eBay-rapporter`.
- **Filnavne (ja 07-11, bilagsnr forrest):** `B134 251009 eBay 20-15256-09193 251009-6041.pdf`, `B135 251012 Fragt CoolRunner 000110671492 20-15256-09193.pdf`.
- **Forløb:** maskinrummet tjekker Indbakke hver dag → læser bilaget (billed-PDF via Google Drive OCR, mails som tekst) → **forslag i appen**,
  som Thomas godkender eller retter → salget registreres, bilaget omdøbes, flyttes og bilagsnr skrives i Salg kolonne P.
- **Kobling:** fragtfaktura ↔ salg via **sporingsnummeret** (står både i eBay-ordren og hos CoolRunner, fx JJD149990200062288889).
- **eBay:** salgsmailen indeholder ingen data → Thomas gemmer ordresiden ("Einzelheiten zum Kauf" i Verkäufer-Cockpit) som PDF.
  Den indeholder ordrenr, salgsdato, SKU, varepris, fragt, gebyr, køber (by, land) og sporingsnr.
- **Fragt:** CoolRunner og GLS sender mails til Thomas' private mail → han videresender (senere automatisk) til CTS-Gmailen; maskinrummet læser mailene (GmailApp).
  Claude har også Gmail-forbindelse til CTS-kontoen (07-11). Første videresendte CoolRunner-mail ligger der (ikke læst endnu).
  CoolRunner-mailen (læst 07-11) har dato, ordrenr, sporingsnr, pris ekskl./inkl. moms – ingen PDF vedhæftet. GLS-eksempel mangler.
- **Månedlig:** eBays salgsrapport i Indbakke → afstemning mod registrerede salg (fanen eBay-afstemning findes).
- Eksempelbilag ligger i `CTS/`: "eBay 20-15256-09193.pdf" og "Coolrunner 000110671492.pdf" (begge billed-PDF'er).

## Forslag: dobbelttjek af årets fragtmails og opbevaring (ikke besluttet)
- Thomas videresender alle årets CoolRunner/GLS-mails til CTS-Gmailen. Maskinrummet (eller en hjælpe-agent) læser dem og laver en liste:
  sporingsnr, dato, beløb → matches mod Salg 2026 (udgift fragt). Resultat: liste over salg uden fragtbilag, beløb der ikke passer, og fragt uden salg.
- **Opbevaring:** selve mailen bliver i Gmail med etiketten **CTS/Bilag behandlet**; kvitteringen gemmes som PDF i `Bilag/<år>/Fragt` med fast filnavn
  og bilagsnr. Intet gemmes to steder ud over det.
