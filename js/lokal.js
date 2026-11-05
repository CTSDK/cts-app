// Lokal lagring på telefonen (IndexedDB). Overlever at appen lukkes.
//  - kv:       nøgle → værdi (kopi af sæt-database, salgspriser, lager, indkøbslog)
//  - udbakke:  ting der venter på at blive sendt (køb, klargøring, fotos), i rækkefølge
(function (rod) {
  'use strict';

  var NAVN = /[?&]mock=1/.test(location.search) ? 'cts-mock' : 'cts';
  var dbLoefte = null;

  function aabn() {
    if (dbLoefte) return dbLoefte;
    dbLoefte = new Promise(function (ok, fejl) {
      var req = indexedDB.open(NAVN, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('udbakke')) db.createObjectStore('udbakke', { keyPath: 'seq', autoIncrement: true });
      };
      req.onsuccess = function () { ok(req.result); };
      req.onerror = function () { fejl(req.error || new Error('Lokal lagring kunne ikke åbnes.')); };
    });
    return dbLoefte;
  }

  function tx(lager, tilstand, fn) {
    return aabn().then(function (db) {
      return new Promise(function (ok, fejl) {
        var t = db.transaction(lager, tilstand);
        var res;
        Promise.resolve(fn(t.objectStore(lager), function (v) { res = v; })).catch(fejl);
        t.oncomplete = function () { ok(res); };
        t.onerror = function () { fejl(t.error); };
        t.onabort = function () { fejl(t.error || new Error('Lokal lagring afbrudt (er telefonen fuld?).')); };
      });
    });
  }
  function req2(r, saet) { r.onsuccess = function () { saet(r.result); }; }

  var Lokal = {
    hent: function (k) { return tx('kv', 'readonly', function (s, saet) { req2(s.get(k), saet); }); },
    saet: function (k, v) { return tx('kv', 'readwrite', function (s) { s.put(v, k); }); },
    udbakke: {
      tilfoej: function (post) { return tx('udbakke', 'readwrite', function (s, saet) { req2(s.add(post), saet); }); },
      alle: function () { return tx('udbakke', 'readonly', function (s, saet) { req2(s.getAll(), saet); }); },
      opdater: function (post) { return tx('udbakke', 'readwrite', function (s) { s.put(post); }); },
      slet: function (seq) { return tx('udbakke', 'readwrite', function (s) { s.delete(seq); }); }
    },
    nulstil: function () {
      return aabn().then(function (db) { db.close(); dbLoefte = null; return new Promise(function (ok) { var r = indexedDB.deleteDatabase(NAVN); r.onsuccess = r.onerror = r.onblocked = function () { ok(); }; }); });
    }
  };

  // Bed telefonen om ikke at rydde lagringen
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignorer */ }

  rod.Lokal = Lokal;
})(this);
