// "Tilføj til DB" fra Nyt køb og fra "+ Tilføj sæt" (også uden net), simuleret forbindelse (?mock=1).
// Kør: node tests/tilfoejdb.js <url> <mappe til skærmbilleder>
const { chromium, devices } = require('playwright');
const assert = require('assert'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/', UD = process.argv[3] || '.';
const mock = p => p.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const fejl = []; page.on('pageerror', e => fejl.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto(URL + '?mock=1');
  await page.evaluate(() => {
    localStorage.clear();
    const r = (dato, setnr, v) => ({ dato, setnr, vaerdi: v, ovp: false, kilde: 'eBay', sorteret: false, fotos: false, klar: false, stand: '', platform: '', noter: '', vejledning: false, komplet: false, listet: false });
    localStorage.setItem('cts.mock', JSON.stringify({ log: [{ dato: '261028', pris: 600 }], ind: [r('261028', '10271', 45), r('261028', '41714', 55)], fotos: {}, salg: [] }));
  });
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');

  // 1) Nyt køb side 1: ukendt sæt → Tilføj til DB
  await page.click('.fanebar [data-fane="koeb1"]');
  const inp = page.locator('#k1-linjer .linje input').first();
  await inp.click(); await inp.pressSequentially('31100-1');       // som Rebrickable skriver det
  await page.waitForFunction(() => document.querySelector('#k1-linjer .navn').textContent.includes('Sæt findes ikke'));
  await page.click('#k1-linjer .db-knap');
  await page.waitForSelector('#dbny:not([hidden])');
  assert.strictEqual(await page.textContent('#dbny-nr'), '31100', '"-1" fjernes');
  // temaforslag fra DB
  const forslag = await page.$$eval('#dbny-temaer option', o => o.map(x => x.value));
  assert.ok(forslag.includes('Creator') && forslag.includes('Castle'), 'temaforslag: ' + forslag);
  // påkrævede felter
  await page.fill('#dbny-navn', 'Sports Car'); await page.fill('#dbny-tema', 'Creator'); await page.fill('#dbny-aar', '20');
  await page.click('#dbny-gem');
  assert.ok((await page.textContent('#dbny-fejl')).includes('årstal'));
  await page.fill('#dbny-undertema', 'Creator 3-in-1'); await page.fill('#dbny-aar', '2020');
  await page.screenshot({ path: path.join(UD, 'dbny-form.png') });
  await page.click('#dbny-gem');
  await page.waitForSelector('#dbny', { state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('#k1-linjer .navn').textContent === 'Sports Car (2020)');
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('cts.mock')).db || {})['31100']);
  assert.deepStrictEqual((await mock(page)).db['31100'], ['Sports Car', 'Creator', 'Creator 3-in-1', '2020'], 'gemt i (simuleret) DB');
  await page.screenshot({ path: path.join(UD, 'dbny-koeb1.png') });

  // 2) Uden net: "+ Tilføj sæt" i et køb
  await page.click('.fanebar [data-fane="lager"]');
  await page.fill('#l-soeg', '261028-10271');
  await page.locator('.lager-post').first().click();
  await page.waitForSelector('#v-koeb3:not([hidden])');
  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.click('#k3-tilfoej');
  await page.fill('#ny-setnr', '30343');
  await page.waitForFunction(() => document.getElementById('ny-navn').textContent.includes('Sæt findes ikke'));
  await page.click('#ny-navn .db-knap');
  await page.fill('#dbny-navn', 'McLaren Elva'); await page.fill('#dbny-tema', 'Speed Champions'); await page.fill('#dbny-aar', '2021');
  await page.click('#dbny-gem');
  await page.waitForFunction(() => document.getElementById('ny-navn').textContent.startsWith('McLaren Elva (2021)'));
  assert.ok(!(await mock(page)).db['30343'], 'ikke sendt endnu (offline)');
  // findes allerede → afvises
  await page.fill('#ny-setnr', '31100');
  await page.waitForFunction(() => document.getElementById('ny-navn').textContent.startsWith('Sports Car'));
  await page.click('#ny-annuller');
  // net igen → sendes
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('cts.mock')).db || {})['30343'], null, { timeout: 15000 });
  // genindlæs: ny kopi fra Sheets har stadig begge sæt
  await page.reload(); await page.waitForSelector('#forbindelse.ok');
  await page.click('.fanebar [data-fane="koeb1"]');
  const sidste = page.locator('#k1-linjer .linje input').last();
  await sidste.click(); await sidste.pressSequentially('30343');
  await page.waitForFunction(() => [...document.querySelectorAll('#k1-linjer .navn')].some(e => e.textContent === 'McLaren Elva (2021)'));
  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl: ' + fejl.join(' | '));
  console.log('tilføj til DB: alle tests OK');
  await browser.close();
})().catch(e => { console.error('FEJL:', e.stack); process.exit(1); });
