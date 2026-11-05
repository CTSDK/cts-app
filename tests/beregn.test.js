// Kør: node tests/beregn.test.js
const assert = require('assert');
const B = require('../js/beregn.js');

// Testcase batch 261028 (værdier fra Excel, alle manuelle)
const kp = B.koebspriser(600, [45, 75, 40, 55]).map(v => B.kr(v));
assert.deepStrictEqual(kp, ['125,58', '209,30', '111,63', '153,49']);
assert.strictEqual(B.kr(B.koebspriser(600, [45, 75, 40, 55]).reduce((a, b) => a + b)), '600,00');

// Briefens oprindelige eksempel (50/110/40/55)
assert.deepStrictEqual(B.koebspriser(600, [50, 110, 40, 55]).map(B.kr), ['117,65', '258,82', '94,12', '129,41']);

// OVP-regel
const salg = { gns: 100, antal: 2, hoejeste: 110, laveste: 90 };
assert.strictEqual(B.vaerdiFraSalg(salg, true), 110);
assert.strictEqual(B.vaerdiFraSalg(salg, false), 100);
assert.strictEqual(B.vaerdiFraSalg(null, true), null);

// SKU og dubletter (første række omdøbes også)
assert.deepStrictEqual(B.skuer('261028', ['10271', '10295', '10271']), ['261028-10271-a', '261028-10295', '261028-10271-b']);
assert.strictEqual(B.batchId('2026-10-28'), '261028');
assert.strictEqual(B.tal('1.234,50'), 1234.5);
assert.strictEqual(B.tal('600'), 600);
assert.strictEqual(B.kr(1234.5), '1.234,50');
console.log('beregn: alle tests OK');
