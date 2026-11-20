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
  var aktiv = 'hjem';
  function gaa(navn) {
    if (kameraer[aktiv] && navn !== aktiv) kameraer[aktiv].stop();
    if (aktiv === 'pm' && navn !== 'pm') pmSendAlt();
    if (aktiv === 'lgs' && navn !== 'lgs') lgSendAlt();
    document.querySelectorAll('.visning').forEach(function (v) { v.hidden = v.id !== 'v-' + navn; });
    aktiv = navn;
    var fane = { forside: 'hjem', retro: 'hjem', rk1: 'hjem', rk2: 'hjem', pm: 'hjem', lgs: 'koeb1', koeb2: 'koeb1', koeb3: k3 && k3.fra === 'lager' ? 'lager' : 'koeb1', indstillinger: 'mere', udbakke: 'mere' }[navn] || navn;
    document.querySelectorAll('[data-fane]').forEach(function (b) { b.classList.toggle('til', b.getAttribute('data-fane') === fane); });
    window.scrollTo(0, 0);
    if (navn === 'hjem') tjekForbindelse();
    if (navn === 'indstillinger') visIndstillinger();
    if (navn === 'koeb1') visKoeb1();
    if (navn === 'koeb2') visKoeb2();
    if (navn === 'lager') visLager();
    if (navn === 'udbakke') tegnUdbakke();
    if (navn === 'salg') visSalg();
    if (navn === 'retro') Data.retroHentMaerker();
    if (navn === 'rk1') visRk1();
    if (navn === 'pm') visPm();
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
    Data.lgHent(k3.dato).then(function () { if (aktiv === 'koeb3') k3SorterInfo(); });
  }
  // Knappen "Sortér dele" på klargøringen: status for sættets sortering
  function k3SorterInfo() {
    var s = findSaet(k3.sku), el = $('k3-sorter-info'); if (!s) return;
    var lk = Data.lgKoeb(k3.dato), ls = lk.saet.find(function (x) { return x.sku === s.sku; });
    var dele = lk.dele.filter(function (d) { return d.sku === s.sku; });
    el.textContent = s.sorteret ? 'Sorteret ✓' + (s.komplet ? ' · komplet' : '')
      : dele.length ? dele.filter(function (d) { return d.ok; }).length + ' af ' + dele.length + ' dele krydset af'
      : ls && !ls.harListe ? 'Ingen sorteringsliste for ' + s.setnr + ' endnu' : ls ? 'Ikke startet' : '';
  }
  $('k3-sorter').addEventListener('click', async function () {
    if (!findSaet(k3.sku)) return;
    if (erAendret()) await gem(false, true);
    aabnLg(k3.dato, k3.sku);
  });
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
    k3SorterInfo();
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

  // ================= Kamera + fotos (fælles for Lego og Retro) =================
  // Foto → beskæring → udbakke. SKU låses, når fotoet tages.
  var kameraer = {}; // visning → {ui, stop}
  var beskaerer = false;
  async function beskaerOgSend(raa, sku, type, ekstra) {
    var r = await Beskaer.aabn(raa);
    if (!r) return false;
    var jpg = Foto.beskaerTilJpg(raa, r);
    var thumb = await Foto.miniature(jpg.dataUrl);
    var uploadId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await Data.tilfoej(type, Object.assign({ sku: sku, billede: jpg.base64, uploadId: uploadId }, ekstra || {}), { sku: sku, thumb: thumb });
    return true;
  }
  // p = id-forstavelse ('k3' / 'rk2'): <p>-video, -start, -tag, -fil, -kamera-tom, -kamerainfo, -kamerafejl
  function lavKamera(p, type, skuFn, ekstraFn) {
    var video = $(p + '-video');
    function info() {
      // Viser den opløsning, iPhonen faktisk giver live-kameraet (til test af fotokvalitet)
      $(p + '-kamerainfo').textContent = Foto.kameraKoerer() && video.videoWidth ? 'Kamera: ' + video.videoWidth + ' × ' + video.videoHeight + ' px' : '';
    }
    function ui() {
      var koerer = Foto.kameraKoerer();
      $(p + '-start').textContent = koerer ? 'Stop kamera' : 'Start kamera';
      $(p + '-tag').disabled = !koerer;
      $(p + '-kamera-tom').hidden = koerer;
      info();
    }
    video.addEventListener('loadedmetadata', info);
    video.addEventListener('resize', info);
    $(p + '-start').addEventListener('click', async function () {
      var f = $(p + '-kamerafejl'); f.textContent = '';
      if (Foto.kameraKoerer()) { Foto.stopKamera(video); ui(); return; }
      try { await Foto.startKamera(video); }
      catch (e) {
        var standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
        var t = e && e.name === 'NotAllowedError'
          ? 'iPhonen afviste kameraet uden at spørge. Tjek Indstillinger → Apps → Safari → Kamera (skal være Spørg eller Tillad).'
          : (e.message || String(e));
        f.textContent = 'Live-kamera virker ikke: ' + t + ' [' + (e && e.name) + ', ' + (standalone ? 'hjemmeskærm' : 'Safari') + ']. Brug imens knappen herover.';
      }
      ui();
    });
    $(p + '-tag').addEventListener('click', async function () {
      if (beskaerer) return;
      var sku = skuFn();
      try {
        var raa = Foto.tagRaa(video);
        beskaerer = true;
        await beskaerOgSend(raa, sku, type, ekstraFn && ekstraFn());
      } catch (e) { $(p + '-kamerafejl').textContent = e.message; }
      finally { beskaerer = false; }
    });
    $(p + '-fil').addEventListener('change', async function () {
      var filer = Array.prototype.slice.call(this.files || []); this.value = '';
      var sku = skuFn();
      beskaerer = true;
      try {
        for (var i = 0; i < filer.length; i++) {
          try { await beskaerOgSend(await Foto.filTilRaa(filer[i]), sku, type, ekstraFn && ekstraFn()); }
          catch (e) { $(p + '-kamerafejl').textContent = e.message; }
        }
      } finally { beskaerer = false; }
    });
    return { ui: ui, stop: function () { Foto.stopKamera(video); ui(); } };
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && kameraer[aktiv]) kameraer[aktiv].stop();
  });
  // Miniaturer: sendt i denne session + venter i udbakken (type = 'uploadFoto' / 'retroUploadFoto')
  function tegnFotoListe(c, sku, type) {
    c.innerHTML = '';
    var vis = Data.sendteFotos(sku).map(function (f) { return { thumb: f.thumb, tekst: f.navn.replace(sku, ''), kl: 'ok' }; });
    Data.poster().filter(function (p) { return p.type === type && p.data.sku === sku; }).forEach(function (p) {
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
  kameraer.koeb3 = lavKamera('k3', 'uploadFoto', function () { return k3.sku; });
  function tegnFotos() { tegnFotoListe($('k3-fotos'), k3.sku, 'uploadFoto'); }

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
  $('l-dato').addEventListener('change', tegnLager);
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
    // Købsdato-feltet (de 6 cifre i SKU'en): købsdatoer med sæt i det valgte filter og tema, nyeste først
    var iTema = status.filter(function (s) { return !valgt || s.tema === valgt; });
    var dAntal = {}; iTema.forEach(function (s) { var d = String(s.dato); dAntal[d] = (dAntal[d] || 0) + 1; });
    var dSel = $('l-dato'), dValgt = dSel.value;
    var datoer = Object.keys(dAntal).sort(function (a, b) { return (a === '250000') - (b === '250000') || (a < b ? 1 : a > b ? -1 : 0); });
    if (dValgt && !dAntal[dValgt]) datoer.push(dValgt);
    dSel.innerHTML = '<option value="">Alle købsdatoer (' + iTema.length + ')</option>' + datoer.map(function (d) { return '<option value="' + esc(d) + '">' + esc(d) + ' (' + (dAntal[d] || 0) + ')</option>'; }).join('');
    dSel.value = dValgt;
    var vis = status.filter(function (s) {
      if (valgt && s.tema !== valgt) return false;
      if (dValgt && String(s.dato) !== dValgt) return false;
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

  // ================= Retro Design =================
  var R = window.Retro;
  var RKLADDE = 'cts.retrokladde';
  var RTYPER = ['Brødskærer', 'Lampe', 'Møbel', 'Radio/TV-kabinet', 'Andet'];
  var rk = null, rlEl = new WeakMap(); // kladde for nyt køb; linje → element
  function nyRk() { return { iso: iDag(), pris: '', hvor: '', noter: '', linjer: [nyRLinje()] }; }
  function nyRLinje() { return { type: RTYPER[0], andet: '', producent: '', kode: '', model: '', antal: '1' }; }
  function gemRk() { try { localStorage.setItem(RKLADDE, JSON.stringify(rk)); } catch (e) { /* ignorer */ } }
  function hentRk() { try { return JSON.parse(localStorage.getItem(RKLADDE)); } catch (e) { return null; } }
  function sletRk() { localStorage.removeItem(RKLADDE); rk = null; }
  function rlType(l) { return l.type === 'Andet' ? String(l.andet || '').trim() : l.type; }
  // Linje → data til maskinrummet (kendt producent: koden fra Mærker)
  function rlData(l) {
    var p = String(l.producent || '').trim(), kendt = Data.retroKode(p);
    return { type: rlType(l), producent: p, kode: p ? (kendt || String(l.kode || '').trim().toUpperCase()) : '', model: String(l.model || '').trim(),
      antal: /^\d+$/.test(String(l.antal).trim()) ? Number(String(l.antal).trim()) : NaN };
  }

  function visRk1() {
    if (!rk) rk = hentRk() || nyRk();
    $('rk1-dato').value = rk.iso; $('rk1-pris').value = rk.pris; $('rk1-hvor').value = rk.hvor; $('rk1-noter').value = rk.noter || '';
    $('rk1-fejl').textContent = '';
    tegnRLinjer(); rk1Opdater();
    Data.retroHentMaerker();
  }
  function rk1Opdater() {
    if (!rk) return;
    var dl = Data.retroMaerker().map(function (m) { return '<option value="' + esc(m.producent) + '">' + esc(m.kode) + '</option>'; }).join('');
    if (rk1Opdater.dl !== dl) { $('rk1-maerker').innerHTML = dl; rk1Opdater.dl = dl; }
    $('rk1-info').textContent = Data.status().retroFejl ? 'Maskinrummet: ' + Data.status().retroFejl : '';
    rk.linjer.forEach(function (l) { var d = rlEl.get(l); if (d && d.isConnected) visKode(d, l); });
    visRkSkuer();
  }
  $('rk1-dato').addEventListener('change', function () { rk.iso = this.value; gemRk(); visRkSkuer(); });
  $('rk1-pris').addEventListener('input', function () { rk.pris = this.value; gemRk(); visRkSkuer(); });
  $('rk1-hvor').addEventListener('input', function () { rk.hvor = this.value; gemRk(); });
  $('rk1-noter').addEventListener('input', function () { rk.noter = this.value; gemRk(); });
  $('rk1-ny-linje').addEventListener('click', function () {
    var l = nyRLinje(); rk.linjer.push(l); $('rk1-linjer').appendChild(lavRLinje(l)); nummererRLinjer(); gemRk(); visRkSkuer();
  });

  function tegnRLinjer() {
    if (!rk.linjer.length) rk.linjer.push(nyRLinje());
    var c = $('rk1-linjer'); c.innerHTML = '';
    rk.linjer.forEach(function (l) { c.appendChild(lavRLinje(l)); });
    nummererRLinjer();
  }
  function nummererRLinjer() {
    $('rk1-linjer').querySelectorAll('.rlinje').forEach(function (d, i, alle) {
      d.querySelector('.rl-nr').textContent = 'Linje ' + (i + 1);
      d.querySelector('.slet').style.visibility = alle.length > 1 ? '' : 'hidden';
    });
  }
  function lavRLinje(l) {
    var d = document.createElement('div'); d.className = 'rlinje';
    d.innerHTML =
      '<div class="rl-top"><span class="rl-nr lille"></span><button type="button" class="slet" aria-label="Fjern linje">×</button></div>' +
      '<div class="rl-typer"><select class="rl-type" aria-label="Type">' + RTYPER.map(function (t) { return '<option' + (l.type === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>' +
      '<input class="rl-andet" autocomplete="off" placeholder="Hvilken type?" aria-label="Anden type" value="' + esc(l.andet) + '"></div>' +
      '<div class="rl-felter"><input class="rl-producent" list="rk1-maerker" autocomplete="off" placeholder="Producent (kan udelades)" aria-label="Producent" value="' + esc(l.producent) + '">' +
      '<input class="rl-kode mono" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="4" placeholder="Kode" aria-label="Mærkekode"></div>' +
      '<div class="rl-felter"><input class="rl-model" autocomplete="off" placeholder="Model (fx 294)" aria-label="Model" value="' + esc(l.model) + '">' +
      '<input class="rl-antal" inputmode="numeric" autocomplete="off" aria-label="Antal" placeholder="Antal" value="' + esc(l.antal) + '"></div>' +
      '<div class="rl-info lille"></div>';
    rlEl.set(l, d);
    var q = function (k) { return d.querySelector(k); };
    var andet = q('.rl-andet');
    andet.hidden = l.type !== 'Andet';
    var aendret = function () { gemRk(); visRkSkuer(); };
    q('.rl-type').addEventListener('change', function () { l.type = this.value; andet.hidden = l.type !== 'Andet'; if (!andet.hidden) andet.focus(); aendret(); });
    andet.addEventListener('input', function () { l.andet = this.value; aendret(); });
    q('.rl-producent').addEventListener('input', function () { l.producent = this.value; visKode(d, l); aendret(); });
    q('.rl-kode').addEventListener('input', function () {
      var v = this.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
      if (this.value !== v) this.value = v;
      l.kode = v; aendret();
    });
    q('.rl-model').addEventListener('input', function () { l.model = this.value; aendret(); });
    q('.rl-antal').addEventListener('input', function () { l.antal = this.value; aendret(); });
    q('.slet').addEventListener('click', function () {
      if (rk.linjer.length < 2) return;
      rk.linjer.splice(rk.linjer.indexOf(l), 1); d.remove(); nummererRLinjer(); aendret();
    });
    visKode(d, l);
    return d;
  }
  // Kendt producent: koden vises og kan ikke ændres. Ny producent: koden skal skrives.
  function visKode(d, l) {
    var kode = d.querySelector('.rl-kode'), info = d.querySelector('.rl-info');
    var p = String(l.producent || '').trim(), kendt = Data.retroKode(p), v;
    if (!p) { v = ''; kode.disabled = true; kode.readOnly = false; info.textContent = ''; info.className = 'rl-info lille'; }
    else if (kendt) { v = kendt; kode.disabled = false; kode.readOnly = true; info.textContent = 'Kendt producent · kode ' + kendt; info.className = 'rl-info lille ok-tekst'; }
    else {
      v = l.kode || ''; kode.disabled = false; kode.readOnly = false;
      info.textContent = 'Ny producent – skriv en kode på 2–4 store bogstaver (fx RV for Raadvad). Appen husker den.'; info.className = 'rl-info lille';
    }
    if (kode.value !== v) kode.value = v;
  }
  function visRkSkuer() {
    var el = $('rk1-skuer'), dato = B.batchId(rk.iso);
    if (!dato) { el.textContent = 'Vælg købsdato'; $('rk1-pr-ting').textContent = ''; return; }
    var linjer = rk.linjer.map(rlData).filter(function (l) { return l.type && l.antal >= 1; });
    var eks = Data.retroKoeb(dato).ting.map(function (t) { return t.sku; });
    var plan = R.retroSkuer(dato, linjer, eks);
    el.innerHTML = plan.skuer.map(function (s) { return '<span class="rsku mono">' + esc(s) + '</span>'; }).join('') +
      (plan.omdoeb.length ? '<div class="lille">Omdøbes i købet: ' + plan.omdoeb.map(function (o) { return esc(o[0]) + ' → ' + esc(o[1]); }).join(', ') + '</div>' : '');
    var pris = B.tal(rk.pris), n = plan.skuer.length;
    $('rk1-pr-ting').textContent = !n ? '' : eks.length
      ? 'Købet ' + dato + ' findes allerede (' + eks.length + ' ting) – tingene tilføjes til det.'
      : pris > 0 ? n + ' ting · købspris ca. ' + B.kr(pris / n) + ' kr pr. ting' : n + ' ting';
  }
  function tjekRLinjer(linjer) {
    var kendte = Data.retroMaerker(), nye = {};
    for (var i = 0; i < linjer.length; i++) {
      var l = linjer[i], nr = 'Linje ' + (i + 1) + ': ';
      if (!l.type) return nr + 'skriv hvilken type.';
      if (!(l.antal >= 1 && l.antal <= 99)) return nr + 'antal skal være et helt tal fra 1 til 99.';
      if (!l.producent || Data.retroKode(l.producent)) continue;
      if (!/^[A-Z]{2,4}$/.test(l.kode)) return nr + 'skriv en kode på 2–4 store bogstaver for den nye producent ' + l.producent + '.';
      var ejer = kendte.find(function (m) { return m.kode === l.kode; });
      if (ejer) return nr + 'koden ' + l.kode + ' bruges allerede af ' + ejer.producent + '.';
      var p = l.producent.toLowerCase();
      if (nye[p] && nye[p] !== l.kode) return nr + l.producent + ' har fået to forskellige koder.';
      var andenP = Object.keys(nye).find(function (k) { return k !== p && nye[k] === l.kode; });
      if (andenP) return nr + 'koden ' + l.kode + ' er brugt til en anden ny producent.';
      nye[p] = l.kode;
    }
    return '';
  }
  $('rk1-gem').addEventListener('click', async function () {
    var f = $('rk1-fejl'); f.textContent = '';
    var dato = B.batchId(rk.iso), pris = B.tal(rk.pris);
    if (!dato) { f.textContent = 'Vælg købsdato.'; return; }
    var linjer = rk.linjer.map(rlData);
    var t = tjekRLinjer(linjer); if (t) { f.textContent = t; return; }
    var tilfoej = false;
    if (Data.retroKoebFindes(dato)) {
      if (isNaN(pris)) pris = 0;
      if (pris < 0) { f.textContent = 'Prisen kan ikke være negativ.'; return; }
      if (!confirm('Køb ' + dato + ' findes allerede.\n\nVil du tilføje tingene til købet? ' + B.kr(pris) + ' kr lægges til købets samlede pris, og hele prisen fordeles igen ligeligt på alle ting i købet.')) return;
      tilfoej = true;
    } else if (!(pris > 0)) { f.textContent = 'Skriv den samlede pris i DKK.'; return; }
    var plan = R.retroSkuer(dato, linjer, Data.retroKoeb(dato).ting.map(function (x) { return x.sku; }));
    var knap = this; knap.disabled = true;
    try {
      await Data.tilfoej('retroOpretKoeb', {
        dato: rk.iso, pris: pris, hvorKoebt: String(rk.hvor || '').trim(), noter: String(rk.noter || '').trim(), ting: linjer, tilfoej: tilfoej,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      }, { dato: dato });
      sletRk();
      aabnRk2(dato, plan.skuer[0]);
      toast(Data.status().online ? 'Gemmer i Sheets …' : 'Gemt på telefonen – sendes til Sheets, når der er net');
    } catch (e) { f.textContent = 'Ikke gemt: ' + e.message; }
    finally { knap.disabled = false; }
  });

  // ----- Side 2: klargør -----
  var rk2 = { dato: null, sku: null };
  function rk2Ting() { return Data.retroKoeb(rk2.dato).ting; }
  function findTing(sku) { return rk2Ting().find(function (t) { return t.sku === sku; }); }
  function kortSku(sku) { return String(sku).replace(/^R\d{6}-/, ''); }
  function aabnRk2(dato, sku) {
    rk2.dato = String(dato);
    gaa('rk2');
    var alle = rk2Ting();
    vaelgTing(sku && findTing(sku) ? sku : (alle[0] && alle[0].sku));
    Data.retroOpdaterKoeb(rk2.dato);
  }
  function tegnRVaelger() {
    var c = $('rk2-vaelg'); c.innerHTML = '';
    rk2Ting().forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.className = (t.sku === rk2.sku ? 'til ' : '') + (t.klar ? 'klar' : '');
      b.setAttribute('aria-selected', t.sku === rk2.sku ? 'true' : 'false');
      b.textContent = (t.klar ? '✓ ' : '') + kortSku(t.sku);
      b.addEventListener('click', async function () {
        if (t.sku === rk2.sku) return;
        if (rErAendret()) await rGem(true);
        vaelgTing(t.sku);
      });
      c.appendChild(b);
    });
  }
  function rk2Info(t) {
    var n = (t.antalFotos || 0), v = t.ventendeFotos || 0;
    return 'Købspris ' + B.kr(t.koebspris) + ' kr' + (t.lagerstatus ? ' · ' + t.lagerstatus : '') + ' · ' + n + ' foto(s) i Drive' +
      (v ? ', ' + v + ' venter' : '') + (t.ventende ? ' · venter på at blive sendt' : '');
  }
  function rk2Koeb() {
    var k = Data.retroKoeb(rk2.dato);
    $('rk2-koeb').textContent = 'Køb ' + rk2.dato + ' · ' + k.ting.length + ' ting' + (k.log ? ' · ' + B.kr(k.log.pris) + ' kr' + (k.log.hvorKoebt ? ' · ' + k.log.hvorKoebt : '') : '');
  }
  var RFELTER = { designer: 'rk2-designer', farve: 'rk2-farve', kendetegn: 'rk2-kendetegn', stand: 'rk2-stand', arbejde: 'rk2-arbejde', noter: 'rk2-noter' };
  function vaelgTing(sku) {
    var t = findTing(sku); if (!t) return;
    rk2.sku = sku;
    tegnRVaelger(); rk2Koeb();
    $('rk2-sku').textContent = t.sku;
    $('rk2-navn').textContent = [t.type, t.producent, t.model].filter(Boolean).join(' ');
    $('rk2-info').textContent = rk2Info(t);
    Object.keys(RFELTER).forEach(function (k) { $(RFELTER[k]).value = t[k] == null ? '' : String(t[k]); });
    $('rk2-klar').checked = !!t.klar;
    $('rk2-status').textContent = '';
    tegnFotoListe($('rk2-fotos'), rk2.sku, 'retroUploadFoto');
  }
  function rFormular() {
    var d = { sku: rk2.sku, klar: $('rk2-klar').checked };
    Object.keys(RFELTER).forEach(function (k) { d[k] = $(RFELTER[k]).value.trim(); });
    return d;
  }
  function rErAendret() {
    var t = findTing(rk2.sku); if (!t) return false;
    var f = rFormular();
    return f.klar !== !!t.klar || Object.keys(RFELTER).some(function (k) { return f[k] !== String(t[k] == null ? '' : t[k]); });
  }
  async function rGem(stille) {
    if (!findTing(rk2.sku)) return false;
    var d = rFormular(), st = $('rk2-status'); st.className = 'besked';
    try {
      await Data.tilfoej('retroGemTing', d, { sku: d.sku });
      if (!stille) st.textContent = (d.klar ? '✓ Gemt · klar' : '✓ Gemt') + (Data.status().online ? '' : ' på telefonen – sendes, når der er net');
      tegnRVaelger();
      return true;
    } catch (e) { st.className = 'besked fejl'; st.textContent = 'Ikke gemt: ' + e.message; return false; }
  }
  $('rk2-gem').addEventListener('click', function () { rGem(false); });
  kameraer.rk2 = lavKamera('rk2', 'retroUploadFoto', function () { return rk2.sku; });
  function opdaterRk2() {
    if (!rk2.dato) return;
    rk2Koeb();
    if (!findTing(rk2.sku)) { var a = rk2Ting(); if (a[0]) vaelgTing(a[0].sku); return; }
    tegnRVaelger();
    tegnFotoListe($('rk2-fotos'), rk2.sku, 'retroUploadFoto');
    $('rk2-info').textContent = rk2Info(findTing(rk2.sku));
  }

  // ================= Playmobil (under Retro) =================
  // Samme regler som den lilla sorteringsside: + sætter ikke kryds; når Fundet = Skal være, får ✓ grøn kant ("klar");
  // tryk ✓ = færdig (også når der mangler dele – manglen er noten). Efter ✓ ryddes søgefeltet, og markøren står i det.
  // "Alle sæt" er kun visning. Ændringer samles pr. del i et øjeblik og lægges så i udbakken (pmGem).
  var pm = { saet: 'alle', filter: 'alle', pend: {}, timere: {}, redigerer: false };
  function pmNoegle(d) { return d.saet + '|' + d.nr; }
  function pmNorm(t) { return String(t).toLowerCase().replace(/\s+/g, ''); }
  function pmFotoSku(saet, nr) { return 'PM-' + (R.rens(saet) || 'SAET') + (nr && R.rens(nr) ? '-' + R.rens(nr) : ''); }
  var KAMERA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  function pmNoteLinje(d) { return d.skal === null && !d.nr; }
  function pmDele() {
    return Data.pmDele().map(function (d) { var p = pm.pend[pmNoegle(d)]; return p ? Object.assign(d, p, { gemmer: true }) : d; });
  }
  function pmAendr(d, felter, ms) {
    var k = pmNoegle(d);
    pm.pend[k] = Object.assign(pm.pend[k] || {}, felter);
    clearTimeout(pm.timere[k]);
    pm.timere[k] = setTimeout(function () { pmSend(d); }, ms || 600);
  }
  function pmSend(d) {
    var k = pmNoegle(d), f = pm.pend[k];
    clearTimeout(pm.timere[k]); delete pm.timere[k];
    if (!f) return;
    delete pm.pend[k];
    Data.tilfoej('pmGem', Object.assign({ r: d.r, nr: d.nr, saet: d.saet }, f), { saet: d.saet, nr: d.nr });
  }
  function pmSendAlt() { Data.pmDele().forEach(function (d) { if (pm.pend[pmNoegle(d)]) pmSend(d); }); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pmSendAlt(); });

  function visPm() {
    pm.redigerer = false;
    pmTegn();
    if (Data.status().online !== false) Data.pmHent();
  }
  function pmOpdater() { if (!pm.redigerer) pmTegn(); else pmTegnStatus(); }
  function pmTegnStatus() {
    var dele = pmDele(), i = $('pm-info'), t = Data.pmHentet();
    i.className = 'lille' + (Data.status().pmFejl ? ' ikke-off' : '');
    i.textContent = Data.status().pmFejl ? 'Maskinrummet: ' + Data.status().pmFejl
      : !dele.length ? 'Listen er ikke hentet endnu – åbn siden med net.'
      : 'Arket "Playmobil alle sæt"' + (t ? ' · hentet ' + new Date(t).toLocaleString('da-DK', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
    var iSaet = dele.filter(function (d) { return (pm.saet === 'alle' || d.saet === pm.saet) && !pmNoteLinje(d); });
    var q = pmNorm($('pm-q').value);
    $('pm-status').textContent = iSaet.filter(function (d) { return d.ok; }).length + ' af ' + iSaet.length + ' afkrydset' + (q ? ' · ' + pmFiltrer(dele).length + ' træf' : '');
    if (pm.saet !== 'alle') {
      var f = Data.pmFotos(pm.saet);
      $('pm-fototitel').textContent = 'Fotos af sæt ' + pm.saet + (Data.pmNavn(pm.saet) ? ' ' + Data.pmNavn(pm.saet) : '') + ' · ' + f.iDrive + ' i Drive' + (f.venter ? ', ' + f.venter + ' venter' : '');
      tegnFotoListe($('pm-fotos'), pmFotoSku(pm.saet), 'pmUploadFoto');
    }
  }
  function pmFiltrer(dele) {
    var q = pmNorm($('pm-q').value);
    return dele.filter(function (d) {
      if (pm.saet !== 'alle' && d.saet !== pm.saet) return false;
      if (pm.filter === 'mangler' && d.ok) return false;
      if (pm.filter === 'afkrydset' && !d.ok) return false;
      return !q || pmNorm(d.nr + d.del + d.note).indexOf(q) >= 0;
    });
  }
  function pmTegnSaet(dele) {
    var saet = []; dele.forEach(function (d) { if (saet.indexOf(d.saet) < 0) saet.push(d.saet); });
    if (pm.saet !== 'alle' && saet.indexOf(pm.saet) < 0) pm.saet = 'alle';
    var c = $('pm-saet'); c.innerHTML = '';
    ['alle'].concat(saet).forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button';
      var navn = s === 'alle' ? '' : Data.pmNavn(s);
      b.innerHTML = '<b>' + esc(s === 'alle' ? 'Alle sæt' : s) + '</b>' + (navn ? '<small>' + esc(navn) + '</small>' : '');
      b.className = s === pm.saet ? 'til' : '';
      b.setAttribute('aria-pressed', s === pm.saet ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (s === pm.saet) return;
        pmSendAlt();
        if (kameraer.pm) kameraer.pm.stop();
        pm.saet = s; $('pm-fotoboks').open = false; pmTegn(); window.scrollTo(0, 0);
      });
      c.appendChild(b);
    });
  }
  function pmTegn() {
    var alle = pmDele(), laast = pm.saet === 'alle';
    pmTegnSaet(alle);
    $('pm-ro').hidden = !laast;
    $('pm-fotoboks').hidden = laast;
    pmTegnStatus();
    var liste = pmFiltrer(alle), q = pmNorm($('pm-q').value), c = $('pm-liste');
    c.innerHTML = '';
    if (!liste.length) { c.innerHTML = '<p class="hjaelp">' + (alle.length ? 'Ingen dele passer.' : '') + '</p>'; return; }
    liste.forEach(function (d) {
      var el = document.createElement('div');
      var note = pmNoteLinje(d), mangler = d.fundet === null || d.fundet === undefined || note ? null : d.skal - d.fundet;
      el.className = 'pm-del' + (d.ok ? ' done' : '') + (q ? ' soeg' : '') + (laast ? ' laast' : '');
      el.innerHTML = '<div class="info"><div class="nr"></div><div class="navn"></div><div class="meta"></div></div>' +
        (note ? '' : '<div class="pm-taeller"><button type="button" aria-label="En mindre">−</button><input type="number" inputmode="numeric" min="0" aria-label="Fundet"><button type="button" aria-label="En mere">+</button><span class="af"></span></div>' +
          '<button type="button" class="pm-chk" aria-label="Færdig">✓</button>') +
        '<div class="pm-noterad"><input class="note" type="text" placeholder="Note …" aria-label="Note">' +
        '<label class="pm-foto" aria-label="Tag foto af delen">' + KAMERA_SVG + '<span class="pm-antal" hidden></span><input type="file" accept="image/*" capture="environment" hidden></label></div>';
      el.querySelector('.nr').textContent = d.nr || d.saet;
      el.querySelector('.navn').textContent = d.del;
      el.querySelector('.meta').innerHTML = 'Sæt ' + esc(d.saet) + (d.side ? ' · ' + esc(d.side) : '') + (note ? '' : ' · skal være ' + d.skal) +
        (mangler > 0 ? ' · <span class="miss">mangler ' + mangler + '</span>' : '') + (d.gemmer || d.ventende ? ' · gemmer …' : '');
      var noteFelt = el.querySelector('.note');
      noteFelt.value = d.note || '';
      noteFelt.addEventListener('focus', function () { pm.redigerer = true; });
      noteFelt.addEventListener('blur', function () { pm.redigerer = false; pmSend(d); pmTegn(); });
      noteFelt.addEventListener('input', function () { pmAendr(d, { note: noteFelt.value }, 900); });
      if (!note) {
        var knp = el.querySelectorAll('.pm-taeller button'), tal = el.querySelector('.pm-taeller input'), chk = el.querySelector('.pm-chk');
        tal.value = d.fundet === null || d.fundet === undefined ? '' : d.fundet;
        el.querySelector('.af').textContent = '/ ' + d.skal;
        chk.setAttribute('aria-pressed', d.ok ? 'true' : 'false');
        if (!d.ok && d.fundet === d.skal) chk.classList.add('klar');
        knp[0].addEventListener('click', function () { pmAendr(d, { fundet: Math.max(0, (d.fundet || 0) - 1) }); pmTegn(); });
        knp[1].addEventListener('click', function () { pmAendr(d, { fundet: (d.fundet || 0) + 1 }); pmTegn(); });
        tal.addEventListener('focus', function () { pm.redigerer = true; });
        tal.addEventListener('blur', function () { pm.redigerer = false; pmTegn(); });
        tal.addEventListener('input', function () { var t = tal.value.trim(); pmAendr(d, { fundet: t === '' ? null : Math.max(0, Math.floor(Number(t)) || 0) }); });
        chk.addEventListener('click', function () {
          var ok = !d.ok;
          pmAendr(d, { ok: ok }, 200);
          if (ok) { $('pm-q').value = ''; pm.redigerer = false; pmTegn(); window.scrollTo(0, 0); $('pm-q').focus(); }
          else pmTegn();
        });
      }
      // Foto af delen (eller af hele sættet på en note-linje som "Div")
      var fk = el.querySelector('.pm-foto'), fi = fk.querySelector('input'), fa = fk.querySelector('.pm-antal');
      var df = note ? Data.pmFotos(d.saet) : Data.pmDelFotos(d.saet, d.nr), n = df.iDrive + df.venter;
      if (n) { fa.hidden = false; fa.textContent = n; fk.classList.toggle('venter', df.venter > 0); }
      fi.addEventListener('change', async function () {
        var filer = Array.prototype.slice.call(this.files || []); this.value = '';
        if (beskaerer) return;
        beskaerer = true;
        try {
          for (var i = 0; i < filer.length; i++) {
            try { await beskaerOgSend(await Foto.filTilRaa(filer[i]), pmFotoSku(d.saet, note ? '' : d.nr), 'pmUploadFoto', note ? { saet: d.saet } : { saet: d.saet, nr: d.nr }); }
            catch (e) { toast('Foto: ' + e.message); }
          }
        } finally { beskaerer = false; pmTegn(); }
      });
      if (laast) { el.querySelectorAll('button, input').forEach(function (x) { x.disabled = true; }); fk.classList.add('laast'); }
      c.appendChild(el);
    });
  }
  $('pm-q').addEventListener('input', function () { pmTegn(); window.scrollTo(0, 0); });
  $('pm-ryd').addEventListener('click', function () { $('pm-q').value = ''; pmTegn(); $('pm-q').focus(); });
  document.querySelectorAll('[data-pmfilter]').forEach(function (b) {
    b.addEventListener('click', function () {
      pm.filter = b.getAttribute('data-pmfilter');
      document.querySelectorAll('[data-pmfilter]').forEach(function (x) { x.classList.toggle('til', x === b); });
      pmTegn();
    });
  });
  $('pm-fotoboks').addEventListener('toggle', function () { if (!this.open && kameraer.pm) kameraer.pm.stop(); });
  kameraer.pm = lavKamera('pm', 'pmUploadFoto', function () { return pmFotoSku(pm.saet); }, function () { return { saet: pm.saet }; });
  // Nyt sæt (fx "Div" = løsdele): én linje med note + fotos
  $('pm-nyt').addEventListener('click', function () { $('pmny-navn').value = ''; $('pmny-fejl').hidden = true; $('pmny').hidden = false; $('pmny-navn').focus(); });
  $('pmny-annuller').addEventListener('click', function () { $('pmny').hidden = true; });
  $('pmny-gem').addEventListener('click', async function () {
    var navn = $('pmny-navn').value.trim(), f = $('pmny-fejl');
    f.hidden = true;
    var fejl = !navn ? 'Skriv et navn.' : navn.indexOf('·') >= 0 ? 'Navnet må ikke indeholde "·".'
      : Data.pmDele().some(function (d) { return d.saet.toLowerCase() === navn.toLowerCase(); }) ? 'Sættet "' + navn + '" findes allerede.' : '';
    if (fejl) { f.textContent = fejl; f.hidden = false; return; }
    await Data.tilfoej('pmNytSaet', { navn: navn }, { navn: navn });
    $('pmny').hidden = true;
    pm.saet = navn; pm.filter = 'alle';
    document.querySelectorAll('[data-pmfilter]').forEach(function (x) { x.classList.toggle('til', x.getAttribute('data-pmfilter') === 'alle'); });
    pmTegn();
    toast('Sæt "' + navn + '" oprettes' + (Data.status().online ? ' …' : ' – sendes, når der er net'));
  });

  // ================= Lego: sortering af dele (pr. køb) =================
  // Samme regler som Playmobil (+ sætter ikke ✓, grøn kant ved fuldt antal, ✓ = færdig, markør tilbage i søgefeltet).
  // Første gang et sæt åbnes, kopierer maskinrummet sættets rene liste ind i købets sorteringsark (kræver net).
  var lgv = { dato: null, sku: null, filter: 'alle', pend: {}, timere: {}, redigerer: false, starter: false };
  function lgNoegle(d) { return d.sku + '|' + d.nr + '|' + d.del; }
  function lgDele() {
    return Data.lgKoeb(lgv.dato).dele.filter(function (d) { return d.sku === lgv.sku; })
      .map(function (d) { var p = lgv.pend[lgNoegle(d)]; return p ? Object.assign(d, p, { gemmer: true }) : d; });
  }
  function lgAendr(d, felter, ms) {
    var k = lgNoegle(d);
    lgv.pend[k] = Object.assign(lgv.pend[k] || {}, felter);
    clearTimeout(lgv.timere[k]);
    lgv.timere[k] = setTimeout(function () { lgSend(d); }, ms || 600);
  }
  function lgSend(d) {
    var k = lgNoegle(d), f = lgv.pend[k];
    clearTimeout(lgv.timere[k]); delete lgv.timere[k];
    if (!f) return;
    delete lgv.pend[k];
    Data.tilfoej('lgGem', Object.assign({ dato: lgv.dato, r: d.r, sku: d.sku, nr: d.nr, del: d.del }, f), { sku: d.sku, nr: d.nr });
  }
  function lgSendAlt() { if (lgv.dato) Data.lgKoeb(lgv.dato).dele.forEach(function (d) { if (lgv.pend[lgNoegle(d)]) lgSend(d); }); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) lgSendAlt(); });
  function lgBesked(t, fejl) { var b = $('lg-besked'); b.hidden = !t; b.textContent = t || ''; b.className = 'besked' + (fejl ? ' fejl' : ''); }

  async function aabnLg(dato, sku) {
    lgv.dato = String(dato); lgv.sku = sku; lgv.redigerer = false; $('lg-q').value = '';
    gaa('lgs');
    lgBesked('');
    lgTegn();
    await lgSikrStartet();
    Data.lgHent(lgv.dato);
  }
  async function lgSikrStartet() {
    if (lgDele().length || lgv.starter) return;
    if (Data.status().online === false) { lgBesked('Første gang et sæt sorteres, skal der være net (listen hentes fra Drive).', true); return; }
    lgv.starter = true; lgBesked('Henter sorteringslisten …');
    try { await Data.lgStart(lgv.sku); lgBesked(''); }
    catch (e) { lgBesked(e.message, true); }
    finally { lgv.starter = false; lgTegn(); }
  }
  $('lg-tilbage').addEventListener('click', function () { lgSendAlt(); aabnKlargoering(lgv.dato, lgv.sku, k3.fra); });
  function lgOpdater() { if (!lgv.redigerer) lgTegn(); else lgTegnStatus(); }
  function lgFiltrer(dele) {
    var q = pmNorm($('lg-q').value);
    return dele.filter(function (d) {
      if (lgv.filter === 'mangler' && d.ok) return false;
      if (lgv.filter === 'afkrydset' && !d.ok) return false;
      return !q || pmNorm(d.nr + d.del + d.note).indexOf(q) >= 0;
    });
  }
  function lgTegnStatus() {
    var dele = lgDele(), saet = findSaet(lgv.sku) || Data.lager().find(function (x) { return x.sku === lgv.sku; }) || {};
    $('lg-info').textContent = 'Køb ' + lgv.dato + ' · ' + lgv.sku + (saet.navn ? ' ' + saet.navn : '') + (saet.sorteret ? ' · sorteret ✓' : '') + (Data.status().lgFejl ? ' · ' + Data.status().lgFejl : '');
    var ok = dele.filter(function (d) { return d.ok; }).length, q = pmNorm($('lg-q').value);
    $('lg-status').textContent = dele.length ? ok + ' af ' + dele.length + ' afkrydset' + (q ? ' · ' + lgFiltrer(dele).length + ' træf' : '') : '';
    var venter = Object.keys(lgv.pend).length || Data.poster().some(function (p) { return p.type === 'lgGem' && p.data.sku === lgv.sku && p.status !== 'fejl'; });
    $('lg-faerdig').hidden = !(dele.length && ok === dele.length);
    $('lg-faerdig').disabled = !!venter;
    $('lg-faerdig').textContent = venter ? 'Gemmer … (vent et øjeblik)' : 'Færdig – overfør til klargøring';
  }
  function lgTegnSaet() {
    var lk = Data.lgKoeb(lgv.dato), c = $('lg-saet'); c.innerHTML = '';
    var vis = lk.saet.filter(function (x) { return x.startet || x.sku === lgv.sku; });
    if (!vis.some(function (x) { return x.sku === lgv.sku; })) { var s0 = findSaet(lgv.sku); if (s0) vis.push({ sku: s0.sku, setnr: s0.setnr, navn: s0.navn, sorteret: s0.sorteret }); }
    vis.forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button';
      b.innerHTML = '<b>' + esc(x.sku) + '</b><small>' + esc(x.navn || '') + '</small>';
      b.className = (x.sku === lgv.sku ? 'til ' : '') + (x.sorteret ? 'faerdig' : '');
      b.setAttribute('aria-pressed', x.sku === lgv.sku ? 'true' : 'false');
      b.addEventListener('click', async function () {
        if (x.sku === lgv.sku) return;
        lgSendAlt(); lgv.sku = x.sku; $('lg-q').value = ''; lgBesked(''); lgTegn(); window.scrollTo(0, 0);
        await lgSikrStartet();
      });
      c.appendChild(b);
    });
  }
  // Billeder af dele fra BrickLink (v24). Farve-id'er: BrickLink Color Guide, kopieret af Thomas 18-11-2026 (Modulex udeladt).
  var BL_FARVER = {"White":1,"Very Light Gray":49,"Very Light Bluish Gray":99,"Light Gray":9,"Light Bluish Gray":86,"Dark Gray":10,"Dark Bluish Gray":85,"Black":11,"Dark Red":59,"Red":5,"Reddish Orange":167,"Dark Salmon":231,"Salmon":25,"Coral":220,"Light Salmon":26,"Sand Red":58,"Dark Brown":120,"Umber":168,"Brown":8,"Reddish Brown":88,"Light Brown":91,"Medium Brown":240,"Fabuland Brown":106,"Dark Tan":69,"Tan":2,"Light Nougat":90,"Medium Tan":241,"Nougat":28,"Medium Nougat":150,"Dark Nougat":225,"Sienna":169,"Fabuland Orange":160,"Earth Orange":29,"Dark Orange":68,"Rust":27,"Neon Orange":165,"Orange":4,"Medium Orange":31,"Light Orange":32,"Bright Light Orange":110,"Warm Yellowish Orange":172,"Very Light Orange":96,"Dark Yellow":161,"Ochre Yellow":173,"Yellow":3,"Light Yellow":33,"Bright Light Yellow":103,"Neon Yellow":236,"Lemon":171,"Neon Green":166,"Light Lime":35,"Yellowish Green":158,"Medium Lime":76,"Lime":34,"Fabuland Lime":248,"Olive Green":155,"Dark Olive Green":242,"Dark Green":80,"Green":6,"Bright Green":36,"Medium Green":37,"Light Green":38,"Sand Green":48,"Dark Turquoise":39,"Light Turquoise":40,"Aqua":41,"Light Aqua":152,"Dark Blue":63,"Blue":7,"Dark Azure":153,"Little Robots Blue":247,"Maersk Blue":72,"Medium Azure":156,"Sky Blue":87,"Medium Blue":42,"Bright Light Blue":105,"Light Blue":62,"Sand Blue":55,"Dark Royal Blue":109,"Violet":43,"Royal Blue":97,"Medium Violet":73,"Lilac":245,"Blue Violet":174,"Light Lilac":246,"Light Violet":44,"Dark Purple":89,"Purple":24,"Light Purple":93,"Magenta":71,"Medium Lavender":157,"Lavender":154,"Clikits Lavender":227,"Sand Purple":54,"Dark Pink":47,"Bright Pink":104,"Pink":23,"Rose Pink":56,"Warm Pink":175,"Medium Dark Pink":94,"Trans-Clear":12,"Trans-Brown":13,"Trans-Black":251,"Trans-Red":17,"Trans-Neon Orange":18,"Trans-Orange":98,"Trans-Light Orange":164,"Trans-Neon Yellow":121,"Trans-Yellow":19,"Trans-Neon Green":16,"Trans-Bright Green":108,"Trans-Light Green":221,"Trans-Light Bright Green":226,"Trans-Green":20,"Trans-Dark Blue":14,"Trans-Medium Blue":74,"Trans-Light Blue":15,"Trans-Aqua":113,"Trans-Light Purple":114,"Trans-Medium Purple":234,"Trans-Purple":51,"Trans-Dark Pink":50,"Trans-Pink":107,"Chrome Gold":21,"Chrome Silver":22,"Chrome Antique Brass":57,"Chrome Black":122,"Chrome Blue":52,"Chrome Green":64,"Chrome Pink":82,"Pearl White":83,"Pearl Very Light Gray":119,"Pearl Light Gray":66,"Flat Silver":95,"Bionicle Silver":239,"Pearl Dark Gray":77,"Pearl Black":244,"Pearl Light Gold":61,"Pearl Gold":115,"Reddish Gold":235,"Bionicle Gold":238,"Flat Dark Gold":81,"Reddish Copper":249,"Copper":84,"Bionicle Copper":237,"Pearl Brown":255,"Pearl Red":252,"Pearl Green":253,"Pearl Blue":254,"Pearl Sand Blue":78,"Pearl Sand Purple":243,"Satin Trans-Clear":228,"Satin Trans-Brown":229,"Satin Trans-Yellow":170,"Satin Trans-Bright Green":233,"Satin Trans-Light Blue":223,"Satin Trans-Dark Blue":232,"Satin Trans-Purple":230,"Satin Trans-Dark Pink":224,"Metallic Silver":67,"Metallic Green":70,"Metallic Gold":65,"Metallic Copper":250,"Milky White":60,"Glow In Dark White":159,"Glow In Dark Opaque":46,"Glow In Dark Trans":118,"Glitter Trans-Clear":101,"Glitter Trans-Orange":222,"Glitter Trans-Neon Green":163,"Glitter Trans-Light Blue":162,"Glitter Trans-Purple":102,"Glitter Trans-Dark Pink":100,"Speckle Silver":111,"Speckle Gold":151,"Speckle Copper":116};
  var BL_NAVNE = Object.keys(BL_FARVER).sort(function (a, b) { return b.length - a.length; });
  function lgBilledUrl(d) {
    var nr = String(d.nr || '').replace(/\(inv\)$/i, '').trim();
    if (!nr) return '';
    if (d.type === 'Minifigur') return 'https://img.bricklink.com/ItemImage/MN/0/' + encodeURIComponent(nr) + '.png';
    var del = String(d.del || ''), id = 0;
    for (var i = 0; i < BL_NAVNE.length; i++) if (del.indexOf(BL_NAVNE[i] + ' ') === 0) { id = BL_FARVER[BL_NAVNE[i]]; break; }
    return 'https://img.bricklink.com/ItemImage/PN/' + id + '/' + encodeURIComponent(nr) + '.png';
  }
  function lgVisStort(url, tekst) {
    var o = document.createElement('div');
    o.className = 'lg-stort';
    o.setAttribute('role', 'dialog');
    o.innerHTML = '<img alt=""><p></p><button type="button" class="knap">Luk</button>';
    o.querySelector('img').src = url;
    o.querySelector('p').textContent = tekst;
    o.addEventListener('click', function () { o.remove(); });
    document.body.appendChild(o);
  }
  function lgTegn() {
    lgTegnSaet();
    lgTegnStatus();
    var alle = lgDele(), liste = lgFiltrer(alle), q = pmNorm($('lg-q').value), c = $('lg-liste');
    c.innerHTML = '';
    if (!liste.length) { c.innerHTML = alle.length ? '<p class="hjaelp">Ingen dele passer.</p>' : ''; return; }
    liste.forEach(function (d) {
      var el = document.createElement('div'), mangler = d.fundet === null || d.fundet === undefined ? null : d.skal - d.fundet;
      el.className = 'pm-del' + (d.ok ? ' done' : '') + (q ? ' soeg' : '');
      el.innerHTML = '<div class="info lg-info"><button type="button" class="lg-bill" aria-label="Vis stort billede"><img alt="" loading="lazy"></button><div><div class="nr"></div><div class="navn"></div><div class="meta"></div></div></div>' +
        '<div class="pm-taeller"><button type="button" aria-label="En mindre">−</button><input type="number" inputmode="numeric" min="0" aria-label="Fundet"><button type="button" aria-label="En mere">+</button><span class="af"></span></div>' +
        '<button type="button" class="pm-chk" aria-label="Færdig">✓</button>' +
        '<div class="pm-noterad"><input class="note" type="text" placeholder="Note …" aria-label="Note">' +
        '<label class="pm-foto" aria-label="Tag foto af delen">' + KAMERA_SVG + '<span class="pm-antal" hidden></span><input type="file" accept="image/*" capture="environment" hidden></label></div>';
      el.querySelector('.nr').innerHTML = esc(d.nr) + (d.type === 'Minifigur' ? '<span class="type">Minifigur</span>' : '');
      el.querySelector('.navn').textContent = d.del;
      var bu = lgBilledUrl(d), bk = el.querySelector('.lg-bill'), bi = bk.querySelector('img');
      if (bu) { bi.src = bu; bi.addEventListener('error', function () { bk.classList.add('tom'); }); bk.addEventListener('click', function () { if (!bk.classList.contains('tom')) lgVisStort(bu, d.nr + ' · ' + d.del); }); }
      else bk.classList.add('tom');
      el.querySelector('.meta').innerHTML = 'skal være ' + d.skal + (mangler > 0 ? ' · <span class="miss">mangler ' + mangler + '</span>' : '') + (d.gemmer || d.ventende ? ' · gemmer …' : '');
      var noteFelt = el.querySelector('.note'), tal = el.querySelector('.pm-taeller input'), knp = el.querySelectorAll('.pm-taeller button'), chk = el.querySelector('.pm-chk');
      noteFelt.value = d.note || '';
      noteFelt.addEventListener('focus', function () { lgv.redigerer = true; });
      noteFelt.addEventListener('blur', function () { lgv.redigerer = false; lgSend(d); lgTegn(); });
      noteFelt.addEventListener('input', function () { lgAendr(d, { note: noteFelt.value }, 900); });
      tal.value = d.fundet === null || d.fundet === undefined ? '' : d.fundet;
      el.querySelector('.af').textContent = '/ ' + d.skal;
      chk.setAttribute('aria-pressed', d.ok ? 'true' : 'false');
      if (!d.ok && d.fundet === d.skal) chk.classList.add('klar');
      knp[0].addEventListener('click', function () { lgAendr(d, { fundet: Math.max(0, (d.fundet || 0) - 1) }); lgTegn(); });
      knp[1].addEventListener('click', function () { lgAendr(d, { fundet: (d.fundet || 0) + 1 }); lgTegn(); });
      tal.addEventListener('focus', function () { lgv.redigerer = true; });
      tal.addEventListener('blur', function () { lgv.redigerer = false; lgTegn(); });
      tal.addEventListener('input', function () { var t = tal.value.trim(); lgAendr(d, { fundet: t === '' ? null : Math.max(0, Math.floor(Number(t)) || 0) }); });
      chk.addEventListener('click', function () {
        var ok = !d.ok;
        lgAendr(d, { ok: ok }, 200);
        if (ok) { $('lg-q').value = ''; lgv.redigerer = false; lgTegn(); window.scrollTo(0, 0); $('lg-q').focus(); }
        else lgTegn();
      });
      var fk = el.querySelector('.pm-foto'), fi = fk.querySelector('input'), fa = fk.querySelector('.pm-antal');
      var df = Data.lgDelFotos(d), n = df.iDrive + df.venter;
      if (n) { fa.hidden = false; fa.textContent = n; fk.classList.toggle('venter', df.venter > 0); }
      fi.addEventListener('change', async function () {
        var filer = Array.prototype.slice.call(this.files || []); this.value = '';
        if (beskaerer) return;
        beskaerer = true;
        try {
          for (var i = 0; i < filer.length; i++) {
            try { await beskaerOgSend(await Foto.filTilRaa(filer[i]), d.sku + '|' + d.nr + '|' + d.del, 'lgUploadFoto', { sku: d.sku, nr: d.nr, del: d.del, dato: lgv.dato }); }
            catch (e) { toast('Foto: ' + e.message); }
          }
        } finally { beskaerer = false; lgTegn(); }
      });
      c.appendChild(el);
    });
  }
  $('lg-q').addEventListener('input', function () { lgTegn(); window.scrollTo(0, 0); });
  $('lg-ryd').addEventListener('click', function () { $('lg-q').value = ''; lgTegn(); $('lg-q').focus(); });
  document.querySelectorAll('[data-lgfilter]').forEach(function (b) {
    b.addEventListener('click', function () {
      lgv.filter = b.getAttribute('data-lgfilter');
      document.querySelectorAll('[data-lgfilter]').forEach(function (x) { x.classList.toggle('til', x === b); });
      lgTegn();
    });
  });
  // Færdig → vis hvad der skrives i Indkøb (Sorteret, Komplet, Noter) → Overfør (udbakke)
  $('lg-faerdig').addEventListener('click', async function () {
    lgSendAlt();
    $('lgf-fejl').hidden = true; $('lgf-tekst').textContent = 'Henter …'; $('lgf-hvad').textContent = ''; $('lgf-ok').disabled = true; $('lgf').hidden = false;
    try {
      var v = await Api.kald('lgFaerdig', { sku: lgv.sku, vis: true }, 2);
      $('lgf-hvad').textContent = lgv.sku + ': Sorteret ✓' + (v.komplet ? ' · Komplet ✓' : ' · ikke komplet (' + v.mangler + ' del(e) mangler)') + (v.tekst ? ' · tilføjes til Noter:' : ' · intet at tilføje til Noter.');
      $('lgf-tekst').textContent = v.tekst || '';
      $('lgf-tekst').hidden = !v.tekst;
      $('lgf-ok').disabled = false;
    } catch (e) { $('lgf-tekst').textContent = ''; $('lgf-fejl').textContent = e.message + (e.fraServer ? '' : ' (kræver net)'); $('lgf-fejl').hidden = false; }
  });
  $('lgf-annuller').addEventListener('click', function () { $('lgf').hidden = true; });
  $('lgf-ok').addEventListener('click', async function () {
    $('lgf').hidden = true;
    await Data.tilfoej('lgFaerdig', { sku: lgv.sku }, { sku: lgv.sku });
    toast('Overfører til klargøring …');
  });

  // ================= Udbakke =================
  var TYPENAVN = { tilfoejDb: 'Nyt sæt i DB', opretBatch: 'Nyt køb', gemKlargoering: 'Klargøring', uploadFoto: 'Foto', registrerSalg: 'Salg', saetListet: 'Listet',
    retroOpretKoeb: 'Retro: nyt køb', retroGemTing: 'Retro: klargøring', retroUploadFoto: 'Retro: foto',
    pmGem: 'Playmobil', pmNytSaet: 'Playmobil: nyt sæt', pmUploadFoto: 'Playmobil: foto',
    lgGem: 'Lego-sortering', lgFaerdig: 'Lego: sorteret', lgUploadFoto: 'Lego: foto af del' };
  function tegnUdbakke() {
    var c = $('u-liste'); c.innerHTML = '';
    var p = Data.poster();
    $('u-antal').textContent = p.length ? p.length + ' venter' + (Data.status().online ? '' : ' · offline') : 'Alt er sendt ✓';
    p.forEach(function (x) {
      var d = document.createElement('div'); d.className = 'post';
      var hvad = x.type === 'opretBatch' ? 'Batch ' + x.data.dato + ' · ' + x.data.saet.length + ' sæt · ' + B.kr(x.data.pris) + ' kr'
        : x.type === 'registrerSalg' ? x.data.koeber + ' · ' + x.data.varer.map(function (v) { return v.sku; }).join(', ')
        : x.type === 'tilfoejDb' ? x.data.setnr + ' ' + x.data.navn
        : x.type === 'pmGem' ? x.data.saet + ' · ' + (x.data.nr || 'note')
        : x.type === 'lgGem' || x.type === 'lgUploadFoto' ? x.data.sku + ' · ' + x.data.nr
        : x.type === 'pmNytSaet' ? x.data.navn
        : x.type === 'pmUploadFoto' ? 'Sæt ' + x.data.saet
        : x.type === 'retroOpretKoeb' ? 'Køb ' + x.meta.dato + ' · ' + R.udvid(x.data.ting).length + ' ting · ' + B.kr(x.data.pris) + ' kr' + (x.data.tilfoej ? ' (tilføjet)' : '')
        : x.data.sku;
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
    if (aktiv === 'rk1') rk1Opdater();
    if (aktiv === 'rk2') opdaterRk2();
    if (aktiv === 'pm') pmOpdater();
    if (aktiv === 'lgs') lgOpdater();
    if (aktiv === 'koeb3') k3SorterInfo();
  });
  Data.paaHaendelse(function (type, info) {
    if (type === 'batchGemt') toast(info.afvig ? 'Batch ' + info.dato + ' gemt – men Sheets regnede anderledes for ' + info.afvig + ' sæt. Tjek arket.' : 'Batch ' + info.dato + ' gemt i Sheets ✓');
    if (type === 'lgFaerdig') { toast('Overført ✓ ' + info.sku + ' er sorteret' + (info.komplet ? ' og komplet' : ' (ikke komplet – se Noter)')); if (aktiv === 'koeb3') vaelgSaet(k3.sku); }
    if (type === 'pmSaetOprettet') toast('Sæt "' + info.navn + '" oprettet i Playmobil-arket ✓');
    if (type === 'retroKoebGemt') toast('Retro-køb ' + info.dato + ' gemt i Sheets ✓');
    if (type === 'altSendt') toast('Alt er sendt til Sheets ✓');
    if (type === 'salgGemt') toast('Salg gemt i Sheets ✓ ' + info.antal + ' vare(r)' + (info.fortjeneste !== null && info.fortjeneste !== undefined ? ' · fortjeneste ' + B.kr(info.fortjeneste) + ' kr' : ''));
    if (type === 'fejl') toast('Kunne ikke sendes: ' + info.fejl);
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* ignorer */ });
  Data.start();
  gaa('hjem');
  window.CTS = { gaa: gaa, aabnKlargoering: function (d, s) { aabnKlargoering(d, s, 'forside'); } }; // til test
})();
