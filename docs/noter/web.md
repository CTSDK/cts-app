# Område: CTS Web (hjemmeside)

Status pr. 20-11-2026 (sen aften): **live på https://ctsdk.github.io/cts-web/** (EN; tysk under `/de/`). Seneste udgivelse `4450ade` grøn.
To sæt til salg: **75135** (€60) og **3845** (€15). Testet her før udgivelse (computer + iPhone-bredde, ingen døde links, klikvej LEGO → tema → sæt på EN og DE).
3845 er **ikke set live** (github.io kan ikke åbnes fra Claudes miljø) – Thomas tjekker.
Thomas har set siden på pc. iPhone-hjemmeskærmsikon viste gammel udgave → slet ikon og tilføj igen fra Safari (ikke bekræftet virker).

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
- **LEGO-siden** (`/lego/`): grå boks "Themes" med 11 runde tema-ikoner (opbygning som LEGO.com).
  **Star Wars** = Thomas' foto af Obi-Wan i cockpittet, mærke "1 SET", fører til 75135. **Castle** = borg 375-fotoet, "Coming soon".
  **Games** (DE "Spiele", 12. cirkel, nederst til højre) = Thomas' foto af Shave a Sheep-æsken (beskåret uden LEGO-logo), "1 SET", fører til 3845.
  Øvrige (Pirates, Space, Town, Harry Potter, Western, Ninja, Boats, Train, Aquazone) = farvecirkel + forbogstaver, nedtonet.
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
- `cts-web` har sin egen korte kopi af disse noter (`CLAUDE.md` + `docs/noter/web.md`).

## NÆSTE (forslag – kræver Thomas' ja)
1. **Thomas tjekker 3845 live** (Ctrl+Shift+R). Flere fotos af 3845 → galleriet.
1. **Købsknapper 75135 + 3845:** link til eBay-opslag (Thomas sender links) eller vent på webshop. Indkøb siger "Listet: FALSE" for begge.
2. **Flere sæt** på LEGO-siden (`src/data/lego.ts`). Når et tema får flere sæt → egen temaside med oversigt (som LEGO.com).
3. **Egne fotos til tema-cirklerne** (fx minifigur pr. tema) → Drive "CTS - Webpage → Indbakke til Claude".
4. **Retro Design-siden** i samme stil (Thomas' fotos af lamper/møbler).
5. **CTS-mail** i kontakt + bund.
6. Senere: Copenhagen Services, eget domæne, katalog fra arket automatisk, webshop (se plan).

## Plan (langsigtet, uændret)
- Katalog: LEGO + Retro fra arkene (kun offentlige kolonner – aldrig indkøbspris/noter). Fotos fra Drive kopieres til siden (Drive-fotos må ikke deles "alle med linket").
- eBay-salg registreres automatisk i arket (idé i okonomi.md).
- **Webshop** (når CVR m.m. er på plads): arket er "sandheden". Mod dobbeltsalg: kunden betaler/reserverer → Thomas fjerner sættet fra eBay →
  **først derefter ordrebekræftelse**; vinder eBay kapløbet → webordre annulleres + refunderes. Betaling via tjeneste med egen betalingsside
  (Stripe/Shopify/MobilePay – **ikke tjekket**). Skal undersøges: handelsbetingelser, moms, fragt, eBays straf for annullering (ikke tjekket).
- Sikkerhed: statisk side, ingen cookies/sporing, kortdata kun hos betalingstjenesten, regnearket aldrig offentligt, ingen nøgler i repo,
  to-trins-login på GitHub + CTS-Google (**ukendt om slået til – spørg Thomas**).
