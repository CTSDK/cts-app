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
  Række 1 søgefelt B1 (leder i A+B+G), række 2–12 træf, række 13 overskrift. **Række 14–742 = 729 rækker:** 3315 (14–25), 3319 (26–56),
  5135 (57–141), 5139 (142–218), 5142 (219–393), 4343 (394–493), 4439 (494–539), 3155 (540–555),
  **5149 (556–670), 5150 (671–704), 5154 (705–742)** (tilføjet 21-11); inden for sæt i samme orden som de gamle ark.
  Kolonner: A Varenr. · B Del · C Skal være · **D Fundet** · E Mangler (formel) · **F ✓** · **G Sæt · side** (fx "5142 · s.22") · H tom · **I Note**.
  Dansk ark (`;` i formler). "Fundet" tomt = ikke talt.
- 15-11: samlet fra de 4 gamle ark (5142, 5135, 5139, små sæt). Tjek i arket: 0 forskelle i A–D, F, G, I for alle rækker. Søgning testet ("5139" = 77 træf).
  36 varenumre ("30 0M ÅÅÅÅ") var gemt som datoer i de gamle ark – rettet til tekst 15-11.
  De gamle ark ligger i Drive-papirkurven (kan gendannes i 30 dage); de gamle sorteringssider er slettet.
- **Sorteringsside:** https://claude.ai/artifact/K3mYEi5WeYVy57NDCw1n3j (lilla, "Playmobil alle sæt"). Valg af sæt øverst, søg (varenr./del/note),
  −/+/talfelt/✓/note, filtre Alle/Mangler/Afkrydset. Gemmer D/F/I pr. række. Peger på det nye ark fra 15-11 – **ikke testet mod det nye ark endnu.**
  **✓-regel (Thomas 15-11, begge sider):** + sætter ikke kryds selv. Når Fundet = Skal være, lyser fluebenet grønt omrids ("klar").
  Først når Thomas trykker ✓, bliver det grønt = færdig. ✓ kan også trykkes, når der mangler dele: så er delen færdig, og manglen (Skal−Fundet)
  er selve noten – tom note = intet andet at notere. Efter ✓ ryddes søgefeltet, og markøren springer op i det, så næste nummer kan tastes.
  "Alle sæt"/"Alle SKU" er kun visning; sortering og noter kun under ét valgt sæt/SKU.
- **I appen (v22 + maskinrum 2.3.2, 15-11; v20/2.3.0 testet af Thomas 15-11: noter og ✓ gemt i arket ✓):** Hjem → Retro Design → **Playmobil**. Samme regler som den lilla side (sæt øverst,
  "Alle sæt" kun visning, søg, −/+/talfelt, ✓-regel, note pr. del). Gemmer via maskinrummet (pmHent/pmGem) og udbakken (virker offline).
  **"+ Nyt sæt"**: navn (fx "Div" = løsdele) → én linje "Note og fotos" (ingen antal/✓), indsat før sidste række (pmNytSaet).
  **Fotos pr. sæt** (fotoboks med kamera-ikon, når ét sæt er valgt): `CTS/Retro/Playmobil/Fotos/PM-<SÆT>.NN.jpg` (pmUploadFoto).
  **Fotos pr. del** (v22/2.3.2): kamera-ikon ved noten på hver del (telefonens kamera → beskær) → `PM-<SÆT>-<VARENR>.NN.jpg`; tal på ikonet = antal fotos.
  På note-linjer (fx Div) gælder ikonet hele sættet. Arkets id: konstant
  PM_STANDARD_ID i Code.gs (kan overstyres med Script Property PLAYMOBIL_ID).
  **Sætnavne** (v21/2.3.1): fanen **"Sæt"** i arket (A nr., B navn) → vises under nummeret på knapperne. Nye navne skrives bare i fanen.
  Testet i browser med testdata (`tests/pm-e2e.js`). **Hos Thomas 15-11 virker:** noter, ✓, + og **fotos af sæt** (Fotos-mappe id
  `1jbdX824Irc5XpEBbblUx02bIrzOv8cDa`: PM-3155.01, PM-4343.01–03). Thomas 15-11: **alt testet og virker** (inkl. fotos pr. del, Nyt sæt, sætnavne).
- Status 15-11 aften (ca.): **274 af 542 afkrydset** – 3315: 10/12 · 3319: 13/31 · 5135: 63/85 · 5139: 40/77 · 5142: 86/175 · 4343: 41/100 · 4439: 19/46 · 3155: 2/16.
- Regler for antal (fra manualerne): et sæt/en pose = 1; dele på to sider tælles én gang; tegnet flere gange uden "2x" tælles som tegningen.
  Delenes navne er Claudes egne ud fra tegningerne – **erstattes med PlaymoDB-navne** (Thomas kopierer sættets PlaymoDB-side ind i samtalen;
  Claude holder den op mod arket/manualen, viser forslag, skriver efter ja). Format: "navn (farve)" som PlaymoDB. PlayMoDB kan ikke åbnes fra sessionen.
  - **3315 ✓ 15-11:** 12 navne fra PlaymoDB. 30 20 1002 (2x i manualen) = "Arm greave, wing shape at shoulder" (PlaymoDB: extra part; samme del også som 30 09 1660).
    Manualen 30 89 7202 er ikke tilføjet som række (ikke besluttet).
  - **3319 ✓ 15-11:** alle 31 numre = PlaymoDB (32 inkl. manual 30 89 6862). PlaymoDB-navn på sættet: "Dragon Baron".
    Tilføjelser efter PlaymoDB-navnet (Thomas' ja): " – m. drage" på flag, hestedække og de 3 skjolde.
  - **5135 ✓ 15-11:** 81 numre = PlaymoDB. 4 manual-numre står hos PlaymoDB som "extra" (samme del, andet nr.):
    30 23 2842=30 22 8422, 30 23 2852=30 22 8412 (skroget), 30 25 3892=30 05 2120, 30 80 3203=30 89 4650 – står i navnet.
    " – m. kranie" på 2 flag, " – m. kranie og sabler" på storsejlet (fra manualens tegning). PlaymoDB-sætnavn: "Pirates Ship".
  - **5139 ✓ 15-11:** 76 numre = PlaymoDB; 30 63 1244 = PlaymoDB extra "Hat, tricorne, with hole for feather". PlaymoDB-listen er ikke komplet
    (80/78) og har 3 ekstra (30 22 8052 sæk cream, 30 06 3540 + 30 62 6863 hatte) – ikke tilføjet. PlaymoDB-sætnavn: "Soldiers Fort with Dungeon".
  - **5142 ✓ 15-11:** 170 numre = PlaymoDB. Extra-numre: 30 21 1123=30 22 9122, 30 21 2203=30 29 5500, 30 25 5053=30 20 2392, 30 25 6602=30 22 8762.
    30 65 2223 "Tanzplatte-Schloss II" = sandsynligvis PlaymoDB's 30 22 8982 + tandhjul 30 46 6630/6640/6650/6660 (Claudes vurdering, står i navnet).
    PlaymoDB-stavefejl rettet: "Indow"→"Window", "swam"→"swan". PlaymoDB-sætnavn: "Princess Fantasy Castle".
  - **4343 Dyreklinik** (PlaymoDB "Animal Clinic", 2007) tilføjet 15-11: række 394–493, 100 numre (141 stk.). Manualen har ingen stykliste –
    numre fra byggetrin (læst af hjælpe-agent). 30 65 8822 (manual) = PlaymoDB 30 66 7350. Antal-valg (Thomas' ja): 30 51 5430, 30 61 8660,
    30 51 0250 = 1 sæt; 30 09 6900 røde plugs = 1 ("en pose", antal ukendt); 30 28 6200 = 1; 30 28 6220 = 2.
  - **4439 Barbartårn** (PlaymoDB "Barbarian Assault Tower", 2005) tilføjet 15-11: række 494–539, 46 numre (63 stk.), alle = PlaymoDB.
    30 51 2920 sider = 1 sæt; 30 62 6752 = 1; 30 21 0700 grå clips = 1 (måske flere). Flammer 30 07 6930 = 3.
  - **3155 Nessie** (PlaymoDB "Nessie", 2002) tilføjet 15-11: række 540–555, 16 numre, alle = PlaymoDB. 30 20 0200 = 3 (tegnet 3 gange).
    Undervandsmotor 7350 sælges separat – ikke med.
  - **5149 E-Rangers hovedkvarter** (PlaymoDB "E-Rangers' Headquarters", 2011) tilføjet 21-11: 115 numre (168 stk.), alle = PlaymoDB. Stykliste s.13–16.
    Antal-valg: 30 23 0692 = 2, 30 28 4290 = 2, 30 62 7953/7963 = 2 hver, 30 60 1552 = 1 (2 dele, ét nr.).
  - **5150 E-Rangers turbojet med landingsplads** (PlaymoDB "E-Rangers Turbojet with Launch Pad") tilføjet 21-11: 34 numre (62 stk.), alle = PlaymoDB.
    Ingen stykliste (numre fra byggetrin). 30 03 6600 gule propper = 18 (6 pr. ben × 3; PlaymoDB pose med 16).
    30 22 9922 og 30 66 5972 = 3 hver, men måske samme ben (står i navnet) – Thomas afgør ved sortering.
  - **5154 Dark Rangers' truck med IR-kanon** (PlaymoDB "Dark Rangers' Truck with IR Knockout Cannon") tilføjet 21-11: 38 numre (54 stk.).
    Ingen stykliste. Manual 30 02 5392 = PlaymoDB 30 21 3390 (står i navnet). 30 03 6600 = 4 (tegnet; PlaymoDB pose med 8).
  - **Alle 11 sæt har PlaymoDB-navne (engelsk). 5149/5150/5154 var de allersidste sæt (Thomas 21-11).**** Manualer er ikke tilføjet som rækker. **Delenavnene skal oversættes til salgsteksten senere** (Thomas 15-11).
- Sætnavne (søgeresuméer 14-11; 4343/4439 fra PlaymoDB 15-11): 4343 Dyreklinik, 4439 Barbartårn, 5142 Prinsesseslot, 5135 Piratskib ("Pirate Prize Ship", 2011–2015), 5139 Soldaterfort ("Soldiers Fort with Dungeon", 2011–2014),
  3315 Sort ridder, 3319 Dragebaronens tropper (svag kilde).
- Åbent (ikke hastende): lignende skib til 5135 (3940?) – Thomas sender evt. 3940-manualen. Skrog: 30 23 2852 = 30 22 8412 (PlaymoDB).
- **Nyt sæt tilføjes:** Thomas sender manual-PDF + kopierer PlaymoDB-siden ind → hjælpe-agent (sonnet) læser manualens numre/antal →
  Claude sammenligner, viser forslag (navne, usikre antal) → efter ja: indsæt rækker *før* sidste række (flyt den sidste tilbage bagefter),
  kopiér format/E-formel/✓-validering fra række 14, skriv A (med apostrof = tekst), B, C, F=FALSK, G "sæt · s.N". Tjek grænser + søgeformlens område.
- Sådan: Thomas sorterer på siden, eller skriver fx "fundet 30 22 9002: 1" / "afkryds 30 25 6590" (sig sættet, hvis nummeret findes i flere sæt).
  Claude læser rækken først, skriver D/F og bekræfter i én linje.

## Næste i Retro
- **Playmobil:** Thomas sorterer videre i appen (Retro → Playmobil), nu også 5149, 5150, 5154. Salget deles måske i **to lots** (Thomas vender tilbage). Tjek: foto af en del (v22), "+ Nyt sæt" Div, sætnavne. Når alt er sorteret:
  samlet salgstekst ud fra noterne (delnavne oversættes) + Thomas' input.
- Thomas: test et rigtigt køb i appen → Claude tjekker CTS Retro (Indkøbslog, Indkøb, Mærker) og fotomappen CTS/Retro/Lager.
- Trin 2: Lager + annoncer (DE/EN, Raadvad-skabelon). Trin 3: Salg + klargøringshold.
