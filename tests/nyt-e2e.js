// Nyt LEGO (v30): Lego → "Nyt LEGO (forseglet)" → dato/butik/ordre/cashback + sæt (pris, gave) → Gem → Klargør uden "Sortér dele".
// Simuleret forbindelse (?mock=1). Kør: node tests/nyt-e2e.js <url> <mappe>   (server: python3 -m http.server 8765)
const { chromium, devices } = require('playwright');
const assert = require('assert'), fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/';
const UD = process.argv[3] || 'test-output';
fs.mkdirSync(UD, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const fejl = [];
  page.on('pageerror', e => fejl.push(e.message));
  const skud = async n => page.screenshot({ path: path.join(UD, 'nyt-' + n + '.png'), fullPage: true });
  const mock = () => page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  const vent = ms => page.waitForTimeout(ms);
  const tomUdbakke = async () => { await vent(800); for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => Data.poster().length)) === 0) return; await vent(150); } throw new Error('Udbakken blev ikke tom'); };

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');
  await page.evaluate(() => Data.hentAlt());

  // Lego-forsiden har knappen
  await page.evaluate(() => CTS.gaa('forside'));
  await page.waitForSelector('#v-forside:not([hidden])');
  await skud('1-forside');
  await page.click('#v-forside [data-gaa="nyt"]');
  await page.waitForSelector('#v-nyt:not([hidden])');
  assert.strictEqual(await page.inputValue('#n-butik'), 'LEGO.com');
  assert.strictEqual(await page.inputValue('#n-cb'), '5');

  await page.fill('#n-dato', '2026-11-21');
  await page.fill('#n-ordre', 'T123');
  const linje = i => page.locator('#n-linjer .nyt-linje').nth(i);
  await linje(0).locator('input').first().fill('6086');
  await linje(0).locator('[data-f]').fill('2799,95');
  await linje(0).locator('[data-v]').fill('359,99');
  await page.click('#n-tilfoej');
  await linje(1).locator('input').first().fill('10271');
  await linje(1).locator('[data-g]').check();
  assert.ok(await linje(1).locator('[data-f]').isDisabled());
  await page.waitForFunction(() => document.querySelectorAll('#n-linjer .navn.fundet').length === 2);
  assert.strictEqual((await page.textContent('#n-sum-f')).trim(), '2.799,95 kr');
  assert.strictEqual((await page.textContent('#n-sum-cb')).trim(), '− 140,00 kr');
  assert.strictEqual((await page.textContent('#n-sum-n')).trim(), '2.659,95 kr');
  await skud('2-udfyldt');

  // Fejl: sæt uden pris
  await page.click('#n-tilfoej');
  await linje(2).locator('input').first().fill('6086');
  await page.waitForFunction(() => document.querySelectorAll('#n-linjer .navn.fundet').length === 3);
  await page.click('#n-gem');
  await page.waitForFunction(() => /fakturapris/.test(document.getElementById('n-fejl').textContent));
  await linje(2).locator('.slet').click();

  // Kladden huskes, hvis man går væk
  await page.click('#v-nyt .tilbage');
  await page.click('#v-forside [data-gaa="nyt"]');
  assert.strictEqual(await page.inputValue('#n-ordre'), 'T123');
  assert.strictEqual(await page.locator('#n-linjer .nyt-linje').count(), 2);

  await page.click('#n-gem');
  await page.waitForSelector('#v-koeb3:not([hidden])');
  await tomUdbakke();
  await vent(300);
  let m = await mock();
  const r1 = m.ind.find(r => r.sku === '261121-6086'), r2 = m.ind.find(r => r.sku === '261121-10271');
  assert.ok(r1 && r2, 'begge sæt i Indkøb');
  assert.strictEqual(r1.koebspris, 2659.95);
  assert.strictEqual(r2.koebspris, 0);
  assert.strictEqual(m.log.find(l => l.dato === '261121').pris, 2659.95);
  assert.ok(r1.sorteret && r1.komplet && r1.ovp && r1.stand === '10');
  // Klargør: ingen "Sortér dele", tekst om kassen
  assert.ok(await page.isHidden('#k3-sorter'));
  assert.ok(/Nyt, forseglet/.test(await page.textContent('#k3-info')));
  assert.ok(/2\.659,95/.test(await page.textContent('#k3-info')));
  assert.ok(/✓ Sorteret/.test(await page.textContent('#k3-krav')));
  await skud('3-klargoer');

  // Andet køb samme dag, anden butik → lægges til samme køb; netto lægges til
  await page.click('#k3-tilbage');
  await page.click('#v-forside [data-gaa="nyt"]');
  assert.strictEqual(await page.inputValue('#n-ordre'), '');
  await page.fill('#n-dato', '2026-11-21');
  await page.fill('#n-butik', 'Proshop');
  await page.fill('#n-cb', '0');
  await linje(0).locator('input').first().fill('6086');
  await linje(0).locator('[data-f]').fill('500');
  await page.waitForFunction(() => document.querySelectorAll('#n-linjer .navn.fundet').length === 1);
  await page.click('#n-gem');
  await page.waitForSelector('#v-koeb3:not([hidden])');
  await tomUdbakke();
  m = await mock();
  assert.strictEqual(m.log.find(l => l.dato === '261121').pris, 3159.95);
  const ens = m.ind.filter(r => r.dato === '261121' && r.setnr === '6086');
  assert.strictEqual(ens.length, 2);
  assert.deepStrictEqual(ens.map(r => r.sku).sort(), ['261121-6086-a', '261121-6086-b']);

  // Almindeligt køb viser stadig "Sortér dele"
  await page.evaluate(async () => { await Api.kald('opretBatch', { dato: '261110', pris: 100, saet: [{ setnr: '6086', vaerdi: 140, ovp: false, kilde: 'BrickLink' }] }); await Data.hentAlt(); });
  await page.evaluate(() => CTS.aabnKlargoering('261110', '261110-6086'));
  assert.ok(await page.isVisible('#k3-sorter'));

  assert.deepStrictEqual(fejl, []);
  console.log('Nyt LEGO e2e: OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
