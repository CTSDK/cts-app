// Lego-sortering: Klargør → "Sortér dele" → liste kopieres ind → tæl/✓/note/foto → Færdig → Sorteret/Komplet/Noter i Indkøb.
// Simuleret forbindelse (?mock=1). Kør: node tests/lgs-e2e.js <url> <mappe>   (server: python3 -m http.server 8765)
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
  const skud = async n => page.screenshot({ path: path.join(UD, 'lgs-' + n + '.png'), fullPage: true });
  const mock = () => page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  const vent = ms => page.waitForTimeout(ms);
  const tomUdbakke = async () => { await vent(1000); for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => Data.poster().length)) === 0) return; await vent(150); } throw new Error('Udbakken blev ikke tom'); };
  const raekke = t => page.locator('#lg-liste .pm-del', { hasText: t });

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');
  // Køb 261110 med 6086 (har ren liste i testdata) og 10271 (har ingen)
  await page.evaluate(async () => {
    await Api.kald('opretBatch', { dato: '261110', pris: 100, saet: [{ setnr: '6086', vaerdi: 140, ovp: false, kilde: 'BrickLink' }, { setnr: '10271', vaerdi: 45, ovp: true, kilde: 'BrickLink' }] });
    await Data.hentAlt();
  });
  await page.evaluate(() => CTS.aabnKlargoering('261110', '261110-6086'));
  await page.waitForSelector('#v-koeb3:not([hidden])');
  await page.waitForFunction(() => document.getElementById('k3-sorter-info').textContent === 'Ikke startet');

  // Sæt uden ren liste → tydelig besked
  await page.evaluate(() => CTS.aabnKlargoering('261110', '261110-10271'));
  await page.waitForFunction(() => /Ingen sorteringsliste/.test(document.getElementById('k3-sorter-info').textContent));
  await page.click('#k3-sorter');
  await page.waitForSelector('#v-lgs:not([hidden])');
  await page.waitForFunction(() => /Ingen sorteringsliste for 10271/.test(document.getElementById('lg-besked').textContent));

  // 6086: start → listen kopieres ind
  await page.click('#lg-tilbage');
  await page.waitForSelector('#v-koeb3:not([hidden])');
  await page.evaluate(() => CTS.aabnKlargoering('261110', '261110-6086'));
  await page.click('#k3-sorter');
  await page.waitForSelector('#lg-liste .pm-del');
  assert.strictEqual(await page.locator('#lg-liste .pm-del').count(), 5);
  assert.strictEqual((await page.textContent('#lg-status')).trim(), '0 af 5 afkrydset');
  assert.ok(await page.isHidden('#lg-faerdig'));
  assert.ok((await raekke('Crusader Axe').textContent()).includes('Minifigur'));
  let m = await mock();
  assert.strictEqual(m.lg.dele.filter(d => d.sku === '261110-6086').length, 5);

  // Samme item no i to farver holdes adskilt: + på den sorte 3004
  await raekke('Black Brick 1 x 2').locator('.pm-taeller button').nth(1).click();
  await tomUdbakke();
  m = await mock();
  assert.strictEqual(m.lg.dele.find(d => d.del === 'Black Brick 1 x 2').fundet, 1);
  assert.strictEqual(m.lg.dele.find(d => d.del === 'Light Gray Brick 1 x 2').fundet, null);

  // Antal via talfelt + ✓ (søgefeltet ryddes og får fokus)
  await page.fill('#lg-q', 'saddle');
  await raekke('Saddle').locator('.pm-chk').click();
  assert.strictEqual(await page.inputValue('#lg-q'), '');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'lg-q');
  const saetAntal = async (t, n) => { const f = raekke(t).locator('.pm-taeller input'); await f.fill(String(n)); await f.blur(); };
  await saetAntal('Black Brick 1 x 2', 9);
  await saetAntal('Light Gray Brick 1 x 2', 89);
  await saetAntal('Light Gray Brick 1 x 1', 4);
  await saetAntal('Crusader Axe', 2);
  await raekke('Light Gray Brick 1 x 1').locator('.note').fill('en er misfarvet');
  await raekke('Light Gray Brick 1 x 1').locator('.note').blur();
  // Foto af en del
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; c.getContext('2d').fillRect(0, 0, 10, 10); return c.toDataURL('image/png').split(',')[1]; });
  await raekke('Light Gray Brick 1 x 1').locator('.pm-foto input').setInputFiles({ name: 'IMG_1.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="ok"]');
  for (const t of ['Black Brick 1 x 2', 'Light Gray Brick 1 x 2', 'Light Gray Brick 1 x 1', 'Crusader Axe']) await raekke(t).locator('.pm-chk').click();
  await tomUdbakke();
  m = await mock();
  assert.ok(m.lg.dele.filter(d => d.sku === '261110-6086').every(d => d.ok), 'alle ✓ gemt');
  assert.strictEqual(m.lg.fotos['261110-6086|3005|Light Gray Brick 1 x 1'][0].navn, '261110-6086-3005-LIGHTGRAYBRICK1X1.01.jpg');
  await page.waitForFunction(() => !document.getElementById('lg-faerdig').hidden && !document.getElementById('lg-faerdig').disabled);
  await skud('1-liste');

  // Færdig → forhåndsvisning → Overfør
  await page.click('#lg-faerdig');
  await page.waitForFunction(() => /Missing/.test(document.getElementById('lgf-tekst').textContent));
  const tekst = await page.textContent('#lgf-tekst');
  assert.strictEqual(tekst, 'Missing: 1 x Black Brick 1 x 2 (3004)\nLight Gray Brick 1 x 1 (3005): en er misfarvet');
  assert.ok((await page.textContent('#lgf-hvad')).includes('ikke komplet (1 del(e) mangler)'));
  await skud('2-faerdig');
  await page.click('#lgf-ok');
  await tomUdbakke();
  m = await mock();
  const r = m.ind.find(x => x.sku === '261110-6086');
  assert.strictEqual(r.sorteret, true); assert.strictEqual(r.komplet, false);
  assert.strictEqual(r.noter, tekst);
  // Tilbage til klargøring: felterne viser det overførte
  await page.click('#lg-tilbage');
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.ok(await page.isChecked('#k3-sorteret'));
  assert.strictEqual(await page.inputValue('#k3-noter'), tekst);
  assert.ok((await page.textContent('#k3-sorter-info')).startsWith('Sorteret ✓'));

  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl');
  console.log('lgs-e2e: alle tests bestået ✓');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
