// CTS-appen – skærme og flow
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var B = window.Beregn, Api = window.Api, Foto = window.Foto;
  var KILDER_MANUEL = ['BrickLink', 'eBay', 'Egen vurdering'];
  var KLADDE = 'cts.kladde';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3000); }
  function iDag() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

  // ================= Navigation =================
  var aktiv = 'forside';
  function gaa(navn) {
    if (aktiv === 'koeb3' && navn !== 'koeb3') {
      if (koe.ventende() > 0 && !confirm('Der er fotos, der ikke er sendt endnu. Vil du forlade siden alligevel?')) return;
      Foto.stopKamera($('k3-video')); kameraUi();
    }
    document.querySelectorAll('.visning').forEach(function (v) { v.hidden = v.id !== 'v-' + navn; });
    aktiv = navn;
    window.scrollTo(0, 0);
    if (navn === 'forside') tjekForbindelse();
    if (navn === 'indstillinger') visIndstillinger();
    if (navn === 'koeb1') visKoeb1();
    if (navn === 'koeb2') visKoeb2();
    if (navn === 'lager') hentLager();
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-gaa]');
    if (g && !g.disabled) gaa(g.getAttribute('data-gaa'));
  });

  // ================= Forside / forbindelse =================
  async function tjekForbindelse() {
    var el = $('forbindelse');
    var ind = Api.indstillinger();
    if (!Api.erMock() && (!ind.url || !ind.noegle)) { el.textContent = 'Ikke forbundet – gå til Indstillinger'; el.className = 'status fejl'; return; }
    el.textContent = 'Tjekker forbindelse …'; el.className = 'status';
    try {
      var p = await Api.kald('ping', {}, 2);
      el.textContent = '✓ Forbundet til ' + p.ark + (p.tilstand === 'test' ? ' (testtilstand)' : '');
      el.className = 'status ok';
    } catch (e) { el.textContent = 'Ingen forbindelse: ' + e.message; el.className = 'status fejl'; }
  }

  function visIndstillinger() {
    var ind = Api.indstillinger();
    $('ind-url').value = ind.url || ''; $('ind-noegle').value = ind.noegle || ''; $('ind-status').textContent = '';
  }
  $('ind-gem').addEventListener('click', async function () {
    var url = $('ind-url').value.trim(), noegle = $('ind-noegle').value.trim(), st = $('ind-status');
    st.className = 'besked';
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) { st.className = 'besked fejl'; st.textContent = 'Adressen skal starte med https://script.google.com/ og slutte på /exec.'; return; }
    if (noegle.length < 20) { st.className = 'besked fejl'; st.textContent = 'Nøglen ser for kort ud. Kopiér den fra regnearket: CTS → Vis API-nøgle.'; return; }
    Api.gemIndstillinger({ url: url, noegle: noegle });
    st.textContent = 'Tester …';
    try { var p = await Api.kald('ping', {}, 2); st.textContent = '✓ Forbundet til "' + p.ark + '" (version ' + p.version + ').'; }
    catch (e) { st.className = 'besked fejl'; st.textContent = 'Gemt, men forbindelsen fejlede: ' + e.message; }
  });

  // ================= Nyt køb – kladde =================
  var koeb = null;
  var navnEl = new WeakMap(), timere = new WeakMap(); // linje → navnefelt/timer (ikke i kladden)
  function nyKoeb() { return { iso: iDag(), pris: '', linjer: [tomLinje()] }; }
  function tomLinje() { return { setnr: '', ovp: true, opslag: null, vaerdi: '', kilde: '' }; }
  function gemKladde() { try { localStorage.setItem(KLADDE, JSON.stringify(koeb)); } catch (e) { /* ignorer */ } }
  function hentKladde() { try { return JSON.parse(localStorage.getItem(KLADDE)); } catch (e) { return null; } }
  function sletKladde() { localStorage.removeItem(KLADDE); koeb = null; }

  // ================= Side 1 =================
  function visKoeb1() {
    if (!koeb) koeb = hentKladde() || nyKoeb();
    $('k1-dato').value = koeb.iso; $('k1-pris').value = koeb.pris;
    opdaterBatchId(); tegnLinjer(); $('k1-fejl').textContent = '';
  }
  function opdaterBatchId() { $('k1-batch').textContent = B.batchId(koeb.iso) || '–'; }
  $('k1-dato').addEventListener('change', function () { koeb.iso = this.value; opdaterBatchId(); gemKladde(); });
  $('k1-pris').addEventListener('input', function () { koeb.pris = this.value; gemKladde(); });

  function sikrTomSidsteLinje() {
    var l = koeb.linjer;
    if (!l.length || l[l.length - 1].setnr.trim()) l.push(tomLinje());
  }
  function tegnLinjer() {
    sikrTomSidsteLinje();
    var c = $('k1-linjer'); c.innerHTML = '';
    koeb.linjer.forEach(function (ln, i) {
      var d = document.createElement('div'); d.className = 'linje';
      var sidste = i === koeb.linjer.length - 1;
      d.innerHTML =
        '<input aria-label="Sætnummer ' + (i + 1) + '" inputmode="numeric" autocomplete="off" placeholder="Setnr" value="' + esc(ln.setnr) + '">' +
        '<div class="ovp" role="group" aria-label="OVP"><button type="button" data-ovp="1" class="' + (ln.ovp ? 'til' : '') + '">OVP</button><button type="button" data-ovp="0" class="' + (ln.ovp ? '' : 'til') + '">Uden</button></div>' +
        '<button type="button" class="slet" aria-label="Fjern linje"' + (sidste ? ' style="visibility:hidden"' : '') + '>×</button>' +
        '<div class="navn"></div>';
      var inp = d.querySelector('input'), navn = d.querySelector('.navn');
      navnEl.set(ln, navn);
      visNavn(navn, ln);
      inp.addEventListener('input', function () {
        ln.setnr = inp.value.trim(); ln.opslag = null; visNavn(navn, ln); gemKladde();
        if (ln.setnr && i === koeb.linjer.length - 1) { koeb.linjer.push(tomLinje()); tilfoejSidsteLinje(); }
        clearTimeout(timere.get(ln)); timere.set(ln, setTimeout(function () { slaaOp(ln); }, 450));
      });
      d.querySelectorAll('[data-ovp]').forEach(function (b) {
        b.addEventListener('click', function () {
          ln.ovp = b.getAttribute('data-ovp') === '1';
          d.querySelectorAll('[data-ovp]').forEach(function (x) { x.classList.toggle('til', x === b); });
          gemKladde();
        });
      });
      d.querySelector('.slet').addEventListener('click', function () { koeb.linjer.splice(koeb.linjer.indexOf(ln), 1); gemKladde(); tegnLinjer(); });
      c.appendChild(d);
    });
  }
  function tilfoejSidsteLinje() {
    // Tegn kun den nye tomme linje, så fokus bliver i feltet man skriver i
    var fokus = document.activeElement, pos = fokus && fokus.selectionStart;
    tegnLinjer();
    var felter = $('k1-linjer').querySelectorAll('input');
    var f = felter[felter.length - 2]; if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* */ } }
  }
  function visNavn(el, ln) {
    if (!ln.setnr) { el.textContent = ''; el.className = 'navn'; return; }
    if (!ln.opslag) { el.textContent = 'Slår op …'; el.className = 'navn'; return; }
    if (ln.opslag.fejl) { el.textContent = 'Opslag fejlede: ' + ln.opslag.fejl; el.className = 'navn ikke'; return; }
    el.textContent = ln.opslag.fundet ? ln.opslag.navn + (ln.opslag.aar ? ' (' + ln.opslag.aar + ')' : '') : 'Sæt findes ikke i DB';
    el.className = 'navn ' + (ln.opslag.fundet ? 'fundet' : 'ikke');
  }
  async function slaaOp(ln) {
    var nr = ln.setnr; if (!nr) return;
    try {
      var r = await Api.kald('slaaOp', { setnr: nr }, 3);
      if (ln.setnr !== nr) return;
      ln.opslag = r;
    } catch (e) { if (ln.setnr === nr) ln.opslag = { fejl: e.message }; }
    gemKladde();
    var el = navnEl.get(ln);
    if (el && el.isConnected) visNavn(el, ln);
  }

  $('k1-faerdig').addEventListener('click', async function () {
    var f = $('k1-fejl'); f.textContent = '';
    var dato = B.batchId(koeb.iso), pris = B.tal(koeb.pris);
    var saet = koeb.linjer.filter(function (l) { return l.setnr; });
    if (!dato) { f.textContent = 'Vælg købsdato.'; return; }
    if (!(pris > 0)) { f.textContent = 'Skriv den samlede pris i DKK.'; return; }
    if (!saet.length) { f.textContent = 'Tilføj mindst ét sæt.'; return; }
    // Vent på opslag der mangler
    this.disabled = true;
    try {
      for (var i = 0; i < saet.length; i++) if (!saet[i].opslag || saet[i].opslag.fejl) await slaaOp(saet[i]);
    } finally { this.disabled = false; }
    tegnLinjer();
    var mangler = saet.filter(function (l) { return !l.opslag || l.opslag.fejl || !l.opslag.fundet; });
    if (mangler.length) { f.textContent = 'Ret disse sætnumre (findes ikke i DB eller opslag fejlede): ' + mangler.map(function (l) { return l.setnr; }).join(', '); return; }
    koeb.linjer = saet; gemKladde();
    gaa('koeb2');
  });

  // ================= Side 2 =================
  function visKoeb2() {
    if (!koeb) { gaa('koeb1'); return; }
    var dato = B.batchId(koeb.iso), pris = B.tal(koeb.pris);
    var skuer = B.skuer(dato, koeb.linjer.map(function (l) { return l.setnr; }));
    $('k2-batch').textContent = dato; $('k2-pris').textContent = B.kr(pris); $('k2-fejl').textContent = '';
    var c = $('k2-liste'); c.innerHTML = '';
    koeb.linjer.forEach(function (ln, i) {
      var auto = B.vaerdiFraSalg(ln.opslag && ln.opslag.salg, ln.ovp);
      if (auto !== null) { ln.vaerdi = auto; ln.kilde = 'Egne salg'; }
      else if (ln.kilde === 'Egne salg') { ln.kilde = ''; ln.vaerdi = ''; }
      var d = document.createElement('div'); d.className = 'post';
      var s = ln.opslag && ln.opslag.salg;
      var info = auto !== null
        ? 'Egne salg: ' + s.antal + ' stk · gns. ' + B.kr(s.gns) + ' € · højeste ' + B.kr(s.hoejeste) + ' € → bruger ' + (ln.ovp ? 'højeste (OVP)' : 'gennemsnit')
        : '<span class="ikke-off">Ikke offentliggjort</span> – ingen egne salg';
      d.innerHTML =
        '<div class="post-top"><span class="navn">' + esc(ln.opslag.navn) + '</span><span class="mono">' + esc(skuer[i]) + '</span></div>' +
        '<div class="lille">' + (ln.ovp ? 'Med OVP' : 'Uden OVP') + ' · ' + info + '</div>' +
        (auto !== null
          ? '<div class="lille">Værdi: <b>' + B.kr(auto) + ' €</b></div>'
          : '<div class="vaerdi-raekke">' +
            '<input inputmode="decimal" aria-label="Værdi i euro for ' + esc(ln.setnr) + '" placeholder="Værdi €" value="' + esc(ln.vaerdi === '' ? '' : String(ln.vaerdi).replace('.', ',')) + '">' +
            '<select aria-label="Kilde for ' + esc(ln.setnr) + '"><option value="">Vælg kilde</option>' +
            KILDER_MANUEL.map(function (k) { return '<option' + (ln.kilde === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>') +
        '<div class="koebspris"><span>Købspris</span><b data-kp>–</b></div>';
      var inp = d.querySelector('input'), sel = d.querySelector('select');
      if (inp) inp.addEventListener('input', function () { var v = B.tal(inp.value); ln.vaerdi = v > 0 ? v : ''; gemKladde(); opdaterKoebspriser(); });
      if (sel) sel.addEventListener('change', function () { ln.kilde = sel.value; gemKladde(); });
      c.appendChild(d);
    });
    gemKladde(); opdaterKoebspriser();
  }
  function opdaterKoebspriser() {
    var pris = B.tal(koeb.pris);
    var v = koeb.linjer.map(function (l) { return Number(l.vaerdi) || 0; });
    var kp = B.koebspriser(pris, v);
    var felter = $('k2-liste').querySelectorAll('[data-kp]');
    kp.forEach(function (k, i) { felter[i].textContent = v[i] > 0 ? B.kr(k) + ' kr' : '–'; });
    var sum = kp.reduce(function (a, k) { return a + k; }, 0);
    $('k2-sum').textContent = B.kr(sum) + ' kr' + (Math.abs(sum - pris) < 0.005 ? ' ✓' : '');
  }
  $('k2-gem').addEventListener('click', async function () {
    var f = $('k2-fejl'); f.textContent = '';
    var mangler = koeb.linjer.filter(function (l) { return !(Number(l.vaerdi) > 0) || !l.kilde; });
    if (mangler.length) { f.textContent = 'Udfyld værdi og kilde for: ' + mangler.map(function (l) { return l.setnr; }).join(', '); return; }
    var knap = this; knap.disabled = true; knap.textContent = 'Gemmer …';
    var dato = B.batchId(koeb.iso), pris = B.tal(koeb.pris);
    try {
      var res = await Api.kald('opretBatch', {
        dato: dato, pris: pris,
        saet: koeb.linjer.map(function (l) { return { setnr: l.setnr, ovp: l.ovp, vaerdi: Number(l.vaerdi), kilde: l.kilde }; })
      }, 1);
      // Kontrol: regnearkets købspriser mod appens
      var lokal = B.koebspriser(pris, koeb.linjer.map(function (l) { return Number(l.vaerdi); }));
      var afvig = res.saet.filter(function (s, i) { return Math.abs(s.koebspris - lokal[i]) > 0.01; });
      sletKladde();
      aabnKlargoering(res, res.saet[0] && res.saet[0].sku, 'forside');
      toast(afvig.length ? 'Gemt – men Sheets regnede anderledes for ' + afvig.length + ' sæt. Tjek arket.' : 'Gemt i Sheets ✓ ' + res.saet.length + ' sæt');
    } catch (e) {
      f.textContent = 'Ikke gemt: ' + e.message;
    } finally { knap.disabled = false; knap.textContent = 'Gem i Sheets'; }
  });

  // ================= Side 3: klargør =================
  var k3 = { batch: null, sku: null, fra: 'forside', stand: '' };
  var koe = new Foto.Koe(function (p) {
    return Api.kald('uploadFoto', { sku: p.sku, billede: p.jpg.base64, uploadId: p.id }, 1);
  }, function (p) {
    if (p.status === 'ok' && p.svar) {
      var s = findSaet(p.sku); if (s) { s.antalFotos = p.svar.antalFotos; s.fotos = true; }
    }
    tegnFotos(); visKrav();
  });

  function findSaet(sku) { return k3.batch && k3.batch.saet.find(function (s) { return s.sku === sku; }); }

  function aabnKlargoering(batch, sku, fra) {
    k3.batch = batch; k3.fra = fra || 'forside';
    gaa('koeb3');
    vaelgSaet(sku || (batch.saet[0] && batch.saet[0].sku));
  }
  $('k3-tilbage').addEventListener('click', function () { gaa(k3.fra); });

  function tegnVaelger() {
    var c = $('k3-vaelg'); c.innerHTML = '';
    k3.batch.saet.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.className = (s.sku === k3.sku ? 'til ' : '') + (s.klar ? 'klar' : '');
      b.setAttribute('aria-selected', s.sku === k3.sku ? 'true' : 'false');
      b.textContent = (s.klar ? '✓ ' : '') + s.setnr + (/-[a-z]$/.test(s.sku) ? s.sku.slice(-2) : '');
      b.addEventListener('click', async function () {
        if (s.sku === k3.sku) return;
        if (erAendret()) await gem(false, true);
        vaelgSaet(s.sku);
      });
      c.appendChild(b);
    });
  }

  function vaelgSaet(sku) {
    var s = findSaet(sku); if (!s) return;
    k3.sku = sku;
    tegnVaelger();
    $('k3-sku').textContent = s.sku;
    $('k3-navn').textContent = s.navn;
    $('k3-info').textContent = (s.ovp ? 'Med æske (OVP)' : 'Uden æske') + ' · købspris ' + B.kr(s.koebspris) + ' kr' + (s.lagerstatus ? ' · ' + s.lagerstatus : '');
    k3.stand = s.stand === '' || s.stand == null ? '' : Number(s.stand);
    $('k3-stand').textContent = k3.stand === '' ? '–' : k3.stand + '/10';
    $('k3-platform').value = s.platform || 'eBay';
    $('k3-vejledning').checked = !!s.vejledning;
    $('k3-komplet').checked = !!s.komplet;
    $('k3-sorteret').checked = !!s.sorteret;
    $('k3-noter').value = s.noter || '';
    $('k3-status').textContent = '';
    tegnFotos(); visKrav();
  }

  function formular() {
    return {
      sku: k3.sku, stand: k3.stand, platform: $('k3-platform').value,
      vejledning: $('k3-vejledning').checked, komplet: $('k3-komplet').checked,
      sorteret: $('k3-sorteret').checked, noter: $('k3-noter').value.trim()
    };
  }
  function erAendret() {
    var s = findSaet(k3.sku); if (!s) return false;
    var f = formular();
    return String(f.stand) !== String(s.stand === null ? '' : s.stand) || f.platform !== (s.platform || 'eBay') ||
      f.vejledning !== !!s.vejledning || f.komplet !== !!s.komplet || f.sorteret !== !!s.sorteret || f.noter !== (s.noter || '');
  }

  function aendrStand(d) {
    if (k3.stand === '') k3.stand = 8; else k3.stand = Math.max(1, Math.min(10, k3.stand + d));
    $('k3-stand').textContent = k3.stand + '/10'; visKrav();
  }
  $('k3-minus').addEventListener('click', function () { aendrStand(-1); });
  $('k3-plus').addEventListener('click', function () { aendrStand(1); });
  $('k3-sorteret').addEventListener('change', visKrav);

  function visKrav() {
    var s = findSaet(k3.sku); if (!s) return;
    var fotos = (s.antalFotos || 0) > 0;
    var ok = { sorteret: $('k3-sorteret').checked, stand: k3.stand !== '', fotos: fotos };
    var venter = koe.poster.filter(function (p) { return p.sku === s.sku && p.status !== 'ok' && p.status !== 'fejl'; }).length;
    $('k3-krav').innerHTML = 'Klar til salg kræver: ' +
      [['sorteret', 'Sorteret'], ['stand', 'Stand'], ['fotos', 'Mindst ét foto']].map(function (k) { return (ok[k[0]] ? '✓ ' : '○ ') + k[1]; }).join(' · ') +
      ' — ' + (s.antalFotos || 0) + ' foto(s) i Drive' + (venter ? ', ' + venter + ' sendes' : '');
    var klarKnap = $('k3-klar');
    if (s.klar) { klarKnap.textContent = 'Markér som ikke klar'; klarKnap.disabled = false; }
    else { klarKnap.textContent = 'Klar til salg'; klarKnap.disabled = !(ok.sorteret && ok.stand && ok.fotos) || venter > 0; }
  }

  async function gem(klar, stille) {
    var s = findSaet(k3.sku); if (!s) return;
    var d = formular(); d.klar = klar === null ? !!s.klar : klar;
    var st = $('k3-status'); st.className = 'besked'; if (!stille) st.textContent = 'Gemmer …';
    try {
      var ny = await Api.kald('gemKlargoering', d, 3);
      Object.assign(s, ny);
      if (!stille) st.textContent = d.klar ? '✓ Klar til salg – vises nu i Lager.' : '✓ Gemt.';
      tegnVaelger(); visKrav();
      return true;
    } catch (e) { st.className = 'besked fejl'; st.textContent = 'Ikke gemt: ' + e.message; return false; }
  }
  $('k3-gem').addEventListener('click', function () { gem(null, false); });
  $('k3-klar').addEventListener('click', async function () {
    var s = findSaet(k3.sku); if (!s) return;
    var ok = await gem(!s.klar, false);
    if (ok && s.klar) {
      var naeste = k3.batch.saet.find(function (x) { return !x.klar; });
      toast(naeste ? 'Klar ✓ – næste: ' + naeste.setnr : 'Alle sæt i batchen er klar ✓');
    }
  });

  // Kamera
  function kameraUi() {
    var koerer = Foto.kameraKoerer();
    $('k3-start').textContent = koerer ? 'Stop kamera' : 'Start kamera';
    $('k3-tag').disabled = !koerer;
    $('k3-kamera-tom').hidden = koerer;
  }
  $('k3-start').addEventListener('click', async function () {
    var f = $('k3-kamerafejl'); f.textContent = '';
    if (Foto.kameraKoerer()) { Foto.stopKamera($('k3-video')); kameraUi(); return; }
    try { await Foto.startKamera($('k3-video')); }
    catch (e) {
      var t = e && e.name === 'NotAllowedError' ? 'Kameraet blev ikke tilladt. Tjek Indstillinger → Safari → Kamera, eller brug knappen herunder.' : (e.message || String(e));
      f.textContent = 'Live-kamera virker ikke: ' + t;
    }
    kameraUi();
  });
  $('k3-tag').addEventListener('click', function () {
    try {
      var jpg = Foto.tagBillede($('k3-video'));
      koe.tilfoej(k3.sku, jpg);
      var v = $('k3-video'); v.style.opacity = '0.3'; setTimeout(function () { v.style.opacity = ''; }, 120);
    } catch (e) { $('k3-kamerafejl').textContent = e.message; }
  });
  $('k3-fil').addEventListener('change', async function () {
    var filer = Array.prototype.slice.call(this.files || []); this.value = '';
    for (var i = 0; i < filer.length; i++) {
      try { koe.tilfoej(k3.sku, await Foto.filTilJpg(filer[i])); }
      catch (e) { $('k3-kamerafejl').textContent = e.message; }
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && aktiv === 'koeb3') { Foto.stopKamera($('k3-video')); kameraUi(); }
  });

  function tegnFotos() {
    var c = $('k3-fotos'); c.innerHTML = '';
    koe.poster.filter(function (p) { return p.sku === k3.sku; }).forEach(function (p) {
      var d = document.createElement('div'); d.className = 'foto ' + p.status;
      var tekst = p.status === 'ok' ? p.navn.replace(p.sku, '') : p.status === 'sender' ? 'sender …' : p.status === 'fejl' ? 'fejlede' : (p.fejl ? 'venter' : 'i kø');
      d.innerHTML = '<img alt="" src="' + p.jpg.dataUrl + '"><span>' + esc(tekst) + '</span>';
      if (p.status === 'fejl') {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Prøv igen';
        b.title = p.fejl; b.addEventListener('click', function () { koe.proevIgen(p.id); });
        d.appendChild(b);
      }
      c.appendChild(d);
    });
  }

  // ================= Lager =================
  var lager = [], filter = 'alle';
  async function hentLager() {
    $('l-antal').textContent = 'Henter …';
    try { lager = await Api.kald('hentLager', {}, 3); tegnLager(); }
    catch (e) { $('l-antal').textContent = 'Kunne ikke hente lager: ' + e.message; }
  }
  $('l-opdater').addEventListener('click', hentLager);
  $('l-soeg').addEventListener('input', tegnLager);
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('til', x === b); });
      tegnLager();
    });
  });
  function erKlar(s) { return s.klar && s.lagerstatus === 'På lager'; }
  function tegnLager() {
    var q = $('l-soeg').value.trim().toLowerCase();
    var vis = lager.filter(function (s) {
      if (filter === 'klar' && !erKlar(s)) return false;
      if (filter === 'ikke' && (s.klar || s.lagerstatus === 'Solgt')) return false;
      if (filter === 'ebay' && !(s.platform === 'eBay' && s.lagerstatus === 'På lager')) return false;
      if (!q) return true;
      return (s.sku + ' ' + s.setnr + ' ' + s.navn).toLowerCase().indexOf(q) >= 0;
    });
    $('l-antal').textContent = vis.length + ' af ' + lager.length + ' sæt';
    var c = $('l-liste'); c.innerHTML = '';
    vis.slice(0, 300).forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'lager-post';
      var maerke = s.lagerstatus === 'Solgt' ? ['solgt', 'Solgt'] : erKlar(s) ? ['klar', 'Klar'] : ['', 'Ikke klar'];
      b.innerHTML = '<span class="mono">' + esc(s.sku) + '</span><span class="maerke ' + maerke[0] + '">' + maerke[1] + '</span>' +
        '<span class="navn">' + esc(s.navn) + '</span>' +
        '<span class="lille">' + [s.stand ? 'Stand ' + s.stand : '', s.platform, s.ovp ? 'OVP' : ''].filter(Boolean).join(' · ') + '</span>';
      b.addEventListener('click', async function () {
        if (s.lagerstatus === 'Solgt') { toast('Sættet er solgt.'); return; }
        try { var batch = await Api.kald('hentBatch', { dato: s.dato }, 3); aabnKlargoering(batch, s.sku, 'lager'); }
        catch (e) { toast('Kunne ikke åbne: ' + e.message); }
      });
      c.appendChild(b);
    });
    if (vis.length > 300) { var m = document.createElement('div'); m.className = 'lille'; m.textContent = 'Viser de første 300. Søg for at indsnævre.'; c.appendChild(m); }
  }

  // ================= Start =================
  if (Api.erMock()) { var bn = $('testbanner'); bn.hidden = false; bn.textContent = 'TESTTILSTAND – simuleret forbindelse, intet gemmes i Sheets'; }
  gaa('forside');
  window.CTS = { gaa: gaa }; // til test
})();
