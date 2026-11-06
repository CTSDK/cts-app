// Ny installation: Hjem viser "Ikke forbundet" → Indstillinger → Hjem skal vise "✓ Forbundet".
// Google-svarene simuleres. Kør: node tests/forbindelse.js <url>
const { chromium, devices } = require('playwright'); const assert = require('assert');
const URL = process.argv[2] || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  const fejl = []; page.on('pageerror', e => fejl.push(e.message));
  await page.route('https://script.google.com/**', async r => {
    const h = JSON.parse(r.request().postData() || '{}').handling;
    const data = h === 'ping' ? { version: '1.5.0', ark: 'cts-app' } : h === 'hentAlt' ? { db: [], salg: [], lager: [], log: [], kurs: {} } : {};
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data }) });
  });
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => document.getElementById('forbindelse').textContent.includes('Ikke forbundet'));
  await page.click('.fanebar [data-fane="mere"]');
  await page.click('#v-mere [data-gaa="indstillinger"]');
  await page.fill('#ind-url', 'https://script.google.com/macros/s/TEST/exec');
  await page.fill('#ind-noegle', 'x'.repeat(40));
  await page.click('#ind-gem');
  await page.waitForFunction(() => document.getElementById('ind-status').textContent.includes('Forbundet'));
  await page.click('.fanebar [data-fane="forside"]');
  await page.waitForFunction(() => document.getElementById('forbindelse').textContent.includes('✓ Forbundet'), null, { timeout: 10000 });
  console.log('Hjem:', await page.textContent('#forbindelse'));
  assert.deepStrictEqual(fejl, []);
  console.log('forbindelse: OK'); await b.close();
})().catch(e => { console.error('FEJL:', e.message); process.exit(1); });
