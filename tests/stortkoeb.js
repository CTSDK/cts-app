// Stort køb (over 12 sæt) og temafelt i Lager, med simuleret forbindelse (?mock=1).
// Kør: node tests/stortkoeb.js <url> <mappe til skærmbilleder>
const { chromium, devices } = require('playwright');
const assert = require('assert'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/', UD = process.argv[3] || '.';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
  const fejl = []; page.on('pageerror', e => fejl.push(e.message));
  await page.goto(URL + '?mock=1');
  // Testdata: køb 250000 med 20 sæt (4 fra DB med tema + 16 ukendte) og køb 261028 med 2 sæt
  await page.evaluate(() => {
    localStorage.clear();
    const r = (dato, setnr, v) => ({ dato, setnr, vaerdi: v, ovp: false, kilde: '', sorteret: false, fotos: false, klar: false, stand: '', platform: '', noter: '', vejledning: false, komplet: false, listet: false });
    const ind = [r('250000', '6086', 0), r('250000', '10271', 0), r('250000', '41711', 0), r('250000', '10295', 0)];
    for (let i = 0; i < 16; i++) ind.push(r('250000', String(1000 + i * 37), 0));
    ind.push(r('261028', '41714', 50), r('261028', '10271', 50));
    localStorage.setItem('cts.mock', JSON.stringify({ log: [{ dato: '250000', pris: 0 }, { dato: '261028', pris: 600 }], ind, fotos: {}, salg: [] }));
  });
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');

  // Lager: temafelt
  await page.click('.fanebar [data-fane="lager"]');
  await page.waitForFunction(() => document.getElementById('l-antal').textContent.includes('af 22'));
  const temaer = await page.$$eval('#l-tema option', o => o.map(x => x.textContent));
  console.log('temaer:', temaer.join(' | '));
  assert.deepStrictEqual(temaer, ['Alle temaer (22)', 'Castle (1)', 'Creator (3)', 'Friends (2)', 'Uden tema (16)']);
  await page.selectOption('#l-tema', 'Creator');
  assert.strictEqual(await page.locator('.lager-post').count(), 3);
  await page.selectOption('#l-tema', '');
  await page.fill('#l-soeg', 'friend');                          // søgning finder også tema
  assert.strictEqual(await page.locator('.lager-post').count(), 2);
  await page.fill('#l-soeg', '');
  await page.screenshot({ path: path.join(UD, 'lager-tema.png') });

  // Stort køb: søgefelt, ingen knapper før der søges, valgt sæt øverst
  await page.fill('#l-soeg', '250000-6086');
  await page.locator('.lager-post').first().click();
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.ok(await page.isVisible('#k3-find'), 'søgefelt vises ved over 12 sæt');
  assert.strictEqual(await page.locator('#k3-vaelg button').count(), 0, 'ingen knapper før søgning');
  assert.strictEqual(await page.textContent('#k3-sku'), '250000-6086');
  await page.fill('#k3-find', '102');
  assert.strictEqual(await page.locator('#k3-vaelg button').count(), 2, '10271 og 10295');
  await page.locator('#k3-vaelg button', { hasText: '10295' }).click();
  assert.strictEqual(await page.textContent('#k3-sku'), '250000-10295');
  await page.fill('#k3-find', '');
  await page.click('#k3-visalle');
  assert.strictEqual(await page.locator('#k3-vaelg button').count(), 20);
  await page.click('#k3-visalle');
  assert.strictEqual(await page.locator('#k3-vaelg button').count(), 0);
  await page.screenshot({ path: path.join(UD, 'stort-koeb.png') });

  // Lille køb: knapperne som før, intet søgefelt
  await page.click('.fanebar [data-fane="lager"]');
  await page.fill('#l-soeg', '261028-41714');
  await page.locator('.lager-post').first().click();
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.ok(await page.isHidden('#k3-find-boks'));
  assert.strictEqual(await page.locator('#k3-vaelg button').count(), 2);
  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl');
  console.log('stort køb + tema: alle tests OK');
  await browser.close();
})().catch(e => { console.error('FEJL:', e.stack); process.exit(1); });
