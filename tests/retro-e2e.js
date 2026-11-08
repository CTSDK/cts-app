// Retro Design: nyt køb + klargøring med foto, med simuleret forbindelse (?mock=1).
// Kør: node tests/retro-e2e.js <url> <mappe til skærmbilleder>   (server: python3 -m http.server 8765)
const { chromium, devices } = require('playwright');
const assert = require('assert'), fs = require('fs'), path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/';
const UD = process.argv[3] || 'test-output';
fs.mkdirSync(UD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], permissions: ['camera'] });
  const page = await ctx.newPage();
  const fejl = [];
  page.on('pageerror', e => fejl.push(e.message));
  page.on('dialog', d => d.accept());
  const skud = async n => page.screenshot({ path: path.join(UD, 'retro-' + n + '.png'), fullPage: true });
  const mock = () => page.evaluate(() => (JSON.parse(localStorage.getItem('cts.mock')) || {}).retro);
  const skuer = () => page.$$eval('#rk1-skuer .rsku', e => e.map(x => x.textContent));

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');

  // Hjem → Retro Design
  assert.ok((await page.textContent('#v-hjem [data-gaa="retro"]')).includes('Køb og klargøring'));
  await page.click('#v-hjem [data-gaa="retro"]');
  await page.waitForSelector('#v-retro:not([hidden])');
  assert.strictEqual(await page.locator('#v-retro .kort:disabled').count(), 2, 'Lager og Salg kommer senere');
  await skud('1-retro');
  await page.click('#v-retro [data-gaa="rk1"]');
  await page.waitForSelector('#v-rk1:not([hidden])');

  // Side 1: 3× Raadvad 294 (ny producent, kode RV) + 1 lampe uden producent
  await page.fill('#rk1-dato', '2026-11-08');
  await page.fill('#rk1-pris', '400');
  await page.fill('#rk1-hvor', 'Loppemarked');
  const l1 = page.locator('#rk1-linjer .rlinje').nth(0);
  await l1.locator('.rl-type').selectOption('Brødskærer');
  await l1.locator('.rl-producent').fill('Raadvad');
  assert.ok((await l1.locator('.rl-info').textContent()).includes('Ny producent'));
  await l1.locator('.rl-kode').pressSequentially('rv');
  assert.strictEqual(await l1.locator('.rl-kode').inputValue(), 'RV', 'kode med store bogstaver');
  await l1.locator('.rl-model').fill('294');
  await l1.locator('.rl-antal').fill('3');
  await page.click('#rk1-ny-linje');
  const l2 = page.locator('#rk1-linjer .rlinje').nth(1);
  await l2.locator('.rl-type').selectOption('Lampe');
  assert.ok(await l2.locator('.rl-kode').isDisabled(), 'kode er slået fra uden producent');
  assert.deepStrictEqual(await skuer(), ['R261108-RV294-a', 'R261108-RV294-b', 'R261108-RV294-c', 'R261108-LAMPE']);
  assert.ok((await page.textContent('#rk1-pr-ting')).includes('4 ting · købspris ca. 100,00 kr'));
  // "Andet" giver fritekst
  await l2.locator('.rl-type').selectOption('Andet');
  assert.ok(await l2.locator('.rl-andet').isVisible());
  await l2.locator('.rl-andet').fill('Skål');
  assert.strictEqual((await skuer())[3], 'R261108-SKAAL');
  await l2.locator('.rl-type').selectOption('Lampe');
  assert.strictEqual((await skuer())[3], 'R261108-LAMPE');
  await skud('2-side1');
  await page.click('#rk1-gem');

  // Side 2: klargør
  await page.waitForSelector('#v-rk2:not([hidden])');
  assert.strictEqual(await page.textContent('#rk2-sku'), 'R261108-RV294-a');
  assert.strictEqual(await page.textContent('#rk2-navn'), 'Brødskærer Raadvad 294');
  await page.waitForFunction(() => document.getElementById('netbar').hidden);   // købet er sendt
  assert.ok((await page.textContent('#rk2-info')).includes('Købspris 100,00 kr · På lager'));
  assert.deepStrictEqual(await page.$$eval('#rk2-vaelg button', e => e.map(x => x.textContent)), ['RV294-a', 'RV294-b', 'RV294-c', 'LAMPE']);
  let r = await mock();
  assert.deepStrictEqual(r.maerker, [{ producent: 'Raadvad', kode: 'RV' }], 'ny producent gemt i Mærker');
  assert.deepStrictEqual(r.ting.map(t => t.koebspris), [100, 100, 100, 100]);
  assert.strictEqual(r.log[0].hvorKoebt, 'Loppemarked');

  // Live-kamera + foto via fil-input (beskæring som Lego)
  await page.click('#rk2-start');
  await page.waitForFunction(() => document.getElementById('rk2-video').videoWidth > 0);
  await page.click('#rk2-tag');
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="hele"]');
  await page.click('[data-b="ok"]');
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 2000; c.height = 1500; c.getContext('2d').fillRect(0, 0, 10, 10); return c.toDataURL('image/png').split(',')[1]; });
  await page.setInputFiles('#rk2-fil', { name: 'IMG_0002.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="ok"]');
  await page.waitForFunction(() => document.querySelectorAll('#rk2-fotos .foto.ok').length === 2);
  assert.deepStrictEqual(await page.$$eval('#rk2-fotos .foto span', e => e.map(x => x.textContent)), ['.01.jpg', '.02.jpg']);

  await page.fill('#rk2-designer', 'Raadvad');
  await page.fill('#rk2-farve', 'Brun');
  await page.fill('#rk2-kendetegn', 'RAADVAD-logo på armen');
  await page.selectOption('#rk2-stand', '8');
  await page.fill('#rk2-arbejde', 'Rengjort og olieret');
  await page.check('#rk2-klar', { force: true });
  await skud('3-side2');
  await page.click('#rk2-gem');
  await page.waitForFunction(() => document.getElementById('rk2-status').textContent.includes('Gemt'));
  await page.waitForFunction(() => document.getElementById('netbar').hidden);
  r = await mock();
  const a = r.ting.find(t => t.sku === 'R261108-RV294-a');
  assert.deepStrictEqual([a.farve, a.kendetegn, a.stand, a.arbejde, a.klar, a.fotos], ['Brun', 'RAADVAD-logo på armen', '8', 'Rengjort og olieret', true, true]);
  assert.strictEqual(r.fotos['R261108-RV294-a'].length, 2, 'to fotos i Drive (simuleret)');
  assert.ok((await page.textContent('#rk2-vaelg button.til')).startsWith('✓'), 'klar-mærke på knappen');

  // Skift ting: ændringer gemmes automatisk
  await page.locator('#rk2-vaelg button').nth(1).click();
  assert.strictEqual(await page.textContent('#rk2-sku'), 'R261108-RV294-b');
  assert.strictEqual(await page.inputValue('#rk2-farve'), '');
  await page.fill('#rk2-farve', 'Rød');
  await page.locator('#rk2-vaelg button').nth(3).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('cts.mock')).retro.ting.find(t => t.sku === 'R261108-RV294-b').farve === 'Rød');
  assert.strictEqual(await page.textContent('#rk2-sku'), 'R261108-LAMPE');

  // Offline: klargøring venter i udbakken og sendes, når der er net
  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.fill('#rk2-noter', 'Skærm med lille bule');
  await page.click('#rk2-gem');
  await page.waitForFunction(() => document.getElementById('rk2-status').textContent.includes('sendes, når der er net'));
  await page.waitForFunction(() => /1 venter/.test(document.getElementById('netbar').textContent));
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => document.getElementById('netbar').hidden, null, { timeout: 30000 });
  assert.strictEqual((await mock()).ting.find(t => t.sku === 'R261108-LAMPE').noter, 'Skærm med lille bule');

  // Tilføj til samme køb: kendt producent → koden udfyldes; lampen får -a, den nye -b; pris lægges til
  await page.click('#v-rk2 .tilbage');
  await page.click('#v-retro [data-gaa="rk1"]');
  await page.fill('#rk1-dato', '2026-11-08');
  await page.fill('#rk1-pris', '100');
  const n1 = page.locator('#rk1-linjer .rlinje').nth(0);
  await n1.locator('.rl-producent').fill('raadvad');
  assert.strictEqual(await n1.locator('.rl-kode').inputValue(), 'RV', 'kendt kode udfyldt');
  assert.ok(await n1.locator('.rl-kode').evaluate(e => e.readOnly));
  await n1.locator('.rl-model').fill('294');
  await page.click('#rk1-ny-linje');
  await page.locator('#rk1-linjer .rlinje').nth(1).locator('.rl-type').selectOption('Lampe');
  assert.deepStrictEqual(await skuer(), ['R261108-RV294-d', 'R261108-LAMPE-b']);
  assert.ok((await page.textContent('#rk1-skuer')).includes('R261108-LAMPE → R261108-LAMPE-a'));
  await page.click('#rk1-gem');                       // bekræftelse ("findes allerede – tilføj?") accepteres
  await page.waitForSelector('#v-rk2:not([hidden])');
  await page.waitForFunction(() => document.getElementById('netbar').hidden);
  assert.strictEqual(await page.textContent('#rk2-sku'), 'R261108-RV294-d');
  r = await mock();
  assert.deepStrictEqual(r.ting.map(t => t.sku), ['R261108-RV294-a', 'R261108-RV294-b', 'R261108-RV294-c', 'R261108-LAMPE-a', 'R261108-RV294-d', 'R261108-LAMPE-b']);
  assert.strictEqual(r.log[0].pris, 500);
  assert.deepStrictEqual(r.ting.map(t => t.koebspris), [83.33, 83.33, 83.33, 83.33, 83.33, 83.35]);
  assert.strictEqual(r.ting.find(t => t.sku === 'R261108-LAMPE-a').noter, 'Skærm med lille bule', 'omdøbt lampe beholder klargøring');
  assert.strictEqual(r.maerker.length, 1, 'ingen dublet i Mærker');
  assert.deepStrictEqual(await page.$$eval('#rk2-vaelg button', e => e.map(x => x.textContent)), ['✓ RV294-a', 'RV294-b', 'RV294-c', 'LAMPE-a', 'RV294-d', 'LAMPE-b']);
  await skud('4-tilfoejet');

  // Udbakken er tom, ingen fejl, ingen vandret scroll
  await page.click('.fanebar [data-fane="mere"]');
  await page.click('#v-mere [data-gaa="udbakke"]');
  assert.ok((await page.textContent('#u-antal')).includes('Alt er sendt'));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'ingen vandret scroll');
  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl');
  console.log('retro-e2e: alle tests OK');
  await browser.close();
})().catch(e => { console.error('FEJL:', e.stack); process.exit(1); });
