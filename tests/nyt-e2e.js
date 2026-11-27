// Nyt LEGO (v30): køb med antal → lager pr. lagernummer (N-sætnr) → fotos af kassen → salg (først købt, først solgt).
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
  page.on('dialog', d => d.accept());
  const skud = async n => page.screenshot({ path: path.join(UD, 'nyt-' + n + '.png'), fullPage: true });
  const mock = () => page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  const vent = ms => page.waitForTimeout(ms);
  const tomUdbakke = async () => { await vent(800); for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => Data.poster().length)) === 0) return; await vent(150); } throw new Error('Udbakken blev ikke tom'); };
  const linje = i => page.locator('#n-linjer .nyt-linje').nth(i);

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');
  await page.evaluate(() => Data.hentAlt());
  await page.evaluate(() => CTS.gaa('forside'));
  await page.click('#v-forside [data-gaa="nyt"]');
  await page.waitForSelector('#v-nyt:not([hidden])');
  assert.strictEqual(await page.inputValue('#n-cb'), '5');

  // Køb 1: LEGO.com, 4x point, 6086 x2 à 1.000 + 10271 gave
  await page.fill('#n-dato', '2026-11-21');
  await page.fill('#n-ordre', 'T1');
  await page.selectOption('#n-point', '4');
  await linje(0).locator('input').first().fill('6086');
  await linje(0).locator('[data-a]').fill('2');
  await linje(0).locator('[data-f]').fill('1000');
  await page.click('#n-tilfoej');
  await linje(1).locator('input').first().fill('10271');
  await linje(1).locator('[data-g]').check();
  await page.waitForFunction(() => document.querySelectorAll('#n-linjer .navn.fundet').length === 2);
  assert.strictEqual((await page.textContent('#n-sum-f')).trim(), '2.000,00 kr');
  assert.strictEqual((await page.textContent('#n-sum-n')).trim(), '1.900,00 kr');
  await skud('1-koeb');
  // Ukendt sæt stoppes
  await page.click('#n-tilfoej');
  await linje(2).locator('input').first().fill('99999');
  await page.click('#n-gem');
  await page.waitForFunction(() => /99999/.test(document.getElementById('n-fejl').textContent));
  await linje(2).locator('.slet').click();
  await page.click('#n-gem');
  await page.waitForSelector('#v-nytlager:not([hidden])');
  await tomUdbakke();
  let m = await mock();
  assert.strictEqual(m.nk.length, 2);
  assert.strictEqual(m.nk[0].prStk, 950);
  await page.waitForFunction(() => /3<\/b> sæt på lager/.test(document.getElementById('nl-sum').innerHTML));
  assert.strictEqual(await page.locator('#nl-liste .nyt-kort').count(), 2);

  // Køb 2: anden butik, uden cashback – samme lagernummer N-6086
  await page.evaluate(() => CTS.gaa('nyt'));
  assert.strictEqual(await page.inputValue('#n-ordre'), '');
  await page.fill('#n-dato', '2026-11-27');
  await page.fill('#n-butik', 'Proshop');
  await page.fill('#n-cb', '0');
  await linje(0).locator('input').first().fill('6086');
  await linje(0).locator('[data-f]').fill('800');
  await page.waitForFunction(() => document.querySelectorAll('#n-linjer .navn.fundet').length === 1);
  await page.click('#n-gem');
  await page.waitForSelector('#v-nytlager:not([hidden])');
  await tomUdbakke();
  const kort = page.locator('#nl-liste .nyt-kort', { hasText: 'N-6086' });
  assert.ok(/3 på lager<\/b> af 3 købt/.test(await kort.innerHTML()));
  assert.ok(/købspris 950,00/.test(await kort.textContent()));
  await skud('2-lager');

  // Fotos af kassen pr. lagernummer
  await kort.click();
  await page.waitForSelector('#v-nytfoto:not([hidden])');
  assert.strictEqual((await page.textContent('#nf-lagernr')).trim(), 'N-6086');
  await page.evaluate(() => Data.tilfoej('nytFoto', { sku: 'N-6086', billede: 'AAAA', uploadId: 'u1' }, { sku: 'N-6086', thumb: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' }));
  await tomUdbakke();
  m = await mock();
  assert.strictEqual(m.nfoto['N-6086'][0].navn, 'N-6086.01.jpg');
  await page.click('#v-nytfoto .tilbage');
  await page.waitForFunction(() => /1 foto/.test(document.querySelector('#nl-liste').textContent));

  // Salg: 2 x N-6086 i samme ordre → K001 to gange (ældste køb først)
  await page.evaluate(() => CTS.gaa('salg'));
  await page.fill('#s-koeber', 'Berlin, Tyskland');
  const vare = i => page.locator('#s-varer .vare').nth(i);
  await vare(0).locator('.sku').fill('N-6086'); await vare(0).locator('.pris').fill('200');
  await vare(1).locator('.sku').fill('N-6086'); await vare(1).locator('.pris').fill('200');
  assert.ok(/nyt, 3 på lager/.test(await vare(0).locator('.info').textContent()));
  await page.click('#s-gem');
  await tomUdbakke();
  m = await mock();
  assert.deepStrictEqual(m.salg.map(x => x.sku), ['N-6086.K001', 'N-6086.K001']);
  await page.evaluate(() => CTS.gaa('nytlager'));
  assert.ok(/1 på lager<\/b> af 3 købt/.test(await kort.innerHTML()));
  assert.ok(/købspris 800,00/.test(await kort.textContent()));
  // For mange stk. stoppes i appen
  await page.evaluate(() => CTS.gaa('salg'));
  await page.fill('#s-koeber', 'Paris, Frankrig');
  await vare(0).locator('.sku').fill('N-6086'); await vare(0).locator('.pris').fill('200');
  await vare(1).locator('.sku').fill('N-6086'); await vare(1).locator('.pris').fill('200');
  await page.click('#s-gem');
  await page.waitForFunction(() => /kun 1 på lager/.test(document.getElementById('s-fejl').textContent));

  // Almindeligt køb viser stadig "Sortér dele"
  await page.evaluate(async () => { await Api.kald('opretBatch', { dato: '261110', pris: 100, saet: [{ setnr: '6086', vaerdi: 140, ovp: false, kilde: 'BrickLink' }] }); await Data.hentAlt(); });
  await page.evaluate(() => CTS.aabnKlargoering('261110', '261110-6086'));
  assert.ok(await page.isVisible('#k3-sorter'));

  assert.deepStrictEqual(fejl, []);
  console.log('Nyt LEGO e2e: OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
