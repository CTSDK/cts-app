// Forbindelse til maskinrummet (Apps Script). Med ?mock=1 i adressen bruges en
// simuleret forbindelse i browseren (kun til test – intet sendes nogen steder).
(function (rod) {
  'use strict';

  var INDST_NOEGLE = 'cts.indstillinger';

  function indstillinger() {
    try { return JSON.parse(localStorage.getItem(INDST_NOEGLE) || '{}'); } catch (e) { return {}; }
  }
  function gemIndstillinger(o) {
    localStorage.setItem(INDST_NOEGLE, JSON.stringify(o));
  }
  function erMock() { return /[?&]mock=1/.test(location.search); }

  function vent(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function kaldRigtig(handling, data) {
    var ind = indstillinger();
    if (!ind.url || !ind.noegle) throw new Error('Appen er ikke forbundet. Gå til Indstillinger.');
    // text/plain undgår CORS-forespørgsel før kaldet; Apps Script læser JSON fra teksten.
    var svar = await fetch(ind.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ noegle: ind.noegle, handling: handling, data: data || {} }),
      redirect: 'follow'
    });
    if (!svar.ok) throw new Error('Serverfejl (' + svar.status + ').');
    var tekst = await svar.text();
    var json;
    try { json = JSON.parse(tekst); } catch (e) { throw new Error('Uventet svar fra maskinrummet. Er adressen rigtig?'); }
    if (!json.ok) { var f = new Error(json.fejl || 'Ukendt fejl.'); f.fraServer = true; throw f; }
    return json.data;
  }

  // Kald med genforsøg ved netværksfejl (ikke ved fejl, serveren selv melder).
  async function kald(handling, data, forsoeg) {
    forsoeg = forsoeg || 1;
    if (navigator.onLine === false) throw new Error('Ingen forbindelse.');
    var fn = erMock() ? Mock.kald : kaldRigtig;
    var sidste;
    for (var i = 0; i < forsoeg; i++) {
      try { return await fn(handling, data); } catch (e) {
        sidste = e;
        if (e.fraServer) throw e;
        if (i < forsoeg - 1) await vent(1500 * Math.pow(2, i));
      }
    }
    throw sidste;
  }

  // ---------------- Simuleret maskinrum ----------------
  var Mock = (function () {
    var DB = {
      '10271': ['Fiat 500 (Bright Light Yello Edition)', 'Creator', 'Creator Expert', '2020'],
      '10295': ['Porsche 911', 'Creator', 'Creator Expert', '2021'],
      '41711': ["Emma's Art School", 'Friends', '', '2022'],
      '41714': ['Andrea’s Theater School', 'Friends', '', '2022'],
      '6086': ["Black Knight's Castle", 'Castle', 'Black Knights', '1992']
    };
    var SALG = { '6086': { gns: 275, antal: 2, hoejeste: 300, laveste: 250 } }; // som testsalgene i testarket
    var NOEGLE = 'cts.mock';
    function laes() { try { return JSON.parse(localStorage.getItem(NOEGLE)) || { log: [], ind: [], fotos: {} }; } catch (e) { return { log: [], ind: [], fotos: {} }; } }
    function skriv(s) { localStorage.setItem(NOEGLE, JSON.stringify(s)); }
    function genberegn(s) {
      // SKU og købspris som regnearkets formler
      var tael = {};
      s.ind.forEach(function (r) { var k = r.dato + '|' + r.setnr; tael[k] = (tael[k] || 0) + 1; });
      var set = {};
      s.ind.forEach(function (r) {
        var k = r.dato + '|' + r.setnr;
        set[k] = (set[k] || 0) + 1;
        r.sku = r.dato + '-' + r.setnr + (tael[k] > 1 ? '-' + String.fromCharCode(96 + set[k]) : '');
        var log = s.log.find(function (l) { return l.dato === r.dato; });
        var sum = s.ind.filter(function (x) { return x.dato === r.dato; }).reduce(function (a, x) { return a + x.vaerdi; }, 0);
        r.koebspris = log && sum ? Math.round(log.pris * r.vaerdi / sum * 100) / 100 : 0;
        r.navn = DB[r.setnr] ? DB[r.setnr][0] : 'Sæt findes ikke';
        r.lagerstatus = r.klar ? 'På lager' : '';
        r.antalFotos = (s.fotos[r.sku] || []).length;
      });
    }
    var H = {
      ping: function () { return { version: 'mock', ark: 'Simuleret testark', tilstand: 'test' }; },
      slaaOp: function (d) {
        var nr = String(d.setnr || '').trim(); var r = DB[nr] || DB[nr + '-1'];
        return { setnr: nr, fundet: !!r, navn: r ? r[0] : 'Sæt findes ikke', tema: r ? r[1] : '', undertema: r ? r[2] : '', aar: r ? r[3] : '', salg: SALG[nr] || null };
      },
      opretBatch: function (d) {
        var s = laes();
        if (s.log.some(function (l) { return l.dato === d.dato; })) throw srv('Batch ' + d.dato + ' findes allerede i Indkøbslog.');
        s.log.unshift({ dato: d.dato, pris: Number(d.pris) });
        var nye = d.saet.map(function (x) {
          return { dato: d.dato, setnr: String(x.setnr), vaerdi: Number(x.vaerdi), ovp: !!x.ovp, kilde: x.kilde, sorteret: false, fotos: false, klar: false, stand: '', platform: '', noter: '', vejledning: false, komplet: false };
        });
        s.ind = nye.concat(s.ind);
        genberegn(s); skriv(s);
        return H.hentBatch({ dato: d.dato });
      },
      hentBatch: function (d) {
        var s = laes(); genberegn(s);
        var log = s.log.find(function (l) { return l.dato === String(d.dato); });
        return { dato: String(d.dato), pris: log ? log.pris : 0, saet: s.ind.filter(function (r) { return r.dato === String(d.dato); }) };
      },
      gemKlargoering: function (d) {
        var s = laes(); genberegn(s);
        var r = s.ind.find(function (x) { return x.sku === d.sku; });
        if (!r) throw srv('SKU ' + d.sku + ' findes ikke i Indkøb.');
        var fotos = (s.fotos[r.sku] || []).length > 0;
        if (d.klar && !(d.sorteret && d.stand && fotos)) throw srv('Klar til salg kræver: sorteret, stand og mindst ét foto.');
        ['sorteret', 'klar', 'stand', 'platform', 'noter', 'vejledning', 'komplet'].forEach(function (k) { r[k] = d[k]; });
        r.fotos = fotos;
        genberegn(s); skriv(s); return r;
      },
      uploadFoto: function (d) {
        var s = laes();
        var liste = s.fotos[d.sku] = s.fotos[d.sku] || [];
        var gl = liste.find(function (f) { return f.id === d.uploadId; });
        if (gl) return { navn: gl.navn, antalFotos: liste.length, gentaget: true };
        var nr = liste.length + 1;
        var navn = d.sku + '.' + (nr < 10 ? '0' + nr : nr) + '.jpg';
        liste.push({ id: d.uploadId, navn: navn, kb: Math.round(d.billede.length * 0.75 / 1024) });
        var r = s.ind.find(function (x) { return x.sku === d.sku; }); if (r) r.fotos = true;
        skriv(s); return { navn: navn, antalFotos: liste.length, gentaget: false };
      },
      hentLager: function () { var s = laes(); genberegn(s); return s.ind; },
      hentAlt: function () {
        var s = laes(); genberegn(s);
        return {
          db: Object.keys(DB).map(function (k) { return [k].concat(DB[k]); }),
          salg: Object.keys(SALG).map(function (k) { var x = SALG[k]; return [k, x.gns, x.antal, x.hoejeste, x.laveste]; }),
          lager: s.ind.map(function (r) { var c = Object.assign({}, r); delete c.antalFotos; return c; }),
          log: s.log.map(function (l) { return [l.dato, l.pris]; })
        };
      }
    };
    function srv(t) { var e = new Error(t); e.fraServer = true; return e; }
    async function kald(handling, data) {
      await vent(150);
      if (navigator.onLine === false) throw new Error('Ingen forbindelse (simuleret).');
      if (!H[handling]) throw srv('Ukendt handling: ' + handling);
      return JSON.parse(JSON.stringify(H[handling](data || {})));
    }
    return { kald: kald, nulstil: function () { localStorage.removeItem(NOEGLE); } };
  })();

  rod.Api = { kald: kald, indstillinger: indstillinger, gemIndstillinger: gemIndstillinger, erMock: erMock, Mock: Mock };
})(this);
