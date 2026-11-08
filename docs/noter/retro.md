# Område: Retro Design

Status pr. 08-11-2026: **trin 1 bygget og testet i testtilstand (app v17 + maskinrum 2.2.0) – IKKE testet hos Thomas.**

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
- **Maskinrum 2.2.0:** CTS → **Opret Retro-ark** laver regnearket "CTS Retro" i `CTS/Retro` (id i Script Properties RETRO_ID) med fanerne
  Indkøbslog (Købsdato ÅÅMMDD | Samlet pris | Hvor købt | Antal ting | Noter | MappeID), Indkøb (SKU | Købsdato | Type | Producent | Designer | Model |
  Farve | Særligt kendetegn | Stand 1–10 | Udført arbejde | Købspris | Fotos | Klar | Lagerstatus | Noter) og Mærker (Producent | Kode).
  Fotos: `CTS/Retro/Lager/<ÅÅMMDD>/<SKU>.NN.jpg`. API: retroMaerker, retroOpretKoeb, retroHentKoeb, retroGemTing, retroUploadFoto.
- **App v17:** Hjem → Retro Design → Registrér nyt køb (side 1: dato, pris, hvor købt, linjer type/producent/kode/model/antal, SKU vises live)
  → Klargør (designer, farve, kendetegn, stand, arbejde, noter, klar + live-kamera/fotos som Lego). Lager og Salg: "kommer senere".
- SKU-detaljer: æøå → AE/OE/AA, kun A–Z/0–9 (fx "Radio/TV-kabinet" → RADIOTVKABINET). Flere ens → -a, -b … Tilføjes en ens ting senere,
  omdøbes en enlig ting til -a (også dens fotos).
- **Tilføj til eksisterende køb:** beløbet lægges til købets samlede pris, og hele prisen fordeles igen ligeligt (hjælperens valg – bekræftes med Thomas).
- Begrænsning: appen kender kun køb lavet/hentet på telefonen; findes købsdatoen i arket fra anden enhed → fejl i udbakken.
- Tests: `node tests/retro.test.js`, `node tests/retro-e2e.js` (Playwright, mock).

## Næste i Retro
- Thomas: sæt maskinrum 2.2.0 ind → Opret Retro-ark → test et rigtigt køb i appen.
- Trin 2: Lager + annoncer (DE/EN, Raadvad-skabelon). Trin 3: Salg + klargøringshold.
