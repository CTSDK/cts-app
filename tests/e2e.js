// Gennemløb af batch 261028 med simuleret forbindelse (?mock=1).
// Kør: node tests/e2e.js <url> <mappe til skærmbilleder>
const { chromium, devices } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/';
const UD = process.argv[3] || 'test-output';
fs.mkdirSync(UD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], permissions: ['camera', 'clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const fejl = [];
  page.on('pageerror', e => fejl.push(e.message));
  page.on('dialog', d => d.accept());
  const skud = async n => page.screenshot({ path: path.join(UD, n + '.png'), fullPage: true });

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');
  await skud('1-forside');

  // Side 1
  await page.click('[data-gaa="koeb1"]');
  await page.fill('#k1-dato', '2026-10-28');
  await page.fill('#k1-pris', '600');
  assert.strictEqual(await page.textContent('#k1-batch'), '261028');
  for (const nr of ['10271', '10295', '41711', '41714']) {
    const felter = page.locator('#k1-linjer .linje input');
    const sidste = felter.nth((await felter.count()) - 1);
    await sidste.click();
    await sidste.pressSequentially(nr, { delay: 30 });
  }
  await page.waitForFunction(() => [...document.querySelectorAll('#k1-linjer .navn')].filter(e => e.classList.contains('fundet')).length === 4);
  assert.strictEqual(await page.locator('#k1-linjer .linje').count(), 5, 'ny tom linje efter sidste sæt');
  await skud('2-side1');
  await page.click('#k1-faerdig');

  // Side 2
  await page.waitForSelector('#v-koeb2:not([hidden])');
  assert.strictEqual(await page.locator('.ikke-off').count(), 4, 'alle fire: Ikke offentliggjort');
  const vaerdier = ['45', '75', '40', '55'];
  const poster = page.locator('#k2-liste .post');
  for (let i = 0; i < 4; i++) {
    await poster.nth(i).locator('input').fill(vaerdier[i]);
    await poster.nth(i).locator('select').selectOption('BrickLink');
  }
  const kp = await page.$$eval('[data-kp]', els => els.map(e => e.textContent));
  assert.deepStrictEqual(kp, ['125,58 kr', '209,30 kr', '111,63 kr', '153,49 kr']);
  assert.strictEqual(await page.textContent('#k2-sum'), '600,00 kr ✓');
  await skud('3-side2');
  await page.click('#k2-gem');

  // Side 3
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.strictEqual(await page.textContent('#k3-sku'), '261028-10271');
  assert.ok((await page.textContent('#k3-info')).includes('125,58'));
  assert.ok(await page.isDisabled('#k3-klar'), 'Klar er låst før krav er opfyldt');
  await page.click('#k3-start');
  await page.waitForFunction(() => document.getElementById('k3-video').videoWidth > 0);
  // Foto 1: beskær ved at trække hjørnet nederst til højre ind
  await page.click('#k3-tag');
  await page.waitForSelector('.beskaer:not([hidden])');
  await skud('4a-beskaer');
  const h = await page.locator('.b-ramme i[data-h="se"]').boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x - 80, h.y - 60, { steps: 5 });
  await page.mouse.up();
  // flyt rammen
  const rb = await page.locator('.b-ramme').boundingBox();
  await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2);
  await page.mouse.down(); await page.mouse.move(rb.x + rb.width / 2 + 20, rb.y + rb.height / 2 + 10, { steps: 3 }); await page.mouse.up();
  await page.click('[data-b="ok"]');
  await page.waitForSelector('.beskaer', { state: 'hidden' });
  // Foto 2: hele billedet
  await page.click('#k3-tag');
  await page.click('[data-b="hele"]');
  await page.click('[data-b="ok"]');
  // Reserve: fil-input – først "Tag om" (må ikke gemmes), så igen med OK
  const jpg = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 3000; c.height = 2000; c.getContext('2d').fillRect(0, 0, 10, 10); return c.toDataURL('image/png').split(',')[1]; });
  const fil = { name: 'IMG_0001.png', mimeType: 'image/png', buffer: Buffer.from(jpg, 'base64') };
  await page.setInputFiles('#k3-fil', fil);
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="om"]');
  await page.setInputFiles('#k3-fil', fil);
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="ok"]');
  await page.waitForFunction(() => document.querySelectorAll('#k3-fotos .foto.ok').length === 3);
  const navne = await page.$$eval('#k3-fotos .foto span', e => e.map(x => x.textContent));
  assert.deepStrictEqual(navne, ['.01.jpg', '.02.jpg', '.03.jpg']);
  const maal = await page.$$eval('#k3-fotos .foto img', e => e.map(x => [x.naturalWidth, x.naturalHeight]));
  console.log('fotomål (px):', JSON.stringify(maal));
  // miniaturer: foto 1 er beskåret (andet format end hele billedet i foto 2)
  assert.ok(Math.abs(maal[0][0] / maal[0][1] - maal[1][0] / maal[1][1]) > 0.05, 'foto 1 er beskåret');
  assert.ok(maal.every(m => Math.max(...m) <= 240), 'miniaturer er små');
  const stoerrelse = await page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')).fotos['261028-10271'].map(f => f.kb));
  console.log('fotostørrelser (KB):', stoerrelse.join(', '));
  await page.click('#k3-plus');
  await page.check('#k3-sorteret', { force: true });
  await page.check('#k3-vejledning', { force: true });
  await page.fill('#k3-noter', 'Komplet, med manual');
  await skud('4-side3');
  assert.ok(!(await page.isDisabled('#k3-klar')));
  await page.click('#k3-klar');
  await page.waitForFunction(() => document.getElementById('k3-status').textContent.includes('Klar til salg'));
  // skift til næste sæt
  await page.locator('#k3-vaelg button').nth(1).click();
  assert.strictEqual(await page.textContent('#k3-sku'), '261028-10295');
  assert.ok(await page.isDisabled('#k3-klar'));
  await skud('5-side3-naeste');

  // Lager
  await page.click('#k3-tilbage');
  await page.click('[data-gaa="lager"]');
  await page.waitForFunction(() => document.getElementById('l-antal').textContent.includes('af 4'));
  await page.click('[data-filter="klar"]');
  assert.strictEqual(await page.locator('.lager-post').count(), 1);
  await page.click('[data-filter="ebay"]');
  assert.strictEqual(await page.locator('.lager-post').count(), 1);
  await page.click('[data-filter="ikke"]');
  assert.strictEqual(await page.locator('.lager-post').count(), 3);
  await page.click('[data-filter="alle"]');
  await page.fill('#l-soeg', 'porsche');
  assert.strictEqual(await page.locator('.lager-post').count(), 1);
  await page.fill('#l-soeg', '');
  // nummerorden: 10271, 10295, 41711, 41714
  const raekkefoelge = await page.$$eval('.lager-post .mono', e => e.map(x => x.textContent.split('-')[1]));
  assert.deepStrictEqual(raekkefoelge, ['10271', '10295', '41711', '41714'], 'lager i nummerorden');
  assert.ok(await page.locator('.fanebar [data-fane="lager"].til').count() === 1, 'Lager-fanen er markeret');
  await skud('6-lager');
  // menubjælken: Mere → Indstillinger → tilbage til Mere
  await page.click('.fanebar [data-fane="mere"]');
  await page.waitForSelector('#v-mere:not([hidden])');
  await page.click('#v-mere [data-gaa="indstillinger"]');
  await page.click('#v-indstillinger .tilbage');
  await page.waitForSelector('#v-mere:not([hidden])');
  await page.click('.fanebar [data-fane="lager"]');

  // Registrér salg (online): 10295 for 100 € + 10 € fragt, 5 € gebyr
  await page.click('.top .tilbage >> visible=true');
  await page.click('[data-gaa="salg"]');
  await page.fill('#s-dato', '2026-11-05');
  await page.fill('#s-koeber', 'Kaarst, Tyskland');
  await page.fill('#s-ordrenr', '05-11111-22222');
  const sv = page.locator('#s-varer .vare .sku').first();
  await sv.click(); await sv.pressSequentially('10295');          // setnr alene skal finde SKU'et
  await page.locator('#s-varer .vare .pris').first().fill('100');
  await page.fill('#s-fragtind', '10'); await page.fill('#s-gebyr', '5');
  await page.waitForFunction(() => document.querySelector('#s-varer .vare .info').classList.contains('fundet'));
  assert.strictEqual(await page.textContent('#s-sum'), '110,00 €');
  assert.strictEqual(await page.textContent('#s-fortj'), 'ca. 574,00 kr');
  await skud('6b-salg');
  await page.click('#s-gem');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('cts.mock')).salg.length === 1);
  await page.waitForFunction(() => document.getElementById('netbar').hidden);
  await page.click('.top .tilbage >> visible=true');
  await page.click('[data-gaa="lager"]');
  await page.fill('#l-soeg', '10295');
  // solgte sæt vises ikke i Lager
  await page.waitForFunction(() => document.getElementById('l-antal').textContent.startsWith('0 af 3'));
  await page.fill('#l-soeg', '');
  // Solgt sæt kan ikke sælges igen
  await page.click('.top .tilbage >> visible=true');
  await page.click('[data-gaa="salg"]');
  const sv2 = page.locator('#s-varer .vare .sku').first(); await sv2.fill('261028-10295');
  await page.waitForFunction(() => document.querySelector('#s-varer .vare .info').textContent.includes('allerede solgt'));
  await page.click('#s-ny');

  // ===== Ret køb: tilføj, ret, fjern =====
  await page.click('.top .tilbage >> visible=true');
  await page.click('[data-gaa="lager"]');
  await page.fill('#l-soeg', '10271');
  await page.locator('.lager-post').first().click();
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.ok((await page.textContent('#k3-koeb')).includes('åbent'), 'købet er åbent');
  await page.click('#k3-tilfoej');
  await page.fill('#ny-setnr', '6086');
  await page.waitForFunction(() => document.getElementById('ny-navn').textContent.includes("Black Knight"));
  assert.strictEqual(await page.inputValue('#ny-vaerdi'), '300', 'egne salg med OVP → højeste pris');
  await skud('6c-tilfoej');
  await page.click('#ny-gem');
  await page.waitForFunction(() => document.getElementById('k3-sku').textContent === '261028-6086');
  assert.strictEqual(await page.locator('#k3-vaelg button').count(), 5);
  let mock = await page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  let sum = mock.ind.filter(r => r.dato === '261028').reduce((a, r) => a + r.koebspris, 0);
  assert.ok(Math.abs(sum - 600) < 0.05, 'batchprisen fordeles stadig til 600 kr: ' + sum);
  // Ret: OVP fra → værdi bliver gennemsnit (275)
  await page.click('#k3-ret');
  await page.click('[data-ret-ovp="0"]');
  await page.fill('#ret-vaerdi', '275');
  await page.click('#ret-gem');
  await page.waitForFunction(() => document.getElementById('k3-info').textContent.startsWith('Uden æske'));
  // Fjern
  await page.click('#k3-fjern');
  await page.waitForFunction(() => document.querySelectorAll('#k3-vaelg button').length === 4);
  mock = await page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  assert.ok(!mock.ind.some(r => r.setnr === '6086' && r.dato === '261028'), '6086 er fjernet');

  // ===== Listings =====
  await page.locator('#k3-vaelg button', { hasText: '10271' }).click();
  await page.click('#k3-lav-listings');
  await page.waitForFunction(() => document.getElementById('k3-listing-besked').textContent.includes('1 sæt'));
  assert.ok(!(await page.isHidden('#k3-listing')));
  assert.ok((await page.textContent('#lt-titel')).startsWith('LEGO Creator 10271'));
  await page.locator('[data-kopier="titel"]').click();
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('Kopieret'));
  await skud('6d-listing');
  await page.check('#k3-listet', { force: true });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('cts.mock')).ind.find(r => r.sku === '261028-10271').listet === true);
  await page.click('#k3-lav-listings');
  await page.waitForFunction(() => document.getElementById('k3-listing-besked').textContent.includes('Ingen sæt'));
  await page.uncheck('#k3-listet', { force: true });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('cts.mock')).ind.find(r => r.sku === '261028-10271').listet === false);
  await page.click('#k3-tilbage');

  // Samme batch igen skal afvises
  await page.click('.top .tilbage >> visible=true');
  await page.click('[data-gaa="koeb1"]');
  await page.fill('#k1-dato', '2026-10-28'); await page.fill('#k1-pris', '100');
  const f = page.locator('#k1-linjer .linje input').first(); await f.click(); await f.pressSequentially('6086');
  await page.waitForSelector('#k1-linjer .navn.fundet');
  await page.click('#k1-faerdig');
  assert.ok((await page.textContent('#k2-liste')).includes('Egne salg'), 'egne salg fra lokal kopi');
  await page.click('#k2-gem');
  await page.waitForFunction(() => document.getElementById('k2-fejl').textContent.includes('findes allerede'));
  await page.evaluate(() => localStorage.removeItem('cts.kladde'));

  // ================= OFFLINE =================
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto(URL + '?mock=1');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.reload();                                   // appen skal starte uden net (service worker)
  await page.waitForSelector('#v-forside:not([hidden])');
  await page.waitForFunction(() => document.getElementById('netbar').textContent.includes('Offline'));
  await skud('7-offline-forside');
  // Lager fra kopien
  await page.click('[data-gaa="lager"]');
  await page.waitForFunction(() => document.getElementById('l-antal').textContent.includes('af 3'));
  await page.fill('#l-soeg', '41711');
  await page.locator('.lager-post').first().click();
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.strictEqual(await page.textContent('#k3-sku'), '261028-41711');
  // Foto offline (telefonens kamera-knap) → beskær → venter
  await page.setInputFiles('#k3-fil', fil);
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="ok"]');
  await page.waitForFunction(() => [...document.querySelectorAll('#k3-fotos .foto span')].some(e => e.textContent === 'venter'));
  await page.click('#k3-plus');
  await page.check('#k3-sorteret', { force: true });
  assert.ok(!(await page.isDisabled('#k3-klar')), 'Klar kan vælges med foto der venter');
  await page.click('#k3-klar');
  await page.waitForFunction(() => document.getElementById('k3-status').textContent.includes('sendes, når der er net'));
  await skud('8-offline-klargoer');
  // Nyt køb offline med lokal sæt-database
  await page.click('#k3-tilbage');
  await page.click('.top .tilbage >> visible=true');
  await page.click('[data-gaa="koeb1"]');
  await page.fill('#k1-dato', '2026-11-06'); await page.fill('#k1-pris', '500');
  const g = page.locator('#k1-linjer .linje input').first(); await g.click(); await g.pressSequentially('6086');
  await page.waitForSelector('#k1-linjer .navn.fundet');
  await page.click('#k1-faerdig');
  assert.strictEqual(await page.textContent('[data-kp]'), '500,00 kr');
  await page.click('#k2-gem');
  await page.waitForSelector('#v-koeb3:not([hidden])');
  assert.strictEqual(await page.textContent('#k3-sku'), '261106-6086');
  // Salg offline
  await page.click('#k3-tilbage');
  await page.click('[data-gaa="salg"]');
  await page.fill('#s-dato', '2026-11-06'); await page.fill('#s-koeber', 'Graz, Østrig');
  const so = page.locator('#s-varer .vare .sku').first(); await so.click(); await so.pressSequentially('261028-41714');
  await page.locator('#s-varer .vare .pris').first().fill('60');
  await page.click('#s-gem');
  await page.waitForFunction(() => /4 venter/.test(document.getElementById('netbar').textContent));
  // Udbakken overlever genstart uden net
  await page.reload();
  await page.waitForFunction(() => /4 venter/.test(document.getElementById('netbar').textContent));
  await page.click('#netbar');
  await page.waitForSelector('#v-udbakke:not([hidden])');
  assert.strictEqual(await page.locator('#u-liste .post').count(), 4);
  await skud('9-udbakke');
  // Net tilbage → alt sendes i rækkefølge
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => document.getElementById('u-antal').textContent.includes('Alt er sendt'), null, { timeout: 30000 });
  const lagret = await page.evaluate(() => JSON.parse(localStorage.getItem('cts.mock')));
  assert.strictEqual(lagret.fotos['261028-41711'].length, 1, 'offline-foto sendt');
  assert.ok(lagret.ind.find(r => r.sku === '261028-41711').klar, 'klar sendt');
  assert.ok(lagret.log.some(l => l.dato === '261106'), 'offline-batch sendt');
  assert.ok(lagret.salg.some(x => x.sku === '261028-41714'), 'offline-salg sendt');

  // Ingen vandret scroll
  const bred = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert.ok(bred, 'ingen vandret scroll');
  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl');
  console.log('e2e: alle tests OK');
  await browser.close();
})().catch(e => { console.error('FEJL:', e.stack); process.exit(1); });
