// Kør: node tests/listing.test.js  – tester tekstgeneratoren fra apps-script/Code.gs
const fs = require('fs'), assert = require('assert');
const kode = fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8');
const hent = (start, slut) => { const a = kode.indexOf(start); const b = kode.indexOf(slut, a); return kode.slice(a, b); };
eval(hent('// Flag som tegnkoder', 'var STAND_DE') + hent('var STAND_DE', '// Deler noten') + hent('function delNote_', 'function dbOpslag_'));

// Thomas' eksempel: 1732 Crossbow Cart, 1994, uden OVP, med vejledning, komplet, stand 7
const t = listingTekst_({ setnr: '1732', navn: 'Crossbow Cart', tema: 'Castle', undertema: 'Dragon Masters', aar: '1994',
  ovp: false, komplet: true, vejledning: true, stand: 7, noteDE: '', noteEN: '', aarNu: 2026 });
console.log('TITEL:', t.titel, '(' + t.titel.length + ' tegn)');
console.log('ZUSTAND:', t.zustand);
console.log('BESKRIVELSE:\n' + t.beskrivelse);
assert.strictEqual(t.titel, 'LEGO Castle 1732 Crossbow Cart (1994) Vintage komplett');
assert.strictEqual(t.zustand, '🇩🇪 Gut (G), siehe Fotos und Beschreibung. Komplett. Anleitung vorhanden.\n\n🇬🇧 Good (G), see photos and description. Complete. Instructions included.');
assert.ok(!t.beskrivelse.includes('OVP') && !t.beskrivelse.includes('Teile') && t.beskrivelse.includes('* Komplett\n* Anleitung vorhanden'));
assert.ok(t.beskrivelse.includes('* Aus der Castle-Reihe (Dragon Masters), 1994'));
assert.ok(t.beskrivelse.startsWith('>>> English description below <<<\n\nSchauen Sie'));
assert.ok(t.beskrivelse.includes('---') && t.beskrivelse.includes('* Condition: 7/10 — good condition for its age'));

// Nyt sæt med OVP, ikke Vintage (2020), ikke komplet, med note
const f = listingTekst_({ setnr: '10271', navn: 'Fiat 500 (Bright Light Yello Edition)', tema: 'Creator', undertema: 'Creator Expert', aar: '2020',
  ovp: true, komplet: false, vejledning: true, stand: 9, noteDE: 'Es fehlt 1 Rad', noteEN: '1 wheel missing', aarNu: 2026 });
assert.strictEqual(f.titel, 'LEGO Creator 10271 Fiat 500 (Bright Light Yello Edition) (2020) OVP');
assert.strictEqual(f.zustand, '🇩🇪 Sehr gut (SG), siehe Fotos und Beschreibung. Original-Verpackung (OVP) vorhanden. Anleitung vorhanden. Hinweis: Es fehlt 1 Rad\n\n🇬🇧 Very good (SG), see photos and description. Original box (OVP) included. Instructions included. Note: 1 wheel missing');
assert.ok(!/komplett|Nicht|ohne/i.test(f.beskrivelse.split('---')[0].replace('LEGO-Angebote', '')), 'intet negativt');
// Uden OVP, uden vejledning, ikke komplet: ingen af de linjer
const n = listingTekst_({ setnr: '6766', navn: 'Rapid River Village', tema: 'Western', undertema: 'Indians', aar: '1997', ovp: false, komplet: false, vejledning: false, stand: 8, noteDE: 'Es fehlt eine Schlange', noteEN: 'Missing a snake', aarNu: 2026 });
assert.strictEqual(n.zustand, '🇩🇪 Sehr gut (SG), siehe Fotos und Beschreibung. Hinweis: Es fehlt eine Schlange\n\n🇬🇧 Very good (SG), see photos and description. Note: Missing a snake');
assert.ok(!/OVP|Original box|Anleitung|nstructions|Complete|Komplett/.test(n.beskrivelse.replace(/LEGO-Angebote|listings/g, '')), n.beskrivelse);
// Thomas' eksempel: OVP med æske-note, vejledning, mangler
const a = listingTekst_({ setnr: '6520', navn: 'Arctic', tema: 'Town', aar: '1993', ovp: true, komplet: false, vejledning: true, stand: 8,
  aeskeDE: 'Karton abgenutzt, Riss auf der Vorderseite', aeskeEN: 'worn, tear on front',
  noteDE: '1× Arktis-Figur mit grüner Mütze (arc009) fehlt', noteEN: '1× Arctic green cap minifigure (arc009) missing', aarNu: 2026 });
assert.strictEqual(a.zustand, '🇩🇪 Sehr gut (SG), siehe Fotos und Beschreibung. Original-Verpackung (OVP) vorhanden (Karton abgenutzt, Riss auf der Vorderseite). Anleitung vorhanden. Hinweis: 1× Arktis-Figur mit grüner Mütze (arc009) fehlt\n\n🇬🇧 Very good (SG), see photos and description. Original box (OVP) included (worn, tear on front). Instructions included. Note: 1× Arctic green cap minifigure (arc009) missing');
// Noten deles: Æske-del og resten
assert.deepStrictEqual(delNote_('Sort: 00. Æske: slidt, flænge på forsiden. Mangler 1 isøkse [intern]'), { aeske: 'slidt, flænge på forsiden', rest: 'Mangler 1 isøkse' });
assert.deepStrictEqual(delNote_('Mangler 1 hjul'), { aeske: '', rest: 'Mangler 1 hjul' });
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
