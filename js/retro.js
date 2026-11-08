// Retro Design – ren logik (ingen DOM): SKU-regel og prisfordeling.
// Samme regler findes i maskinrummet (apps-script/Code.gs: retroDel_, retroSku_, retroPlan_, retroPriser_)
// og testes ens i tests/retro.test.js.
(function (rod) {
  'use strict';

  // Tekst → store bogstaver uden mellemrum og tegn (æøå → AE/OE/AA). Kun A-Z og 0-9.
  function rens(t) {
    return String(t == null ? '' : t).toUpperCase()
      .replace(/Æ/g, 'AE').replace(/Ø/g, 'OE').replace(/Å/g, 'AA')
      .replace(/[ÄÁÀÂ]/g, 'A').replace(/[ÖÓÒÔ]/g, 'O').replace(/[ÜÚÙÛ]/g, 'U').replace(/[ÉÈÊË]/g, 'E')
      .replace(/[^A-Z0-9]/g, '');
  }

  // Del af SKU'et: kode+model hvis model; ellers kode hvis producent (kode); ellers typen.
  function retroDel(kode, model, type) {
    var k = rens(kode), m = rens(model);
    if (m) return k + m;
    if (k) return k;
    return rens(type) || 'TING';
  }

  // 1 → a, 2 → b … 26 → z, 27 → aa
  function bogstav(n) {
    var s = '';
    while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(97 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function bogstavNr(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 96);
    return n;
  }

  function skuFraDel(dato, del, nr, antalEns) {
    return 'R' + dato + '-' + del + (antalEns > 1 ? '-' + bogstav(nr) : '');
  }

  // SKU for én ting. nr = nummer blandt de ens (1, 2, 3 …), antalEns = hvor mange ens i købet.
  function retroSku(dato, kode, model, type, nr, antalEns) {
    return skuFraDel(dato, retroDel(kode, model, type), nr, antalEns);
  }

  // SKU'er for nye ting i et køb (også når der tilføjes til et eksisterende køb).
  // eksisterende = SKU'er der allerede er i købet; nyeDele = del for hver ny ting i rækkefølge.
  // Resultat: { skuer: [...], omdoeb: [[gammelSku, nySku], …] } – en ting, der stod alene uden bogstav,
  // får -a, når der kommer flere ens til.
  function retroPlan(dato, eksisterende, nyeDele) {
    var info = {};
    (eksisterende || []).forEach(function (sku) {
      var m = /^R\d{6}-([A-Z0-9]+)(?:-([a-z]+))?$/.exec(String(sku));
      if (!m) return;
      var i = info[m[1]] = info[m[1]] || { antal: 0, hoejeste: 0, alene: null };
      i.antal++;
      if (m[2]) i.hoejeste = Math.max(i.hoejeste, bogstavNr(m[2])); else i.alene = String(sku);
    });
    var nyeAntal = {};
    nyeDele.forEach(function (d) { nyeAntal[d] = (nyeAntal[d] || 0) + 1; });
    var taeller = {}, omdoeb = [], total = {};
    Object.keys(nyeAntal).forEach(function (d) {
      var i = info[d] || { antal: 0, hoejeste: 0, alene: null };
      total[d] = i.antal + nyeAntal[d];
      taeller[d] = i.hoejeste;
      if (total[d] > 1 && i.alene) { taeller[d]++; omdoeb.push([i.alene, skuFraDel(dato, d, taeller[d], total[d])]); }
    });
    var skuer = nyeDele.map(function (d) {
      if (total[d] > 1) { taeller[d]++; return skuFraDel(dato, d, taeller[d], total[d]); }
      return skuFraDel(dato, d, 1, 1);
    });
    return { skuer: skuer, omdoeb: omdoeb };
  }

  // Linjer {type, kode, model, antal} → én ting pr. stk.
  function udvid(linjer) {
    var res = [];
    (linjer || []).forEach(function (l) {
      var n = Math.max(0, Math.floor(Number(l.antal) || 0));
      for (var i = 0; i < n; i++) res.push(l);
    });
    return res;
  }

  // SKU'er for linjerne (til live-forhåndsvisning og lokal visning)
  function retroSkuer(dato, linjer, eksisterende) {
    var ting = udvid(linjer);
    return retroPlan(dato, eksisterende || [], ting.map(function (l) { return retroDel(l.kode, l.model, l.type); }));
  }

  // Samlet pris delt ligeligt på n ting, 2 decimaler; sidste ting får resten, så summen passer.
  function retroPriser(pris, n) {
    if (!(n > 0)) return [];
    var oere = Math.round((Number(pris) || 0) * 100), hver = Math.floor(oere / n), res = [];
    for (var i = 0; i < n - 1; i++) res.push(hver / 100);
    res.push((oere - hver * (n - 1)) / 100);
    return res;
  }

  // "2026-11-08" eller "261108" → "261108"
  function retroDato(s) {
    s = String(s == null ? '' : s).trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return m[1].slice(2) + m[2] + m[3];
    return /^\d{6}$/.test(s) ? s : '';
  }

  var api = { rens: rens, retroDel: retroDel, retroSku: retroSku, retroPlan: retroPlan, retroSkuer: retroSkuer, udvid: udvid,
    retroPriser: retroPriser, retroDato: retroDato, bogstav: bogstav };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else rod.Retro = api;
})(this);
