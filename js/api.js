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
    function laes() { var t = { log: [], ind: [], fotos: {}, salg: [] }; try { var x = JSON.parse(localStorage.getItem(NOEGLE)); if (x) { x.salg = x.salg || []; return x; } } catch (e) { /* */ } return t; }
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
        r.lagerstatus = (s.salg || []).some(function (x) { return x.sku === r.sku; }) ? 'Solgt' : (r.klar ? 'På lager' : '');
        r.antalFotos = (s.fotos[r.sku] || []).length;
      });
    }
    var H = {
      ping: function () { return { version: 'mock', ark: 'Simuleret testark', tilstand: 'test' }; },
      tilfoejDb: function (d) {
        var s = laes(), nr = String(d.setnr || '').trim().replace(/-1$/, '');
        s.db = s.db || {};
        var gl = DB[nr] || s.db[nr];
        if (gl) { if (gl[0] === d.navn) return { setnr: nr, navn: d.navn, tema: d.tema, undertema: d.undertema || '', aar: d.aar, gentaget: true }; throw srv('Sæt ' + nr + ' findes allerede i DB som "' + gl[0] + '".'); }
        s.db[nr] = [d.navn, d.tema, d.undertema || '', String(d.aar)];
        skriv(s); return { setnr: nr, navn: d.navn, tema: d.tema, undertema: d.undertema || '', aar: String(d.aar), gentaget: false };
      },
      slaaOp: function (d) {
        var ekstra = laes().db || {};
        var nr = String(d.setnr || '').trim(); var r = DB[nr] || DB[nr + '-1'] || ekstra[nr] || ekstra[nr.replace(/-1$/, '')];
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
      tilfoejSaet: function (d) {
        var s = laes();
        if (!s.log.some(function (l) { return l.dato === String(d.dato); })) throw srv('Købet ' + d.dato + ' findes ikke i Indkøbslog.');
        genberegn(s);
        var rk = s.ind.filter(function (r) { return r.dato === String(d.dato); });
        var aaben = String(d.dato) === '250000' || rk.some(function (r) { return !r.klar && r.lagerstatus !== 'Solgt'; });
        if (!aaben && !d.genaabn) throw srv('LUKKET: Købet ' + d.dato + ' er lukket, fordi alle sæt er klargjort eller solgt.');
        var sidste = -1; s.ind.forEach(function (r, i) { if (r.dato === String(d.dato)) sidste = i; });
        var nye = d.saet.map(function (x) { return { dato: String(d.dato), setnr: String(x.setnr), vaerdi: Number(x.vaerdi) || 0, ovp: !!x.ovp, kilde: x.kilde || '', sorteret: false, fotos: false, klar: false, stand: '', platform: '', noter: '', vejledning: false, komplet: false, listet: false }; });
        s.ind.splice.apply(s.ind, [sidste + 1, 0].concat(nye));
        genberegn(s); skriv(s); return H.hentBatch({ dato: d.dato });
      },
      retSaet: function (d) {
        var s = laes(); genberegn(s);
        var r = s.ind.find(function (x) { return x.sku === d.sku; });
        if (!r) throw srv('SKU ' + d.sku + ' findes ikke i Indkøb.');
        if (r.lagerstatus === 'Solgt') throw srv('Sættet er solgt og kan ikke rettes.');
        r.setnr = String(d.setnr); r.ovp = !!d.ovp; r.vaerdi = Number(d.vaerdi) || 0; r.kilde = d.kilde || '';
        genberegn(s); skriv(s); return H.hentBatch({ dato: r.dato });
      },
      fjernSaet: function (d) {
        var s = laes(); genberegn(s);
        var i = s.ind.findIndex(function (x) { return x.sku === d.sku; });
        if (i < 0) throw srv('SKU ' + d.sku + ' findes ikke i Indkøb.');
        if (s.ind[i].lagerstatus === 'Solgt') throw srv('Sættet er solgt og kan ikke fjernes.');
        var dato = s.ind[i].dato; s.ind.splice(i, 1);
        genberegn(s); skriv(s); return H.hentBatch({ dato: dato });
      },
      saetListet: function (d) {
        var s = laes(); var r = s.ind.find(function (x) { genberegn(s); return x.sku === d.sku; });
        if (!r) throw srv('SKU ' + d.sku + ' findes ikke.');
        r.listet = d.listet === true; genberegn(s); skriv(s); return r;
      },
      lavListings: function (d) {
        var s = laes(); genberegn(s);
        var rk = s.ind.filter(function (r) { return r.dato === String(d.dato) && r.klar && r.lagerstatus !== 'Solgt' && !r.listet; });
        if (!rk.length) return { antal: 0, url: '', saet: [], besked: 'Ingen sæt i købet er klar til salg og endnu ikke listet.' };
        return { antal: rk.length, url: 'https://docs.google.com/document/d/mock', saet: rk.map(function (r) {
          var db = DB[r.setnr] || ['', '', '', ''];
          return { sku: r.sku, navn: r.navn, titel: 'LEGO ' + db[1] + ' ' + r.setnr + ' ' + r.navn + ' (' + db[3] + ')' + (r.ovp ? ' OVP' : '') + (r.komplet ? ' komplett' : ''),
            zustand: 'Zustand ' + r.stand + '/10.', beskrivelse: 'Schauen Sie sich auch meine anderen LEGO-Angebote an …\n\nLEGO ' + db[1] + ' ' + r.setnr + ' ' + r.navn };
        }) };
      },
      registrerSalg: function (d) {
        var s = laes(); genberegn(s);
        var varer = (d.varer || []).filter(function (v) { return v.sku; });
        if (!varer.length) throw srv('Ingen varer i ordren.');
        varer.forEach(function (v) {
          var r = s.ind.find(function (x) { return x.sku === v.sku; });
          if (!r) throw srv('SKU ' + v.sku + ' findes ikke i Indkøb.');
          if (r.lagerstatus === 'Solgt') throw srv('SKU ' + v.sku + ' er allerede solgt.');
        });
        var kurs = 7.46, sumH = varer.reduce(function (a, v) { return a + Number(v.pris); }, 0);
        var n = function (x) { return Number(x) || 0; };
        var raekker = varer.map(function (v) {
          var r = s.ind.find(function (x) { return x.sku === v.sku; });
          var andel = sumH ? Number(v.pris) / sumH : 0;
          var f = (Number(v.pris) + andel * (n(d.fragtInd) - n(d.gebyr) - n(d.refund))) * kurs - andel * n(d.fragtUd) - r.koebspris;
          s.salg.push({ dato: d.dato, sku: v.sku, koeber: d.koeber, pris: Number(v.pris) });
          return { sku: v.sku, indkoebspris: r.koebspris, fortjeneste: Math.round(f * 100) / 100 };
        });
        genberegn(s); skriv(s);
        return { aar: d.dato.slice(0, 4), raekker: raekker, fortjenesteOrdre: Math.round(raekker.reduce(function (a, r) { return a + r.fortjeneste; }, 0) * 100) / 100,
          saet: s.ind.filter(function (r) { return varer.some(function (v) { return v.sku === r.sku; }); }) };
      },
      // ----- Retro Design (samme regler som maskinrummet; SKU/pris fra js/retro.js) -----
      retroMaerker: function () { return retroL(laes()).maerker; },
      retroOpretKoeb: function (d) {
        var R = rod.Retro, s = laes(), r = retroL(s);
        var dato = R.retroDato(d.dato); if (!dato) throw srv('Købsdato mangler eller er forkert.');
        var tilfoej = d.tilfoej === true, pris = Number(d.pris);
        if (isNaN(pris) || pris < 0 || (!tilfoej && !(pris > 0))) throw srv('Samlet pris skal være over 0.');
        if (!(d.ting || []).length) throw srv('Ingen ting i købet.');
        var log = r.log.find(function (l) { return l.dato === dato; });
        if (log && d.id && (log.ider || []).indexOf(d.id) >= 0) { var g = H.retroHentKoeb({ dato: dato }); g.gentaget = true; g.nye = []; g.omdoeb = []; return g; }
        if (log && !tilfoej) throw srv('Køb ' + dato + ' findes allerede.');
        var kendt = {}, ejer = {}, ting = [];
        r.maerker.forEach(function (m) { kendt[m.producent.toLowerCase()] = m; ejer[m.kode] = m.producent; });
        d.ting.forEach(function (l, i) {
          var type = String(l.type || '').trim(), antal = Number(l.antal);
          if (!type) throw srv('Linje ' + (i + 1) + ' mangler type.');
          if (!(antal >= 1 && antal <= 99 && Math.floor(antal) === antal)) throw srv('Linje ' + (i + 1) + ': antal skal være et helt tal fra 1 til 99.');
          var producent = String(l.producent || '').trim(), kode = String(l.kode || '').trim().toUpperCase(), model = String(l.model || '').trim();
          if (producent) {
            var k = kendt[producent.toLowerCase()];
            if (k) { if (kode && kode !== k.kode) throw srv('Producent ' + k.producent + ' har koden ' + k.kode + ' i Mærker (ikke ' + kode + ').'); kode = k.kode; producent = k.producent; }
            else {
              if (!/^[A-Z]{2,4}$/.test(kode)) throw srv('Ny producent ' + producent + ': koden skal være 2–4 store bogstaver.');
              if (ejer[kode]) throw srv('Koden ' + kode + ' bruges allerede af ' + ejer[kode] + '.');
              var ny = { producent: producent, kode: kode }; kendt[producent.toLowerCase()] = ny; ejer[kode] = producent; r.maerker.push(ny);
            }
          } else kode = '';
          for (var j = 0; j < antal; j++) ting.push({ type: type, producent: producent, kode: kode, model: model });
        });
        var eks = r.ting.filter(function (t) { return t.dato === dato; });
        var plan = R.retroPlan(dato, eks.map(function (t) { return t.sku; }), ting.map(function (t) { return R.retroDel(t.kode, t.model, t.type); }));
        if (log) { log.pris = Math.round((log.pris + pris) * 100) / 100; if (!log.hvorKoebt) log.hvorKoebt = d.hvorKoebt || ''; }
        else { log = { dato: dato, pris: pris, hvorKoebt: d.hvorKoebt || '', noter: d.noter || '', ider: [] }; r.log.unshift(log); }
        if (d.id) (log.ider = log.ider || []).push(d.id);
        plan.omdoeb.forEach(function (o) {
          var t = eks.find(function (x) { return x.sku === o[0]; }); if (t) t.sku = o[1];
          if (r.fotos[o[0]]) { r.fotos[o[1]] = r.fotos[o[0]].map(function (f) { return Object.assign({}, f, { navn: f.navn.replace(o[0], o[1]) }); }); delete r.fotos[o[0]]; }
        });
        var nye = ting.map(function (t, i) {
          return { sku: plan.skuer[i], dato: dato, type: t.type, producent: t.producent, designer: '', model: t.model, farve: '', kendetegn: '',
            stand: '', arbejde: '', koebspris: 0, fotos: false, klar: false, lagerstatus: 'På lager', noter: '' };
        });
        var sidste = -1; r.ting.forEach(function (t, i) { if (t.dato === dato) sidste = i; });
        if (sidste < 0) r.ting = nye.concat(r.ting); else r.ting.splice.apply(r.ting, [sidste + 1, 0].concat(nye));
        var alle = r.ting.filter(function (t) { return t.dato === dato; }), kp = R.retroPriser(log.pris, alle.length);
        alle.forEach(function (t, i) { t.koebspris = kp[i]; });
        skriv(s);
        var res = H.retroHentKoeb({ dato: dato });
        res.nye = nye.map(function (t) { return { sku: t.sku, type: t.type, producent: t.producent, model: t.model }; });
        res.omdoeb = plan.omdoeb; res.gentaget = false;
        return res;
      },
      retroHentKoeb: function (d) {
        var r = retroL(laes()), dato = rod.Retro.retroDato(d.dato);
        var log = r.log.find(function (l) { return l.dato === dato; });
        if (!log) throw srv('Køb ' + dato + ' findes ikke i CTS Retro.');
        var ting = r.ting.filter(function (t) { return t.dato === dato; }).map(function (t) { return Object.assign({}, t, { antalFotos: (r.fotos[t.sku] || []).length }); });
        return { dato: dato, pris: log.pris, hvorKoebt: log.hvorKoebt, antal: ting.length, noter: log.noter, ting: ting };
      },
      retroGemTing: function (d) {
        var s = laes(), r = retroL(s), t = r.ting.find(function (x) { return x.sku === d.sku; });
        if (!t) throw srv('SKU ' + d.sku + ' findes ikke i CTS Retro → Indkøb.');
        var stand = d.stand === '' || d.stand == null ? '' : Number(d.stand);
        if (stand !== '' && !(stand >= 1 && stand <= 10)) throw srv('Stand skal være 1–10.');
        ['designer', 'farve', 'kendetegn', 'arbejde', 'noter'].forEach(function (k) { t[k] = String(d[k] || '').trim(); });
        t.stand = stand === '' ? '' : String(stand); t.klar = d.klar === true;
        skriv(s); return Object.assign({}, t, { antalFotos: (r.fotos[t.sku] || []).length });
      },
      retroUploadFoto: function (d) {
        var s = laes(), r = retroL(s), t = r.ting.find(function (x) { return x.sku === d.sku; });
        if (!t) throw srv('SKU ' + d.sku + ' findes ikke i CTS Retro → Indkøb.');
        if (!d.billede) throw srv('Intet billede.');
        var liste = r.fotos[d.sku] = r.fotos[d.sku] || [];
        var gl = liste.find(function (f) { return f.id === d.uploadId; });
        if (gl) return { navn: gl.navn, antalFotos: liste.length, gentaget: true };
        var nr = liste.length + 1, navn = d.sku + '.' + (nr < 10 ? '0' + nr : nr) + '.jpg';
        liste.push({ id: d.uploadId, navn: navn, kb: Math.round(d.billede.length * 0.75 / 1024) });
        t.fotos = true; skriv(s);
        return { navn: navn, antalFotos: liste.length, gentaget: false };
      },
      hentAlt: function () {
        var s = laes(); genberegn(s);
        return {
          db: Object.keys(DB).map(function (k) { return [k].concat(DB[k]); }).concat(Object.keys(s.db || {}).map(function (k) { return [k].concat(s.db[k]); })),
          salg: Object.keys(SALG).map(function (k) { var x = SALG[k]; return [k, x.gns, x.antal, x.hoejeste, x.laveste]; }),
          lager: s.ind.map(function (r) { var c = Object.assign({}, r); delete c.antalFotos; return c; }),
          log: s.log.map(function (l) { return [l.dato, l.pris]; }),
          kurs: { '2025': 7.46, '2026': 7.46 }
        };
      }
    };
    function srv(t) { var e = new Error(t); e.fraServer = true; return e; }
    function retroL(s) { s.retro = s.retro || { log: [], ting: [], maerker: [], fotos: {} }; return s.retro; }
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
