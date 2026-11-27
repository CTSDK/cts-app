# Område: CTS Web (hjemmeside)

Status pr. 27-11-2026: **live på https://ctsdk.github.io/cts-web/** (EN; tysk under `/de/`). Seneste udgivelse `a068662` (27-11) grøn.
Brugte sæt til salg: **75135** (€60), **3845** (€15), **70783** (€30). **54 nye, forseglede sæt** (lagernumre N-sætnr) uden pris og fotos, lagt ud 27-11.
Testet her før udgivelse (build 146 sider, ingen sidefejl, skærmbilleder). Thomas har set LEGO-siden live 27-11 ("alt opdateret").

## Regler for webarbejdet (Thomas 20-11)
- **Byg intet før Thomas har sagt ja. Læg intet ud (push til `main`) før Thomas har sagt "læg det ud".** Arbejd på arbejdsgrenen indtil da.
- **Gør præcis det, der bedes om.** "Fjern teksten bread slicers" = kun de ord, ikke hele teksten (fejl 20-11).
- Eksempelsider giver **stil**, ikke indhold (fejl 20-11: Claude lavede en "vinylplade" ud fra Stone Groove).
  "Layout som det første" = **opbygningen** (segl, velkomst, tre afdelinger), ikke den gamle stil (fejl 20-11).
- **Ingen LEGO.com-billeder/ikoner** (varemærke/ophavsret, juridisk ikke tjekket). Kun Thomas' egne fotos.
- **eBay-salgsfotos må ikke bruges som designbilleder** (forside/ikoner) – kun i galleriet for det sæt, de viser.
- Fotos gøres mindre og EXIF/GPS fjernes, før de lægges i `public/img/`.
- Skærmbilleder sendes fra computer + iPhone. Symmetri på forsiden måles (Playwright), ikke gættes.

## Sådan ser siden ud NU
- **Stil:** næsten hvid baggrund, marineblå menubjælke + bund med farvestriber (blå/sennep/rød/orange), Anton (overskrifter),
  Oswald (etiketter), Courier Prime (brødtekst), Playfair Display ("Welcome to C T S."). Skrifter ligger på siden selv.
- **Forside:** magasinlinje øverst ("Copenhagen · Denmark ——— Issue No. 01 · 2026"); seglet (400 px) med to fede tekstfelter på hver side
  ("About CTS · N°01 – A small Danish business…" / "Found · Restored · Passed on – We find them…").
  Under: symmetrisk rombe (370 px fra midten alle veje): **LEGO** venstre, **Retro Design** højre, "Welcome to C T S." + farvestriber i midten,
  **Copenhagen Services** nederst. Runde billedvinduer med hvid "+"-knap:
  LEGO = Thomas' foto af **borg 375** (æskens forside), Retro = Thomas' **teak-lampe** (vinduet retoucheret til tapet), Services = marineblå + by-ikon.
  Retro-tekst: "Lamps, furniture and other Scandinavian classics." Ingen "Choose a department".
- **LEGO-siden** (`/lego/`): grå boks "Themes" med 25 runde tema-cirkler. Mærket viser antal sæt ("1 SET" / "13 SETS"); 1 sæt → sættets side,
  flere → **temaside** `/lego/theme/<slug>/` (kort med nr., navn, stand-mærke, pris). Foto-cirkler: Castle (375), Star Wars (Obi-Wan), Games (3845), Bionicle (70783);
  resten farve + forbogstaver. Tomme temaer nedtonet "Coming soon". Nye temaer 27-11: Ideas, Promotional, Icons, City, Speed Champions, Ninjago, DC Super Heroes,
  Disney, Fortnite, Minecraft, Sonic, Seasonal, Technic, BrickHeadz. Teksten øverst siger stadig "Used, complete sets…" (Thomas spurgt 27-11, ikke ændret).
- **Stand-mærke** på alle salgssider: "New, sealed" / "Neu & OVP" (sennep) eller "Used" / "Gebraucht". Nye sæt: "In stock – x copies", "Factory sealed – never opened",
  felterne Dele/Minifigurer skjules, når de ikke kendes. Tekst kun fakta (ingen opfundet salgstekst).
- **Salgsside 75135 Obi-Wan's Jedi Interceptor** (`/lego/75135/`), opbygning som LEGO.com-produktside:
  pris **€60** (Thomas 20-11), stand 9/10, 215 dele, 2016, minifigurer Obi-Wan Kenobi + R4-P17, SKU 261118-75135.
  Galleri med **9 fotos** (Drive 261118-75135.01–.09, æskens forside først, skæve drejet), salgstekst EN+DE, "What's included", specifikationer.
  **Købsknap grå** ("Buying here – coming soon"). Kilder: cts-app → Lager/Indkøb (stand, æske-note), "261118 Sortering" (alle dele fundet).
  215 dele/2016 = Claudes viden, passer med arket (ikke slået op).
- **Salgsside 3845 Wild Wool / Shave a Sheep** (`/lego/3845/`, lagt ud 20-11): pris **€15** (Thomas), stand 9/10, 118 dele (talt fra den rene sorteringsliste),
  2010, tema Games, ingen undertema, minifigurer "–". Galleri 4 fotos: Thomas' foto sendt i samtalen (forside) + Drive 261118-3845.01–.03.
  Tekst EN+DE: brætspil 2–4 spillere, 5+, 10–15 min. (fra æsken), sæt/ulv/terning bygges selv; med: alle 118 dele, LEGO-terning, byggevejledning,
  spilleregler, original æske. Kilder: Indkøb (stand 9, æske Ja, vejledning ✓, komplet ✓, "Alt er fint"), DB (Games, 2010). Købsknap grå.
  Thomas sagde "fotos kommer" – kun de 3 i Drive pr. 20-11; flere fotos → sæt dem i galleriet.
- Skabelonen tåler nu sæt uden undertema og uden minifigurer (`subtheme?`, "–").
- **Retro, Services, Privatliv:** simpel "coming soon"-side i ny stil. Kontakt: "CTS mail – coming soon".

## Teknik
- Repo **CTSDK/cts-web**, Astro 7.4.13, `base: /cts-web`. Push til `main` → GitHub Actions bygger og udgiver (Pages = GitHub Actions, slået til 20-11).
- Filer: tekster `src/i18n/ui.ts`; stil `src/styles/global.css`; forside `src/components/views/Home.astro` + `src/components/Doors.astro`;
  LEGO `src/components/views/Lego.astro`, sæt-side `LegoSet.astro`, **data `src/data/lego.ts`** (temaer + sæt; nyt sæt = nyt objekt).
  **Nyt sæt (fast måde, 20-11):** data fra Indkøb + DB + ren sorteringsliste (antal dele); fotos fra Drive `CTS/Lager/<købsdato>/` (download via Drive-forbindelsen),
  1600 px + miniature 240 px, EXIF fjernet (PIL `exif_transpose`); objekt i `sets` + `set`/`photo` på temaet; kopiér `src/pages/lego/75135.astro` og `de/lego/75135.astro`
  med nyt nummer; `npm run build`; Playwright-skærmbilleder pc + iPhone; push arbejdsgren → "læg det ud" → push til `main`.
  Billeder: `public/img/lego/75135/`, `public/img/lego/3845/`, `public/img/lego/themes/`, `public/img/retro/`.
- **Nye sæt (27-11):** data genereret i `src/data/nyt.ts` (fra arket "Nyt LEGO lager": Rebrickable navn/år/dele, Brickset tema, antal = købt) → lægges ind i `sets`
  i `lego.ts`; sider via `src/pages/lego/[no].astro` + `de/lego/[no].astro`; temaside `LegoTheme.astro` + `lego/theme/[slug].astro`. Antal på lager opdateres
  ikke automatisk – regenerér `nyt.ts`, når der sælges.
- `cts-web` har sin egen korte kopi af disse noter (`CLAUDE.md` + `docs/noter/web.md`).

## NÆSTE (forslag – kræver Thomas' ja)
1. **Fotos af kasserne** til de nye sæt (Thomas tager dem i appen → Drive `CTS/Lager/Nyt LEGO/<lagernr>/`) → galleri på siderne.
2. **Priser** på de nye sæt (mål ≥ vejl. pris +30 %) – først når de er udgået. Købsknapper (eBay-links eller webshop).
3. Evt. ny tekst øverst på LEGO-siden (nu både nye og brugte sæt). Antal på lager automatisk fra arket (senere).
4. Retro Design-siden, CTS-mail, egne tema-fotos, Copenhagen Services, eget domæne, webshop (se plan).

## Plan (langsigtet, uændret)
- Katalog: LEGO + Retro fra arkene (kun offentlige kolonner – aldrig indkøbspris/noter). Fotos fra Drive kopieres til siden (Drive-fotos må ikke deles "alle med linket").
- eBay-salg registreres automatisk i arket (idé i okonomi.md).
- **Webshop** (når CVR m.m. er på plads): arket er "sandheden". Mod dobbeltsalg: kunden betaler/reserverer → Thomas fjerner sættet fra eBay →
  **først derefter ordrebekræftelse**; vinder eBay kapløbet → webordre annulleres + refunderes. Betaling via tjeneste med egen betalingsside
  (Stripe/Shopify/MobilePay – **ikke tjekket**). Skal undersøges: handelsbetingelser, moms, fragt, eBays straf for annullering (ikke tjekket).
- Sikkerhed: statisk side, ingen cookies/sporing, kortdata kun hos betalingstjenesten, regnearket aldrig offentligt, ingen nøgler i repo,
  to-trins-login på GitHub + CTS-Google (**ukendt om slået til – spørg Thomas**).
