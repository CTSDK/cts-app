// Playmobil (under Retro): sortering, ✓-regel, "Alle sæt" kun visning, nyt sæt, foto – med simuleret forbindelse (?mock=1).
// Kør: node tests/pm-e2e.js <url> <mappe til skærmbilleder>   (server: python3 -m http.server 8765)
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
  const skud = async n => page.screenshot({ path: path.join(UD, 'pm-' + n + '.png'), fullPage: true });
  const mock = () => page.evaluate(() => (JSON.parse(localStorage.getItem('cts.mock')) || {}).pm);
  const del = (pm, saet, nr) => pm.dele.find(d => d.saet === saet && d.nr === nr);
  const vent = ms => page.waitForTimeout(ms);
  const tomUdbakke = async () => { await vent(1000); for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => Data.poster().length)) === 0) return; await vent(150); } throw new Error('Udbakken blev ikke tom'); };

  await page.goto(URL + '?mock=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#forbindelse.ok');

  await page.click('#v-hjem [data-gaa="retro"]');
  await page.click('#v-retro [data-gaa="pm"]');
  await page.waitForSelector('#v-pm:not([hidden])');
  await page.waitForSelector('#pm-liste .pm-del');
  assert.deepStrictEqual(await page.$$eval('#pm-saet button b', b => b.map(x => x.textContent)), ['Alle sæt', '3315', '5135', '5142']);
  assert.deepStrictEqual(await page.$$eval('#pm-saet button small', b => b.map(x => x.textContent)), ['Sort ridder', 'Piratskib', 'Prinsesseslot']);

  // Alle sæt = kun visning
  assert.ok(await page.isVisible('#pm-ro'));
  assert.ok(await page.locator('#pm-liste .pm-chk').first().isDisabled());
  assert.ok(await page.locator('#pm-liste .note').first().isDisabled());
  assert.ok(await page.isHidden('#pm-fotoboks'));
  await skud('1-alle');

  // Vælg 3315: knapper virker, fotoboks vises
  await page.click('#pm-saet button:has-text("3315")');
  assert.ok(await page.isHidden('#pm-ro'));
  assert.ok(await page.isVisible('#pm-fotoboks'));
  assert.strictEqual(await page.locator('#pm-liste .pm-del').count(), 4);
  assert.strictEqual((await page.textContent('#pm-status')).trim(), '1 af 4 afkrydset');

  // Arm greave (skal være 2): + to gange → grøn kant ("klar"), men IKKE afkrydset
  const greave = page.locator('#pm-liste .pm-del', { hasText: '30 20 1002' });
  await greave.locator('.pm-taeller button').nth(1).click();
  await page.locator('#pm-liste .pm-del', { hasText: '30 20 1002' }).locator('.pm-taeller button').nth(1).click();
  const g2 = page.locator('#pm-liste .pm-del', { hasText: '30 20 1002' });
  assert.strictEqual(await g2.locator('.pm-taeller input').inputValue(), '2');
  assert.ok((await g2.locator('.pm-chk').getAttribute('class')).includes('klar'), 'grøn kant ved 2 af 2');
  assert.strictEqual(await g2.locator('.pm-chk').getAttribute('aria-pressed'), 'false');
  await tomUdbakke();
  let pm = await mock();
  assert.strictEqual(del(pm, '3315', '30 20 1002').fundet, 2);
  assert.strictEqual(del(pm, '3315', '30 20 1002').ok, false);
  assert.ok(await page.evaluate(() => Data.poster().length === 0));

  // Søg "sword" → ✓ → søgefeltet ryddes, markøren står i det, gemt i arket
  await page.fill('#pm-q', 'sword');
  assert.strictEqual(await page.locator('#pm-liste .pm-del').count(), 1);
  await page.locator('#pm-liste .pm-del .pm-chk').click();
  assert.strictEqual(await page.inputValue('#pm-q'), '');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'pm-q');
  await tomUdbakke();
  pm = await mock();
  assert.strictEqual(del(pm, '3315', '30 24 7480').ok, true, '3315-sværdet afkrydset');
  assert.strictEqual(del(pm, '5135', '30 24 7480').ok, false, 'samme nr. i 5135 ikke rørt');

  // Saddel mangler: ✓ med 0 fundet = færdig; note gemmes
  const sadel = page.locator('#pm-liste .pm-del', { hasText: '30 24 8540' });
  await sadel.locator('.note').fill('blå sadel mangler');
  await sadel.locator('.note').blur();
  await page.locator('#pm-liste .pm-del', { hasText: '30 24 8540' }).locator('.pm-chk').click();
  await tomUdbakke();
  pm = await mock();
  assert.strictEqual(del(pm, '3315', '30 24 8540').note, 'blå sadel mangler');
  assert.strictEqual(del(pm, '3315', '30 24 8540').ok, true);
  assert.strictEqual((await page.textContent('#pm-status')).trim(), '3 af 4 afkrydset');
  await skud('2-3315');

  // Filter "Mangler"
  await page.click('[data-pmfilter="mangler"]');
  assert.strictEqual(await page.locator('#pm-liste .pm-del').count(), 1);
  await page.click('[data-pmfilter="alle"]');

  // Nyt sæt "Div" → én note-linje, kan få note og foto
  await page.click('#pm-nyt');
  await page.fill('#pmny-navn', '3315');
  await page.click('#pmny-gem');
  assert.ok((await page.textContent('#pmny-fejl')).includes('findes allerede'));
  await page.fill('#pmny-navn', 'Div');
  await page.click('#pmny-gem');
  await page.waitForSelector('#pmny', { state: 'hidden' });
  await tomUdbakke();
  pm = await mock();
  const div = pm.dele.find(d => d.saet === 'Div');
  assert.ok(div && div.nr === '' && div.skal === null, 'Div oprettet som note-linje');
  assert.strictEqual(pm.dele[pm.dele.length - 1].saet, '5142', 'sidste række er stadig 5142');
  assert.ok((await page.getAttribute('#pm-saet button.til', 'aria-pressed')) === 'true');
  assert.strictEqual(await page.textContent('#pm-saet button.til'), 'Div', 'Div uden navn under');
  assert.strictEqual(await page.locator('#pm-liste .pm-del .pm-chk').count(), 0, 'ingen ✓ på Div');
  await page.locator('#pm-liste .pm-del .note').fill('3 hjelme, 1 hest, diverse våben');
  await page.locator('#pm-liste .pm-del .note').blur();
  await tomUdbakke();
  pm = await mock();
  assert.strictEqual(pm.dele.find(d => d.saet === 'Div').note, '3 hjelme, 1 hest, diverse våben');

  // Foto til Div (fil-knap → beskæring → udbakke → mock-Drive)
  await page.evaluate(() => { document.getElementById('pm-fotoboks').open = true; });
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 1200; c.height = 900; c.getContext('2d').fillRect(0, 0, 10, 10); return c.toDataURL('image/png').split(',')[1]; });
  await page.setInputFiles('#pm-fil', { name: 'IMG_0001.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForSelector('.beskaer:not([hidden])');
  await page.click('[data-b="ok"]');
  await tomUdbakke();
  pm = await mock();
  assert.strictEqual((pm.fotos.Div || []).length, 1);
  assert.strictEqual(pm.fotos.Div[0].navn, 'PM-DIV.01.jpg');
  await vent(300);
  assert.ok((await page.textContent('#pm-fototitel')).includes('1 i Drive'));
  await skud('3-div');

  // Offline: ændring venter i udbakken og vises med det samme; sendes når net kommer igen
  await page.click('#pm-saet button:has-text("5135")');
  await ctx.setOffline(true);
  await page.locator('#pm-liste .pm-del', { hasText: '30 28 2120' }).locator('.pm-taeller button').nth(1).click();
  await vent(900);
  assert.strictEqual(await page.locator('#pm-liste .pm-del', { hasText: '30 28 2120' }).locator('.pm-taeller input').inputValue(), '14');
  assert.ok(await page.evaluate(() => Data.poster().some(p => p.type === 'pmGem')));
  await ctx.setOffline(false);
  await page.evaluate(() => { window.dispatchEvent(new Event('online')); });
  await tomUdbakke();
  pm = await mock();
  assert.strictEqual(del(pm, '5135', '30 28 2120').fundet, 14);

  assert.deepStrictEqual(fejl, [], 'ingen JS-fejl');
  console.log('pm-e2e: alle tests bestået ✓');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
