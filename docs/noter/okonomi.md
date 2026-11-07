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
- 2025: B001–B028 brugt (B020–B028 = fragtbilag givet 07-11; fragt fra før 07-07-2025 er privat → `Bilag/2025/Privat før CTS`, intet nr). 2026: B001–B133 brugt (gammel journal: B132 = varekøb fra privat 06-09, B133 = kørsel 06-09, ikke bogført)
  2026: B134–B162 givet 07-11 via Bilagsplan (✅ kørt af Thomas). B163–B165 (eBay Münster/Bovolone/Frederiksberg) givet 07-11. Alle salg 2026 har nu bilagsnr.
  → **næste 2026 er B166**.
  Feucht 07-10: eBay-PDF siger SKU 260217-6083-2, arket -1 – Thomas tjekker. Kalenderår eller regnskabsår: uafklaret (spørg revisor).
- Hvert salg har typisk to bilag i Salg-fanen kolonne P: eBay-ordren + fragtfakturaen, fx "B125, B130". Udgifter: bilagsnr i kolonne A.
- Sidste salg med bilagsnr: 03-09-2026. Salgene 27-09 → 09-10 har intet bilagsnr endnu.

## Gammel bilagsmappe (Drive: "Gammelt CTS Regnskab - Skal slettes efter brug")
- Gennemgået 07-11. Ca. 160 rigtige bilag (2025/2026), 14 afregningsbilag + skabelon, Bilagsjournal 2025/2026.csv (nøgle bilagsnr ↔ fil, med sporings-/ordrenr),
  kørselsregnskaber, 2025-perioderapporter. Regler stod i Bilagssystem.md (fx ét bilag = én PDF, gem i 5 år, køb fra private kræver afregningsbilag).
- **Gjort 07-11:** bilag, afregningsbilag og journaler flyttet til `CTS/Økonomi/Bilag/2025|2026` (gamle filnavne beholdt); resten i papirkurven.

## Månedlig dobbelttjek mod eBay (besluttet 07-11)
- Thomas lægger **hvert salg op som PDF** (eBay-ordreside) → salget registreres med SKU (vigtigt for lageret).
- Hver måned: eBays månedsoversigt ("<Mon> 2026 statement.pdf") gemmes i `CTS/Økonomi/Bilag/<år>/eBay-rapporter` og afstemmes mod Salg-fanen.
- Afstemning sep+okt 2026 (07-11): 3 manglende salg er nu skrevet i Salg 2026 række 5–11 (Bernstadt, Zagreb, Amöneburg) ud fra eBay-PDF'erne.
  **Tjek senere:** 250000-6678-a og 250000-6630-a er valgt (eBay-SKU var 251009-6678 / 250000-6630). Bilagsnr mangler for alle salg efter 03-09.
- Delvise refusioner = som regel fragt refunderet, når kunden har købt flere sæt i flere omgange. Står nogle gange netto uden kolonne J – Thomas: lad det være.
- "Sep/Oct 2026 statement.pdf" ligger i `Bilag/2026/eBay-rapporter`. eBay-ordre-PDF'erne ligger i Indbakke.

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

## Maskinrum 1.8.0: "Gem fragtbilag fra Gmail" (✅ testet hos Thomas 07-11: 106 gemt, 38 fandtes, 7 ikke genkendt)
- Menu CTS → **Gem fragtbilag fra Gmail**. Læser CTS-Gmailens mails med CoolRunner/GLS (også mails vedhæftet som .eml) uden etiketten
  *CTS/Bilag behandlet* → gemmer i `CTS/Økonomi/Bilag/Indbakke` (id 17xqS57VoqpSHcmY0AuKGmouoCnRiR-t7) → sætter etiketten. Sletter intet, giver ingen bilagsnr.
- CoolRunner: mailen gemmes som PDF (`CoolRunner <ordrenr> <ÅÅMMDD>.pdf`); vedhæftede PDF'er er pakkelabels og gemmes ikke.
- GLS: faktura-PDF gemmes (`GLS <ordre> faktura <nr>.pdf`), ellers mailen (`GLS <ordre> <ÅÅMMDD>.pdf`). Kreditnota: `GLS kreditnota …`.
- Testet på den rigtige CoolRunner-mail (lokalt): 68 kvitteringer → 67 unikke (én dublet). GLS-mailen kunne ikke hentes her – testes hos Thomas.
- Efter kørsel: Claude lægger dubletter af eksisterende bilag (41 kendte) i papirkurven og laver forslag til bilagsnr.
- Mappe-id'er: Økonomi 1zD9CwVndzrYoBWv_ykZ7FaGm724hiuO0, Bilag 12LuML_4mGi_0ssTv9X0HN9sxqe09OZoD, 2025 1tAEpFv5WH62PRmJEO4n_kpGLFBl1Olou, 2026 1PaUb_K1AwHbSDeC3A9VNOauzqLzJhoZR
  (hvert år: Salg, Fragt, Udgifter, eBay-rapporter, Afregningsbilag). Bilagsjournal 2026.csv peger stadig på gamle stier.
- Salgsdato = datoen kunden betalte (derfor kan fragtlabel være købt før salgsdatoen, fx Rüsselsheim 11-05/15-05).
- Returfragt (pakke ikke afhentet, sendt retur for CTS' regning) lægges til det oprindelige salgs Udgift Fragt i samme år; ellers i Udgifter (konto 3030).
  Gjort 07-11: Bielefeld 06-08-2026 F = 67,81 + 125 + 125 = 317,81; Brünzow-retur 07-02-2026 (175 kr) = Udgifter 2026 række 18 (bilagsnr mangler).

## Maskinrum 1.9.0: "Udfør bilagsplan" (✅ testet hos Thomas 07-11: 29 bilag)
- Store opgaver (omdøb/flyt filer + bilagsnr i celler) laves sådan: Claude skriver planen i fanen **Bilagsplan** (A Bilagsnr, B Fil-id, C Nyt filnavn,
  D Mappe-id, E Celle fx "Salg 2026!P111", F Status) med ét kald → Thomas kører **CTS → Udfør bilagsplan** én gang. Ingen godkendelse pr. fil.
- Rækker med tom status udføres; numre flettes ind i cellen (bevarer eksisterende, sorteret). Kan køres igen.
 og opbevaring (ikke besluttet)
- Thomas videresender alle årets CoolRunner/GLS-mails til CTS-Gmailen. Maskinrummet (eller en hjælpe-agent) læser dem og laver en liste:
  sporingsnr, dato, beløb → matches mod Salg 2026 (udgift fragt). Resultat: liste over salg uden fragtbilag, beløb der ikke passer, og fragt uden salg.
- **Opbevaring:** selve mailen bliver i Gmail med etiketten **CTS/Bilag behandlet**; kvitteringen gemmes som PDF i `Bilag/<år>/Fragt` med fast filnavn
  og bilagsnr. Intet gemmes to steder ud over det.
