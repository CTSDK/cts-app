// Ren beregningslogik – bruges af appen og af testene (ingen DOM).
(function (rod) {
  'use strict';

  // Værdi ud fra egne salg: med OVP højeste pris, uden OVP gennemsnit. null = ingen egne salg.
  function vaerdiFraSalg(salg, ovp) {
    if (!salg || !(salg.antal > 0)) return null;
    var v = ovp ? salg.hoejeste : salg.gns;
    return v > 0 ? v : null;
  }

  // Købspris pr. sæt = batchpris × (værdi / sum af værdier). Ikke afrundet.
  function koebspriser(batchpris, vaerdier) {
    var sum = vaerdier.reduce(function (a, v) { return a + (Number(v) || 0); }, 0);
    return vaerdier.map(function (v) {
      return sum > 0 ? batchpris * (Number(v) || 0) / sum : 0;
    });
  }

  // SKU'er som regnearket laver dem: ÅÅMMDD-setnr, + -a/-b ... når samme sæt optræder flere gange.
  function skuer(dato, setnumre) {
    var antal = {};
    setnumre.forEach(function (n) { antal[n] = (antal[n] || 0) + 1; });
    var set = {};
    return setnumre.map(function (n) {
      var base = dato + '-' + n;
      if (antal[n] < 2) return base;
      set[n] = (set[n] || 0) + 1;
      return base + '-' + String.fromCharCode(96 + set[n]);
    });
  }

  // Dato (yyyy-mm-dd fra <input type=date>) → ÅÅMMDD
  function batchId(isoDato) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDato || '');
    return m ? m[1].slice(2) + m[2] + m[3] : '';
  }

  // Dansk talformat: 1234.5 → "1.234,50"
  function kr(v) {
    var n = Math.round((Number(v) || 0) * 100) / 100;
    var s = n.toFixed(2).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return s.join(',');
  }

  // "1.234,5" / "1234.5" / "600" → tal
  function tal(t) {
    if (typeof t === 'number') return t;
    t = String(t || '').trim().replace(/\s/g, '');
    if (!t) return NaN;
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    return Number(t);
  }

  var api = { vaerdiFraSalg: vaerdiFraSalg, koebspriser: koebspriser, skuer: skuer, batchId: batchId, kr: kr, tal: tal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else rod.Beregn = api;
})(this);
