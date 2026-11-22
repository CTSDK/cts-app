// Lego-sortering v28: knappen "Alle" pr. del og "Alt i orden – kryds resten af" for hele sættet (maskinrum 2.5.3: lgGemAlle).
// Simuleret forbindelse (?mock=1). Kør: node tests/lgs-alle-e2e.js <url> <mappe>   (server: python3 -m http.server 8765)
const { chromium, devices } = require('playwright');
const assert = require('assert'), fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/';
const UD = process.argv[3] || 'test-output';
fs.mkdirSync(UD, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const fejl = [], dialoger = [];
  page.on('pageerror', e => fejl.push(e.message));
  page.on('dialog', d => { dialoger.push(d.message()); d.accept(); });
  const skud = async n => page.screenshot({ path: path.join(UD, 'lgs-alle-' + n + '.png'), fullPage: true });
  const mock = () => page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  const vent = ms => page.waitForTimeout(ms);
  const tomUdbakke = async () => { await vent(1000); for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => Data.poster().length)) === 0) return; await vent(150); } throw new Error('Udbakken blev ikke tom'); };
  const raekke = t => page.locator('#lg-liste .pm-del', { hasText: t });
  const del = (m, t) => m.lg.dele.find(d => d.del === t);

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');
  await page.evaluate(async () => {
    await Api.kald('opretBatch', { dato: '261110', pris: 100, saet: [{ setnr: '6086', vaerdi: 140, ovp: false, kilde: 'BrickLink' }] });
    await Data.hentAlt();
  });
  await page.evaluate(() => CTS.aabnKlargoering('261110', '261110-6086'));
  await page.waitForSelector('#v-koeb3:not([hidden])');
  await page.click('#k3-sorter');
  await page.waitForSelector('#lg-liste .pm-del');
  assert.strictEqual((await page.textContent('#lg-alle')).trim(), 'Alt i orden – kryds resten af (5)');
  assert.ok(await page.isVisible('#lg-alle'));

  // "Alle" på én del: antal = skal være og ✓ i ét tryk; søgefeltet ryddes og får fokus
  await page.fill('#lg-q', '3004');
  await raekke('Black Brick 1 x 2').locator('.lg-fuld').click();
  assert.strictEqual(await page.inputValue('#lg-q'), '');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'lg-q');
  await tomUdbakke();
  let m = await mock();
  assert.strictEqual(del(m, 'Black Brick 1 x 2').fundet, 10);
  assert.strictEqual(del(m, 'Black Brick 1 x 2').ok, true);
  assert.strictEqual(del(m, 'Light Gray Brick 1 x 2').ok, false);

  // En del med mangel + note krydses af manuelt
  const f = raekke('Light Gray Brick 1 x 1').locator('.pm-taeller input'); await f.fill('3'); await f.blur();
  await raekke('Light Gray Brick 1 x 1').locator('.note').fill('en er misfarvet');
  await raekke('Light Gray Brick 1 x 1').locator('.note').blur();
  await raekke('Light Gray Brick 1 x 1').locator('.pm-chk').click();
  await tomUdbakke();
  assert.strictEqual((await page.textContent('#lg-alle')).trim(), 'Alt i orden – kryds resten af (3)');
  await skud('1-foer');

  // Alt i orden uden net → bekræft → vises med det samme fra udbakken; sendes, når nettet er tilbage
  await ctx.setOffline(true);
  await page.waitForFunction(() => Data.status().online === false);
  // Alt i orden → bekræft → resten (3) får fuldt antal og ✓; afkrydsede dele og noter røres ikke
  await page.click('#lg-alle');
  assert.ok(/De 3 dele, der ikke er krydset af/.test(dialoger[0]), dialoger[0]);
  await page.waitForFunction(() => document.getElementById('lg-status').textContent.trim() === '5 af 5 afkrydset', null, { timeout: 1500 });
  assert.ok(await page.isHidden('#lg-alle'));
  assert.strictEqual(await page.evaluate(() => Data.poster().filter(p => p.type === 'lgGemAlle').length), 1, 'venter i udbakken');
  assert.ok(await page.isDisabled('#lg-faerdig'), 'Færdig venter på at alt er gemt');
  await ctx.setOffline(false);
  await tomUdbakke();
  m = await mock();
  const dele = m.lg.dele.filter(d => d.sku === '261110-6086');
  assert.ok(dele.every(d => d.ok), 'alle ✓ gemt');
  assert.strictEqual(del(m, 'Light Gray Brick 1 x 2').fundet, 89);
  assert.strictEqual(del(m, 'Black Horse Saddle with Clip').fundet, 1);
  assert.strictEqual(del(m, 'Crusader Axe - Blue Legs with Black Hips').fundet, 2);
  assert.strictEqual(del(m, 'Light Gray Brick 1 x 1').fundet, 3, 'manuelt talt del røres ikke');
  assert.strictEqual(del(m, 'Light Gray Brick 1 x 1').note, 'en er misfarvet');
  await page.waitForFunction(() => !document.getElementById('lg-faerdig').hidden && !document.getElementById('lg-faerdig').disabled);
  assert.strictEqual((await page.textContent('#lg-status')).trim(), '5 af 5 afkrydset');
  await skud('2-efter');

  // Færdig → kun den manuelle mangel står i teksten
  await page.click('#lg-faerdig');
  await page.waitForFunction(() => /Missing/.test(document.getElementById('lgf-tekst').textContent));
  assert.strictEqual(await page.textContent('#lgf-tekst'), 'Missing: 1 x Light Gray Brick 1 x 1 (3005)\nLight Gray Brick 1 x 1 (3005): en er misfarvet');

  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl');
  console.log('lgs-alle-e2e: alle tests bestået ✓');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
