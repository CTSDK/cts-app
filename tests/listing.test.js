// Kør: node tests/listing.test.js  – tester tekstgeneratoren fra apps-script/Code.gs
const fs = require('fs'), assert = require('assert');
const kode = fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8');
const hent = (start, slut) => { const a = kode.indexOf(start); const b = kode.indexOf(slut, a); return kode.slice(a, b); };
eval(hent('var STAND_DE', '// Fjerner sorteringskoder') + hent('function rensNote_', 'function dbOpslag_'));

// Thomas' eksempel: 1732 Crossbow Cart, 1994, uden OVP, med vejledning, komplet, stand 7
const t = listingTekst_({ setnr: '1732', navn: 'Crossbow Cart', tema: 'Castle', undertema: 'Dragon Masters', aar: '1994',
  ovp: false, komplet: true, vejledning: true, stand: 7, noteDE: '', noteEN: '', aarNu: 2026 });
console.log('TITEL:', t.titel, '(' + t.titel.length + ' tegn)');
console.log('ZUSTAND:', t.zustand);
console.log('BESKRIVELSE:\n' + t.beskrivelse);
assert.strictEqual(t.titel, 'LEGO Castle 1732 Crossbow Cart (1994) Vintage komplett');
assert.strictEqual(t.zustand, 'Zustand 7/10 – guter, altersgerechter Zustand. Komplett. Anleitung liegt bei.');
assert.ok(!t.beskrivelse.includes('Original-Karton') && !t.beskrivelse.includes('Teile') && t.beskrivelse.includes('* Komplett\n* Anleitung liegt bei'));
assert.ok(t.beskrivelse.includes('* Aus der Castle-Reihe (Dragon Masters), 1994'));
assert.ok(t.beskrivelse.includes('---') && t.beskrivelse.includes('* Condition: 7/10 — good condition for its age'));

// Nyt sæt med OVP, ikke Vintage (2020), ikke komplet, med note
const f = listingTekst_({ setnr: '10271', navn: 'Fiat 500 (Bright Light Yello Edition)', tema: 'Creator', undertema: 'Creator Expert', aar: '2020',
  ovp: true, komplet: false, vejledning: true, stand: 9, noteDE: 'Es fehlt 1 Rad', noteEN: '1 wheel missing', aarNu: 2026 });
assert.strictEqual(f.titel, 'LEGO Creator 10271 Fiat 500 (Bright Light Yello Edition) (2020) OVP');
assert.strictEqual(f.zustand, 'Zustand 9/10 – sehr gut. Mit Original-Karton (OVP), Anleitung liegt bei. Hinweis: Es fehlt 1 Rad');
assert.ok(!/komplett|Nicht|ohne/i.test(f.beskrivelse.split('---')[0].replace('LEGO-Angebote', '')), 'intet negativt');
// Uden OVP, uden vejledning, ikke komplet: ingen af de linjer
const n = listingTekst_({ setnr: '6766', navn: 'Rapid River Village', tema: 'Western', undertema: 'Indians', aar: '1997', ovp: false, komplet: false, vejledning: false, stand: 8, noteDE: 'Es fehlt eine Schlange', noteEN: 'Missing a snake', aarNu: 2026 });
assert.strictEqual(n.zustand, 'Zustand 8/10 – sehr guter gebrauchter Zustand. Hinweis: Es fehlt eine Schlange');
assert.ok(!/OVP|Original box|Anleitung|instructions|Complete|Komplett/.test(n.beskrivelse.replace(/LEGO-Angebote|listings/g, '')), n.beskrivelse);
assert.ok(f.beskrivelse.includes('* Note: 1 wheel missing'));

// Kendt DB-fejl: år i undertema-kolonnen; BrickLink-variant 7236-2 vises som 7236
const v = listingTekst_({ setnr: '7236-2', navn: "Emma's Art School", tema: 'Friends', undertema: '2022', aar: '', ovp: true, komplet: true, vejledning: true, stand: 10, aarNu: 2026 });
assert.strictEqual(v.titel, "LEGO Friends 7236 Emma's Art School (2022) OVP komplett");

// Lang titel: Vintage falder først væk, så tema, aldrig over 80 tegn
const l = listingTekst_({ setnr: '6285', navn: 'Black Seas Barracuda – Special Collectors Edition Extra Long Name', tema: 'Pirates', aar: '1989', ovp: true, komplet: true, vejledning: true, stand: 8, aarNu: 2026 });
assert.ok(l.titel.length <= 80 && !l.titel.includes('Vintage'), l.titel);

// Noter: sorteringskode og [intern] fjernes
assert.strictEqual(rensNote_('Sort: 250113B. Komplet, med manual [Rigtig foto kommer senere]'), 'Komplet, med manual');
assert.strictEqual(rensNote_('Sort: 00'), '');
console.log('\nlisting: alle tests OK');
