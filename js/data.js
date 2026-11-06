// Data og synkronisering.
//  - Lokal kopi (fra sidste gang der var net): sæt-database, egne salgspriser, lager, indkøbslog.
//  - Udbakke: alt hvad der laves (nyt køb, klargøring, fotos) gemmes først på telefonen og
//    sendes derefter i rækkefølge. Uden net venter det og sendes automatisk senere.
//  - Det, appen viser, er den lokale kopi + det der venter i udbakken.
(function (rod) {
  'use strict';

  var B = rod.Beregn, Api = rod.Api, Lokal = rod.Lokal;
  var kopi = { db: null, salg: {}, lager: [], log: {}, hentet: 0, kurs: {} };
  var listings = { saet: {}, doc: {} }; // sku → {titel, zustand, beskrivelse}; dato → dokument-url
  var udbakke = [];
  var lyttere = [], haendelser = [];
  var status = { online: navigator.onLine, sender: false, henter: false, fejl: '' };
  var sendteFotos = {}; // sku → [{thumb, navn}] for fotos sendt i denne session

  function fyr() { lyttere.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }
  function haendelse(type, info) { haendelser.forEach(function (fn) { try { fn(type, info); } catch (e) { console.error(e); } }); }

  async function start() {
    try {
      var v = await Promise.all(['db', 'salg', 'lager', 'log', 'hentet', 'kurs'].map(function (k) { return Lokal.hent(k); }));
      kopi.db = v[0] || null; kopi.salg = v[1] || {}; kopi.lager = v[2] || []; kopi.log = v[3] || {}; kopi.hentet = v[4] || 0; kopi.kurs = v[5] || {};
      listings = (await Lokal.hent('listings')) || { saet: {}, doc: {} };
      udbakke = (await Lokal.udbakke.alle()) || [];
      udbakke.forEach(function (p) { if (p.status === 'sender') p.status = 'venter'; });
    } catch (e) { status.fejl = 'Lokal lagring virker ikke: ' + e.message; }
    fyr();
    koer();
    hentAlt();
  }

  // ---------------- Visning: kopi + ventende ----------------
  function lokaleRaekker(d, meta) {
    var nr = d.saet.map(function (s) { return String(s.setnr); });
    var skuer = B.skuer(d.dato, nr);
    var kp = B.koebspriser(Number(d.pris), d.saet.map(function (s) { return Number(s.vaerdi); }));
    return d.saet.map(function (s, i) {
      return {
        sku: skuer[i], dato: String(d.dato), setnr: nr[i], navn: (meta && meta.navne && meta.navne[i]) || nr[i],
        vaerdi: Number(s.vaerdi), koebspris: Math.round(kp[i] * 100) / 100, ovp: !!s.ovp, kilde: s.kilde,
        sorteret: false, fotos: false, klar: false, stand: '', platform: '', lagerstatus: '', noter: '',
        vejledning: false, komplet: false, antalFotos: 0, lokal: true
      };
    });
  }

  function anvend(raekker, poster) {
    var res = raekker.map(function (r) { return Object.assign({}, r, { ventendeFotos: 0, ventende: false }); });
    var idx = {}; res.forEach(function (r) { idx[r.sku] = r; });
    poster.forEach(function (p) {
      if (p.type === 'opretBatch') {
        if (res.some(function (r) { return r.dato === String(p.data.dato); })) return;
        var nye = lokaleRaekker(p.data, p.meta);
        nye.forEach(function (r) { r.ventende = true; idx[r.sku] = r; });
        res = nye.concat(res);
      } else if (p.type === 'gemKlargoering') {
        var r = idx[p.data.sku]; if (!r) return;
        ['sorteret', 'klar', 'stand', 'platform', 'noter', 'vejledning', 'komplet'].forEach(function (k) { r[k] = p.data[k]; });
        if (r.lagerstatus !== 'Solgt') r.lagerstatus = r.klar ? 'På lager' : '';
        r.ventende = true;
      } else if (p.type === 'uploadFoto') {
        var f = idx[p.data.sku]; if (!f) return;
        f.fotos = true; f.ventendeFotos++;
      } else if (p.type === 'saetListet') {
        var li = idx[p.data.sku]; if (li) { li.listet = p.data.listet; li.ventende = true; }
      } else if (p.type === 'registrerSalg') {
        (p.data.varer || []).forEach(function (v) { var x = idx[v.sku]; if (x) { x.lagerstatus = 'Solgt'; x.ventende = true; } });
      }
    });
    return res;
  }

  function lager() { return anvend(kopi.lager, udbakke).slice().sort(B.saetOrden); }
  function batch(dato) { return lager().filter(function (r) { return r.dato === String(dato); }); }
  function batchFindes(dato) {
    if (kopi.log[String(dato)] !== undefined) return true;
    return udbakke.some(function (p) { return p.type === 'opretBatch' && String(p.data.dato) === String(dato); });
  }

  // ---------------- Opslag i den lokale sæt-database ----------------
  function harDb() { return !!kopi.db; }
  function slaaOp(nr) {
    nr = String(nr || '').trim();
    var r = kopi.db && (kopi.db[nr] || kopi.db[nr + '-1'] || kopi.db[nr.replace(/-1$/, '')]);
    return {
      setnr: nr, fundet: !!r, navn: r ? r[0] : 'Sæt findes ikke', tema: r ? r[1] : '', undertema: r ? r[2] : '', aar: r ? r[3] : '',
      salg: kopi.salg[nr] || null
    };
  }

  // ---------------- Tilføj sæt til DB (virker også uden net) ----------------
  function dbNummer(nr) { return String(nr == null ? '' : nr).trim().replace(/-1$/, ''); }
  function temaer() {
    var t = {}; Object.keys(kopi.db || {}).forEach(function (k) { var x = kopi.db[k][1]; if (x) t[x] = 1; });
    return Object.keys(t).sort(function (a, b) { return a.localeCompare(b); });
  }
  // Sæt i udbakken lægges ind i den lokale DB-kopi (også efter en ny kopi fra Sheets)
  function anvendDb() {
    udbakke.forEach(function (p) {
      if (p.type !== 'tilfoejDb') return;
      var d = p.data; if (kopi.db && !kopi.db[d.setnr]) kopi.db[d.setnr] = [d.navn, d.tema, d.undertema || '', d.aar];
    });
  }
  async function tilfoejDb(d) {
    var nr = dbNummer(d.setnr), navn = String(d.navn || '').trim(), tema = String(d.tema || '').trim(), aar = String(d.aar || '').trim();
    if (!nr) throw new Error('Sætnummer mangler.');
    if (!navn) throw new Error('Skriv sættets navn.');
    if (!tema) throw new Error('Skriv et tema.');
    if (!/^(19[4-9]\d|20\d\d)$/.test(aar)) throw new Error('År skal være et årstal, fx 1992.');
    if (!kopi.db) throw new Error('Sæt-databasen er ikke hentet til telefonen endnu. Åbn appen med net én gang.');
    var fandtes = kopi.db[nr] || kopi.db[nr + '-1'];
    if (fandtes) throw new Error('Sæt ' + nr + ' findes allerede i DB som "' + fandtes[0] + '".');
    var data = { setnr: nr, navn: navn, tema: tema, undertema: String(d.undertema || '').trim(), aar: aar };
    kopi.db[nr] = [data.navn, data.tema, data.undertema, data.aar];
    await Lokal.saet('db', kopi.db);
    await tilfoej('tilfoejDb', data, { setnr: nr });
    return slaaOp(nr);
  }

  // ---------------- Udbakke ----------------
  async function tilfoej(type, data, meta) {
    var post = { type: type, data: data, meta: meta || {}, status: 'venter', fejl: '', tid: Date.now() };
    post.seq = await Lokal.udbakke.tilfoej(post);
    udbakke.push(post);
    fyr();
    koer();
    return post;
  }

  function venter() { return udbakke.filter(function (p) { return p.status !== 'fejl'; }); }
  function fejlede() { return udbakke.filter(function (p) { return p.status === 'fejl'; }); }
  function poster() { return udbakke.slice(); }

  var koerer = false, timer = null;
  function planlaeg(ms) { clearTimeout(timer); timer = setTimeout(koer, ms); }

  async function koer() {
    if (koerer) return;
    koerer = true; status.sender = true; fyr();
    var sendt = 0;
    try {
      for (;;) {
        var p = udbakke.find(function (x) { return x.status === 'venter'; });
        if (!p) break;
        p.status = 'sender'; fyr();
        try {
          var svar = await Api.kald(p.type, p.data, 1);
          status.online = true;
          await efterSucces(p, svar);
          await Lokal.udbakke.slet(p.seq);
          udbakke = udbakke.filter(function (x) { return x !== p; });
          sendt++;
          fyr();
        } catch (e) {
          if (e.fraServer) {
            p.status = 'fejl'; p.fejl = e.message;
            await Lokal.udbakke.opdater(p);
            haendelse('fejl', p);
            fyr();
            continue;
          }
          p.status = 'venter';
          status.online = false;
          fyr();
          planlaeg(20000);
          break;
        }
      }
    } finally { koerer = false; status.sender = false; fyr(); }
    if (sendt && !udbakke.some(function (x) { return x.status === 'venter'; })) haendelse('altSendt', sendt);
  }

  async function efterSucces(p, svar) {
    if (p.type === 'opretBatch') {
      var dato = String(svar.dato);
      var lokal = lokaleRaekker(p.data, p.meta);
      kopi.lager = svar.saet.map(function (s) { s.antalFotos = s.antalFotos || 0; return s; })
        .concat(kopi.lager.filter(function (r) { return r.dato !== dato; }));
      kopi.log[dato] = svar.pris;
      var afvig = svar.saet.filter(function (s, i) { return lokal[i] && Math.abs(s.koebspris - lokal[i].koebspris) > 0.01; });
      await Promise.all([Lokal.saet('lager', kopi.lager), Lokal.saet('log', kopi.log)]);
      haendelse('batchGemt', { dato: dato, antal: svar.saet.length, afvig: afvig.length });
    } else if (p.type === 'gemKlargoering') {
      erstat(svar);
      await Lokal.saet('lager', kopi.lager);
    } else if (p.type === 'saetListet') {
      erstat(svar);
      await Lokal.saet('lager', kopi.lager);
    } else if (p.type === 'registrerSalg') {
      (svar.saet || []).forEach(erstat);
      await Lokal.saet('lager', kopi.lager);
      haendelse('salgGemt', { antal: (svar.raekker || []).length, fortjeneste: svar.fortjenesteOrdre });
    } else if (p.type === 'tilfoejDb') {
      if (kopi.db) { kopi.db[svar.setnr] = [svar.navn, svar.tema, svar.undertema || '', svar.aar]; await Lokal.saet('db', kopi.db); }
    } else if (p.type === 'uploadFoto') {
      var r = kopi.lager.find(function (x) { return x.sku === p.data.sku; });
      if (r) { r.antalFotos = svar.antalFotos; r.fotos = true; }
      (sendteFotos[p.data.sku] = sendteFotos[p.data.sku] || []).push({ thumb: p.meta.thumb, navn: svar.navn });
      await Lokal.saet('lager', kopi.lager);
    }
  }

  function erstat(s) {
    var i = kopi.lager.findIndex(function (x) { return x.sku === s.sku; });
    if (i >= 0) { if (s.antalFotos === undefined) s.antalFotos = kopi.lager[i].antalFotos; kopi.lager[i] = s; }
  }

  async function proevIgen(seq) {
    var p = udbakke.find(function (x) { return x.seq === seq; }); if (!p) return;
    p.status = 'venter'; p.fejl = ''; await Lokal.udbakke.opdater(p); fyr(); koer();
  }
  async function slet(seq) {
    await Lokal.udbakke.slet(seq);
    udbakke = udbakke.filter(function (x) { return x.seq !== seq; }); fyr();
  }

  // ---------------- Hent ny kopi fra Sheets ----------------
  async function hentAlt() {
    if (status.henter) return false;
    status.henter = true; fyr();
    try {
      var d = await Api.kald('hentAlt', {}, 2);
      var db = {}; (d.db || []).forEach(function (r) { db[String(r[0])] = [r[1], r[2], r[3], r[4]]; });
      var salg = {}; (d.salg || []).forEach(function (r) { salg[String(r[0])] = { gns: Number(r[1]), antal: Number(r[2]), hoejeste: Number(r[3]), laveste: Number(r[4]) }; });
      var log = {}; (d.log || []).forEach(function (r) { log[String(r[0])] = Number(r[1]); });
      // bevar fototællinger, som lagerlisten ikke indeholder
      var gl = {}; kopi.lager.forEach(function (r) { gl[r.sku] = r.antalFotos; });
      (d.lager || []).forEach(function (r) { if (r.antalFotos === undefined) r.antalFotos = gl[r.sku] || (r.fotos ? 1 : 0); });
      kopi = { db: db, salg: salg, lager: d.lager || [], log: log, hentet: Date.now(), kurs: d.kurs || {} };
      anvendDb();
      await Promise.all([Lokal.saet('db', db), Lokal.saet('salg', salg), Lokal.saet('lager', kopi.lager), Lokal.saet('log', log), Lokal.saet('hentet', kopi.hentet), Lokal.saet('kurs', kopi.kurs)]);
      status.online = true;
      return true;
    } catch (e) {
      if (!e.fraServer) status.online = false; else status.fejl = e.message;
      return false;
    } finally { status.henter = false; fyr(); }
  }

  // Køb: tilføj/ret/fjern kræver net (SKU'er og købspriser regnes af arket)
  async function retKoeb(handling, data) {
    var b = await Api.kald(handling, data, 2);
    erstatBatch(b);
    return b;
  }
  function erstatBatch(b) {
    var dato = String(b.dato);
    kopi.lager = b.saet.concat(kopi.lager.filter(function (r) { return r.dato !== dato; }));
    Lokal.saet('lager', kopi.lager); fyr();
  }
  function koebStatus(dato) {
    var rk = batch(dato);
    var mangler = rk.filter(function (r) { return !r.klar && r.lagerstatus !== 'Solgt'; }).length;
    return { aaben: String(dato) === '250000' || mangler > 0 || !rk.length, mangler: mangler, ialt: rk.length, privat: String(dato) === '250000' };
  }
  async function lavListings(dato) {
    var r = await Api.kald('lavListings', { dato: dato }, 1);
    (r.saet || []).forEach(function (x) { listings.saet[x.sku] = { titel: x.titel, zustand: x.zustand, beskrivelse: x.beskrivelse }; });
    if (r.url) listings.doc[String(dato)] = r.url;
    await Lokal.saet('listings', listings);
    fyr();
    return r;
  }

  // Præcise fototællinger for en batch (kun når der er net – ellers bruges kopien)
  async function opdaterFotos(dato) {
    try {
      var b = await Api.kald('hentBatch', { dato: dato }, 1);
      b.saet.forEach(function (s) { var r = kopi.lager.find(function (x) { return x.sku === s.sku; }); if (r) r.antalFotos = s.antalFotos; });
      await Lokal.saet('lager', kopi.lager);
      fyr();
    } catch (e) { /* uden net: brug kopien */ }
  }

  window.addEventListener('online', function () { status.online = true; fyr(); koer(); });
  window.addEventListener('offline', function () { status.online = false; fyr(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) koer(); });

  rod.Data = {
    start: start, paa: function (fn) { lyttere.push(fn); }, paaHaendelse: function (fn) { haendelser.push(fn); },
    lager: lager, batch: batch, batchFindes: batchFindes, harDb: harDb, slaaOp: slaaOp, tilfoejDb: tilfoejDb, temaer: temaer, dbNummer: dbNummer,
    tilfoej: tilfoej, venter: venter, fejlede: fejlede, poster: poster, proevIgen: proevIgen, slet: slet, koer: koer,
    hentAlt: hentAlt, opdaterFotos: opdaterFotos, status: function () { return status; },
    retKoeb: retKoeb, koebStatus: koebStatus, lavListings: lavListings,
    listing: function (sku) { return listings.saet[sku] || null; }, listingDoc: function (dato) { return listings.doc[String(dato)] || ''; },
    hentetTid: function () { return kopi.hentet; }, kurs: function (aar) { return Number(kopi.kurs[String(aar)]) || 7.46; }, sendteFotos: function (sku) { return sendteFotos[sku] || []; }
  };
})(this);
