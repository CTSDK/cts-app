// Retro Design: SKU-regel og prisfordeling – samme cases mod appen (js/retro.js) og maskinrummet (Code.gs).
// Kør: node tests/retro.test.js
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const R = require('../js/retro.js');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8'), ctx);
const arr = x => JSON.parse(JSON.stringify(x));   // vm-arrays → almindelige arrays

// --- Ren SKU-funktion: retroSku(dato, kode, model, type, nr, antalEns) ---
const enkelte = [
  [['261108', 'RV', '294', 'Brødskærer', 1, 3], 'R261108-RV294-a'],
  [['261108', 'RV', '294', 'Brødskærer', 3, 3], 'R261108-RV294-c'],
  [['261108', 'RV', '191', 'Brødskærer', 1, 1], 'R261108-RV191'],
  [['261108', 'LK', '', 'Lampe', 1, 2], 'R261108-LK-a'],
  [['261108', '', '', 'Lampe', 1, 2], 'R261108-LAMPE-a'],
  [['261108', '', '', 'Lampe', 1, 1], 'R261108-LAMPE'],
  [['261108', '', '', 'Brødskærer', 1, 1], 'R261108-BROEDSKAERER'],
  [['261108', '', '', 'Radio/TV-kabinet', 1, 1], 'R261108-RADIOTVKABINET'],
  [['261108', 'rv', 'ph 5', 'Lampe', 2, 2], 'R261108-RVPH5-b'],
  [['261108', '', '', 'Skål på fod', 1, 1], 'R261108-SKAALPAAFOD'],
  [['261108', '', 'X 1', 'Andet', 1, 1], 'R261108-X1'],
  [['261108', 'RV', '294', 'Brødskærer', 27, 30], 'R261108-RV294-aa']
];
for (const [a, forventet] of enkelte) {
  assert.strictEqual(R.retroSku(...a), forventet, 'JS ' + a.join(','));
  assert.strictEqual(ctx.retroSku_(...a), forventet, 'Code.gs ' + a.join(','));
}
console.log('retroSku (JS + Code.gs):', enkelte.length, 'cases OK');

// --- Hele købet: Thomas' eksempel (3× Raadvad 294 + 1 lampe uden producent) ---
const linjer = [{ type: 'Brødskærer', producent: 'Raadvad', kode: 'RV', model: '294', antal: 3 }, { type: 'Lampe', producent: '', kode: '', model: '', antal: 1 }];
const plan1 = R.retroSkuer('261108', linjer, []);
assert.deepStrictEqual(plan1.skuer, ['R261108-RV294-a', 'R261108-RV294-b', 'R261108-RV294-c', 'R261108-LAMPE']);
assert.deepStrictEqual(plan1.omdoeb, []);
const dele = R.udvid(linjer).map(l => ctx.retroDel_(l.kode, l.model, l.type));
assert.deepStrictEqual(arr(ctx.retroPlan_('261108', [], dele)), arr(plan1), 'Code.gs = JS');

// Samme del på to linjer → a, b
const plan2 = R.retroSkuer('261108', [{ type: 'Brødskærer', kode: 'RV', model: '294', antal: 1 }, { type: 'Lampe', antal: 1 }, { type: 'Brødskærer', kode: 'RV', model: '294', antal: 1 }]);
assert.deepStrictEqual(plan2.skuer, ['R261108-RV294-a', 'R261108-LAMPE', 'R261108-RV294-b']);

// Tilføjelse til eksisterende køb: lampen der stod alene bliver -a; RV294 fortsætter med -d
const eks = plan1.skuer;
const nye = [{ type: 'Brødskærer', kode: 'RV', model: '294', antal: 1 }, { type: 'Lampe', antal: 1 }, { type: 'Brødskærer', kode: 'RV', model: '191', antal: 1 }];
const plan3 = R.retroSkuer('261108', nye, eks);
assert.deepStrictEqual(plan3.skuer, ['R261108-RV294-d', 'R261108-LAMPE-b', 'R261108-RV191']);
assert.deepStrictEqual(plan3.omdoeb, [['R261108-LAMPE', 'R261108-LAMPE-a']]);
const dele3 = R.udvid(nye).map(l => ctx.retroDel_(l.kode, l.model, l.type));
assert.deepStrictEqual(arr(ctx.retroPlan_('261108', eks, dele3)), arr(plan3), 'Code.gs = JS (tilføjelse)');
console.log('retroSkuer/retroPlan (nyt køb, flere linjer, tilføjelse med omdøbning): OK');

// --- Prisfordeling: lige store dele, 2 decimaler, sidste får resten ---
const priser = [[400, 4, [100, 100, 100, 100]], [100, 3, [33.33, 33.33, 33.34]], [500, 6, [83.33, 83.33, 83.33, 83.33, 83.33, 83.35]],
  [0.58, 2, [0.29, 0.29]], [10, 1, [10]], [0, 2, [0, 0]], [1000, 7, [142.85, 142.85, 142.85, 142.85, 142.85, 142.85, 142.9]]];
for (const [pris, n, forventet] of priser) {
  assert.deepStrictEqual(R.retroPriser(pris, n), forventet, 'JS ' + pris + '/' + n);
  assert.deepStrictEqual(arr(ctx.retroPriser_(pris, n)), forventet, 'Code.gs ' + pris + '/' + n);
  const sum = R.retroPriser(pris, n).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - pris) < 0.001, 'summen passer ' + pris);
}
console.log('retroPriser (JS + Code.gs):', priser.length, 'cases OK');

// --- Dato ---
for (const [ind, ud] of [['2026-11-08', '261108'], ['261108', '261108'], ['8-11-2026', ''], ['', '']]) {
  assert.strictEqual(R.retroDato(ind), ud); assert.strictEqual(ctx.retroDato_(ind), ud);
}
assert.ok(/^2\.2\.0$/.test(ctx.VERSION), 'VERSION 2.2.0');
console.log('retro: alle tests OK');
