// Kør: node tests/sortering.test.js  – tester nummerorden i et køb (sorterKoeb_ fra apps-script/Code.gs)
const fs = require('fs'), assert = require('assert');
const kode = fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8');
const hent = (start, slut) => { const a = kode.indexOf(start); const b = kode.indexOf(slut, a); return kode.slice(a, b); };
var K = { DATO: 2, SETNR: 3, NOTER: 17 };
var SpreadsheetApp = { flush() {} };
function batchRaekker_(data, dato) { return data.raekker.filter(r => String(r.v[K.DATO - 1]) === String(dato)); }
eval(hent('function saetNoegle_', 'function sorterAlleKoeb'));

// Falsk ark: rækker = arrays; moveRows flytter én række til destinationIndex (før-koordinater, som i Apps Script)
function lavArk(raekker, start) {
  const ark = { rows: raekker.map(r => r.slice()), flyt: 0,
    getRange(r) { return { r }; },
    moveRows(spec, dest) { const i = spec.r - start, d = dest - start; const [x] = ark.rows.splice(i, 1); ark.rows.splice(d > i ? d - 1 : d, 0, x); ark.flyt++; } };
  return ark;
}
function data(ark, start) { return { ark, raekker: ark.rows.map((v, i) => ({ raekke: start + i, v })) }; }
const r = (dato, nr, note) => { const v = new Array(23).fill(''); v[1] = dato; v[2] = nr; v[16] = note || ''; return v; };

// 261028 som i arket: fire sæt + tre tilføjet nederst, plus et andet køb under
const ark = lavArk([r(261028, 10271), r(261028, 10295), r(261028, 41711), r(261028, 41714), r(261028, 30577), r(261028, 31100), r(261028, 30343), r(261015, 677)], 3);
assert.strictEqual(sorterKoeb_('261028', data(ark, 3)), 3);
assert.deepStrictEqual(ark.rows.map(x => x[2]), [10271, 10295, 30343, 30577, 31100, 41711, 41714, 677]);
// Allerede sorteret → intet flyttes
assert.strictEqual(sorterKoeb_('261028', data(ark, 3)), 0);

// Tal, ikke tekst: 677 før 6044; "7236-2" efter 7236; ens sæt beholder rækkefølge (noter a/b)
const a2 = lavArk([r(1, 6044), r(1, '7236-2'), r(1, 677, 'a'), r(1, 7236), r(1, 677, 'b'), r(1, '')], 3);
sorterKoeb_('1', data(a2, 3));
assert.deepStrictEqual(a2.rows.map(x => x[2] + (x[16] || '')), ['677a', '677b', '6044', '7236', '7236-2', '']);

// Rækker ikke samlet → -1, intet flyttes
const a3 = lavArk([r(1, 5), r(2, 1), r(1, 3)], 3);
assert.strictEqual(sorterKoeb_('1', data(a3, 3)), -1);
assert.strictEqual(a3.flyt, 0);
console.log('Sortering: alle test bestået');

// Appen (js/beregn.js): Lager i nummerorden på tværs af køb
const { saetOrden } = require('../js/beregn.js');
const l = [{ setnr: '6044', dato: '261015', sku: '261015-6044' }, { setnr: '677', dato: '261015', sku: '261015-677' },
  { setnr: '31100', dato: '261028', sku: '261028-31100' }, { setnr: '677', dato: '261028', sku: '261028-677' }, { setnr: '7236-2', dato: '1', sku: 'x' }, { setnr: '7236', dato: '1', sku: 'y' }];
assert.deepStrictEqual(l.sort(saetOrden).map(x => x.sku), ['261028-677', '261015-677', '261015-6044', 'y', 'x', '261028-31100']);
console.log('Lager-orden i appen: OK');
