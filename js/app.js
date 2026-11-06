// CTS-appen – skærme og flow
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var B = window.Beregn, Api = window.Api, Foto = window.Foto, Beskaer = window.Beskaer, Data = window.Data;
  var KILDER_MANUEL = ['BrickLink', 'eBay', 'Egen vurdering'];
  var KLADDE = 'cts.kladde';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3000); }
  function iDag() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

  // Lille logo foran overskriften på alle sider undtagen Hjem
  document.querySelectorAll('.top h2').forEach(function (h) {
    var i = document.createElement('img'); i.src = 'icons/logo-ikon.png'; i.alt = ''; i.className = 'top-logo';
    h.parentNode.insertBefore(i, h);
  });

  // ================= Tilføj sæt til DB =================
  var dbNy = null;
  function dbKnap(nr, efter) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'link db-knap'; b.textContent = 'Tilføj til DB';
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); aabnDbNy(nr, efter); });
    return b;
  }
  function aabnDbNy(nr, efter) {
    dbNy = { nr: Data.dbNummer(nr), efter: efter };
    $('dbny-nr').textContent = dbNy.nr;
    ['dbny-navn', 'dbny-tema', 'dbny-undertema', 'dbny-aar'].forEach(function (id) { $(id).value = ''; });
    $('dbny-temaer').innerHTML = Data.temaer().map(function (t) { return '<option value="' + esc(t) + '">'; }).join('');
    $('dbny-fejl').hidden = true;
    $('dbny').hidden = false; $('dbny-navn').focus();
  }
  $('dbny-annuller').addEventListener('click', function () { $('dbny').hidden = true; dbNy = null; });
  $('dbny-gem').addEventListener('click', async function () {
    if (!dbNy) return;
    var f = $('dbny-fejl'); f.hidden = true;
    try {
      var o = await Data.tilfoejDb({ setnr: dbNy.nr, navn: $('dbny-navn').value, tema: $('dbny-tema').value, undertema: $('dbny-undertema').value, aar: $('dbny-aar').value });
      var efter = dbNy.efter; $('dbny').hidden = true; dbNy = null;
      toast(o.navn + ' er tilføjet til DB' + (Data.status().online ? '' : ' – sendes, når der er net'));
      if (efter) efter(o);
    } catch (e) { f.textContent = e.message; f.hidden = false; }
  });

  // ================= Navigation =================
  var aktiv = 'forside';
  function gaa(navn) {
    if (aktiv === 'koeb3' && navn !== 'koeb3') { Foto.stopKamera($('k3-video')); kameraUi(); }
    document.querySelectorAll('.visning').forEach(function (v) { v.hidden = v.id !== 'v-' + navn; });
    aktiv = navn;
    var fane = { koeb2: 'koeb1', koeb3: k3 && k3.fra === 'lager' ? 'lager' : 'koeb1', indstillinger: 'mere', udbakke: 'mere' }[navn] || navn;
    document.querySelectorAll('[data-fane]').forEach(function (b) { b.classList.toggle('til', b.getAttribute('data-fane') === fane); });
    window.scrollTo(0, 0);
    if (navn === 'forside') tjekForbindelse();
    if (navn === 'indstillinger') visIndstillinger();
    if (navn === 'koeb1') visKoeb1();
    if (navn === 'koeb2') visKoeb2();
    if (navn === 'lager') visLager();
    if (navn === 'udbakke') tegnUdbakke();
    if (navn === 'salg') visSalg();
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-gaa]');
    if (g && !g.disabled) gaa(g.getAttribute('data-gaa'));
  });

  // ================= Forside / forbindelse =================
  function tjekForbindelse() {
    var el = $('forbindelse');
    var ind = Api.indstillinger();
    if (!Api.erMock() && (!ind.url || !ind.noegle)) { el.textContent = 'Ikke forbundet – gå til Indstillinger'; el.className = 'status fejl'; return; }
    // Fjern en gammel "Ikke forbundet"-besked, nu hvor adresse og nøgle er udfyldt
    if (/Indstillinger/.test(el.textContent)) { el.textContent = 'Tjekker forbindelse …'; el.className = 'status'; }
    Data.hentAlt();
    visStatus();
  }

  // Statuslinje på forsiden + bjælke øverst på alle sider
  function visStatus() {
    var st = Data.status(), v = Data.venter().length, f = Data.fejlede().length;
    var t, kl;
    if (f) { t = '⚠ ' + f + ' fejlede · ' + v + ' venter – tryk for at se'; kl = 'fejl'; }
    else if (!st.online) { t = 'Offline' + (v ? ' · ' + v + ' venter på net' : ' · alt er sendt'); kl = 'offline'; }
    else if (v || st.sender) { t = 'Sender … ' + v + ' tilbage'; kl = 'sender'; }
    else { t = ''; kl = ''; }
    var bar = $('netbar'); bar.textContent = t; bar.className = 'netbar ' + kl; bar.hidden = !t;
    $('m-venter').textContent = f ? f + ' fejlede · ' + v + ' venter' : v ? v + ' venter' : 'Alt er sendt';
    var el = $('forbindelse');
    if (el && el.className.indexOf('fejl') >= 0 && /Indstillinger/.test(el.textContent)) return;
    var hentet = Data.hentetTid();
    if (st.henter && !hentet) { el.textContent = 'Henter data fra Sheets …'; el.className = 'status'; }
    else if (st.online) { el.textContent = '✓ Forbundet' + (v ? ' · ' + v + ' venter' : ' · alt er sendt'); el.className = 'status ok'; }
    else { el.textContent = 'Offline – arbejder på kopien fra ' + (hentet ? new Date(hentet).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '(ingen kopi endnu)'); el.className = 'status fejl'; }
  }
  $('netbar').addEventListener('click', function () { gaa('udbakke'); });

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
    koeb.linjer.forEach(function (ln) { c.appendChild(lavLinje(ln)); });
    nummererLinjer();
  }
  function erSidste(ln) { return koeb.linjer[koeb.linjer.length - 1] === ln; }
  function nummererLinjer() {
    $('k1-linjer').querySelectorAll('.linje').forEach(function (d, i) {
      d.querySelector('input').setAttribute('aria-label', 'Sætnummer ' + (i + 1));
      d.querySelector('.slet').style.visibility = i === koeb.linjer.length - 1 ? 'hidden' : '';
    });
  }
  // Én linje. Ny tom linje tilføjes nedenunder uden at tegne de andre om,
  // så tastaturet og fokus bliver i det felt, man skriver i (vigtigt på iPhone).
  function lavLinje(ln) {
    var d = document.createElement('div'); d.className = 'linje';
    d.innerHTML =
      '<input inputmode="numeric" autocomplete="off" placeholder="Setnr" value="' + esc(ln.setnr) + '">' +
      '<div class="ovp" role="group" aria-label="OVP"><button type="button" data-ovp="1" class="' + (ln.ovp ? 'til' : '') + '">OVP</button><button type="button" data-ovp="0" class="' + (ln.ovp ? '' : 'til') + '">Uden</button></div>' +
      '<button type="button" class="slet" aria-label="Fjern linje">×</button>' +
      '<div class="navn"></div>';
    var inp = d.querySelector('input'), navn = d.querySelector('.navn');
    navnEl.set(ln, navn);
    visNavn(navn, ln);
    inp.addEventListener('input', function () {
      ln.setnr = inp.value.trim(); ln.opslag = null; visNavn(navn, ln);
      if (ln.setnr && erSidste(ln)) {
        var ny = tomLinje(); koeb.linjer.push(ny);
        $('k1-linjer').appendChild(lavLinje(ny)); nummererLinjer();
      }
      gemKladde();
      clearTimeout(timere.get(ln)); timere.set(ln, setTimeout(function () { slaaOp(ln); }, 450));
    });
    d.querySelectorAll('[data-ovp]').forEach(function (b) {
      b.addEventListener('click', function () {
        ln.ovp = b.getAttribute('data-ovp') === '1';
        d.querySelectorAll('[data-ovp]').forEach(function (x) { x.classList.toggle('til', x === b); });
        gemKladde();
      });
    });
    d.querySelector('.slet').addEventListener('click', function () {
      koeb.linjer.splice(koeb.linjer.indexOf(ln), 1); d.remove(); nummererLinjer(); gemKladde();
    });
    return d;
  }
  function visNavn(el, ln) {
    if (!ln.setnr) { el.textContent = ''; el.className = 'navn'; return; }
    if (!ln.opslag) { el.textContent = 'Slår op …'; el.className = 'navn'; return; }
    if (ln.opslag.fejl) { el.textContent = 'Opslag fejlede: ' + ln.opslag.fejl; el.className = 'navn ikke'; return; }
    el.textContent = ln.opslag.fundet ? ln.opslag.navn + (ln.opslag.aar ? ' (' + ln.opslag.aar + ')' : '') : 'Sæt findes ikke i DB';
    el.className = 'navn ' + (ln.opslag.fundet ? 'fundet' : 'ikke');
    if (!ln.opslag.fundet) el.appendChild(dbKnap(ln.setnr, function () { slaaOp(ln); }));
  }
  async function slaaOp(ln) {
    var nr = ln.setnr; if (!nr) return;
    if (Data.harDb()) ln.opslag = Data.slaaOp(nr);
    else {
      try {
        var r = await Api.kald('slaaOp', { setnr: nr }, 3);
        if (ln.setnr !== nr) return;
        ln.opslag = r;
      } catch (e) { if (ln.setnr === nr) ln.opslag = { fejl: 'Sæt-databasen er ikke hentet til telefonen endnu. Åbn appen med net én gang.' }; }
    }
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
    var dato = B.batchId(koeb.iso), pris = B.tal(koeb.pris);
    if (Data.batchFindes(dato)) { f.textContent = 'Batch ' + dato + ' findes allerede i Indkøbslog.'; return; }
    var knap = this; knap.disabled = true;
    try {
      await Data.tilfoej('opretBatch', {
        dato: dato, pris: pris,
        saet: koeb.linjer.map(function (l) { return { setnr: l.setnr, ovp: l.ovp, vaerdi: Number(l.vaerdi), kilde: l.kilde }; })
      }, { navne: koeb.linjer.map(function (l) { return l.opslag && l.opslag.navn; }) });
      sletKladde();
      var rk = Data.batch(dato);
      aabnKlargoering(dato, rk[0] && rk[0].sku, 'forside');
      toast(Data.status().online ? 'Gemmer i Sheets …' : 'Gemt på telefonen – sendes til Sheets, når der er net');
    } catch (e) {
      f.textContent = 'Ikke gemt: ' + e.message;
    } finally { knap.disabled = false; }
  });

  // ================= Side 3: klargør =================
  var k3 = { dato: null, sku: null, fra: 'forside', stand: '' };
  function k3Saet() { return Data.batch(k3.dato); }
  function findSaet(sku) { return k3Saet().find(function (s) { return s.sku === sku; }); }

  function aabnKlargoering(dato, sku, fra) {
    k3.dato = String(dato); k3.fra = fra || 'forside'; $('k3-find').value = ''; k3VisAlle = false;
    gaa('koeb3');
    var alle = k3Saet();
    vaelgSaet(sku || (alle[0] && alle[0].sku));
    Data.opdaterFotos(k3.dato);
  }
  $('k3-tilbage').addEventListener('click', function () { gaa(k3.fra); });

  // Store køb (over 12 sæt): søgefelt i stedet for alle knapper, så det valgte sæt står øverst
  var STORT_KOEB = 12, k3VisAlle = false;
  function tegnVaelger() {
    var c = $('k3-vaelg'); c.innerHTML = '';
    var alle = k3Saet(), stort = alle.length > STORT_KOEB;
    var q = stort ? $('k3-find').value.trim().toLowerCase() : '';
    $('k3-find-boks').hidden = !stort;
    $('k3-visalle').textContent = k3VisAlle ? 'Skjul listen' : 'Vis alle ' + alle.length + ' sæt';
    var vis = !stort ? alle : q ? alle.filter(function (s) { return (s.sku + ' ' + s.setnr + ' ' + s.navn).toLowerCase().indexOf(q) >= 0; }) : k3VisAlle ? alle : [];
    c.hidden = !vis.length && !q;
    if (q && !vis.length) { var t = document.createElement('div'); t.className = 'lille'; t.textContent = 'Intet sæt i købet passer på "' + q + '"'; c.appendChild(t); }
    vis.forEach(function (s) {
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
    $('k3-retform').hidden = true;
    tegnFotos(); visKrav(); visKoebStatus(); visListing();
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
    var iDrive = s.antalFotos || 0, venter = s.ventendeFotos || 0;
    var ok = { sorteret: $('k3-sorteret').checked, stand: k3.stand !== '', fotos: iDrive > 0 || venter > 0 || s.fotos };
    $('k3-krav').innerHTML = 'Klar til salg kræver: ' +
      [['sorteret', 'Sorteret'], ['stand', 'Stand'], ['fotos', 'Mindst ét foto']].map(function (k) { return (ok[k[0]] ? '✓ ' : '○ ') + k[1]; }).join(' · ') +
      ' — ' + iDrive + ' foto(s) i Drive' + (venter ? ', ' + venter + ' venter på at blive sendt' : '');
    var klarKnap = $('k3-klar');
    if (s.klar) { klarKnap.textContent = 'Markér som ikke klar'; klarKnap.disabled = false; }
    else { klarKnap.textContent = 'Klar til salg'; klarKnap.disabled = !(ok.sorteret && ok.stand && ok.fotos); }
  }

  async function gem(klar, stille) {
    var s = findSaet(k3.sku); if (!s) return false;
    var d = formular(); d.klar = klar === null ? !!s.klar : klar;
    var st = $('k3-status'); st.className = 'besked';
    try {
      await Data.tilfoej('gemKlargoering', d, { sku: d.sku });
      if (!stille) st.textContent = (d.klar ? '✓ Klar til salg' : '✓ Gemt') + (Data.status().online ? '' : ' på telefonen – sendes, når der er net');
      tegnVaelger(); visKrav();
      return true;
    } catch (e) { st.className = 'besked fejl'; st.textContent = 'Ikke gemt: ' + e.message; return false; }
  }
  $('k3-gem').addEventListener('click', function () { gem(null, false); });
  $('k3-klar').addEventListener('click', async function () {
    var s = findSaet(k3.sku); if (!s) return;
    var ok = await gem(!s.klar, false);
    if (ok && !s.klar) {
      var naeste = k3Saet().find(function (x) { return !x.klar; });
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
      var standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
      var t = e && e.name === 'NotAllowedError'
        ? 'iPhonen afviste kameraet uden at spørge. Tjek Indstillinger → Apps → Safari → Kamera (skal være Spørg eller Tillad).'
        : (e.message || String(e));
      f.textContent = 'Live-kamera virker ikke: ' + t + ' [' + (e && e.name) + ', ' + (standalone ? 'hjemmeskærm' : 'Safari') + ']. Brug imens knappen herover.';
    }
    kameraUi();
  });
  // Foto → beskæring → upload-kø. SKU låses, når fotoet tages.
  var beskaerer = false;
  async function beskaerOgSend(raa, sku) {
    var r = await Beskaer.aabn(raa);
    if (!r) return false;
    var jpg = Foto.beskaerTilJpg(raa, r);
    var thumb = await Foto.miniature(jpg.dataUrl);
    var uploadId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await Data.tilfoej('uploadFoto', { sku: sku, billede: jpg.base64, uploadId: uploadId }, { sku: sku, thumb: thumb });
    return true;
  }
  $('k3-tag').addEventListener('click', async function () {
    if (beskaerer) return;
    var sku = k3.sku;
    try {
      var raa = Foto.tagRaa($('k3-video'));
      beskaerer = true;
      await beskaerOgSend(raa, sku);
    } catch (e) { $('k3-kamerafejl').textContent = e.message; }
    finally { beskaerer = false; }
  });
  $('k3-fil').addEventListener('change', async function () {
    var filer = Array.prototype.slice.call(this.files || []); this.value = '';
    var sku = k3.sku;
    beskaerer = true;
    try {
      for (var i = 0; i < filer.length; i++) {
        try { await beskaerOgSend(await Foto.filTilRaa(filer[i]), sku); }
        catch (e) { $('k3-kamerafejl').textContent = e.message; }
      }
    } finally { beskaerer = false; }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && aktiv === 'koeb3') { Foto.stopKamera($('k3-video')); kameraUi(); }
  });

  function tegnFotos() {
    var c = $('k3-fotos'); c.innerHTML = '';
    var sku = k3.sku;
    var vis = Data.sendteFotos(sku).map(function (f) { return { thumb: f.thumb, tekst: f.navn.replace(sku, ''), kl: 'ok' }; });
    Data.poster().filter(function (p) { return p.type === 'uploadFoto' && p.data.sku === sku; }).forEach(function (p) {
      vis.push({ thumb: p.meta.thumb, kl: p.status, tekst: p.status === 'sender' ? 'sender …' : p.status === 'fejl' ? 'fejlede' : 'venter', post: p });
    });
    vis.forEach(function (f) {
      var d = document.createElement('div'); d.className = 'foto ' + f.kl;
      d.innerHTML = '<img alt="" src="' + f.thumb + '"><span>' + esc(f.tekst) + '</span>';
      if (f.post && f.post.status === 'fejl') {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Prøv igen'; b.title = f.post.fejl;
        b.addEventListener('click', function () { Data.proevIgen(f.post.seq); });
        d.appendChild(b);
      }
      c.appendChild(d);
    });
  }

  function opdaterK3() {
    visKoebStatus();
    if (!findSaet(k3.sku)) return;
    visListing();
    tegnVaelger(); tegnFotos(); visKrav();
    var s = findSaet(k3.sku);
    $('k3-info').textContent = (s.ovp ? 'Med æske (OVP)' : 'Uden æske') + ' · købspris ' + B.kr(s.koebspris) + ' kr' + (s.lagerstatus ? ' · ' + s.lagerstatus : '') + (s.ventende ? ' · venter på at blive sendt' : '');
  }

  // ================= Ret køb: status, tilføj, ret, fjern =================
  function visKoebStatus() {
    var st = Data.koebStatus(k3.dato);
    $('k3-koeb').textContent = st.privat ? 'Eget LEGO (250000) · altid åbent · ' + st.ialt + ' sæt'
      : 'Køb ' + k3.dato + ' · ' + (st.aaben ? 'åbent · ' + st.mangler + ' af ' + st.ialt + ' mangler klargøring' : 'lukket · alle sæt klargjort eller solgt');
    var s = findSaet(k3.sku), solgt = s && s.lagerstatus === 'Solgt';
    $('k3-ret').hidden = !s || solgt; $('k3-fjern').hidden = !s || solgt;
  }
  var ny = { ovp: true, opslag: null };
  function visVaerdiFelt(prefix, opslag, ovp) {
    var privat = String(k3.dato) === '250000';
    var auto = opslag && opslag.salg ? B.vaerdiFraSalg(opslag.salg, ovp) : null;
    $(prefix + '-vaerdi-raekke').hidden = privat;
    if (auto !== null && !privat) { $(prefix + '-vaerdi').value = String(auto).replace('.', ','); $(prefix + '-kilde').value = 'Egne salg'; }
  }
  function slaaOpFelt(prefix, cb) {
    var nr = $(prefix + '-setnr').value.trim();
    var o = nr ? (Data.harDb() ? Data.slaaOp(nr) : null) : null;
    $(prefix + '-navn').textContent = !nr ? '' : !o ? 'Sæt-databasen er ikke hentet endnu' : o.fundet ? o.navn + (o.aar ? ' (' + o.aar + ')' : '') : 'Sæt findes ikke i DB';
    $(prefix + '-navn').className = 'lille ' + (o && o.fundet ? 'ok-tekst' : '');
    if (o && !o.fundet) $(prefix + '-navn').appendChild(dbKnap(nr, function () { slaaOpFelt(prefix, cb); }));
    if (cb) cb(o);
  }
  $('k3-find').addEventListener('input', tegnVaelger);
  $('k3-visalle').addEventListener('click', function () { k3VisAlle = !k3VisAlle; if (!k3VisAlle) $('k3-find').value = ''; tegnVaelger(); });
  $('k3-tilfoej').addEventListener('click', function () {
    ny = { ovp: true, opslag: null };
    ['ny-setnr', 'ny-vaerdi'].forEach(function (id) { $(id).value = ''; }); $('ny-kilde').value = ''; $('ny-navn').textContent = ''; $('ny-fejl').textContent = '';
    document.querySelectorAll('[data-ny-ovp]').forEach(function (b) { b.classList.toggle('til', b.getAttribute('data-ny-ovp') === '1'); });
    visVaerdiFelt('ny', null, true);
    $('k3-ny').hidden = false; $('ny-setnr').focus();
  });
  $('ny-annuller').addEventListener('click', function () { $('k3-ny').hidden = true; });
  $('ny-setnr').addEventListener('input', function () { slaaOpFelt('ny', function (o) { ny.opslag = o; visVaerdiFelt('ny', o, ny.ovp); }); });
  document.querySelectorAll('[data-ny-ovp]').forEach(function (b) {
    b.addEventListener('click', function () {
      ny.ovp = b.getAttribute('data-ny-ovp') === '1';
      document.querySelectorAll('[data-ny-ovp]').forEach(function (x) { x.classList.toggle('til', x === b); });
      visVaerdiFelt('ny', ny.opslag, ny.ovp);
    });
  });
  async function koebHandling(handling, data, fejlFelt) {
    try { return await Data.retKoeb(handling, data); }
    catch (e) {
      if (/^LUKKET:/.test(e.message)) {
        if (!confirm(e.message.replace('LUKKET: ', '') + '\n\nVil du åbne købet igen og tilføje sættet?')) return null;
        data.genaabn = true; return await koebHandling(handling, data, fejlFelt);
      }
      $(fejlFelt).textContent = e.fraServer ? e.message : 'Kræver net – prøv igen, når der er forbindelse.';
      return null;
    }
  }
  function saetData(prefix, ovp) {
    var privat = String(k3.dato) === '250000';
    var v = B.tal($(prefix + '-vaerdi').value);
    return { setnr: $(prefix + '-setnr').value.trim(), ovp: ovp, vaerdi: privat || isNaN(v) ? '' : v, kilde: privat ? '' : $(prefix + '-kilde').value };
  }
  function tjekSaet(d, fejlFelt) {
    if (!d.setnr) { $(fejlFelt).textContent = 'Skriv sætnummer.'; return false; }
    if (String(k3.dato) !== '250000' && (!(d.vaerdi > 0) || !d.kilde)) { $(fejlFelt).textContent = 'Udfyld værdi og kilde.'; return false; }
    return true;
  }
  $('ny-gem').addEventListener('click', async function () {
    $('ny-fejl').textContent = '';
    var d = saetData('ny', ny.ovp); if (!tjekSaet(d, 'ny-fejl')) return;
    this.disabled = true;
    var b = await koebHandling('tilfoejSaet', { dato: k3.dato, saet: [d] }, 'ny-fejl');
    this.disabled = false;
    if (!b) return;
    $('k3-ny').hidden = true;
    var nyeste = b.saet.filter(function (x) { return x.setnr === String(d.setnr); }).pop();
    vaelgSaet(nyeste ? nyeste.sku : (b.saet[0] && b.saet[0].sku));
    toast('Sæt tilføjet · købspriserne er fordelt igen');
  });
  var ret = { ovp: true };
  $('k3-ret').addEventListener('click', function () {
    var s = findSaet(k3.sku); if (!s) return;
    ret = { ovp: !!s.ovp };
    $('ret-setnr').value = s.setnr; $('ret-vaerdi').value = s.vaerdi ? String(s.vaerdi).replace('.', ',') : ''; $('ret-kilde').value = s.kilde || '';
    document.querySelectorAll('[data-ret-ovp]').forEach(function (b) { b.classList.toggle('til', (b.getAttribute('data-ret-ovp') === '1') === ret.ovp); });
    $('ret-fejl').textContent = ''; slaaOpFelt('ret'); $('ret-vaerdi-raekke').hidden = String(k3.dato) === '250000';
    $('k3-retform').hidden = false;
  });
  $('ret-annuller').addEventListener('click', function () { $('k3-retform').hidden = true; });
  $('ret-setnr').addEventListener('input', function () { slaaOpFelt('ret'); });
  document.querySelectorAll('[data-ret-ovp]').forEach(function (b) {
    b.addEventListener('click', function () { ret.ovp = b.getAttribute('data-ret-ovp') === '1'; document.querySelectorAll('[data-ret-ovp]').forEach(function (x) { x.classList.toggle('til', x === b); }); });
  });
  $('ret-gem').addEventListener('click', async function () {
    $('ret-fejl').textContent = '';
    var d = saetData('ret', ret.ovp); if (!tjekSaet(d, 'ret-fejl')) return;
    var gl = k3Saet().map(function (x) { return x.sku; }).indexOf(k3.sku);
    d.sku = k3.sku;
    this.disabled = true;
    var b = await koebHandling('retSaet', d, 'ret-fejl');
    this.disabled = false;
    if (!b) return;
    $('k3-retform').hidden = true;
    // Samme sæt igen: samme SKU, hvis sætnummeret er uændret, ellers det rettede sætnummer
    var nr = String(d.setnr).trim();
    var x = b.saet.find(function (y) { return y.sku === k3.sku && y.setnr === nr; }) ||
      b.saet.filter(function (y) { return y.setnr === nr; }).pop() || k3Saet()[Math.max(0, Math.min(gl, k3Saet().length - 1))];
    vaelgSaet(x && x.sku); toast('Sættet er rettet');
  });
  $('k3-fjern').addEventListener('click', async function () {
    var s = findSaet(k3.sku); if (!s) return;
    if (!confirm('Fjerne ' + s.sku + ' ' + s.navn + ' fra købet? Købspriserne fordeles på de øvrige sæt.')) return;
    var b = await koebHandling('fjernSaet', { sku: s.sku }, 'k3-status');
    if (!b) return;
    if (b.saet.length) vaelgSaet(b.saet[0].sku); else gaa(k3.fra);
    toast('Sættet er fjernet fra købet');
  });

  // ================= Listings =================
  function visListing() {
    var s = findSaet(k3.sku), l = s && Data.listing(s.sku);
    $('k3-listing').hidden = !l;
    if (l) { $('lt-titel').textContent = l.titel; $('lt-zustand').textContent = l.zustand; $('lt-beskrivelse').textContent = l.beskrivelse; }
    $('k3-listet').checked = !!(s && s.listet);
    var url = Data.listingDoc(k3.dato); $('k3-doc').hidden = !url; if (url) $('k3-doc').href = url;
  }
  $('k3-lav-listings').addEventListener('click', async function () {
    var m = $('k3-listing-besked'); m.textContent = 'Laver listings …'; this.disabled = true;
    try {
      var r = await Data.lavListings(k3.dato);
      m.textContent = r.antal ? r.antal + ' sæt er skrevet i dokumentet "' + k3.dato + ' Listings" i købsmappen.' : r.besked;
      visListing();
    } catch (e) { m.textContent = e.fraServer ? 'Fejl: ' + e.message : 'Kræver net – prøv igen, når der er forbindelse.'; }
    finally { this.disabled = false; }
  });
  document.querySelectorAll('[data-kopier]').forEach(function (b) {
    b.addEventListener('click', async function () {
      var l = Data.listing(k3.sku); if (!l) return;
      var t = l[b.getAttribute('data-kopier')];
      try { await navigator.clipboard.writeText(t); toast('Kopieret ✓'); }
      catch (e) {
        var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); toast('Kopieret ✓'); } catch (e2) { toast('Kunne ikke kopiere'); }
        ta.remove();
      }
    });
  });
  $('k3-listet').addEventListener('change', function () {
    Data.tilfoej('saetListet', { sku: k3.sku, listet: this.checked }, { sku: k3.sku });
    toast(this.checked ? 'Markeret som listet – kommer ikke med i dokumentet næste gang' : 'Ikke listet');
  });

  // ================= Lager =================
  var filter = 'alle';
  function visLager() {
    tegnLager();
    if (Date.now() - Data.hentetTid() > 60000) Data.hentAlt();
  }
  $('l-opdater').addEventListener('click', async function () {
    $('l-antal').textContent = 'Henter …';
    var ok = await Data.hentAlt();
    if (!ok) toast('Ingen forbindelse – viser kopien på telefonen');
    tegnLager();
  });
  $('l-soeg').addEventListener('input', tegnLager);
  $('l-tema').addEventListener('change', tegnLager);
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('til', x === b); });
      tegnLager();
    });
  });
  function erKlar(s) { return s.klar && s.lagerstatus === 'På lager'; }
  var UDEN_TEMA = 'Uden tema';
  function temaFor(s) { return (Data.harDb() && Data.slaaOp(s.setnr).tema) || UDEN_TEMA; }
  function tegnLager() {
    var q = $('l-soeg').value.trim().toLowerCase();
    var lager = Data.lager().filter(function (s) { return s.lagerstatus !== 'Solgt'; }); // solgte sæt vises ikke i Lager
    var status = lager.filter(function (s) {
      if (filter === 'klar' && !erKlar(s)) return false;
      if (filter === 'ikke' && (s.klar || s.lagerstatus === 'Solgt')) return false;
      if (filter === 'ebay' && !(s.platform === 'eBay' && s.lagerstatus === 'På lager')) return false;
      return true;
    });
    status.forEach(function (s) { s.tema = temaFor(s); });
    // Temafeltet: de temaer, der er sæt i med det valgte filter, og antal
    var antal = {}; status.forEach(function (s) { antal[s.tema] = (antal[s.tema] || 0) + 1; });
    var sel = $('l-tema'), valgt = sel.value;
    var temaer = Object.keys(antal).sort(function (a, b) { return (a === UDEN_TEMA) - (b === UDEN_TEMA) || a.localeCompare(b); });
    if (valgt && !antal[valgt]) temaer.push(valgt);
    sel.innerHTML = '<option value="">Alle temaer (' + status.length + ')</option>' + temaer.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + ' (' + (antal[t] || 0) + ')</option>'; }).join('');
    sel.value = valgt;
    var vis = status.filter(function (s) {
      if (valgt && s.tema !== valgt) return false;
      if (!q) return true;
      return (s.sku + ' ' + s.setnr + ' ' + s.navn + ' ' + s.tema).toLowerCase().indexOf(q) >= 0;
    });
    var hentet = Data.hentetTid();
    $('l-antal').textContent = vis.length + ' af ' + lager.length + ' sæt' + (hentet ? ' · kopi fra ' + new Date(hentet).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : ' · ingen kopi hentet endnu');
    var c = $('l-liste'); c.innerHTML = '';
    vis.slice(0, 300).forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'lager-post';
      var maerke = s.lagerstatus === 'Solgt' ? ['solgt', 'Solgt'] : erKlar(s) ? ['klar', 'Klar'] : ['', 'Ikke klar'];
      b.innerHTML = '<span class="mono">' + esc(s.sku) + '</span><span class="maerke ' + maerke[0] + '">' + maerke[1] + '</span>' +
        '<span class="navn">' + esc(s.navn) + '</span>' +
        '<span class="lille">' + [s.tema !== UDEN_TEMA ? s.tema : '', s.stand ? 'Stand ' + s.stand : '', s.platform, s.ovp ? 'OVP' : '', s.ventende || s.ventendeFotos ? 'venter på at blive sendt' : ''].filter(Boolean).join(' · ') + '</span>';
      b.addEventListener('click', function () {
        if (s.lagerstatus === 'Solgt') { toast('Sættet er solgt.'); return; }
        aabnKlargoering(s.dato, s.sku, 'lager');
      });
      c.appendChild(b);
    });
    if (vis.length > 300) { var m = document.createElement('div'); m.className = 'lille'; m.textContent = 'Viser de første 300. Søg for at indsnævre.'; c.appendChild(m); }
  }

  // ================= Registrér salg =================
  var SALGKLADDE = 'cts.salgkladde';
  var salg = null;
  var vareEl = new WeakMap();
  function nySalg() { return { iso: iDag(), platform: 'eBay', koeber: '', ordrenr: '', bilag: '', fragtInd: '', gebyr: '', fragtUd: '', refund: '', varer: [{ sku: '', pris: '' }] }; }
  function gemSalgKladde() { try { localStorage.setItem(SALGKLADDE, JSON.stringify(salg)); } catch (e) { /* */ } }
  function ledige() { return Data.lager().filter(function (r) { return r.lagerstatus !== 'Solgt'; }); }
  function findLedig(tekst) {
    var t = String(tekst || '').trim(); if (!t) return null;
    var alle = ledige();
    var eks = alle.find(function (r) { return r.sku.toUpperCase() === t.toUpperCase(); });
    if (eks) return eks;
    var paaNr = alle.filter(function (r) { return r.setnr === t; });
    return paaNr.length === 1 ? paaNr[0] : null;
  }
  var SFELTER = { 's-koeber': 'koeber', 's-ordrenr': 'ordrenr', 's-bilag': 'bilag', 's-fragtind': 'fragtInd', 's-gebyr': 'gebyr', 's-fragtud': 'fragtUd', 's-refund': 'refund' };
  function visSalg() {
    if (!salg) { try { salg = JSON.parse(localStorage.getItem(SALGKLADDE)); } catch (e) { salg = null; } }
    if (!salg) salg = nySalg();
    $('s-dato').value = salg.iso; $('s-platform').value = salg.platform;
    Object.keys(SFELTER).forEach(function (id) { $(id).value = salg[SFELTER[id]] || ''; });
    var dl = $('s-skuer'); dl.innerHTML = '';
    ledige().forEach(function (r) { var o = document.createElement('option'); o.value = r.sku; o.label = r.navn; dl.appendChild(o); });
    tegnVarer(); $('s-fejl').textContent = ''; regnSalg();
  }
  $('s-dato').addEventListener('change', function () { salg.iso = this.value; gemSalgKladde(); regnSalg(); });
  $('s-platform').addEventListener('change', function () { salg.platform = this.value; gemSalgKladde(); });
  Object.keys(SFELTER).forEach(function (id) {
    $(id).addEventListener('input', function () { salg[SFELTER[id]] = this.value; gemSalgKladde(); regnSalg(); });
  });
  function tegnVarer() {
    var l = salg.varer; if (!l.length || String(l[l.length - 1].sku).trim()) l.push({ sku: '', pris: '' });
    var c = $('s-varer'); c.innerHTML = '';
    l.forEach(function (v) { c.appendChild(lavVare(v)); });
    nummererVarer();
  }
  function nummererVarer() {
    $('s-varer').querySelectorAll('.vare').forEach(function (d, i, alle) { d.querySelector('.slet').style.visibility = i === alle.length - 1 ? 'hidden' : ''; });
  }
  function lavVare(v) {
    var d = document.createElement('div'); d.className = 'vare';
    d.innerHTML = '<input class="sku" list="s-skuer" autocomplete="off" autocapitalize="off" placeholder="SKU eller setnr" aria-label="SKU" value="' + esc(v.sku) + '">' +
      '<input class="pris" inputmode="decimal" placeholder="Pris €" aria-label="Pris i euro" value="' + esc(String(v.pris).replace('.', ',')) + '">' +
      '<button type="button" class="slet" aria-label="Fjern vare">×</button><div class="info"></div>';
    var si = d.querySelector('.sku'), pi = d.querySelector('.pris'), info = d.querySelector('.info');
    vareEl.set(v, info); visVare(v);
    si.addEventListener('input', function () {
      v.sku = si.value.trim();
      var hit = findLedig(v.sku); if (hit && hit.sku !== v.sku && hit.setnr === v.sku) { v.sku = hit.sku; }
      visVare(v);
      if (v.sku && salg.varer[salg.varer.length - 1] === v) { var ny = { sku: '', pris: '' }; salg.varer.push(ny); $('s-varer').appendChild(lavVare(ny)); nummererVarer(); }
      gemSalgKladde(); regnSalg();
    });
    si.addEventListener('change', function () { var hit = findLedig(si.value); if (hit) { v.sku = hit.sku; si.value = hit.sku; visVare(v); gemSalgKladde(); regnSalg(); } });
    pi.addEventListener('input', function () { v.pris = pi.value; gemSalgKladde(); regnSalg(); });
    d.querySelector('.slet').addEventListener('click', function () { salg.varer.splice(salg.varer.indexOf(v), 1); d.remove(); nummererVarer(); gemSalgKladde(); regnSalg(); });
    return d;
  }
  function visVare(v) {
    var el = vareEl.get(v); if (!el) return;
    if (!v.sku) { el.textContent = ''; el.className = 'info'; return; }
    var r = findLedig(v.sku);
    var solgt = !r && Data.lager().some(function (x) { return x.sku.toUpperCase() === v.sku.toUpperCase() && x.lagerstatus === 'Solgt'; });
    if (r) { el.textContent = r.sku + ' · ' + r.navn + ' · købspris ' + B.kr(r.koebspris) + ' kr' + (r.stand ? ' · stand ' + r.stand : ''); el.className = 'info fundet'; }
    else { el.textContent = solgt ? 'Er allerede solgt' : 'Findes ikke på lager – skriv hele SKU\'et'; el.className = 'info ikke'; }
  }
  function regnSalg() {
    var t = B.tal, n = function (x) { var v = t(x); return isNaN(v) ? 0 : v; };
    var varer = salg.varer.filter(function (v) { return v.sku; });
    var sumH = varer.reduce(function (a, v) { return a + n(v.pris); }, 0);
    $('s-sum').textContent = B.kr(sumH + n(salg.fragtInd)) + ' €';
    var kurs = Data.kurs((salg.iso || '').slice(0, 4));
    var ok = varer.length && varer.every(function (v) { return findLedig(v.sku) && n(v.pris) >= 0; }) && sumH > 0;
    if (!ok) { $('s-fortj').textContent = '–'; return; }
    var f = varer.reduce(function (a, v) {
      var r = findLedig(v.sku), andel = n(v.pris) / sumH;
      return a + (n(v.pris) + andel * (n(salg.fragtInd) - n(salg.gebyr) - n(salg.refund))) * kurs - andel * n(salg.fragtUd) - (r.koebspris || 0);
    }, 0);
    $('s-fortj').textContent = 'ca. ' + B.kr(f) + ' kr';
  }
  $('s-ny').addEventListener('click', function () {
    if (salg && salg.varer.some(function (v) { return v.sku; }) && !confirm('Rydde formularen? Det, du har tastet, bliver ikke gemt.')) return;
    salg = nySalg(); gemSalgKladde(); visSalg();
  });
  $('s-gem').addEventListener('click', async function () {
    var f = $('s-fejl'); f.textContent = '';
    var varer = salg.varer.filter(function (v) { return v.sku; });
    if (!salg.iso) { f.textContent = 'Vælg salgsdato.'; return; }
    if (!salg.koeber.trim()) { f.textContent = 'Skriv køber (by, land).'; return; }
    if (!varer.length) { f.textContent = 'Tilføj mindst én vare.'; return; }
    var fejl = varer.filter(function (v) { return !findLedig(v.sku) || isNaN(B.tal(v.pris)) || B.tal(v.pris) < 0; });
    if (fejl.length) { f.textContent = 'Ret disse varer (findes ikke på lager, allerede solgt eller mangler pris): ' + fejl.map(function (v) { return v.sku; }).join(', '); return; }
    var dubl = varer.map(function (v) { return findLedig(v.sku).sku; }).filter(function (x, i, a) { return a.indexOf(x) !== i; });
    if (dubl.length) { f.textContent = 'Samme SKU står to gange: ' + dubl.join(', '); return; }
    var num = function (x) { var v = B.tal(x); return isNaN(v) ? 0 : v; };
    var knap = this; knap.disabled = true;
    try {
      await Data.tilfoej('registrerSalg', {
        dato: salg.iso, koeber: salg.koeber.trim(), platform: salg.platform, ordrenr: salg.ordrenr.trim(), bilag: salg.bilag.trim(),
        fragtInd: num(salg.fragtInd), gebyr: num(salg.gebyr), fragtUd: num(salg.fragtUd), refund: num(salg.refund),
        varer: varer.map(function (v) { return { sku: findLedig(v.sku).sku, pris: num(v.pris) }; })
      }, { antal: varer.length });
      toast(Data.status().online ? 'Gemmer salget i Sheets …' : 'Gemt på telefonen – sendes til Sheets, når der er net');
      salg = nySalg(); gemSalgKladde(); visSalg();
    } catch (e) { f.textContent = 'Ikke gemt: ' + e.message; }
    finally { knap.disabled = false; }
  });

  // ================= Udbakke =================
  var TYPENAVN = { tilfoejDb: 'Nyt sæt i DB', opretBatch: 'Nyt køb', gemKlargoering: 'Klargøring', uploadFoto: 'Foto', registrerSalg: 'Salg', saetListet: 'Listet' };
  function tegnUdbakke() {
    var c = $('u-liste'); c.innerHTML = '';
    var p = Data.poster();
    $('u-antal').textContent = p.length ? p.length + ' venter' + (Data.status().online ? '' : ' · offline') : 'Alt er sendt ✓';
    p.forEach(function (x) {
      var d = document.createElement('div'); d.className = 'post';
      var hvad = x.type === 'opretBatch' ? 'Batch ' + x.data.dato + ' · ' + x.data.saet.length + ' sæt · ' + B.kr(x.data.pris) + ' kr'
        : x.type === 'registrerSalg' ? x.data.koeber + ' · ' + x.data.varer.map(function (v) { return v.sku; }).join(', ')
        : x.type === 'tilfoejDb' ? x.data.setnr + ' ' + x.data.navn : x.data.sku;
      d.innerHTML = '<div class="post-top"><span class="navn">' + TYPENAVN[x.type] + '</span><span class="mono">' + esc(hvad) + '</span></div>' +
        '<div class="lille">' + (x.status === 'fejl' ? '<span class="ikke-off">Fejlede:</span> ' + esc(x.fejl) : x.status === 'sender' ? 'Sender …' : 'Venter på net') + '</div>';
      if (x.status === 'fejl') {
        var k = document.createElement('div'); k.className = 'knapper';
        var b1 = document.createElement('button'); b1.className = 'knap'; b1.textContent = 'Prøv igen'; b1.addEventListener('click', function () { Data.proevIgen(x.seq); });
        var b2 = document.createElement('button'); b2.className = 'knap'; b2.textContent = 'Slet';
        b2.addEventListener('click', function () { if (confirm('Slette denne post? Den bliver ikke sendt til Sheets.')) Data.slet(x.seq); });
        k.appendChild(b1); k.appendChild(b2); d.appendChild(k);
      }
      c.appendChild(d);
    });
  }
  $('u-send').addEventListener('click', function () { Data.koer(); toast('Prøver at sende …'); });

  // ================= Start =================
  if (Api.erMock()) { var bn = $('testbanner'); bn.hidden = false; bn.textContent = 'TESTTILSTAND – simuleret forbindelse, intet gemmes i Sheets'; }
  Data.paa(function () {
    visStatus();
    if (aktiv === 'lager') tegnLager();
    if (aktiv === 'koeb3') opdaterK3();
    if (aktiv === 'udbakke') tegnUdbakke();
  });
  Data.paaHaendelse(function (type, info) {
    if (type === 'batchGemt') toast(info.afvig ? 'Batch ' + info.dato + ' gemt – men Sheets regnede anderledes for ' + info.afvig + ' sæt. Tjek arket.' : 'Batch ' + info.dato + ' gemt i Sheets ✓');
    if (type === 'altSendt') toast('Alt er sendt til Sheets ✓');
    if (type === 'salgGemt') toast('Salg gemt i Sheets ✓ ' + info.antal + ' vare(r)' + (info.fortjeneste !== null && info.fortjeneste !== undefined ? ' · fortjeneste ' + B.kr(info.fortjeneste) + ' kr' : ''));
    if (type === 'fejl') toast('Kunne ikke sendes: ' + info.fejl);
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* ignorer */ });
  Data.start();
  gaa('forside');
  window.CTS = { gaa: gaa }; // til test
})();
