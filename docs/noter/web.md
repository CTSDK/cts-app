# Område: CTS Web (hjemmeside)

Status pr. 20-11-2026: **skelet bygget og testet her (ikke hos Thomas), gemt på GitHub, IKKE lagt ud** (Pages ikke slået til).
Udseendet skal laves om til Stone Groove-stil (godkendt retning, se nedenfor). **Byg intet før Thomas har sagt ja** (Thomas 20-11: "spørg altid og start aldrig før der er sagt ja").

## Hvad siden er
- Hjemmeside for hele CTS: **forside (landing page) med tre døre**: **LEGO®**, **Retro Design** (Raadvad, brødskærere, renoverede lamper, møbler), **Copenhagen Services** (kun billede + "coming soon" indtil videre).
- **Engelsk** hovedsprog, **tysk** under `/de/` (Claude oversætter; Astros indbyggede i18n, `prefixDefaultLocale: false`). Flere sprog kan tilføjes.
- Kontakt: står "CTS mail – coming soon" (Thomas vil ikke vise mailen endnu).
- Ingen sporing/cookies/Google; skrifter ligger på siden selv (fontsource). LEGO®-varemærkelinje i bunden, ingen LEGO-logo (juridisk ikke tjekket).

## Teknik (bygget, tjekket mod Astros egen vejledning hentet fra github.com/withastro/docs)
- Repo **CTSDK/cts-web** (offentligt, adskilt fra appen). Claude har push-adgang (Thomas gav den 20-11). Gren `main`.
- **Astro 7.4.13**, `site: https://ctsdk.github.io`, `base: /cts-web` → adresse **https://ctsdk.github.io/cts-web/** (eget domæne senere).
- Udgivelse: `.github/workflows/deploy.yml` (withastro/action@v6 + actions/deploy-pages@v5). Kører ved hver push til main;
  fejler indtil Pages er slået til (forventet – Thomas kan ignorere fejl-mailen).
- Tekster: `src/i18n/ui.ts`. Farver/skrift: `src/styles/global.css`. Sider: `src/components/views/` + ruter i `src/pages/` og `src/pages/de/`.
- Logo: seglet `logo-segl.png` (kopieret fra appens `icons/`).
- Test (her): 10 sider bygget, ingen døde links, ingen eksterne kald, passer i iPhone-bredde. Nuværende udseende = første bud (creme, butiksdøre) – erstattes.
- Ikke muligt herfra: docs.astro.build og Thomas' eksempelsider er blokeret → Thomas sender skærmbilleder i samtalen (virker).

## Godkendt retning for udseendet (Thomas 20-11)
- **Overordnet stil = Stone Groove Spirits** (stonegroovespirits.com, set på Thomas' skærmbillede): slidt **creme**-papir, farver **marineblå,
  brændt orange, sennepsgul, rød** i lodrette blokke/striber (pladecover), store **smalle fede versal-overskrifter** (sort linje + orange linje),
  små etiketter med spredte bogstaver + tynde streger, skrivemaskine-brødtekst, katalognumre ("SG-001", "SIDE A / TRACK 01") → hos os SKU'er,
  marineblå menubjælke.
- **Magasin-præg** (rejsemagasin "World of Travel"): stort coverfoto, elegant overskrift, opslag med store fotos og spalter → forside + Retro Design.
- **LEGO-afdeling: katalog-præg som LEGO-katalogerne 2006-09**, men **en smule dæmpet**: runde mærker med sætnr./SKU, "NEW"-stjerne. Ingen LEGO-logo.
- Afdelingerne vises som "spor": No. 01 LEGO®, No. 02 Retro Design, No. 03 Copenhagen Services.
- Baggrund: **creme**. Skelettet genbruges – kun udseendet ændres.
- **Coverfoto:** Thomas tager et; indtil da bruges seglet.

## Plan (trin)
1. **Fundament** (nu): forside + tre afdelinger, EN/DE, stil. Ingen data endnu.
2. **Katalog:** LEGO + Retro hentes fra arkene (kun offentlige kolonner – aldrig indkøbspris/noter). Køb = link til eBay. Fotos kopieres fra Drive
   til siden af maskinrummet (Drive-fotos må ikke deles "alle med linket").
3. **eBay-salg registreres automatisk** i arket (idé i okonomi.md).
4. **Webshop** (når CVR m.m. er på plads): arket er "sandheden". Thomas' metode mod dobbeltsalg: kunden lægger i kurv/betaler (helst reservation),
   Thomas fjerner sættet fra eBay, **først derefter ordrebekræftelse**; når eBay vinder kapløbet → webordre annulleres + refunderes.
   Betaling via tjeneste med egen betalingsside (Stripe/Shopify/MobilePay-løsning – **ikke tjekket**: pris, reservation, MobilePay).
   Skal undersøges: handelsbetingelser ("bindende ved bekræftelse" – dansk ret ikke tjekket), moms, fragt, eBays straf for annullering (ikke tjekket).
- Sikkerhed: statisk side (intet login/database), kortdata kun hos betalingstjenesten, regnearket aldrig offentligt, ingen nøgler i repo,
  to-trins-login på GitHub + CTS-Google (**ukendt om slået til – spørg Thomas**), privatlivstekst, ingen cookies.

## NÆSTE (start i ny samtale)
0. Ny samtale: hvis `cts-web` ikke er med i samtalen, kobler Claude det på (add_repo CTSDK/cts-web, push) og kloner det.
1. **Prøveside (mockup) af forsiden i Stone Groove-stil** – vis Thomas planen kort, få **ja**, byg, test (computer + iPhone), send skærmbilleder.
   Intet lægges ud før Thomas har godkendt billederne.
2. Efter godkendelse: resten af siderne i samme stil.
3. Så: Thomas slår Pages til (Settings → Pages → Source: **GitHub Actions**) → siden live på https://ctsdk.github.io/cts-web/.
4. Drive-mappe **CTS Web** (Thomas opretter) til logo, fotos, eksempler.
