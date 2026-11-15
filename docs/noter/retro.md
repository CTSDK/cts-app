# Område: Retro Design

Status pr. 08-11-2026: **trin 1 bygget og installeret hos Thomas (app v19 + maskinrum 2.2.1, arket CTS Retro oprettet). Nyt køb endnu ikke testet med et rigtigt køb.**

## Det vi ved (Thomas 08-11)
- Retro Design = **danske retro-ting, der klargøres og sælges igen**. Hører under CTS og indgår i økonomien (CTS Økonomi, Område "Retro Design").
- **Varer:** fx **brødskærere** (renoveres, males, gøres klar) og **danske retrolamper**. Kan være alt muligt.
- **Indkøb:** loppemarkeder, Den Blå Avis (DBA); evt. dødsboer senere.
- **Klargøring i hold:** fx ~20 brødskærere males på én gang; 4–6 lamper ad gangen. Fremover løbende.
- **Salg:** Catawiki og eBay.
- **Omfang:** starter stille og roligt ved siden af Lego, vokser senere.
- I appen har Retro Design sit eget felt på Hjem ("kommer senere").

## Eksempel på annonce (Thomas 08-11, engelsk)
> **Brown Raadvad 294 Bread Slicer**
> A stunning original Danish design classic, a vintage Raadvad 294 bread slicer, featuring the elegant "RAADVAD" logo on the cutting arm.
> Common, but highly desirable due to its sleek design, this model is a timeless choice for collectors and design enthusiasts alike.
- Titel = farve + mærke + model + type. Tekst = fast indledning + særlige kendetegn (fx logo) + en sætning om hvor eftertragtet modellen er.

## Beslutninger (Thomas 08-11)
- **Eget regneark "CTS Retro"** (Indkøb, Indkøbslog, Lager, Salg). Økonomien samles i CTS Økonomi (Område "Retro Design"). Lego kører for sig selv.
- **Appen:** Retro-feltet på Hjem får Nyt køb · Lager · Salg – samme måde som Lego.
- **Køb:** dato, samlet pris, én eller flere ting; prisen deles ligeligt (som Lego).
- **Felter pr. ting:** type (brødskærer, lampe, møbel, radio/tv-kabinet …), producent, designer, model, farve, særligt kendetegn, stand, udført arbejde, fotos (i appen).
- **SKU:** `R` + købsdato + mærkekode+model (+ -a/-b/-c ved flere ens i samme køb), fx `R261108-RV294-a`, `R261108-RV191`, `R261108-LAMPE-a`.
  Mærkekoden (fx RV = Raadvad) vælges første gang mærket oprettes; appen husker den.
- **Annoncer:** som Lego – overskrift + tilstand + beskrivelse, tysk + engelsk. Raadvad-eksemplet herover er skabelon for beskrivelsen.
- **Klargøringsudgifter:** (1) småting/forbrug (tape, kasser, skruer, ledning på rulle, olie) = samlet udgift i CTS Økonomi, fordeles ikke;
  (2) klargøringshold (fx maling til 20 brødskærere) = samlet pris deles ligeligt på tingene i holdet; (3) del til én bestemt ting = lægges direkte på den.
- **Senere:** møbler og gamle radio/tv-kabinetter (upcycling, maling, olie) – samme model.
- **eBay:** Thomas opretter/omdøber konti senere: én til Lego (fx "CTS Lego") og én til "CTS Retro". Indtil CVR er salg Thomas' private.
- Der ligger måske én Raadvad på eBay nu (Thomas tjekker). Ellers starter Retro, når de går rigtigt i gang.
- **Rækkefølge:** (1) regneark + Nyt køb med fotos, (2) Lager + annoncer, (3) Salg + klargøringshold.

- **Stand:** skala 1–10 som Lego, samme betegnelser i annoncen (besluttet 08-11).

## Trin 1 (bygget 08-11)
- **Maskinrum 2.2.0:** CTS → **Opret Retro-ark** laver regnearket "CTS Retro" i `CTS/Retro` (✅ oprettet af Thomas 08-11, id `1FQh_UuorscBSh59KYfhB4x6ufyJT5nNeRyA1renVpbc`; også i Script Properties RETRO_ID) med fanerne
  Indkøbslog (Købsdato ÅÅMMDD | Samlet pris | Hvor købt | Antal ting | Noter | MappeID), Indkøb (SKU | Købsdato | Type | Producent | Designer | Model |
  Farve | Særligt kendetegn | Stand 1–10 | Udført arbejde | Købspris | Fotos | Klar | Lagerstatus | Noter) og Mærker (Producent | Kode).
  Fotos: `CTS/Retro/Lager/<ÅÅMMDD>/<SKU>.NN.jpg`. API: retroMaerker, retroOpretKoeb, retroHentKoeb, retroGemTing, retroUploadFoto.
- **App v17:** Hjem → Retro Design → Registrér nyt køb (side 1: dato, pris, hvor købt, linjer type/producent/kode/model/antal, SKU vises live)
  → Klargør (designer, farve, kendetegn, stand, arbejde, noter, klar + live-kamera/fotos som Lego). Lager og Salg: "kommer senere".
- SKU-detaljer: æøå → AE/OE/AA, kun A–Z/0–9 (fx "Radio/TV-kabinet" → RADIOTVKABINET). Flere ens → -a, -b … Tilføjes en ens ting senere,
  omdøbes en enlig ting til -a (også dens fotos).
- **Tilføj til eksisterende køb:** beløbet lægges til købets samlede pris, og hele prisen fordeles igen ligeligt (bekræftet af Thomas 08-11).
- Begrænsning: appen kender kun køb lavet/hentet på telefonen; findes købsdatoen i arket fra anden enhed → fejl i udbakken.
- Tests: `node tests/retro.test.js`, `node tests/retro-e2e.js` (Playwright, mock).

## Playmobil (under Retro, fra 15-11-2026)
Børnenes gamle Playmobil. **Ingen købspris, ingen SKU.** Alle sæt sælges **samlet i ét salg**. Salgsteksten laves til sidst ud fra noterne
(kolonne I) + Thomas' input: "sæt X, Y, Z … med disse mangler – stort set alle næsten komplette". Kun noget vi har nu; evt. små mængder senere her.
- **Drive:** `CTS/Retro/Playmobil` (id `1GMWYxrs8T8cvRCSUxSWs5MaaExXHgxXQ`, flyttet fra CTS/Playmobil 15-11). Manual-PDF'er ligger hos Thomas.
- **Regneark "Playmobil alle sæt"** (eneste kilde): `1pEB0STX0_rDlWOzGswuZyo2ot3zCztb99Ezueoi1NEc`, fane **Dele** (sheetId 449130092).
  Række 1 søgefelt B1 (leder i A+B+G), række 2–12 træf, række 13 overskrift. **Række 14–393 = 380 rækker:** 3315 (14–25), 3319 (26–56),
  5135 (57–141), 5139 (142–218), 5142 (219–393); inden for sæt i samme orden som de gamle ark.
  Kolonner: A Varenr. · B Del · C Skal være · **D Fundet** · E Mangler (formel) · **F ✓** · **G Sæt · side** (fx "5142 · s.22") · H tom · **I Note**.
  Dansk ark (`;` i formler). "Fundet" tomt = ikke talt.
- 15-11: samlet fra de 4 gamle ark (5142, 5135, 5139, små sæt). Tjek i arket: 0 forskelle i A–D, F, G, I for alle rækker. Søgning testet ("5139" = 77 træf).
  De gamle ark ligger i Drive-papirkurven (kan gendannes i 30 dage); de gamle sorteringssider er slettet.
- **Sorteringsside:** https://claude.ai/artifact/K3mYEi5WeYVy57NDCw1n3j (lilla, "Playmobil alle sæt"). Valg af sæt øverst, søg (varenr./del/note),
  −/+/talfelt/✓/note, filtre Alle/Mangler/Afkrydset. Gemmer D/F/I pr. række. Peger på det nye ark fra 15-11 – **ikke testet mod det nye ark endnu.**
  Senere: samme side inde i appen under Retro (kommer med Lego-maskinrumsopdateringen).
- Status 15-11: **211 af 380 afkrydset** – 3315: 8/12 · 3319: 13/31 · 5135: 63/85 · 5139: 41/77 · 5142: 86/175.
- Regler for antal (fra manualerne): et sæt/en pose = 1; dele på to sider tælles én gang; tegnet flere gange uden "2x" tælles som tegningen.
  Delenes navne er Claudes egne ud fra tegningerne – rettes når Thomas giver bedre navne.
- Sætnavne (søgeresuméer 14-11): 5142 Prinsesseslot, 5135 Piratskib ("Pirate Prize Ship", 2011–2015), 5139 Soldaterfort ("Soldiers Fort with Dungeon", 2011–2014),
  3315 Sort ridder, 3319 Dragebaronens tropper (svag kilde).
- Åbent (ikke hastende): lignende skib til 5135 (3940?) – Thomas sender evt. 3940-manualen. Skrog-nr. uafklaret (eBay 30 22 8412 / manual 30 23 2852).
- Sådan: Thomas sorterer på siden, eller skriver fx "fundet 30 22 9002: 1" / "afkryds 30 25 6590" (sig sættet, hvis nummeret findes i flere sæt).
  Claude læser rækken først, skriver D/F og bekræfter i én linje.

## Næste i Retro
- **Playmobil:** Thomas åbner den lilla side, trykker Tillad, prøver +/✓/note → tjekker arket. Sortering fortsætter (169 rækker). Til sidst: samlet salgstekst.
- Thomas: test et rigtigt køb i appen → Claude tjekker CTS Retro (Indkøbslog, Indkøb, Mærker) og fotomappen CTS/Retro/Lager.
- Trin 2: Lager + annoncer (DE/EN, Raadvad-skabelon). Trin 3: Salg + klargøringshold.
