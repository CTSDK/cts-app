/**
 * CTS-appen – maskinrum (Google Apps Script)
 * ------------------------------------------
 * Indsættes i Apps Script-projektet, der hører til Google Sheets-filen "cts-app"
 * (Udvidelser → Apps Script). Se docs/GUIDE.md og docs/IMPORT.md.
 *
 * Indhold:
 *  - Menu "CTS": import fra Excel, kontrol mod Excel, sortering af gamle fotos, API-nøgle.
 *  - doPost: API som appen kalder. Alle kald kræver den hemmelige nøgle.
 *
 * Ingen data ligger i denne fil. Nøglen gemmes i scriptets egenskaber, ikke i koden.
 * Formler skrives med engelsk syntaks; arket sættes midlertidigt til en_US imens.
 */

var VERSION = '1.10.0';

// ---------- Faner ----------
var FANE = {
  LOG: 'Indkøbslog', INDKOEB: 'Indkøb', LAGER: 'Lager',
  SALG25: 'Salg 2025', SALG26: 'Salg 2026',
  UDG25: 'Udgifter 2025', UDG26: 'Udgifter 2026',
  SKAT25: 'Skat 2025', SKAT26: 'Skat 2026',
  DB: 'DB', DBS: 'DB Salgspriser', KONTO: 'Kontoplan', EBAY: 'eBay-afstemning',
  KONTROL: 'Kontrol', FOTOIMPORT: 'Foto-import'
};
var ORDEN = ['LOG', 'INDKOEB', 'LAGER', 'SALG26', 'SALG25', 'UDG26', 'UDG25', 'SKAT26', 'SKAT25', 'DB', 'DBS', 'KONTO', 'EBAY'];

// Indkøb: kolonner (1 = A). Række 1 titel, række 2 overskrift (med formler), data fra række 3.
var K = {
  SKU: 1, DATO: 2, SETNR: 3, NAVN: 4, VAERDI: 5, KOEBSPRIS: 6, SALGFOR: 7, OVP: 8,
  SORTERET: 9, FOTOS: 10, KLAR: 11, STAND: 12, PLATFORM: 13, LAGERSTATUS: 14,
  SALGSDATO: 15, SALGSPRIS: 16, NOTER: 17, KILDE: 18, VEJLEDNING: 19, KOMPLET: 20,
  FAST: 21, FOTOSKU: 22, LISTET: 23
};
var INDKOEB_KOLONNER = 23;
// Indkøbslog: A dato, B pris, C skattepligt, D noter, E..L formler, M mappe-id (skjult)
var LK = { DATO: 1, PRIS: 2, SKAT: 3, NOTER: 4, MAPPEID: 13 };
var START = 3; // første datarække i Indkøb, Indkøbslog, Udgifter og eBay-afstemning
var SALG_START = 4; // første datarække i Salg

var PLATFORME = ['eBay', 'Catawiki', 'BrickLink', 'DBA / Facebook', 'Andet', 'Platform ikke valgt'];
var PLATFORME_SALG = ['eBay', 'Catawiki', 'BrickLink', 'DBA', 'Facebook', 'Andet'];
var KILDER = ['Egne salg', 'BrickLink', 'eBay', 'Egen vurdering'];
var IMPORTFIL = 'cts-import.json';
var FOTO_KILDE = 'Import-fotos';

// ======================================================================
//  MENU
// ======================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CTS')
    .addItem('Importér fra Excel (sletter alt)', 'importerFraExcel')
    .addItem('Kør kontrol mod Excel', 'koerKontrol')
    .addItem('Lav listings for et køb', 'lavListingsMenu')
    .addItem('Sortér gamle fotos', 'sorterFotos')
    .addItem('Lav valgliste for ikke-matchede fotos', 'lavValgliste')
    .addItem('Flyt valgte fotos', 'flytValgte')
    .addItem('Fjern fotos af solgte sæt', 'fjernSolgteFotos')
    .addItem('Sortér alle køb i nummerorden', 'sorterAlleKoeb')
    .addSeparator()
    .addItem('Vis API-nøgle', 'visNoegle')
    .addItem('Opdatér formler (bevarer data)', 'opdaterFormler')
    .addItem('Tjek opsætning', 'tjekOpsaetning')
    .addItem('Lav ny API-nøgle', 'nyNoegle')
    .addSeparator()
    .addItem('Kopiér noter til Drive (og hver nat)', 'synkNoterMenu')
    .addSeparator()
    .addItem('Gem bilag fra Gmail (fragt + andre)', 'gemFragtbilagMenu')
    .addItem('Udfør bilagsplan', 'udfoerBilagsplanMenu')
    .addToUi();
}

// ---------- Noter: kopi fra GitHub til Drive-mappen CTS/Noter ----------
// Hovednoten og områdenoterne hentes fra GitHub og skrives i CTS/Noter (backup, og så Thomas kan læse dem).
var NOTER_MAPPE = '1dCTDB4xGkJTLc7bL156aiNAGqDjHkxJ0';
var NOTER_KILDE = 'https://raw.githubusercontent.com/CTSDK/cts-app/main/';
var NOTER = [['CLAUDE.md', 'CTS.md'], ['docs/noter/lego.md', 'lego.md'], ['docs/noter/retro.md', 'retro.md'],
  ['docs/noter/okonomi.md', 'okonomi.md'], ['docs/SAADAN.md', 'Sådan arbejder du med Claude.md']];
function synkNoter() {
  var mappe = DriveApp.getFolderById(NOTER_MAPPE), res = [];
  NOTER.forEach(function (n) {
    var svar = UrlFetchApp.fetch(NOTER_KILDE + n[0] + '?t=' + Date.now(), { muteHttpExceptions: true });
    if (svar.getResponseCode() !== 200) { res.push(n[1] + ': ikke fundet (' + svar.getResponseCode() + ')'); return; }
    var tekst = svar.getContentText('UTF-8'), it = mappe.getFilesByName(n[1]);
    if (it.hasNext()) {
      var f = it.next();
      while (it.hasNext()) it.next().setTrashed(true);            // ingen dubletter
      if (f.getBlob().getDataAsString('UTF-8') !== tekst) { f.setContent(tekst); res.push(n[1] + ': opdateret'); } else res.push(n[1] + ': uændret');
    } else { mappe.createFile(n[1], tekst, 'text/markdown'); res.push(n[1] + ': oprettet'); }
  });
  return res;
}
function synkNoterMenu() {
  var ui = SpreadsheetApp.getUi();
  var findes = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'synkNoter'; });
  if (!findes) ScriptApp.newTrigger('synkNoter').timeBased().everyDays(1).atHour(3).create();
  ui.alert('Noter', synkNoter().join('\n') + '\n\nNoterne kopieres nu også automatisk hver nat ved 3-tiden.', ui.ButtonSet.OK);
}

// ---------- Fragtbilag: CTS-Gmail → Drive CTS/Økonomi/Bilag/Indbakke ----------
// Læser mails, som Thomas har videresendt fra CoolRunner og GLS (også mails vedhæftet som .eml).
// CoolRunner: kvitteringen er selve mailen → gemmes som PDF (vedhæftede PDF'er er pakkelabels og gemmes ikke).
// GLS: vedhæftede faktura-PDF'er gemmes; uden faktura gemmes mailen (ordrebekræftelse) som PDF.
// Filnavn: "<Firma> <ordrenr> [faktura <nr>] <ÅÅMMDD>.pdf". Findes navnet allerede i Indbakke, springes det over.
// Færdige tråde får etiketten "CTS/Bilag behandlet". Intet slettes, og der gives ikke bilagsnumre.
var BILAG_INDBAKKE = '17xqS57VoqpSHcmY0AuKGmouoCnRiR-t7';
var BILAG_ETIKET = 'CTS/Bilag behandlet';
// Thomas videresender bilag fra sin private mail. Andre mails med vedhæftninger fra den adresse gemmes også (fx MobilePay-kvitteringer).
var BILAG_AFSENDER = 't.clifford.pejtersen@gmail.com';
var FRAGT_SOEG = '(coolrunner OR gls OR from:' + BILAG_AFSENDER + ') -label:cts-bilag-behandlet';

function gemFragtbilagMenu() {
  var r = gemFragtbilag();
  SpreadsheetApp.getUi().alert('Bilag fra Gmail',
    'Gemt i Indbakke: ' + r.gemt.length + '\nFandtes allerede: ' + r.findes + '\nIkke genkendt: ' + r.ukendt.length +
    '\nTråde færdige: ' + r.traade + (r.mere ? '\n\nDer er mere – kør igen.' : '') +
    (r.ukendt.length ? '\n\nIkke genkendt:\n' + r.ukendt.slice(0, 15).join('\n') : ''), SpreadsheetApp.getUi().ButtonSet.OK);
}

function gemFragtbilag() {
  var laas = LockService.getScriptLock();   // to kørsler på samme tid gav dubletter (07-11)
  if (!laas.tryLock(1000)) throw new Error('Gem fragtbilag kører allerede. Vent, til den er færdig.');
  try { return gemFragtbilagIndre_(); } finally { laas.releaseLock(); }
}

function gemFragtbilagIndre_() {
  var start = Date.now(), mappe = DriveApp.getFolderById(BILAG_INDBAKKE);
  var etiket = GmailApp.getUserLabelByName(BILAG_ETIKET) || GmailApp.createLabel(BILAG_ETIKET);
  var findes = {}, it = mappe.getFiles();
  while (it.hasNext()) findes[it.next().getName()] = true;
  var res = { gemt: [], findes: 0, ukendt: [], traade: 0, mere: false };
  var traade = GmailApp.search(FRAGT_SOEG, 0, 20);
  for (var t = 0; t < traade.length; t++) {
    if (Date.now() - start > 4.5 * 60 * 1000) { res.mere = true; break; }
    traade[t].getMessages().forEach(function (m) {
      var fundet = 0;
      var gem = function (b) {
        var gls = b.navn.match(/^(GLS \d+) \d{6}\.pdf$/);   // GLS-mail uden faktura: spring over, hvis fakturaen findes
        if (findes[b.navn] || (gls && Object.keys(findes).some(function (n) { return n.indexOf(gls[1] + ' faktura ') === 0; }))) { res.findes++; return; }
        mappe.createFile(b.blob.setName(b.navn)); findes[b.navn] = true; res.gemt.push(b.navn);
      };
      fragtMails_(m).forEach(function (mail) {
        var bilag = fragtBilag_(mail);
        fundet += bilag.length;
        if (!bilag.length) { if (mail.vigtig) res.ukendt.push(mail.emne || '(uden emne)'); return; }
        bilag.forEach(gem);
      });
      // Andet bilag fra Thomas (ikke fragt): vedhæftede PDF'er/billeder gemmes med mailens emne som navn
      if (!fundet && fraAfsender_(m.getFrom())) andreBilag_(m).forEach(gem);
    });
    traade[t].addLabel(etiket); res.traade++;
  }
  if (traade.length === 20 && !res.mere) res.mere = true;
  return res;
}

function fraAfsender_(fra) { return String(fra || '').toLowerCase().indexOf(BILAG_AFSENDER) >= 0; }

// "Lego køb 261028" + 4521415852.pdf → "Lego køb 261028.pdf" (flere filer: "… (2).pdf")
function andreBilag_(m) {
  var emne = String(m.getSubject() || 'Bilag').replace(/^(\s*(VS|SV|Fwd?|Re)\s*:\s*)+/i, '').replace(/[\\\/:*?"<>|]+/g, ' ').trim() || 'Bilag';
  var filer = m.getAttachments({ includeInlineImages: false }).filter(function (a) {
    return /pdf|image\//i.test(String(a.getContentType() || '')) || /\.(pdf|jpe?g|png|heic)$/i.test(String(a.getName() || ''));
  });
  return filer.map(function (a, i) {
    var ext = (String(a.getName()).match(/\.[A-Za-z0-9]+$/) || ['.pdf'])[0].toLowerCase();
    return { navn: andetNavn_(emne, i, filer.length, ext), blob: a.copyBlob() };
  });
}
function andetNavn_(emne, i, antal, ext) { return emne + (antal > 1 ? ' (' + (i + 1) + ')' : '') + ext; }

// En Gmail-besked → liste af "mails": selve beskeden + hver vedhæftet .eml (rekursivt). Læses fra rå-mailen.
function fragtMails_(m) {
  var ud = emlMails_(m.getRawContent());
  ud[0].vigtig = false;   // selve videresendelsen er ofte bare en "indpakning"
  return ud;
}

function emlMails_(raa) {
  var del = mimeParse_(raa), ud = [], mail = { emne: mimeOrd_(del.hoved.subject || ''), html: '', tekst: '', pdf: [], vigtig: true };
  ud.push(mail);
  (function gaa(d) {
    var ct = (d.hoved['content-type'] || 'text/plain').toLowerCase();
    if (d.dele) { d.dele.forEach(gaa); return; }
    if (ct.indexOf('message/rfc822') === 0) { ud = ud.concat(emlMails_(d.krop)); return; }
    var navn = mimeFilnavn_(d.hoved);
    if (ct.indexOf('application/pdf') === 0 || /\.pdf$/i.test(navn)) {
      mail.pdf.push({ navn: navn, blob: Utilities.newBlob(Utilities.base64Decode(d.krop.replace(/\s+/g, '')), 'application/pdf', navn || 'bilag.pdf') });
    } else if (ct.indexOf('text/html') === 0 && !mail.html) mail.html = mimeTekst_(d);
    else if (ct.indexOf('text/plain') === 0 && !mail.tekst && !navn) mail.tekst = mimeTekst_(d);
  })(del);
  return ud;
}

// Hvilke bilag giver en mail? Tom liste = ikke en fragtkvittering.
function fragtBilag_(mail) {
  var info = fragtInfo_(mail.tekst || htmlTilTekst_(mail.html));
  if (!info) {   // fx GLS-fakturaer vedhæftet direkte: "Faktura 21803097 - ordre 4246792.pdf"
    return mail.pdf.map(function (p) {
      var m = String(p.navn).match(/(faktura|kreditnota)\s*(\d{6,})\D+?ordre\s*(\d{6,})/i);
      return m ? { navn: (/kredit/i.test(m[1]) ? 'GLS kreditnota ' : 'GLS ') + m[3] + ' faktura ' + m[2] + '.pdf', blob: p.blob } : null;
    }).filter(Boolean);
  }
  if (info.firma === 'GLS' && mail.pdf.length) {
    return mail.pdf.filter(function (p) { return !/label/i.test(p.navn); }).map(function (p, i, alle) {
      var nr = info.faktura || (String(p.navn).match(/(\d{7,})/) || [])[1];
      return { navn: fragtNavn_(info, nr) + (alle.length > 1 && !nr ? ' (' + (i + 1) + ')' : '') + '.pdf', blob: p.blob };
    });
  }
  var html = '<html><head><meta charset="utf-8"></head><body><p style="font:11px Arial;color:#666">Gemt af CTS maskinrum ' +
    Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM-yyyy') + ' – mail: ' + htmlEsc_(mail.emne) + '</p>' +
    (mail.html || '<pre>' + htmlEsc_(mail.tekst) + '</pre>') + '</body></html>';
  return [{ navn: fragtNavn_(info, info.faktura) + '.pdf', blob: Utilities.newBlob(html, 'text/html', 'mail.html').getAs('application/pdf') }];
}

function fragtNavn_(info, faktura) {
  // GLS med fakturanr: uden dato, så faktura-PDF og mail om samme faktura får samme navn (ingen dubletter)
  if (faktura) return info.firma + ' ' + info.ordre + ' faktura ' + faktura;
  return info.firma + ' ' + info.ordre + (info.dato ? ' ' + info.dato : '');
}

// Udtræk firma, ordrenr, dato (ÅÅMMDD) og evt. fakturanr af mailteksten
function fragtInfo_(tekst) {
  tekst = String(tekst || '');
  var to = function (n) { return ('0' + n).slice(-2); }, m;
  if (/coolrunner/i.test(tekst) && (m = tekst.match(/Ordrenumm?b?er:?\s*(\d{9,})/i))) {
    var d = tekst.match(/Dato:?\s*(\d{1,2})\/(\d{1,2})-(\d{4})/);
    return { firma: 'CoolRunner', ordre: m[1], dato: d ? d[3].slice(2) + to(d[2]) + to(d[1]) : '', faktura: '' };
  }
  if (/\bGLS\b/.test(tekst)) {
    var kredit = /kreditnota/i.test(tekst);
    m = tekst.match(/(?:Ordrenummer:?|ordre)\s*(\d{6,})/i);
    if (!m) return null;
    var k = tekst.match(/Købsdato:?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i) || tekst.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
    if (k && Number(k[2]) > 12) k = [k[0], k[2], k[1], k[3]];   // amerikansk dato (MM/DD/ÅÅÅÅ)
    var f = tekst.match(/(?:faktura|kreditnota)\s*(?:nr\.?\s*)?(\d{6,})/i);
    return { firma: kredit ? 'GLS kreditnota' : 'GLS', ordre: m[1], dato: k ? k[3].slice(2) + to(k[2]) + to(k[1]) : '', faktura: f ? f[1] : '' };
  }
  return null;
}

// ---- lille MIME-læser (kun det, der skal bruges her) ----
function mimeParse_(raa) {
  raa = String(raa).replace(/\r\n/g, '\n');
  var i = raa.indexOf('\n\n'), hovedTekst = i < 0 ? raa : raa.slice(0, i), krop = i < 0 ? '' : raa.slice(i + 2);
  var hoved = {};
  hovedTekst.replace(/\n[ \t]+/g, ' ').split('\n').forEach(function (l) {
    var j = l.indexOf(':'); if (j > 0) { var n = l.slice(0, j).trim().toLowerCase(); if (!(n in hoved)) hoved[n] = l.slice(j + 1).trim(); }
  });
  var ct = hoved['content-type'] || '', b = ct.match(/boundary="?([^";]+)"?/i);
  if (/^multipart\//i.test(ct) && b) {
    var dele = [], stykker = krop.split('--' + b[1]);
    for (var k = 1; k < stykker.length; k++) {
      var st = stykker[k];
      if (/^--/.test(st)) break;
      dele.push(mimeParse_(st.replace(/^[ \t]*\n/, '')));
    }
    return { hoved: hoved, dele: dele };
  }
  return { hoved: hoved, krop: krop };
}

function mimeTekst_(d) {
  var enc = String(d.hoved['content-transfer-encoding'] || '').toLowerCase();
  var cs = ((d.hoved['content-type'] || '').match(/charset="?([^";]+)"?/i) || [])[1] || 'UTF-8', bytes;
  if (enc === 'base64') bytes = Utilities.base64Decode(d.krop.replace(/\s+/g, ''));
  else if (enc === 'quoted-printable') bytes = qpBytes_(d.krop);
  else return d.krop;
  return Utilities.newBlob(bytes).getDataAsString(cs);
}

function qpBytes_(s) {
  s = s.replace(/=\n/g, '');
  var ud = [];
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(s.substr(i + 1, 2))) { ud.push(parseInt(s.substr(i + 1, 2), 16)); i += 2; }
    else {
      var kode = s.charCodeAt(i);
      if (kode < 128) ud.push(kode); else Utilities.newBlob(c).getBytes().forEach(function (x) { ud.push(x & 255); });
    }
  }
  return ud.map(function (x) { return x > 127 ? x - 256 : x; });
}

function mimeFilnavn_(h) {
  var s = (h['content-disposition'] || '') + ';' + (h['content-type'] || '');
  var m = s.match(/(?:file)?name\*?="?([^";]+)"?/i);
  return m ? mimeOrd_(m[1]) : '';
}

function mimeOrd_(s) {
  return String(s).replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, function (_, cs, typ, data) {
    var bytes = /b/i.test(typ) ? Utilities.base64Decode(data) : qpBytes_(data.replace(/_/g, ' '));
    return Utilities.newBlob(bytes).getDataAsString(cs);
  }).replace(/\?=\s+=\?/g, '');
}

function htmlTilTekst_(h) {
  return String(h || '').replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|tr|td|th|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ');
}
function htmlEsc_(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ---------- Bilagsplan: Claude skriver planen i fanen "Bilagsplan", Thomas kører den med ét klik ----------
// Kolonner (række 1 = overskrift): A Bilagsnr, B Fil-id, C Nyt filnavn, D Mappe-id, E Celle (fx "Salg 2026!P111"), F Status.
// Rækker med tom status udføres: filen omdøbes og flyttes, og bilagsnr føjes til cellen (eksisterende numre bevares, sorteret).
// Status sættes til "OK <dato>" eller "FEJL: …". Kan køres igen uden at gøre noget to gange.
var BILAGSPLAN = 'Bilagsplan';

function udfoerBilagsplanMenu() {
  var r = udfoerBilagsplan();
  SpreadsheetApp.getUi().alert('Bilagsplan', 'Udført: ' + r.ok + '\nFejl: ' + r.fejl.length + (r.mere ? '\n\nDer er mere – kør igen.' : '') +
    (r.fejl.length ? '\n\n' + r.fejl.slice(0, 10).join('\n') : ''), SpreadsheetApp.getUi().ButtonSet.OK);
}

function udfoerBilagsplan() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(BILAGSPLAN);
  if (!sh) throw new Error('Fanen "' + BILAGSPLAN + '" findes ikke.');
  var n = sh.getLastRow() - 1, res = { ok: 0, fejl: [], mere: false }, start = Date.now();
  if (n < 1) return res;
  var data = sh.getRange(2, 1, n, 6).getDisplayValues(), mapper = {};
  for (var i = 0; i < data.length; i++) {
    var r = data[i], nr = r[0].trim();
    if (!nr || r[5]) continue;
    if (Date.now() - start > 4.5 * 60 * 1000) { res.mere = true; break; }
    try {
      if (r[1]) {
        var f = DriveApp.getFileById(r[1].trim());
        if (r[2] && f.getName() !== r[2].trim()) f.setName(r[2].trim());
        if (r[3]) { var id = r[3].trim(); mapper[id] = mapper[id] || DriveApp.getFolderById(id); f.moveTo(mapper[id]); }
      }
      if (r[4]) tilfoejBilagsnr_(ss, r[4].trim(), nr);
      sh.getRange(i + 2, 6).setValue('OK ' + Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM-yyyy HH:mm'));
      res.ok++;
    } catch (e) {
      sh.getRange(i + 2, 6).setValue('FEJL: ' + e.message); res.fejl.push(nr + ': ' + e.message);
    }
  }
  return res;
}

// "Salg 2026!P111" + "B148" → "B052, B054, B148" (ingen dubletter, sorteret)
function tilfoejBilagsnr_(ss, celle, nr) {
  var m = celle.match(/^'?(.+?)'?!([A-Z]+\d+)$/);
  if (!m) throw new Error('Ukendt celle ' + celle);
  var sh = ss.getSheetByName(m[1]);
  if (!sh) throw new Error('Fanen ' + m[1] + ' findes ikke');
  var c = sh.getRange(m[2]);
  c.setValue(flettBilagsnr_(String(c.getDisplayValue()), nr));
}
function flettBilagsnr_(gl, nr) {
  var alle = (gl + ',' + nr).split(/[,;\s]+/).map(function (x) { return x.trim().toUpperCase(); }).filter(function (x) { return /^B\d+$/.test(x); });
  var set = {}; alle.forEach(function (x) { set[x] = true; });
  return Object.keys(set).sort(function (a, b) { return Number(a.slice(1)) - Number(b.slice(1)); }).join(', ');
}

function visNoegle() {
  SpreadsheetApp.getUi().alert('API-nøgle',
    'Kopiér nøglen herunder og indsæt den i appen under Indstillinger.\n\n' + hentNoegle_() +
    '\n\nDel den ikke med andre.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function nyNoegle() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Lav ny API-nøgle', 'Den gamle nøgle holder op med at virke, og du skal indtaste den nye i appen. Fortsæt?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().setProperty('API_NOEGLE', lavNoegle_());
  visNoegle();
}

function hentNoegle_() {
  var p = PropertiesService.getScriptProperties();
  var n = p.getProperty('API_NOEGLE');
  if (!n) { n = lavNoegle_(); p.setProperty('API_NOEGLE', n); }
  return n;
}
function lavNoegle_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }

function tjekOpsaetning() {
  var ss = SpreadsheetApp.getActive(), linjer = [];
  ORDEN.forEach(function (k) { linjer.push((ss.getSheetByName(FANE[k]) ? '✓ ' : '✗ MANGLER: ') + FANE[k]); });
  var p = PropertiesService.getScriptProperties();
  var rod = p.getProperty('ROD_MAPPE_ID'), rodNavn = '✗ ikke sat';
  try { if (rod) rodNavn = '✓ ' + stiTil_(DriveApp.getFolderById(rod)); } catch (e) { rodNavn = '✗ findes ikke'; }
  linjer.push('Fotomappe: ' + rodNavn);
  linjer.push('API-nøgle: ' + (p.getProperty('API_NOEGLE') ? '✓ sat' : '✗ ikke sat'));
  linjer.push('Importeret: ' + (p.getProperty('IMPORTERET') || 'nej'));
  linjer.push('Version: ' + VERSION);
  SpreadsheetApp.getUi().alert('Tjek opsætning', linjer.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

function stiTil_(mappe) {
  var dele = [mappe.getName()], it = mappe.getParents(), n = 0;
  while (it.hasNext() && n < 5) { var m = it.next(); dele.unshift(m.getName()); it = m.getParents(); n++; }
  return dele.join('/');
}

// ======================================================================
//  HJÆLPERE
// ======================================================================

function ind_(fane, kol, fra) { return 'INDIRECT("\'' + fane + '\'!' + kol + fra + ':' + kol + '")'; }

function proev_(fn, hvad) {
  var sidste;
  for (var i = 0; i < 3; i++) {
    try { return fn(); } catch (e) { sidste = e; SpreadsheetApp.flush(); Utilities.sleep(2000 * (i + 1)); }
  }
  throw new Error('Kunne ikke ' + hvad + ': ' + (sidste && sidste.message));
}

// Kør fn med arket på engelsk landestandard (så formler med komma parses), og sæt tilbage bagefter
function medEngelsk_(ss, fn) {
  var gl = ss.getSpreadsheetLocale();
  ss.setSpreadsheetLocale('en_US'); SpreadsheetApp.flush();
  try { return fn(); } finally { SpreadsheetApp.flush(); ss.setSpreadsheetLocale(gl && gl !== 'en_US' ? gl : 'da_DK'); SpreadsheetApp.flush(); }
}

function findDbStart_(db) {
  var v = db.getRange(1, 1, 5, 1).getDisplayValues();
  for (var i = 0; i < v.length; i++) if (String(v[i][0]).trim().toLowerCase() === 'lego number') return i + 2;
  return 0;
}
function dbRef_() {
  var db = SpreadsheetApp.getActive().getSheetByName(FANE.DB);
  var s = db ? findDbStart_(db) : 0;
  if (!s) throw new Error('Fanen DB med overskriften "Lego number" findes ikke.');
  PropertiesService.getScriptProperties().setProperty('DB_START', String(s));
  return { A: 'DB!$A$' + s + ':$A', B: 'DB!$B$' + s + ':$B', C: 'DB!$C$' + s + ':$C', D: 'DB!$D$' + s + ':$D' };
}

function mappeForRegneark_(ss) {
  var it = DriveApp.getFileById(ss.getId()).getParents();
  return it.hasNext() ? it.next() : DriveApp.getRootFolder();
}
function underMappe_(foraeldre, navn) {
  var it = foraeldre.getFoldersByName(navn);
  return it.hasNext() ? it.next() : foraeldre.createFolder(navn);
}

var NAVY = '#1f3864';
function nyFane_(ss, navn, titel, overskrifter, overskriftRaekke, titelBredde) {
  var sh = ss.insertSheet(ss.getSheets().length);
  sh.setName(navn);
  var n = titelBredde || overskrifter.length;
  sh.getRange(1, 1, 1, n).merge().setValue(titel).setBackground(NAVY).setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
  if (overskrifter.length) {
    sh.getRange(overskriftRaekke, 1, 1, overskrifter.length).setValues([overskrifter]).setBackground(NAVY)
      .setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  }
  sh.setFrozenRows(overskriftRaekke);
  return sh;
}

function sikrRaekker_(sh, antal) {
  var mangler = antal - sh.getMaxRows();
  if (mangler > 0) sh.insertRowsAfter(sh.getMaxRows(), mangler);
}

function ark_(navn) {
  var sh = SpreadsheetApp.getActive().getSheetByName(navn);
  if (!sh) throw new Error('Fanen "' + navn + '" findes ikke. Kør CTS → Importér fra Excel.');
  return sh;
}

// ======================================================================
//  BYG FANERNE (tomme, med formler)
// ======================================================================

function byggAlt_(ss, data) {
  var db = ss.getSheetByName(FANE.DB);
  ss.setActiveSheet(db);
  ss.getSheets().forEach(function (sh) { if (sh.getName() !== FANE.DB) proev_(function () { ss.deleteSheet(sh); }, 'slette fanen ' + sh.getName()); });
  ss.getNamedRanges().forEach(function (r) { try { r.remove(); } catch (e) { /* ignorer */ } });
  SpreadsheetApp.flush(); Utilities.sleep(1000);

  byggKontoplan_(ss, data);
  byggIndkoebslog_(ss);
  byggIndkoeb_(ss);
  byggSalg_(ss, '2025', data.salg2025.kurs);
  byggSalg_(ss, '2026', data.salg2026.kurs);
  byggUdgifter_(ss, '2025');
  byggUdgifter_(ss, '2026');
  byggSkat_(ss, '2025', data.skat2025);
  byggSkat_(ss, '2026', data.skat2026);
  byggDbSalgspriser_(ss);
  byggLager_(ss);
  byggEbay_(ss, data.ebay.titel);
  formlerAlle_(ss);

  ORDEN.forEach(function (k, i) { var sh = ss.getSheetByName(FANE[k]); if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); } });
}

function byggKontoplan_(ss, data) {
  var sh = nyFane_(ss, FANE.KONTO, 'KONTOPLAN OG LISTER', ['Konto', 'Kontonavn', '', 'Platforme (Indkøb)', 'Platforme (Salg)'], 2);
  sh.getRange('A3:A').setNumberFormat('@');
  var kp = (data && data.kontoplan) || [];
  if (kp.length) sh.getRange(3, 1, kp.length, 2).setValues(kp.map(function (r) { return [String(r[0]), r[1]]; }));
  sh.getRange(3, 4, PLATFORME.length, 1).setValues(PLATFORME.map(function (p) { return [p]; }));
  sh.getRange(3, 5, PLATFORME_SALG.length, 1).setValues(PLATFORME_SALG.map(function (p) { return [p]; }));
  sh.setColumnWidth(2, 280); sh.setColumnWidths(4, 2, 170);
}

function byggIndkoebslog_(ss) {
  var sh = nyFane_(ss, FANE.LOG, 'INDKØBSLOG — Copenhagen Treasures and Services',
    ['Indkøbsdato', 'Samlet køb (DKK)', 'Skattepligt', 'Noter', 'Sæt i alt', 'Solgt', 'Klar (På lager)', 'Ikke klar',
      'Salg 2025 (DKK)', 'Salg 2026 (DKK)', 'Salg i alt (DKK)', 'ROI', 'MappeID'], 2);
  sh.getRange('A3:A').setNumberFormat('0');
  sh.getRange('B3:B').setNumberFormat('#,##0.00');
  sh.getRange('I3:K').setNumberFormat('#,##0.00');
  sh.getRange('L3:L').setNumberFormat('0.0%');
  sh.getRange('C3:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Ja', 'Nej'], true).build());
  sh.setColumnWidth(4, 360); sh.hideColumns(LK.MAPPEID);
}

function byggIndkoeb_(ss) {
  var sh = nyFane_(ss, FANE.INDKOEB, 'INDKØB — Copenhagen Treasures and Services',
    ['SKU', 'Købsdato', 'Set nr.', 'Navn', 'BL or eBay Average (€)', 'Købspris (DKK)',
      'Sættes til salg for:', 'Original Box', 'Sorteret', 'Fotos', 'Klar til salg', 'Stand (1-10)',
      'Salgsplatform', 'Lagerstatus', 'Salgsdato', 'Salgspris', 'Noter',
      'Værdikilde', 'Vejledning', 'Komplet', 'Fast købspris (DKK)', 'Foto-SKU', 'Listet'], 2);
  sh.getRange('B3:C').setNumberFormat('0');
  sh.getRange('E3:E').setNumberFormat('[$€]#,##0.00');
  sh.getRange('F3:G').setNumberFormat('#,##0.00');
  sh.getRange('U3:U').setNumberFormat('#,##0.00');
  sh.setColumnWidth(1, 140); sh.setColumnWidth(4, 260); sh.setColumnWidth(17, 300);
  sh.hideColumns(K.FOTOSKU);
}

// Afkrydsning, rullelister og formater på et område af rækker i Indkøb
function saetValidering_(sh, fra, antal) {
  if (antal < 1) return;
  var cb = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  [K.SORTERET, K.FOTOS, K.KLAR, K.VEJLEDNING, K.KOMPLET, K.LISTET].forEach(function (k) { sh.getRange(fra, k, antal, 1).setDataValidation(cb); });
  var liste = function (v) { return SpreadsheetApp.newDataValidation().requireValueInList(v, true).setAllowInvalid(true).build(); };
  sh.getRange(fra, K.OVP, antal, 1).setDataValidation(liste(['Ja', 'Nej']));
  sh.getRange(fra, K.STAND, antal, 1).setDataValidation(liste(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']));
  sh.getRange(fra, K.PLATFORM, antal, 1).setDataValidation(liste(PLATFORME));
  sh.getRange(fra, K.KILDE, antal, 1).setDataValidation(liste(KILDER));
}

function byggSalg_(ss, aar, kurs) {
  var navn = FANE['SALG' + aar.slice(2)];
  var sh = nyFane_(ss, navn, 'SALG ' + aar + ' — Copenhagen Treasures and Services',
    ['Salgsdato', 'SKU', 'Køber', 'Platform', 'Indkøbspris (DKK)', 'Udgift Fragt', 'Portals gebyr',
      'Ordre Sum', 'Fragt (modtaget)', 'Refunderet (EUR)', 'Ordre Sum + Fragt (DKK)',
      'Fortjeneste sæt (DKK)', 'Fortjeneste Ordre (DKK)', 'Skattepligtigt', 'eBay-ordrenr.', 'Bilagsnr'], 3, 16);
  sh.getRange('E2').setValue('Udgifter'); sh.getRange('H2').setValue('Indtægter'); sh.getRange('J2').setValue('I alt:');
  sh.getRange('Q2').setValue('EUR/DKK kurs'); sh.getRange('R2').setValue(Number(kurs) || 7.46);
  sh.getRange('A2:R2').setFontWeight('bold');
  sh.getRange('A4:A').setNumberFormat('dd-mm-yyyy');
  sh.getRange('E4:F').setNumberFormat('#,##0.00');
  sh.getRange('G4:J').setNumberFormat('[$€]#,##0.00');
  sh.getRange('K4:M').setNumberFormat('#,##0.00');
  sh.getRange('K2:M2').setNumberFormat('#,##0.00');
  sh.getRange('D4:D').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PLATFORME_SALG, true).setAllowInvalid(true).build());
  sh.setColumnWidth(3, 200);
}

function byggUdgifter_(ss, aar) {
  var navn = FANE['UDG' + aar.slice(2)];
  var sh = nyFane_(ss, navn, 'UDGIFTER ' + aar + ' — Copenhagen Treasures and Services',
    ['Bilagsnr', 'Dato', 'Konto', 'Kontonavn', 'Modpart', 'Beløb', 'Valuta', 'Beløb DKK', 'Moms DKK', 'Fradrag %', 'Fradrag DKK', 'Note'], 2, 12);
  sh.getRange('B3:B').setNumberFormat('dd-mm-yyyy');
  sh.getRange('C3:C').setNumberFormat('@');
  sh.getRange('F3:F').setNumberFormat('#,##0.00');
  sh.getRange('H3:I').setNumberFormat('#,##0.00');
  sh.getRange('K3:K').setNumberFormat('#,##0.00');
  sh.getRange('C3:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(ss.getSheetByName(FANE.KONTO).getRange('A3:A'), true).setAllowInvalid(true).build());
  sh.getRange('G3:G').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['DKK', 'EUR'], true).build());
  // Opsummering pr. konto (N:Q)
  sh.getRange('N2').setValue('OPSUMMERING PR. KONTO').setFontWeight('bold');
  sh.getRange('N3').setValue('Driftsudgifter i alt (fradragsberettiget)').setFontWeight('bold');
  sh.getRange('N4:Q4').setValues([['Konto', 'Kontonavn', 'Beløb DKK', 'Fradrag DKK']]).setFontWeight('bold').setBackground(NAVY).setFontColor('#ffffff');
  sh.getRange('P3:Q').setNumberFormat('#,##0.00');
  sh.setColumnWidth(5, 200); sh.setColumnWidth(12, 320); sh.setColumnWidth(15, 240);
}

function byggSkat_(ss, aar, tekster) {
  var navn = FANE['SKAT' + aar.slice(2)];
  var sh = nyFane_(ss, navn, 'SKAT ' + aar + ' — Copenhagen Treasures and Services', ['Post', 'Beløb (DKK)', 'Note'], 2);
  (tekster || []).forEach(function (t) {
    var r = t[0]; if (r < 3) return;
    if (t[1] !== '') sh.getRange(r, 1).setValue(t[1]);
    if (t[2] !== '') sh.getRange(r, 3).setValue(t[2]);
  });
  [6, 9, 16].forEach(function (r) { sh.getRange(r, 1).setFontWeight('bold'); });
  sh.getRange(18, 1, 1, 2).setFontWeight('bold');
  sh.getRange('B4:B18').setNumberFormat('#,##0.00');
  sh.setColumnWidth(1, 420); sh.setColumnWidth(2, 140); sh.setColumnWidth(3, 300);
}

function byggDbSalgspriser_(ss) {
  var sh = nyFane_(ss, FANE.DBS, 'DB SALGSPRISER — Copenhagen Treasures and Services (opslag, EUR)',
    ['Sæt nr.', 'Tema', 'Gns. salgspris (€)', 'Antal salg', 'Højeste salgspris (€)', 'Laveste pris (€)'], 2);
  sh.getRange('C3:C').setNumberFormat('[$€]#,##0.00');
  sh.getRange('E3:F').setNumberFormat('[$€]#,##0.00');
}

function byggLager_(ss) {
  var sh = nyFane_(ss, FANE.LAGER, 'LAGER — Copenhagen Treasures and Services',
    ['SKU', 'Stand', 'Til salg på', 'Set nr.', 'Navn', 'Theme', 'Subtheme', 'Noter'], 2);
  sh.setColumnWidth(1, 140); sh.setColumnWidth(5, 260); sh.setColumnWidth(8, 300);
}

function byggEbay_(ss, titel) {
  var sh = nyFane_(ss, FANE.EBAY, titel || 'eBAY-AFSTEMNING',
    ['SKU (eBay)', 'Titel (eBay)', 'Match i Indkøb', 'Lagerstatus', 'Navn i Indkøb', 'Vurdering', 'Dublet',
      'Normaliseret SKU', 'Match (norm.)', 'Lagerstatus (norm.)', 'Vurdering (normaliseret)'], 2, 11);
  sh.getRange('M2:N2').setValues([['OPSUMMERING', '']]).setFontWeight('bold');
  sh.getRange('M3:M7').setValues([['Antal eBay-opslag'], ["Unikke SKU'er i listen"], ['Dubletter i listen'], ['OK'], ['Kræver handling']]);
  sh.setColumnWidth(2, 380); sh.setColumnWidth(6, 260); sh.setColumnWidth(11, 280); sh.setColumnWidth(13, 200);
}

// ======================================================================
//  FORMLER (lægges i overskriftsrækken og bruger INDIRECT, så de tåler
//  at rækker indsættes øverst eller slettes)
// ======================================================================

function formlerAlle_(ss) {
  var db = dbRef_();
  formlerIndkoebslog_(ss.getSheetByName(FANE.LOG));
  formlerIndkoeb_(ss.getSheetByName(FANE.INDKOEB), db);
  formlerSalg_(ss.getSheetByName(FANE.SALG25), '2025');
  formlerSalg_(ss.getSheetByName(FANE.SALG26), '2026');
  formlerUdgifter_(ss.getSheetByName(FANE.UDG25), '2025');
  formlerUdgifter_(ss.getSheetByName(FANE.UDG26), '2026');
  formlerSkat_(ss.getSheetByName(FANE.SKAT25), '2025');
  formlerSkat_(ss.getSheetByName(FANE.SKAT26), '2026');
  formlerDbSalgspriser_(ss.getSheetByName(FANE.DBS), db);
  formlerLager_(ss.getSheetByName(FANE.LAGER), db);
  formlerEbay_(ss.getSheetByName(FANE.EBAY));
}

function formlerIndkoebslog_(sh) {
  var I = FANE.INDKOEB, L = FANE.LOG;
  var fd = 'logdato,' + ind_(L, 'A', 3) + ',inddato,' + ind_(I, 'B', 3) + ',indstatus,' + ind_(I, 'N', 3) + ',';
  sh.getRange('E2').setFormula('=LET(' + fd + '{"Sæt i alt";ARRAYFORMULA(IF(logdato="","",COUNTIF(inddato,logdato)))})');
  sh.getRange('F2').setFormula('=LET(' + fd + '{"Solgt";ARRAYFORMULA(IF(logdato="","",COUNTIFS(inddato,logdato,indstatus,"Solgt")))})');
  sh.getRange('G2').setFormula('=LET(' + fd + '{"Klar (På lager)";ARRAYFORMULA(IF(logdato="","",COUNTIFS(inddato,logdato,indstatus,"På lager")))})');
  sh.getRange('H2').setFormula('=LET(logdato,' + ind_(L, 'A', 3) + ',ialt,' + ind_(L, 'E', 3) + ',solgte,' + ind_(L, 'F', 3) + ',klare,' + ind_(L, 'G', 3) +
    ',{"Ikke klar";ARRAYFORMULA(IF(logdato="","",ialt-solgte-klare))})');
  ['2025', '2026'].forEach(function (aar, i) {
    var S = FANE['SALG' + aar.slice(2)];
    sh.getRange(2, 9 + i).setFormula('=LET(logdato,' + ind_(L, 'A', 3) + ',skuer,' + ind_(S, 'B', SALG_START) + ',ordre,' + ind_(S, 'H', SALG_START) + ',' +
      'pre,ARRAYFORMULA(UPPER(IFERROR(LEFT(skuer,FIND("-",skuer)-1),""))),beloeb,ARRAYFORMULA(IF(ISNUMBER(ordre),ordre,0)),' +
      '{"Salg ' + aar + ' (DKK)";MAP(logdato,LAMBDA(batchdato,IF(batchdato="","",SUMPRODUCT((pre=UPPER(TO_TEXT(batchdato)))*beloeb)*\'' + S + '\'!$R$2)))})');
  });
  sh.getRange('K2').setFormula('=LET(logdato,' + ind_(L, 'A', 3) + ',salg2025,' + ind_(L, 'I', 3) + ',salg2026,' + ind_(L, 'J', 3) +
    ',{"Salg i alt (DKK)";ARRAYFORMULA(IF(logdato="","",salg2025+salg2026))})');
  sh.getRange('L2').setFormula('=LET(logdato,' + ind_(L, 'A', 3) + ',pris,' + ind_(L, 'B', 3) + ',salg,' + ind_(L, 'K', 3) +
    ',{"ROI";ARRAYFORMULA(IF(logdato="","",IFERROR(salg/pris-1,"")))})');
}

function formlerIndkoeb_(sh, db) {
  var I = FANE.INDKOEB, L = FANE.LOG;
  // A: SKU = Købsdato-Setnr, + -a/-b ved dubletter (også første række)
  sh.getRange('A2').setFormula('=LET(datoer,' + ind_(I, 'B', 3) + ',saetnr,' + ind_(I, 'C', 3) + ',raekker,ARRAYFORMULA(ROW(datoer)),' +
    '{"SKU";ARRAYFORMULA(IF(datoer="","",datoer&"-"&saetnr&IF(saetnr="","",IF(COUNTIFS(datoer,datoer,saetnr,saetnr)>1,' +
    '"-"&CHAR(96+COUNTIFS(datoer,datoer,saetnr,saetnr,raekker,"<="&raekker)),""))))})');
  // D: Navn fra DB (prøver også "<nr>-1")
  sh.getRange('D2').setFormula('=LET(datoer,' + ind_(I, 'B', 3) + ',saetnr,' + ind_(I, 'C', 3) + ',dbtabel,{ARRAYFORMULA(TO_TEXT(' + db.A + ')),' + db.B + '},' +
    '{"Navn";ARRAYFORMULA(IF(datoer="","",IFERROR(VLOOKUP(TO_TEXT(saetnr),dbtabel,2,FALSE),' +
    'IFERROR(VLOOKUP(TO_TEXT(saetnr)&"-1",dbtabel,2,FALSE),"Sæt findes ikke"))))})');
  // F: Købspris = fast pris hvis udfyldt, ellers (batchpris − faste priser) × værdi / sum af værdier uden fast pris
  sh.getRange('F2').setFormula('=LET(datoer,' + ind_(I, 'B', 3) + ',vaerdier,' + ind_(I, 'E', 3) + ',fast,' + ind_(I, 'U', 3) + ',' +
    'logtabel,{' + ind_(L, 'A', 3) + ',' + ind_(L, 'B', 3) + '},' +
    'fastsum,MAP(datoer,LAMBDA(batchdato,IF(batchdato="",0,SUMIFS(fast,datoer,batchdato)))),' +
    'udensum,MAP(datoer,LAMBDA(batchdato,IF(batchdato="",0,SUMIFS(vaerdier,datoer,batchdato,fast,"")))),' +
    '{"Købspris (DKK)";ARRAYFORMULA(IF(datoer="","",IF(fast<>"",fast,IFERROR((VLOOKUP(datoer,logtabel,2,FALSE)-fastsum)' +
    '*vaerdier/udensum,0))))})');
  // N: Lagerstatus = Solgt hvis SKU findes i Salg 2025/2026, ellers På lager hvis Klar til salg
  sh.getRange('N2').setFormula('=LET(skuer,' + ind_(I, 'A', 3) + ',klar,' + ind_(I, 'K', 3) + ',solgt2025,' + ind_(FANE.SALG25, 'B', SALG_START) + ',solgt2026,' + ind_(FANE.SALG26, 'B', SALG_START) + ',' +
    '{"Lagerstatus";ARRAYFORMULA(IF(skuer="","",IF(COUNTIF(solgt2025,skuer)+COUNTIF(solgt2026,skuer)>0,"Solgt",IF(klar=TRUE,"På lager",""))))})');
}

// Summer pr. ordre (samme dato + køber) beregnet række for række. SUMIFS udvider ikke i ARRAYFORMULA,
// derfor MAP med SUMIFS pr. række.
function gruppe_(navne) {
  return navne.map(function (x) {
    return 'g' + x + ',MAP(dato,kober,LAMBDA(rdato,rkober,SUMIFS(' + x + ',dato,rdato,kober,rkober))),';
  }).join('');
}

function formlerSalg_(sh, aar) {
  var S = FANE['SALG' + aar.slice(2)], I = FANE.INDKOEB, L = FANE.LOG;
  var v = function (k) { return ind_(S, k, SALG_START); };
  var lad = 'dato,' + v('A') + ',sku,' + v('B') + ',kober,' + v('C') + ',fragtud,' + v('F') + ',gebyr,' + v('G') + ',ordre,' + v('H') +
    ',fragtind,' + v('I') + ',refund,' + v('J') + ',raekker,ARRAYFORMULA(ROW(dato)),tom,ARRAYFORMULA((dato="")*(sku="")),';
  var forste = 'COUNTIFS(dato,dato,kober,kober,raekker,"<"&raekker)=0';
  // E: indkøbspris fra Indkøb
  sh.getRange('E3').setFormula('=LET(' + lad + 'opslag,{' + ind_(I, 'A', 3) + ',' + ind_(I, 'F', 3) + '},' +
    '{"Indkøbspris (DKK)";ARRAYFORMULA(IF(sku="","",IFERROR(VLOOKUP(sku,opslag,2,FALSE),"")))})');
  // K: Ordre Sum + Fragt (DKK). 2025: pr. række. 2026: samlet pr. ordre på ordrens første række.
  if (aar === '2025') {
    sh.getRange('K3').setFormula('=LET(' + lad + '{"Ordre Sum + Fragt (DKK)";ARRAYFORMULA(IF(tom,"",(IF(ISNUMBER(ordre),ordre,0)+IF(ISNUMBER(fragtind),fragtind,0)-IF(ISNUMBER(refund),refund,0))*$R$2))})');
  } else {
    sh.getRange('K3').setFormula('=LET(' + lad + gruppe_(['ordre', 'fragtind', 'refund']) +
      '{"Ordre Sum + Fragt (DKK)";ARRAYFORMULA(IF(tom,"",IF(' + forste + ',(gordre+gfragtind-grefund)*$R$2,"")))})');
  }
  // L: Fortjeneste pr. sæt (fragt, gebyr og refusion fordelt efter ordresum inden for dato + køber)
  sh.getRange('L3').setFormula('=LET(' + lad + gruppe_(['ordre', 'fragtind', 'gebyr', 'refund', 'fragtud']) + 'indkoeb,' + v('E') + ',' +
    '{"Fortjeneste sæt (DKK)";ARRAYFORMULA(IF(tom,"",IFERROR((ordre+ordre/gordre*(gfragtind-ggebyr-grefund))*$R$2' +
    '-(ordre/gordre)*gfragtud-indkoeb,"")))})');
  // M: Fortjeneste pr. ordre på ordrens første række
  sh.getRange('M3').setFormula('=LET(' + lad + 'fsaet,' + v('L') + ',gfsaet,MAP(dato,kober,LAMBDA(rdato,rkober,SUMIFS(fsaet,dato,rdato,kober,rkober))),' +
    '{"Fortjeneste Ordre (DKK)";ARRAYFORMULA(IF(tom,"",IF(' + forste + ',gfsaet,"")))})');
  // N: Skattepligtigt (2026 slås op i Indkøbslog; 2025 er indtastet)
  if (aar === '2026') {
    sh.getRange('N3').setFormula('=LET(sku,' + v('B') + ',logtabel,{ARRAYFORMULA(UPPER(TO_TEXT(' + ind_(L, 'A', 3) + '))),' + ind_(L, 'C', 3) + '},' +
      '{"Skattepligtigt";ARRAYFORMULA(IF(sku="","",IFERROR(VLOOKUP(UPPER(IFERROR(LEFT(sku,FIND("-",sku)-1),"")),logtabel,2,FALSE),"")))})');
  }
  // Totaler i række 2
  sh.getRange('K2').setFormula('=SUM(' + v('K') + ')');
  sh.getRange('L2').setFormula('=SUM(' + v('L') + ')');
  sh.getRange('M2').setFormula('=SUM(' + v('M') + ')');
}

function formlerUdgifter_(sh, aar) {
  var U = FANE['UDG' + aar.slice(2)], S = FANE['SALG' + aar.slice(2)];
  var v = function (k) { return ind_(U, k, 3); };
  var kp = '{ARRAYFORMULA(TO_TEXT(' + ind_(FANE.KONTO, 'A', 3) + ')),' + ind_(FANE.KONTO, 'B', 3) + '}';
  sh.getRange('D2').setFormula('=LET(konto,' + v('C') + ',kontotabel,' + kp + ',{"Kontonavn";ARRAYFORMULA(IF(konto="","",IFERROR(VLOOKUP(TO_TEXT(konto),kontotabel,2,FALSE),"")))})');
  sh.getRange('H2').setFormula('=LET(beloeb,' + v('F') + ',valuta,' + v('G') + ',{"Beløb DKK";ARRAYFORMULA(IF(beloeb="","",IF(valuta="EUR",beloeb*\'' + S + '\'!$R$2,beloeb)))})');
  sh.getRange('K2').setFormula('=LET(beloeb,' + v('F') + ',beloebdkk,' + v('H') + ',procent,' + v('J') + ',{"Fradrag DKK";ARRAYFORMULA(IF(beloeb="","",beloebdkk*IF(ISNUMBER(procent),procent,0)/100))})');
  sh.getRange('P3').setFormula('=SUM(' + v('H') + ')');
  sh.getRange('Q3').setFormula('=SUM(' + v('K') + ')');
  sh.getRange('N5').setFormula('=IFERROR(LET(konto,' + v('C') + ',beloebdkk,' + v('H') + ',fradrag,' + v('K') + ',kontotabel,' + kp + ',' +
    'liste,SORT(UNIQUE(FILTER(ARRAYFORMULA(TO_TEXT(konto)),konto<>""))),' +
    'HSTACK(liste,MAP(liste,LAMBDA(kontonr,IFERROR(VLOOKUP(kontonr,kontotabel,2,FALSE),""))),MAP(liste,LAMBDA(kontonr,SUMIF(konto,kontonr,beloebdkk))),MAP(liste,LAMBDA(kontonr,SUMIF(konto,kontonr,fradrag))))),"")');
}

function formlerSkat_(sh, aar) {
  var S = FANE['SALG' + aar.slice(2)], U = FANE['UDG' + aar.slice(2)];
  var v = function (k) { return ind_(S, k, SALG_START); };
  var kurs = '\'' + S + '\'!$R$2';
  var basis = 'LET(dato,' + v('A') + ',kober,' + v('C') + ',fragtud,' + v('F') + ',gebyr,' + v('G') + ',ordre,' + v('H') +
    ',fragtind,' + v('I') + ',refund,' + v('J') + ',skat,' + v('N') + ',erja,ARRAYFORMULA(skat="Ja"),';
  var lad = function (g) {
    return basis + gruppe_(['ordre'].concat(g)) + 'andel,ARRAYFORMULA(IFERROR(IF(ISNUMBER(ordre),ordre,0)/gordre,0)),';
  };
  sh.getRange('B4').setFormula('=' + kurs);
  sh.getRange('B7').setFormula('=SUM(' + v('K') + ')');
  var b8 = 'SUMPRODUCT(erja*IF(ISNUMBER(ordre),ordre,0))*' + kurs + '+SUMPRODUCT(erja*andel*gfragtind)*' + kurs;
  if (aar === '2026') b8 += '-SUMPRODUCT(erja*andel*grefund)*' + kurs;
  sh.getRange('B8').setFormula('=' + lad(aar === '2026' ? ['fragtind', 'refund'] : ['fragtind']) + 'ARRAYFORMULA(' + b8 + '))');
  sh.getRange('B10').setFormula('=SUMIF(' + v('N') + ',"Ja",' + v('E') + ')');
  sh.getRange('B11').setFormula('=' + lad(['gebyr']) + 'ARRAYFORMULA(SUMPRODUCT(erja*andel*ggebyr)*' + kurs + '))');
  sh.getRange('B13').setFormula('=' + lad(['fragtud']) + 'ARRAYFORMULA(SUMPRODUCT(erja*andel*gfragtud)))');
  sh.getRange('B14').setFormula('=\'' + U + '\'!$Q$3');
  sh.getRange('B17').setFormula('=' + basis + 'ARRAYFORMULA(SUMPRODUCT(IFERROR(erja/COUNTIFS(dato,dato,kober,kober,skat,"Ja"),0))))');
  sh.getRange('B18').setFormula('=B8-B10-B11-B13-B14');
}

function formlerDbSalgspriser_(sh, db) {
  var s25 = FANE.SALG25, s26 = FANE.SALG26;
  sh.getRange('A3').setFormula(
    '=IFERROR(LET(salgsku,VSTACK(' + ind_(s25, 'B', SALG_START) + ',' + ind_(s26, 'B', SALG_START) + '),' +
    'salgpris,VSTACK(' + ind_(s25, 'H', SALG_START) + ',' + ind_(s26, 'H', SALG_START) + '),' +
    'gyldig,ARRAYFORMULA((salgsku<>"")*ISNUMBER(salgpris)*(IF(ISNUMBER(salgpris),salgpris,0)>0)),' +
    'skuliste,FILTER(salgsku,gyldig=1),prisliste,FILTER(salgpris,gyldig=1),' +
    'nrliste,ARRAYFORMULA(IFERROR(REGEXEXTRACT(TO_TEXT(skuliste),"^[^-]*-([^-]+)"),TO_TEXT(skuliste))),' +
    'unikke,UNIQUE(nrliste),' +
    'temaer,ARRAYFORMULA(IFERROR(VLOOKUP(unikke,{ARRAYFORMULA(TO_TEXT(' + db.A + ')),' + db.C + '},2,FALSE),"")),' +
    'antal,MAP(unikke,LAMBDA(saet,SUM(ARRAYFORMULA(--(nrliste=saet))))),' +
    'snit,MAP(unikke,LAMBDA(saet,SUM(ARRAYFORMULA((nrliste=saet)*prisliste))/SUM(ARRAYFORMULA(--(nrliste=saet))))),' +
    'hoejest,MAP(unikke,LAMBDA(saet,MAX(FILTER(prisliste,nrliste=saet)))),' +
    'lavest,MAP(unikke,LAMBDA(saet,MIN(FILTER(prisliste,nrliste=saet)))),' +
    'visnr,ARRAYFORMULA(IFERROR(VALUE(unikke),unikke)),' +
    'SORT(HSTACK(visnr,temaer,snit,antal,hoejest,lavest),1,TRUE)),"")');
}

function formlerLager_(sh, db) {
  var I = FANE.INDKOEB;
  var v = function (k) { return ind_(I, k, 3); };
  sh.getRange('A3').setFormula('=IFERROR(LET(' +
    'skuer,' + v('A') + ',saetnr,' + v('C') + ',navne,' + v('D') + ',sorteret,' + v('I') + ',fotos,' + v('J') + ',klar,' + v('K') + ',' +
    'stand,' + v('L') + ',platform,' + v('M') + ',status,' + v('N') + ',noter,' + v('Q') + ',' +
    'temaer,ARRAYFORMULA(IFERROR(VLOOKUP(TO_TEXT(saetnr),{ARRAYFORMULA(TO_TEXT(' + db.A + ')),' + db.C + '},2,FALSE),"")),' +
    'undertemaer,ARRAYFORMULA(IFERROR(VLOOKUP(TO_TEXT(saetnr),{ARRAYFORMULA(TO_TEXT(' + db.A + ')),' + db.D + '},2,FALSE),"")),' +
    'vis,ARRAYFORMULA((sorteret=TRUE)*(fotos=TRUE)*(klar=TRUE)*(status="På lager")),' +
    'SORT(FILTER({skuer,stand,platform,saetnr,navne,temaer,undertemaer,noter},vis=1),4,TRUE)),"")');
}

function formlerEbay_(sh) {
  var E = FANE.EBAY, I = FANE.INDKOEB;
  var lad = 'LET(sku,' + ind_(E, 'A', 3) + ',indsku,' + ind_(I, 'A', 3) + ',indstatus,' + ind_(I, 'N', 3) + ',indnavn,' + ind_(I, 'D', 3) + ',';
  sh.getRange('C2').setFormula('=' + lad + '{"Match i Indkøb";ARRAYFORMULA(IF(sku="","",COUNTIF(indsku,sku)))})');
  sh.getRange('D2').setFormula('=' + lad + '{"Lagerstatus";ARRAYFORMULA(IF(sku="","",IFERROR(VLOOKUP(sku,{indsku,indstatus},2,FALSE),"—")))})');
  sh.getRange('E2').setFormula('=' + lad + '{"Navn i Indkøb";ARRAYFORMULA(IF(sku="","",IFERROR(VLOOKUP(sku,{indsku,indnavn},2,FALSE),"—")))})');
  sh.getRange('F2').setFormula('=LET(sku,' + ind_(E, 'A', 3) + ',antalmatch,' + ind_(E, 'C', 3) + ',status1,' + ind_(E, 'D', 3) + ',{"Vurdering";ARRAYFORMULA(IF(sku="","",' +
    'IF(antalmatch=0,"SKU findes ikke i Indkøb",IF(status1="Solgt","ADVARSEL: solgt – opslag bør fjernes",IF(status1="På lager","OK","Ikke klar til salg")))))})');
  sh.getRange('G2').setFormula('=LET(sku,' + ind_(E, 'A', 3) + ',{"Dublet";ARRAYFORMULA(IF(sku="","",IF(COUNTIF(sku,sku)>1,"Dublet i eBay-liste","")))})');
  sh.getRange('H2').setFormula('=LET(sku,' + ind_(E, 'A', 3) + ',{"Normaliseret SKU";ARRAYFORMULA(IF(sku="","",SUBSTITUTE(UPPER(sku),"-","")))})');
  var norm = 'normind,ARRAYFORMULA(SUBSTITUTE(UPPER(indsku),"-","")),normsku,' + ind_(E, 'H', 3) + ',';
  sh.getRange('I2').setFormula('=' + lad + norm + '{"Match (norm.)";ARRAYFORMULA(IF(sku="","",COUNTIF(normind,normsku)))})');
  sh.getRange('J2').setFormula('=' + lad + norm + '{"Lagerstatus (norm.)";ARRAYFORMULA(IF(sku="","",IFERROR(VLOOKUP(normsku,{normind,indstatus},2,FALSE),"—")))})');
  sh.getRange('K2').setFormula('=LET(sku,' + ind_(E, 'A', 3) + ',antalmatch,' + ind_(E, 'C', 3) + ',normmatch,' + ind_(E, 'I', 3) + ',status2,' + ind_(E, 'J', 3) + ',{"Vurdering (normaliseret)";ARRAYFORMULA(IF(sku="","",' +
    'IF(normmatch=0,"FEJL: SKU findes slet ikke",IF(antalmatch=0,IF(status2="Solgt","Skrivefejl + solgt","Skrivefejl i SKU (kun formatforskel)"),' +
    'IF(status2="Solgt","ADVARSEL: solgt – opslag bør fjernes",IF(status2="På lager","OK","Ikke klar til salg"))))))})');
  sh.getRange('N3').setFormula('=COUNTA(' + ind_(E, 'A', 3) + ')');
  sh.getRange('N4').setFormula('=COUNTUNIQUE(' + ind_(E, 'A', 3) + ')');
  sh.getRange('N5').setFormula('=COUNTIF(' + ind_(E, 'G', 3) + ',"Dublet*")');
  sh.getRange('N6').setFormula('=COUNTIF(' + ind_(E, 'K', 3) + ',"OK")');
  sh.getRange('N7').setFormula('=N3-N6');
}

// Skriver formlerne igen uden at røre data
function opdaterFormler() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  try { medEngelsk_(ss, function () { formlerAlle_(ss); }); }
  catch (e) { ui.alert('Formlerne blev ikke opdateret', String(e.message || e), ui.ButtonSet.OK); return; }
  ui.alert('Formler opdateret', 'Data er ikke ændret. Kør "Kør kontrol mod Excel" for at sammenligne. Version ' + VERSION, ui.ButtonSet.OK);
}

// ======================================================================
//  IMPORT FRA EXCEL (importfilen cts-import.json i CTS-mappen)
// ======================================================================

function laesImportfil_(ss) {
  var cts = mappeForRegneark_(ss);
  var it = cts.getFilesByName(IMPORTFIL);
  if (!it.hasNext()) throw new Error('Filen ' + IMPORTFIL + ' ligger ikke i mappen ' + cts.getName() + ' i Drive.');
  var data = JSON.parse(it.next().getBlob().getDataAsString('UTF-8'));
  if (!data.indkoeb || !data.facit) throw new Error('Importfilen ser forkert ud.');
  return data;
}

function importerFraExcel() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  var data;
  try { data = laesImportfil_(ss); } catch (e) { ui.alert('Import', e.message, ui.ButtonSet.OK); return; }
  if (!ss.getSheetByName(FANE.DB)) { ui.alert('Fanen DB mangler. Importen er stoppet, intet er ændret.'); return; }
  var svar = ui.prompt('Importér fra Excel',
    'Dette SLETTER alle faner i "' + ss.getName() + '" undtagen DB og bygger hele projektmappen forfra med data fra Excel ' +
    '(' + data.indkoeb.length + ' sæt, ' + data.indkoebslog.length + ' batches, ' + (data.salg2025.raekker.length + data.salg2026.raekker.length) + ' salg).\n\n' +
    'Skriv SLET ALT for at fortsætte:', ui.ButtonSet.OK_CANCEL);
  if (svar.getSelectedButton() !== ui.Button.OK || svar.getResponseText().trim().toUpperCase() !== 'SLET ALT') { ui.alert('Importen er annulleret. Intet er ændret.'); return; }

  try {
    medEngelsk_(ss, function () {
      byggAlt_(ss, data);
      skrivData_(ss, data);
    });
  } catch (e) {
    ui.alert('Importen stoppede', String(e.message || e) + '\n\nKør importen igen. Virker det ikke, så send et skærmbillede til Claude.', ui.ButtonSet.OK);
    return;
  }
  // Fotomapper: CTS/Lager (én mappe pr. købsdato)
  var cts = mappeForRegneark_(ss);
  var lager = underMappe_(cts, 'Lager');
  var p = PropertiesService.getScriptProperties();
  p.setProperty('ROD_MAPPE_ID', lager.getId());
  p.setProperty('TILSTAND', 'drift');
  p.setProperty('IMPORTERET', Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM-yyyy HH:mm'));
  hentNoegle_();
  SpreadsheetApp.flush();
  var res = kontrol_(ss, data);
  ui.alert('Import færdig',
    data.indkoeb.length + ' sæt og ' + (data.salg2025.raekker.length + data.salg2026.raekker.length) + ' salg er importeret.\n\n' +
    'Kontrol mod Excel: ' + res.ok + ' af ' + res.ialt + ' tal stemmer' + (res.afvig ? ', ' + res.afvig + ' afviger (se fanen Kontrol).' : ' ✓') +
    '\n\nFotos gemmes nu i: ' + stiTil_(lager), ui.ButtonSet.OK);
}

// Datoer skrives som tekst ÅÅÅÅ-MM-DD, så Sheets selv læser dem (ingen tidszone-forskydning)
function dato_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  return m ? m[1] + '-' + m[2] + '-' + m[3] : s;
}
// Tekst som "7236-2" eller "260906-7236-2" må ikke læses som dato/tal af Sheets
function tekst_(v) { return typeof v === 'string' && /^[\d\s\-\/.:,]+$/.test(v) && /[\-\/.:,\s]/.test(v) ? "'" + v : v; }
function vaerdi_(v) { return v && typeof v === 'object' && v.formel ? v.formel : (v === undefined || v === null ? '' : v); }

function skrivData_(ss, data) {
  // Indkøbslog
  var log = ss.getSheetByName(FANE.LOG);
  var lr = data.indkoebslog.map(function (r) { return [r[0], r[1], r[2] || 'Ja', r[3] || '']; });
  sikrRaekker_(log, START + lr.length + 50);
  if (lr.length) log.getRange(START, 1, lr.length, 4).setValues(lr);

  // Indkøb
  var ind = ss.getSheetByName(FANE.INDKOEB);
  var n = data.indkoeb.length;
  sikrRaekker_(ind, START + n + 200);
  var bc = [], e = [], gm = [], ov = [];
  data.indkoeb.forEach(function (r) {
    bc.push([r.dato, r.setnr === '' ? '' : tekst_(r.setnr)]);
    e.push([r.vaerdi === '' ? '' : r.vaerdi]);
    gm.push([r.salgFor, r.ovp, r.sorteret === true, r.fotos === true, r.klar === true, r.stand === '' ? '' : r.stand, r.platform]);
    //       O   P   Q noter  R kilde  S vejl.  T kompl. U fast    V foto-SKU
    ov.push(['', '', r.noter, r.kilde, false, false, r.fast === '' ? '' : r.fast, '']);
  });
  ind.getRange(START, K.DATO, n, 2).setValues(bc);
  ind.getRange(START, K.VAERDI, n, 1).setValues(e);
  ind.getRange(START, K.SALGFOR, n, 7).setValues(gm);
  ind.getRange(START, K.SALGSDATO, n, 8).setValues(ov);
  saetValidering_(ind, START, ind.getMaxRows() - START + 1);

  // Salg
  ['2025', '2026'].forEach(function (aar) {
    var sh = ss.getSheetByName(FANE['SALG' + aar.slice(2)]);
    var rk = data['salg' + aar].raekker;
    sikrRaekker_(sh, SALG_START + rk.length + 300);
    if (!rk.length) return;
    var g = function (r, k) { return vaerdi_(r[k]); };
    sh.getRange(SALG_START, 1, rk.length, 4).setValues(rk.map(function (r) { return [dato_(g(r, 'A')), tekst_(g(r, 'B')), g(r, 'C'), g(r, 'D')]; }));
    sh.getRange(SALG_START, 6, rk.length, 5).setValues(rk.map(function (r) { return [g(r, 'F'), g(r, 'G'), g(r, 'H'), g(r, 'I'), g(r, 'J')]; }));
    if (aar === '2025') sh.getRange(SALG_START, 14, rk.length, 1).setValues(rk.map(function (r) { return [g(r, 'N')]; }));
    sh.getRange(SALG_START, 15, rk.length, 2).setValues(rk.map(function (r) { return [g(r, 'O'), g(r, 'P')]; }));
  });

  // Udgifter
  ['2025', '2026'].forEach(function (aar) {
    var sh = ss.getSheetByName(FANE['UDG' + aar.slice(2)]);
    var rk = data['udgifter' + aar];
    if (!rk.length) return;
    var g = function (r, k) { return vaerdi_(r[k]); };
    sh.getRange(START, 1, rk.length, 3).setValues(rk.map(function (r) { return [g(r, 'A'), dato_(g(r, 'B')), String(g(r, 'C'))]; }));
    sh.getRange(START, 5, rk.length, 3).setValues(rk.map(function (r) { return [g(r, 'E'), g(r, 'F'), g(r, 'G')]; }));
    sh.getRange(START, 9, rk.length, 2).setValues(rk.map(function (r) { return [g(r, 'I'), g(r, 'J')]; }));
    sh.getRange(START, 12, rk.length, 1).setValues(rk.map(function (r) { return [g(r, 'L')]; }));
  });

  // eBay-afstemning
  var eb = ss.getSheetByName(FANE.EBAY);
  var er = data.ebay.raekker;
  sikrRaekker_(eb, START + er.length + 20);
  if (er.length) eb.getRange(START, 1, er.length, 2).setValues(er.map(function (r) { return [tekst_(r[0]), r[1]]; }));
  SpreadsheetApp.flush();
}

// ======================================================================
//  KONTROL MOD EXCEL
// ======================================================================

function koerKontrol() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  var data;
  try { data = laesImportfil_(ss); } catch (e) { ui.alert('Kontrol', e.message, ui.ButtonSet.OK); return; }
  var res = kontrol_(ss, data);
  ui.alert('Kontrol mod Excel', res.ok + ' af ' + res.ialt + ' tal stemmer' + (res.afvig ? '. ' + res.afvig + ' afviger – se fanen Kontrol.' : ' ✓'), ui.ButtonSet.OK);
}

function kontrol_(ss, data) {
  var F = data.facit, linjer = [], detaljer = [];
  var tal = function (x) { return x === '' || x === null || x === undefined ? '' : Number(x); };
  var ens = function (a, b, tol) {
    a = tal(a); b = tal(b);
    if (a === '' || b === '' || isNaN(a) || isNaN(b)) return String(a) === String(b) || (a === '' && (b === 0)) || (b === '' && a === 0);
    return Math.abs(a - b) <= (tol || 0.01);
  };
  var tjek = function (omraade, hvad, antal, fejl) {
    linjer.push([omraade, hvad, antal, antal - fejl.length, fejl.length, fejl.length ? '✗' : '✓']);
    fejl.slice(0, 40).forEach(function (f) { detaljer.push([omraade, hvad].concat(f)); });
  };

  // Indkøb (samme rækkefølge som Excel)
  var ind = ss.getSheetByName(FANE.INDKOEB);
  var n = F.indkoeb.length;
  var iv = ind.getRange(START, 1, n, K.LAGERSTATUS).getValues();
  var fSku = [], fPris = [], fStatus = [];
  F.indkoeb.forEach(function (f, i) {
    var r = iv[i];
    if (String(r[K.SKU - 1]) !== f[0]) fSku.push([f[0], String(r[K.SKU - 1]), 'række ' + (START + i)]);
    if (!ens(r[K.KOEBSPRIS - 1], f[1])) fPris.push([f[0], r[K.KOEBSPRIS - 1], f[1]]);
    if (String(r[K.LAGERSTATUS - 1]) !== String(f[2])) fStatus.push([f[0], r[K.LAGERSTATUS - 1], f[2]]);
  });
  tjek('Indkøb', 'SKU', n, fSku);
  tjek('Indkøb', 'Købspris', n, fPris);
  tjek('Indkøb', 'Lagerstatus', n, fStatus);

  // Indkøbslog
  var log = ss.getSheetByName(FANE.LOG);
  var lv = log.getRange(START, 1, F.indkoebslog.length, 8).getValues();
  var fLog = [];
  F.indkoebslog.forEach(function (f, i) {
    var r = lv[i];
    [[4, 1, 'Sæt i alt'], [5, 2, 'Solgt'], [6, 3, 'Klar']].forEach(function (k) { if (!ens(r[k[0]], f[k[1]], 0)) fLog.push([f[0] + ' ' + k[2], r[k[0]], f[k[1]]]); });
  });
  tjek('Indkøbslog', 'Antal pr. batch', F.indkoebslog.length * 3, fLog);

  // Salg
  ['2025', '2026'].forEach(function (aar) {
    var sh = ss.getSheetByName(FANE['SALG' + aar.slice(2)]);
    var fr = F['salg' + aar];
    if (!fr.length) return;
    var sv = sh.getRange(SALG_START, 1, fr.length, 14).getValues();
    var navne = ['Indkøbspris', 'Ordre Sum + Fragt', 'Fortjeneste sæt', 'Fortjeneste ordre', 'Skattepligtigt'];
    var kol = [5, 11, 12, 13, 14];
    navne.forEach(function (nv, j) {
      var fejl = [];
      fr.forEach(function (f, i) {
        var a = sv[i][kol[j] - 1], b = f[j + 1];
        var ok = j === 4 ? String(a) === String(b) : ens(a, b);
        if (!ok) fejl.push([String(sv[i][1]) + ' (række ' + (SALG_START + i) + ')', a, b]);
      });
      tjek('Salg ' + aar, nv, fr.length, fejl);
    });
  });

  // Udgifter
  ['2025', '2026'].forEach(function (aar) {
    var sh = ss.getSheetByName(FANE['UDG' + aar.slice(2)]);
    var fr = F['udgifter' + aar];
    if (!fr.length) return;
    var uv = sh.getRange(START, 1, fr.length, 11).getValues();
    var fejl = [];
    fr.forEach(function (f, i) {
      if (!ens(uv[i][7], f[1])) fejl.push([uv[i][0] + ' Beløb DKK', uv[i][7], f[1]]);
      if (!ens(uv[i][10], f[2])) fejl.push([uv[i][0] + ' Fradrag DKK', uv[i][10], f[2]]);
    });
    tjek('Udgifter ' + aar, 'Beløb og fradrag', fr.length * 2, fejl);
  });

  // Skat
  ['2025', '2026'].forEach(function (aar) {
    var sh = ss.getSheetByName(FANE['SKAT' + aar.slice(2)]);
    var fs = F['skat' + aar], fejl = [];
    Object.keys(fs).forEach(function (r) {
      var a = sh.getRange(Number(r), 2).getValue();
      if (!ens(a, fs[r])) fejl.push([sh.getRange(Number(r), 1).getValue() + ' (B' + r + ')', a, fs[r]]);
    });
    tjek('Skat ' + aar, 'Alle poster inkl. nettoavance', Object.keys(fs).length, fejl);
  });

  // DB Salgspriser
  var dbs = ss.getSheetByName(FANE.DBS);
  var dl = Math.max(1, dbs.getLastRow() - 2);
  var dv = dbs.getRange(3, 1, dl, 6).getValues(), map = {};
  dv.forEach(function (r) { if (r[0] !== '') map[String(r[0])] = r; });
  var fejlD = [];
  F.dbSalgspriser.forEach(function (f) {
    var r = map[f[0]];
    if (!r) { fejlD.push([f[0], 'mangler', '']); return; }
    if (!ens(r[2], f[1]) || !ens(r[3], f[2], 0) || !ens(r[4], f[3]) || !ens(r[5], f[4])) fejlD.push([f[0], [r[2], r[3], r[4], r[5]].join(' / '), f.slice(1).join(' / ')]);
  });
  tjek('DB Salgspriser', 'Gns./antal/højeste/laveste', F.dbSalgspriser.length, fejlD);

  // eBay-afstemning
  var eb = ss.getSheetByName(FANE.EBAY);
  var ev = eb.getRange(START, 1, F.ebay.length, 11).getValues(), fejlE = [];
  F.ebay.forEach(function (f, i) { if (String(ev[i][10]) !== String(f[1])) fejlE.push([f[0], ev[i][10], f[1]]); });
  tjek('eBay-afstemning', 'Vurdering', F.ebay.length, fejlE);

  // Skriv fanen Kontrol
  var gl = ss.getSheetByName(FANE.KONTROL); if (gl) ss.deleteSheet(gl);
  var sh = nyFane_(ss, FANE.KONTROL, 'KONTROL MOD EXCEL — ' + Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM-yyyy HH:mm'),
    ['Område', 'Tjek', 'Antal', 'Stemmer', 'Afviger', ''], 2);
  sh.getRange(3, 1, linjer.length, 6).setValues(linjer);
  var r0 = 3 + linjer.length + 2;
  sh.getRange(r0, 1, 1, 5).setValues([['AFVIGELSER (højst 40 pr. tjek)', '', 'Hvad', 'Sheets', 'Excel']]).setFontWeight('bold');
  if (detaljer.length) sh.getRange(r0 + 1, 1, detaljer.length, 5).setValues(detaljer);
  else sh.getRange(r0 + 1, 1).setValue('Ingen afvigelser ✓');
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 260); sh.setColumnWidths(4, 2, 150);
  var ok = 0, ialt = 0, afvig = 0;
  linjer.forEach(function (l) { ialt += l[2]; ok += l[3]; afvig += l[4]; });
  return { ok: ok, ialt: ialt, afvig: afvig };
}

// ======================================================================
//  SORTÉR GAMLE FOTOS  (CTS/Import-fotos → CTS/Lager/<købsdato>/<SKU>.NN.jpg)
// ======================================================================

function sorterFotos() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  var res;
  ss.toast('Sorteringen kører (højst 4 minutter pr. runde) …', 'Sortér gamle fotos', 10);
  try { res = sorterFotos_(); } catch (e) { ui.alert('Sortér gamle fotos', e.message, ui.ButtonSet.OK); return; }
  ss.toast(res.flyttet + ' flyttet · ' + res.solgte + ' solgte i papirkurv · ' + res.ikke + ' ikke matchet' +
    (res.mere ? ' · fortsætter automatisk om 1 minut' : ' · færdig ✓'), 'Sortér gamle fotos', 30);
  return;
  ui.alert('Sortér gamle fotos',
    res.flyttet + ' fotos flyttet til købsmapperne, ' + res.solgte + ' fotos af solgte sæt lagt i papirkurven, ' +
    res.ikke + ' kunne ikke matches (se fanen Foto-import og mappen "_Ikke matchet").' +
    (res.mere ? '\n\nDer er flere fotos. Sorteringen fortsætter automatisk om lidt – du kan lukke regnearket.' : '\n\nAlle fotos er gennemgået ✓'),
    ui.ButtonSet.OK);
}

function sorterFotosFortsaet() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sorterFotosFortsaet') ScriptApp.deleteTrigger(t); });
  sorterFotos_();
}

function sorterFotos_() {
  var start = Date.now();
  var ss = SpreadsheetApp.getActive();
  var cts = mappeForRegneark_(ss);
  var it = cts.getFoldersByName(FOTO_KILDE);
  if (!it.hasNext()) throw new Error('Mappen ' + FOTO_KILDE + ' findes ikke i ' + cts.getName() + '. Upload fotoene dertil først (se guiden).');
  var kilde = it.next();
  var ikkeMappe = underMappe_(kilde, '_Ikke matchet');
  var rod = rodMappe_();

  // SKU-opslag fra Indkøb
  var data = laesIndkoeb_();
  var eksakt = {}, norm = {}, raekkeFor = {};
  data.raekker.forEach(function (r) {
    var sku = String(r.v[K.SKU - 1]); if (!sku || /^#/.test(sku)) return;
    eksakt[sku.toUpperCase()] = sku;
    var nk = sku.toUpperCase().replace(/-/g, '');
    norm[nk] = norm[nk] === undefined ? sku : null; // null = tvetydig
    raekkeFor[sku] = r;
  });
  // Sætnummer uden variant/suffiks (7669-2 → 7669, 607-b → 607) → SKU'er
  var kerne = function (nr) { return String(nr).toUpperCase().replace(/-\d+$/, '').replace(/-?[A-Z]$/, ''); };
  var paaNr = {};
  data.raekker.forEach(function (r) {
    var sku = String(r.v[K.SKU - 1]), nr = String(r.v[K.SETNR - 1] || '');
    if (!nr || /^#/.test(sku)) return;
    (paaNr[kerne(nr)] = paaNr[kerne(nr)] || []).push(sku);
  });
  var findPaaNr = function (base) {
    var rest = base.indexOf('-') >= 0 ? base.slice(base.indexOf('-') + 1) : base;
    var l = paaNr[kerne(rest)];
    return l && l.length === 1 ? l[0] : null;
  };
  var find = function (base) {
    var b = base.toUpperCase();
    var kand = [b];
    if (/^00-/.test(b)) kand.push('250000-' + b.slice(3)); // gamle 00-sæt ligger i samlebatch 250000
    for (var i = 0; i < kand.length; i++) {
      if (eksakt[kand[i]]) return eksakt[kand[i]];
      var nk = kand[i].replace(/-/g, '');
      if (norm[nk]) return norm[nk];
    }
    return null;
  };

  var logFane = ss.getSheetByName(FANE.FOTOIMPORT) || nyFane_(ss, FANE.FOTOIMPORT, 'FOTO-IMPORT FRA ONEDRIVE', ['Tid', 'Original', 'Resultat', 'Ny placering'], 2);
  var logLinjer = [], mapper = {}, taelling = {}, fotoSku = {};
  var flyttet = 0, ikke = 0, solgte = 0, mere = false;

  var filer = [], iIkke = {};
  var saml = function (mappe, erIkke) {
    var f = mappe.getFiles(); while (f.hasNext()) { var x = f.next(); filer.push(x); if (erIkke) iIkke[x.getId()] = true; }
    var u = mappe.getFolders(); while (u.hasNext()) { var m = u.next(); saml(m, erIkke || m.getId() === ikkeMappe.getId()); }
  };
  saml(kilde, false);

  for (var i = 0; i < filer.length; i++) {
    if (Date.now() - start > 4 * 60 * 1000) { mere = true; break; }
    var fil = filer[i], navn = fil.getName();
    var m = /^(.+?)[-_ .](\d{1,3})\.(jpe?g|png|heic|heif|webp)$/i.exec(rensNavn_(navn));
    var sku = m ? find(m[1]) : null, note = '';
    if (m && !sku) { sku = findPaaNr(m[1]); if (sku) note = ' (matchet på sætnummer – filnavnet sagde ' + m[1] + ')'; }
    var tid = Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM HH:mm');
    if (!sku) {
      ikke++;
      if (!iIkke[fil.getId()]) {
        fil.moveTo(ikkeMappe);
        logLinjer.push([tid, navn, m ? 'Ingen entydig SKU i Indkøb for "' + m[1] + '"' : 'Navnet følger ikke mønstret <SKU>-NN', '_Ikke matchet']);
      }
      continue;
    }
    if (String(raekkeFor[sku].v[K.LAGERSTATUS - 1]) === 'Solgt') {
      fil.setTrashed(true); solgte++;
      logLinjer.push([tid, navn, 'Solgt – lagt i papirkurven' + note, sku]);
      continue;
    }
    var dato = String(raekkeFor[sku].v[K.DATO - 1]);
    var mappe = mapper[dato] || (mapper[dato] = batchMappe_(dato, true));
    var t = taelling[dato] || (taelling[dato] = fotoTaelling_(mappe));
    var ext = m[3].toLowerCase() === 'jpeg' ? 'jpg' : m[3].toLowerCase();
    var nr = Number(m[2]);
    var nyt = sku + '.' + pad2_(nr) + '.' + ext;
    if (t.navne[nyt.toUpperCase()]) { nr = (t.hoejeste[sku] || 0) + 1; nyt = sku + '.' + pad2_(nr) + '.' + ext; }
    fil.moveTo(mappe); fil.setName(nyt);
    t.navne[nyt.toUpperCase()] = true; t.antal[sku] = (t.antal[sku] || 0) + 1; t.hoejeste[sku] = Math.max(t.hoejeste[sku] || 0, nr);
    fotoSku[sku] = true; flyttet++;
    logLinjer.push([tid, navn, 'Flyttet' + note, dato + '/' + nyt]);
  }

  // Notér Foto-SKU og Fotos = sand for de matchede sæt
  Object.keys(fotoSku).forEach(function (sku) {
    var r = raekkeFor[sku];
    data.ark.getRange(r.raekke, K.FOTOSKU).setValue(sku);
    data.ark.getRange(r.raekke, K.FOTOS).setValue(true);
  });
  if (logLinjer.length) logFane.getRange(logFane.getLastRow() + 1, 1, logLinjer.length, 4).setValues(logLinjer);

  if (mere) ScriptApp.newTrigger('sorterFotosFortsaet').timeBased().after(60 * 1000).create();
  return { flyttet: flyttet, ikke: ikke, solgte: solgte, mere: mere };
}

function pad2_(n) { return n < 10 ? '0' + n : String(n); }

// ---------- Valgliste for fotos der ikke kunne matches ----------
var FANE_VALG = 'Ikke matchet';

// "251001 - 6044 - 01.jpeg" → "251001-6044-01.jpeg"
function rensNavn_(navn) { return String(navn).replace(/\s*-\s*/g, '-').replace(/\s+(?=\.)/g, '').trim(); }

function delNavn_(navn) {
  navn = rensNavn_(navn);
  var m = /^(.+?)[-_ .](\d{1,3})\.(jpe?g|png|heic|heif|webp)$/i.exec(navn);
  if (m) return { base: m[1], nr: Number(m[2]), ext: m[3].toLowerCase() === 'jpeg' ? 'jpg' : m[3].toLowerCase() };
  var x = /^(.+)\.(\w+)$/.exec(navn);
  return { base: x ? x[1] : navn, nr: 0, ext: x ? x[2].toLowerCase() : 'jpg' };
}

function ikkeMappe_() {
  var cts = mappeForRegneark_(SpreadsheetApp.getActive());
  var it = cts.getFoldersByName(FOTO_KILDE);
  if (!it.hasNext()) throw new Error('Mappen ' + FOTO_KILDE + ' findes ikke.');
  return underMappe_(it.next(), '_Ikke matchet');
}

function lavValgliste() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  var mappe = ikkeMappe_(), it = mappe.getFiles(), grupper = {};
  while (it.hasNext()) {
    var f = it.next(), d = delNavn_(f.getName());
    var g = grupper[d.base] || (grupper[d.base] = { antal: 0, eks: [] });
    g.antal++; if (g.eks.length < 3) g.eks.push(f.getName());
  }
  var data = laesIndkoeb_(), paaNr = {};
  var kerne = function (nr) { return String(nr).toUpperCase().replace(/-\d+$/, '').replace(/-?[A-Z]$/, ''); };
  data.raekker.forEach(function (r) {
    var sku = String(r.v[K.SKU - 1]), nr = String(r.v[K.SETNR - 1] || '');
    if (!nr || /^#/.test(sku)) return;
    var sort = /Sort:\s*(\w+)/i.exec(String(r.v[K.NOTER - 1] || ''));
    (paaNr[kerne(nr)] = paaNr[kerne(nr)] || []).push({ sku: sku, status: String(r.v[K.LAGERSTATUS - 1] || 'ikke klar'), sort: sort ? sort[1].toUpperCase() : '' });
  });
  // Fotos pr. SKU i alle købsmapper (til forslag: eksemplar uden fotos foretrækkes)
  var fotosPr = {}, rodIt = rodMappe_().getFolders();
  while (rodIt.hasNext()) { var t = fotoTaelling_(rodIt.next()); Object.keys(t.antal).forEach(function (k) { fotosPr[k] = (fotosPr[k] || 0) + t.antal[k]; }); }
  // Kendte omlabeleringer fra noterne
  var kendte = { '250919-6023': '250831-6023', '250919-6039': '250831-6039' };
  var kendtGrund = { '250919-6023': 'din note siger, at 250919-6023 fik ny label 250831-6023', '250919-6039': 'formodet samme omlabelering som 6023 – TJEK' };
  var logDatoer = {};
  (function () { var lg = ark_(FANE.LOG), n = lg.getLastRow() - START + 1; if (n > 0) lg.getRange(START, 1, n, 1).getValues().forEach(function (r) { logDatoer[String(r[0])] = true; }); })();
  var foreslaa = function (base, kand) { var res = foreslaa0(base, kand); return res; };
  var foreslaa0 = function (base, kand) {
    if (kendte[base] && kand.some(function (k) { return k.sku === kendte[base]; })) return [kendte[base], 'Forslag: ' + kendtGrund[base]];
    // Gammel sorteringsdato (fx 250526, 250113B), som ikke er et køb → samlebatch 250000
    var pre0 = base.split('-')[0].toUpperCase(), gammel = '';
    if (/^25\d{4}[A-Z]?$/.test(pre0) && !logDatoer[pre0]) {
      var i250 = kand.filter(function (k) { return k.sku.indexOf('250000-') === 0; });
      if (i250.length) { kand = i250; gammel = ' (gammel sorteringsdato ' + pre0 + ' → samlebatch 250000)'; }
    }
    var effBase = gammel ? '250000-' + base.slice(base.indexOf('-') + 1) : base;
    // Foto uden bogstav, men sættet har fået -a/-b: fotoet er fra før dubletten → første eksemplar = -a
    var medA = kand.filter(function (k) { return k.sku.toUpperCase() === effBase.toUpperCase() + '-A'; });
    var praecis = kand.filter(function (k) { return k.sku.toUpperCase() === effBase.toUpperCase(); });
    if (praecis.length === 1) return [praecis[0].sku, 'Forslag: samme sæt' + gammel + (praecis[0].status === 'Solgt' ? ' (solgt → papirkurv)' : '')];
    if (medA.length === 1) return [medA[0].sku, 'Forslag: fotoet er fra før dubletten – første eksemplar blev til -a' + gammel + (medA[0].status === 'Solgt' ? ' (solgt → papirkurv)' : '')];
    var prefix = base.split('-')[0];
    // Filnavnet starter med en gammel sorteringskode (fx 00 eller 250113B), som står i sættets note
    var medSort = kand.filter(function (k) { return k.sort && k.sort === prefix.toUpperCase(); });
    if (medSort.length === 1) return [medSort[0].sku, 'Forslag: noten siger Sort: ' + medSort[0].sort + gammel + (medSort[0].status === 'Solgt' ? ' (solgt → papirkurv)' : '')];
    if (medSort.length > 1) {
      var sortUden = medSort.filter(function (k) { return !fotosPr[k.sku] && k.status !== 'Solgt'; });
      if (sortUden.length === 1) return [sortUden[0].sku, 'Forslag: Sort: ' + prefix + ' og eneste uden fotos'];
      if (medSort.every(function (k) { return k.status === 'Solgt'; })) return ['Slet', 'Forslag: alle med Sort: ' + prefix + ' er solgt'];
      kand = medSort;
    }
    var samme = kand.filter(function (k) { return k.sku.split('-')[0] === prefix; });
    var pulje = samme.length ? samme : kand;
    var hvor = (samme.length ? 'i batch ' + prefix : 'blandt alle') + gammel;
    if (pulje.length === 1) return [pulje[0].sku, 'Forslag: eneste ' + hvor + (pulje[0].status === 'Solgt' ? ' (solgt → papirkurv)' : '')];
    var udenFoto = pulje.filter(function (k) { return !fotosPr[k.sku] && k.status !== 'Solgt'; });
    if (udenFoto.length === 1) return [udenFoto[0].sku, 'Forslag: eneste ' + hvor + ' uden fotos og ikke solgt'];
    if (pulje.length && pulje.every(function (k) { return k.status === 'Solgt'; })) return ['Slet', 'Forslag: alle mulige sæt ' + hvor + ' er solgt'];
    return ['', 'Vælg selv (' + pulje.length + ' muligheder ' + hvor + ')'];
  };
  var baser = Object.keys(grupper).sort();
  var gl = ss.getSheetByName(FANE_VALG); if (gl) ss.deleteSheet(gl);
  var sh = nyFane_(ss, FANE_VALG, 'FOTOS DER IKKE KUNNE MATCHES – vælg SKU i kolonne D og kør CTS → Flyt valgte fotos',
    ['Filnavn starter med', 'Antal fotos', 'Mulige SKU\'er i Indkøb (status)', 'Dit valg', 'Resultat', 'Eksempler'], 2);
  if (!baser.length) { ui.alert('Der ligger ingen fotos i _Ikke matchet ✓'); return; }
  var rows = [], valg = [];
  baser.forEach(function (b) {
    var rest = b.indexOf('-') >= 0 ? b.slice(b.indexOf('-') + 1) : b;
    var kand = (paaNr[kerne(rest)] || []).filter(function (k) { return k.sku !== b; });
    var forslag = kand.length ? foreslaa(b, kand) : ['', 'Intet sæt med det nummer – vælg Slet eller skriv SKU'];
    rows.push([b, grupper[b].antal, kand.map(function (k) { return k.sku + ' (' + k.status + (fotosPr[k.sku] ? ', ' + fotosPr[k.sku] + ' fotos' : ', ingen fotos') + ')'; }).join(', ') || '– intet sæt med det nummer –', forslag[0], forslag[1], grupper[b].eks.join(', ')]);
    valg.push(kand.map(function (k) { return k.sku; }).concat(['Slet', 'Spring over']));
  });
  sh.getRange(3, 1, rows.length, 6).setValues(rows);
  valg.forEach(function (v, i) {
    sh.getRange(3 + i, 4).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(v.slice(0, 500), true).setAllowInvalid(true).build());
  });
  sh.setColumnWidth(1, 170); sh.setColumnWidth(3, 420); sh.setColumnWidth(4, 170); sh.setColumnWidth(5, 220); sh.setColumnWidth(6, 360);
  sh.getRange('D3:D').setBackground('#fff8dc');
  ss.setActiveSheet(sh);
  var medForslag = rows.filter(function (r) { return r[3]; }).length;
  ui.alert('Valgliste', baser.length + ' sæt (' + rows.reduce(function (a, r) { return a + r[1]; }, 0) + ' fotos).\n' +
    medForslag + ' har fået et forslag i kolonne D, ' + (baser.length - medForslag) + ' skal du vælge selv.\n\n' +
    'Gennemse kolonne D og ret det, der er forkert: et SKU, "Slet" eller "Spring over".\n' +
    'Intet flyttes, før du kører CTS → Flyt valgte fotos.', ui.ButtonSet.OK);
}

function flytValgte() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive(), start = Date.now();
  var sh = ss.getSheetByName(FANE_VALG);
  if (!sh) { ui.alert('Kør først CTS → Lav valgliste for ikke-matchede fotos.'); return; }
  var n = sh.getLastRow() - 2; if (n < 1) return;
  var v = sh.getRange(3, 1, n, 5).getValues();
  var data = laesIndkoeb_(), raekkeFor = {};
  data.raekker.forEach(function (r) { raekkeFor[String(r.v[K.SKU - 1])] = r; });
  // Filer i _Ikke matchet grupperet efter navnets start
  var filer = {}, it = ikkeMappe_().getFiles();
  while (it.hasNext()) { var f = it.next(), d = delNavn_(f.getName()); (filer[d.base] = filer[d.base] || []).push({ fil: f, d: d }); }
  var mapper = {}, taelling = {}, flyttet = 0, slettet = 0, fejl = 0, mere = false, log = [];
  var tid = Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM HH:mm');
  for (var i = 0; i < v.length; i++) {
    if (Date.now() - start > 4 * 60 * 1000) { mere = true; break; }
    var base = String(v[i][0]), valg = String(v[i][3]).trim(), res = String(v[i][4]);
    if (!valg || valg === 'Spring over' || /^Færdig/.test(res)) continue;
    var liste = filer[base] || [];
    if (valg === 'Slet') {
      liste.forEach(function (x) { x.fil.setTrashed(true); log.push([tid, x.fil.getName(), 'Valgt: slet – lagt i papirkurven', '']); });
      slettet += liste.length;
      sh.getRange(3 + i, 5).setValue('Færdig: ' + liste.length + ' lagt i papirkurven');
      continue;
    }
    var r = raekkeFor[valg];
    if (!r) { sh.getRange(3 + i, 5).setValue('FEJL: SKU ' + valg + ' findes ikke i Indkøb'); fejl++; continue; }
    if (String(r.v[K.LAGERSTATUS - 1]) === 'Solgt') {
      liste.forEach(function (x) { x.fil.setTrashed(true); log.push([tid, x.fil.getName(), 'Valgt ' + valg + ' (solgt) – lagt i papirkurven', '']); });
      slettet += liste.length;
      sh.getRange(3 + i, 5).setValue('Færdig: ' + valg + ' er solgt – ' + liste.length + ' lagt i papirkurven');
      continue;
    }
    var dato = String(r.v[K.DATO - 1]);
    var mappe = mapper[dato] || (mapper[dato] = batchMappe_(dato, true));
    var t = taelling[dato] || (taelling[dato] = fotoTaelling_(mappe));
    liste.sort(function (a, b) { return a.d.nr - b.d.nr; }).forEach(function (x) {
      var nr = x.d.nr || ((t.hoejeste[valg] || 0) + 1);
      var nyt = valg + '.' + pad2_(nr) + '.' + x.d.ext;
      if (t.navne[nyt.toUpperCase()]) { nr = (t.hoejeste[valg] || 0) + 1; nyt = valg + '.' + pad2_(nr) + '.' + x.d.ext; }
      x.fil.moveTo(mappe); x.fil.setName(nyt);
      t.navne[nyt.toUpperCase()] = true; t.hoejeste[valg] = Math.max(t.hoejeste[valg] || 0, nr);
      log.push([tid, x.fil.getName(), 'Valgt ' + valg + ' – flyttet', dato + '/' + nyt]);
    });
    flyttet += liste.length;
    data.ark.getRange(r.raekke, K.FOTOSKU).setValue(valg);
    data.ark.getRange(r.raekke, K.FOTOS).setValue(true);
    sh.getRange(3 + i, 5).setValue('Færdig: ' + liste.length + ' flyttet til ' + dato);
  }
  if (log.length) {
    var lf = ss.getSheetByName(FANE.FOTOIMPORT) || nyFane_(ss, FANE.FOTOIMPORT, 'FOTO-IMPORT FRA ONEDRIVE', ['Tid', 'Original', 'Resultat', 'Ny placering'], 2);
    lf.getRange(lf.getLastRow() + 1, 1, log.length, 4).setValues(log);
  }
  ui.alert('Flyt valgte fotos', flyttet + ' flyttet, ' + slettet + ' lagt i papirkurven' + (fejl ? ', ' + fejl + ' rækker med fejl (se kolonne E)' : '') +
    (mere ? '.\n\nIkke alle nåede med – kør CTS → Flyt valgte fotos igen.' : '.'), ui.ButtonSet.OK);
}

// Lægger fotos af solgte sæt i papirkurven (kan fortrydes i 30 dage)
function fjernSolgteFotos() {
  var ui = SpreadsheetApp.getUi();
  var svar = ui.alert('Fjern fotos af solgte sæt',
    'Alle fotos i CTS/Lager af sæt med Lagerstatus = Solgt lægges i papirkurven i Drive (kan fortrydes i 30 dage). Fortsæt?', ui.ButtonSet.YES_NO);
  if (svar !== ui.Button.YES) return;
  var data = laesIndkoeb_(), solgt = {};
  data.raekker.forEach(function (r) { if (String(r.v[K.LAGERSTATUS - 1]) === 'Solgt') solgt[String(r.v[K.SKU - 1])] = true; });
  var rod = rodMappe_(), mapper = rod.getFolders(), antal = 0, linjer = [];
  var tid = Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM HH:mm');
  while (mapper.hasNext()) {
    var filer = mapper.next().getFiles();
    while (filer.hasNext()) {
      var f = filer.next(), m = /^(.+)\.(\d{2,})\.(jpe?g|png|heic|heif|webp)$/i.exec(f.getName());
      if (m && solgt[m[1]]) { linjer.push([tid, f.getName(), 'Solgt – lagt i papirkurven', m[1]]); f.setTrashed(true); antal++; }
    }
  }
  if (linjer.length) {
    var ss = SpreadsheetApp.getActive();
    var lf = ss.getSheetByName(FANE.FOTOIMPORT) || nyFane_(ss, FANE.FOTOIMPORT, 'FOTO-IMPORT FRA ONEDRIVE', ['Tid', 'Original', 'Resultat', 'Ny placering'], 2);
    lf.getRange(lf.getLastRow() + 1, 1, linjer.length, 4).setValues(linjer);
  }
  ui.alert('Fjern fotos af solgte sæt', antal + ' fotos af solgte sæt er lagt i papirkurven.', ui.ButtonSet.OK);
}

// ======================================================================
//  API (kaldes fra appen)
// ======================================================================

function doGet() { return ContentService.createTextOutput('CTS maskinrum kører (version ' + VERSION + ').'); }

function doPost(e) {
  var svar;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var noegle = PropertiesService.getScriptProperties().getProperty('API_NOEGLE');
    if (!noegle || body.noegle !== noegle) throw fejl_('Forkert eller manglende nøgle.');
    var h = HANDLINGER[body.handling];
    if (!h) throw fejl_('Ukendt handling: ' + body.handling);
    svar = { ok: true, data: h(body.data || {}) };
  } catch (err) {
    svar = { ok: false, fejl: (err && err.message) || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(svar)).setMimeType(ContentService.MimeType.JSON);
}

function fejl_(t) { return new Error(t); }

var HANDLINGER = {
  ping: function () {
    var p = PropertiesService.getScriptProperties();
    return { version: VERSION, ark: SpreadsheetApp.getActive().getName(), tilstand: p.getProperty('TILSTAND') || '' };
  },
  slaaOp: function (d) { return slaaOp_(String(d.setnr || '').trim()); },
  opretBatch: function (d) { return medLaas_(function () { return opretBatch_(d); }); },
  hentBatch: function (d) { return hentBatch_(String(d.dato)); },
  gemKlargoering: function (d) { return medLaas_(function () { return gemKlargoering_(d); }); },
  uploadFoto: function (d) { return medLaas_(function () { return uploadFoto_(d); }); },
  hentLager: function () { return hentLager_(); },
  hentAlt: function () { return hentAlt_(); },
  registrerSalg: function (d) { return medLaas_(function () { return registrerSalg_(d); }); },
  tilfoejSaet: function (d) { return medLaas_(function () { return tilfoejSaet_(d); }); },
  retSaet: function (d) { return medLaas_(function () { return retSaet_(d); }); },
  fjernSaet: function (d) { return medLaas_(function () { return fjernSaet_(d); }); },
  saetListet: function (d) { return medLaas_(function () { return saetListet_(d); }); },
  lavListings: function (d) { return medLaas_(function () { return lavListings_(d); }); },
  tilfoejDb: function (d) { return medLaas_(function () { return tilfoejDb_(d); }); }
};

// ======================================================================
//  RET KØB: tilføj, ret og fjern sæt. Et køb er åbent, indtil alle sæt er klargjort eller solgt.
//  Batch 250000 (eget/familiens LEGO) er altid åben, og værdi er ikke påkrævet.
// ======================================================================

var PRIVAT_BATCH = '250000';

function batchRaekker_(data, dato) {
  return data.raekker.filter(function (r) { return String(r.v[K.DATO - 1]) === String(dato); });
}
function batchStatus_(rk, dato) {
  var mangler = rk.filter(function (r) { return r.v[K.KLAR - 1] !== true && String(r.v[K.LAGERSTATUS - 1]) !== 'Solgt'; }).length;
  return { aaben: String(dato) === PRIVAT_BATCH || mangler > 0 || rk.length === 0, mangler: mangler, ialt: rk.length, privat: String(dato) === PRIVAT_BATCH };
}
function tjekSaetData_(s, dato, i) {
  if (!String(s.setnr || '').trim()) throw fejl_('Sæt ' + (i + 1) + ' mangler sætnummer.');
  if (String(dato) === PRIVAT_BATCH) return;
  if (!(Number(s.vaerdi) > 0)) throw fejl_('Sæt ' + s.setnr + ' mangler værdi.');
  if (KILDER.indexOf(s.kilde) < 0) throw fejl_('Sæt ' + s.setnr + ' har ukendt kilde.');
}

function tilfoejSaet_(d) {
  var dato = String(d.dato || ''), saet = d.saet || [];
  if (!saet.length) throw fejl_('Ingen sæt at tilføje.');
  var log = ark_(FANE.LOG), findes = false;
  if (log.getLastRow() >= START) log.getRange(START, 1, log.getLastRow() - START + 1, 1).getValues().forEach(function (r) { if (String(r[0]) === dato) findes = true; });
  if (!findes) throw fejl_('Købet ' + dato + ' findes ikke i Indkøbslog.');
  saet.forEach(function (s, i) { tjekSaetData_(s, dato, i); });
  var data = laesIndkoeb_(), rk = batchRaekker_(data, dato), st = batchStatus_(rk, dato);
  if (!st.aaben && d.genaabn !== true) throw fejl_('LUKKET: Købet ' + dato + ' er lukket, fordi alle sæt er klargjort eller solgt.');
  var ind = data.ark, n = saet.length;
  // Nye sæt sættes ind EFTER købets sidste række, så det første eksemplar af et sæt forbliver -a
  var efter = rk.length ? Math.max.apply(null, rk.map(function (r) { return r.raekke; })) : START - 1;
  if (efter < START) ind.insertRowsBefore(START, n); else ind.insertRowsAfter(efter, n);
  var fra = efter < START ? START : efter + 1;
  ind.getRange(fra, 1, n, INDKOEB_KOLONNER).setBackground(null).setFontColor(null).setFontWeight('normal').setHorizontalAlignment(null).setWrap(false);
  var bc = [], e = [], gm = [], ov = [];
  saet.forEach(function (s) {
    var nr = String(s.setnr).trim();
    bc.push([Number(dato), /^\d+$/.test(nr) ? Number(nr) : tekst_(nr)]);
    e.push([Number(s.vaerdi) > 0 ? Number(s.vaerdi) : '']);
    gm.push(['', s.ovp ? 'Ja' : 'Nej', false, false, false, '', '']);
    ov.push(['', '', '', KILDER.indexOf(s.kilde) >= 0 ? s.kilde : '', false, false, '', '']);
  });
  ind.getRange(fra, K.DATO, n, 2).setValues(bc);
  ind.getRange(fra, K.VAERDI, n, 1).setValues(e);
  ind.getRange(fra, K.SALGFOR, n, 7).setValues(gm);
  ind.getRange(fra, K.SALGSDATO, n, 8).setValues(ov);
  ind.getRange(fra, K.LISTET, n, 1).setValue(false);
  saetValidering_(ind, fra, n);
  ind.getRange(fra, K.DATO, n, 2).setNumberFormat('0');
  ind.getRange(fra, K.VAERDI, n, 1).setNumberFormat('[$€]#,##0.00');
  SpreadsheetApp.flush();
  sorterKoeb_(dato);
  synkFotonavne_(dato);
  return hentBatch_(dato);
}

function retSaet_(d) {
  var f = findRaekke_(String(d.sku || ''));
  if (String(f.r.v[K.LAGERSTATUS - 1]) === 'Solgt') throw fejl_('Sættet er solgt og kan ikke rettes.');
  var dato = String(f.r.v[K.DATO - 1]), ark = f.ark, rk = f.r.raekke;
  tjekSaetData_({ setnr: d.setnr, vaerdi: d.vaerdi, kilde: d.kilde }, dato, 0);
  var nr = String(d.setnr).trim();
  ark.getRange(rk, K.SETNR).setValue(/^\d+$/.test(nr) ? Number(nr) : tekst_(nr));
  ark.getRange(rk, K.OVP).setValue(d.ovp ? 'Ja' : 'Nej');
  ark.getRange(rk, K.VAERDI).setValue(Number(d.vaerdi) > 0 ? Number(d.vaerdi) : '');
  ark.getRange(rk, K.KILDE).setValue(KILDER.indexOf(d.kilde) >= 0 ? d.kilde : '');
  SpreadsheetApp.flush();
  sorterKoeb_(dato);
  synkFotonavne_(dato);
  return hentBatch_(dato);
}

function fjernSaet_(d) {
  var f = findRaekke_(String(d.sku || ''));
  if (String(f.r.v[K.LAGERSTATUS - 1]) === 'Solgt') throw fejl_('Sættet er solgt og kan ikke fjernes.');
  var dato = String(f.r.v[K.DATO - 1]);
  f.ark.deleteRow(f.r.raekke);
  SpreadsheetApp.flush();
  synkFotonavne_(dato);
  return hentBatch_(dato);
}

// ---------- Nummerorden: sættene i et køb står efter sætnummer ----------
// Hele rækker flyttes (moveRows), så noter, flueben og formater følger med. Ens sæt beholder
// deres indbyrdes rækkefølge, så -a/-b og fotonavne ikke skifter.
function saetNoegle_(nr) {
  var t = String(nr == null ? '' : nr).trim(), m = t.match(/^(\d+)(.*)$/);
  return m ? [0, Number(m[1]), m[2]] : [t === '' ? 2 : 1, 0, t];
}
function sammenlignSaet_(a, b) {
  for (var i = 0; i < 2; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0;
}
// Returnerer antal flyttede rækker, eller -1 hvis købets rækker ikke ligger samlet
function sorterKoeb_(dato, data) {
  data = data || laesIndkoeb_();
  var rk = batchRaekker_(data, dato), n = rk.length;
  if (n < 2) return 0;
  var start = rk[0].raekke;
  for (var i = 1; i < n; i++) if (rk[i].raekke !== start + i) return -1;
  var orden = rk.map(function (r, j) { return { j: j, k: saetNoegle_(r.v[K.SETNR - 1]) }; });
  orden.sort(function (a, b) { return sammenlignSaet_(a.k, b.k) || a.j - b.j; });
  var nu = rk.map(function (r, j) { return j; }), flyttet = 0, sh = data.ark;
  for (var t = 0; t < n; t++) {
    var p = nu.indexOf(orden[t].j);
    if (p === t) continue;
    sh.moveRows(sh.getRange(start + p, 1), start + t);
    nu.splice(p, 1); nu.splice(t, 0, orden[t].j);
    flyttet++;
  }
  if (flyttet) SpreadsheetApp.flush();
  return flyttet;
}
function sorterAlleKoeb() {
  var ui = SpreadsheetApp.getUi(), t0 = Date.now();
  var data = laesIndkoeb_(), set = {}, datoer = [];
  data.raekker.forEach(function (r) { var d = String(r.v[K.DATO - 1]); if (!set[d]) { set[d] = 1; datoer.push(d); } });
  var sorteret = [], spredt = [], ialt = 0;
  for (var i = 0; i < datoer.length; i++) {
    if (Date.now() - t0 > 240000) { ui.alert('Sortér køb', 'Tiden løb ud efter ' + i + ' af ' + datoer.length + ' køb. Kør menupunktet igen for at fortsætte.', ui.ButtonSet.OK); return; }
    var f = sorterKoeb_(datoer[i], data);
    if (f < 0) spredt.push(datoer[i]);
    else if (f > 0) { sorteret.push(datoer[i]); ialt += f; }
  }
  ui.alert('Sortér køb', 'Færdig. ' + datoer.length + ' køb tjekket.\n\n' +
    (sorteret.length ? 'Sorteret: ' + sorteret.join(', ') + ' (' + ialt + ' rækker flyttet).' : 'Alle køb stod allerede i nummerorden.') +
    (spredt.length ? '\n\nIkke sorteret, fordi rækkerne ikke ligger samlet: ' + spredt.join(', ') : ''), ui.ButtonSet.OK);
}

function saetListet_(d) {
  var f = findRaekke_(String(d.sku || ''));
  f.ark.getRange(f.r.raekke, K.LISTET).setValue(d.listet === true);
  SpreadsheetApp.flush();
  return tilSaet_(findRaekke_(String(d.sku)).r);
}

// ======================================================================
//  LISTINGS: én Google Doc pr. køb med alle klare, usolgte og ikke-listede sæt
// ======================================================================

var STAND_DE = { 10: 'neuwertig', 9: 'sehr gut', 8: 'sehr guter gebrauchter Zustand', 7: 'guter, altersgerechter Zustand',
  6: 'gebrauchter Zustand mit leichten Spuren', 5: 'deutliche Gebrauchsspuren' };
var STAND_EN = { 10: 'like new', 9: 'very good', 8: 'very good used condition', 7: 'good condition for its age',
  6: 'used condition with light wear', 5: 'clear signs of use' };
// Flag som tegnkoder, så de ikke ødelægges ved kopiering af koden
var FLAG_DE = '\uD83C\uDDE9\uD83C\uDDEA', FLAG_EN = '\uD83C\uDDEC\uD83C\uDDE7';

// Kort standbetegnelse til standbeskrivelsen (uden tal)
function standNavn_(stand) {
  var n = Number(stand) || 0;
  if (!n) return null;
  if (n >= 10) return ['Neuwertig', 'Like new'];
  if (n >= 8) return ['Sehr gut (SG)', 'Very good (SG)'];
  if (n >= 6) return ['Gut (G)', 'Good (G)'];
  if (n >= 4) return ['Akzeptabel', 'Acceptable'];
  return ['Stark gebraucht', 'Heavily used'];
}

var TEKST = {
  introDE: 'Schauen Sie sich auch meine anderen LEGO-Angebote an und lassen Sie mich wissen, falls Sie etwas Bestimmtes suchen! – nach dem ersten Kauf ist der Versand für weitere Sets kostenlos.',
  introEN: "Check out my other LEGO listings and let me know if you're looking for something specific! – free shipping on additional sets after your first purchase.",
  fragtDE: 'Versand per Sparversand über CoolRunner, in Zusammenarbeit mit Homerunner und Bring. Die Pakete werden in Dänemark gesammelt und ein- bis zweimal pro Woche von DHL und anderen Partnerspeditionen abgeholt und in Europa verteilt – die Sendungsverfolgung aktualisiert sich erst, sobald der finale Zusteller das Paket registriert hat, was in der Regel etwa eine Woche dauert.',
  fragtEN: 'Standard economy shipping (Sparversand) via CoolRunner, working with Homerunner and Bring. Parcels are collected in Denmark and picked up once or twice a week by DHL and other partner carriers for distribution across Europe — tracking only updates once the final carrier registers the parcel, which usually takes about a week.'
};

// Fjerner sorteringskoder og [interne bemærkninger] fra noter
// Deler noten i æskens stand ("Æske: …") og resten
function delNote_(note) {
  var tekst = rensNote_(note), aeske = '';
  tekst = tekst.replace(/(?:Æske|Aeske|Kasse|Karton|Box)\s*:\s*([^.;]*)[.;]?/i, function (_, x) { aeske = x.trim(); return ''; });
  return { aeske: aeske, rest: tekst.replace(/^[\s.;,–-]+|[\s;,–-]+$/g, '').replace(/\s{2,}/g, ' ').trim() };
}

function rensNote_(note) {
  return String(note || '').replace(/Sort:\s*[\w-]+[.;,]?/gi, '').replace(/\[[^\]]*\]/g, '').replace(/^[\s.;,–-]+|[\s;,–-]+$/g, '').replace(/\s{2,}/g, ' ').trim();
}

// Ren tekstgenerator (ingen Google-kald) – i: {setnr, navn, tema, undertema, aar, ovp, komplet, vejledning, stand, noteDE, noteEN, aarNu}
function listingTekst_(i) {
  var nr = String(i.setnr).replace(/-\d+$/, '');
  var aar = String(i.aar || ''), under = String(i.undertema || '');
  if (!/^\d{4}$/.test(aar) && /^\d{4}$/.test(under)) { aar = under; under = ''; } // kendt DB-fejl: år i undertema-kolonnen
  var tema = String(i.tema || '');
  var vintage = /^\d{4}$/.test(aar) && (Number(i.aarNu) - Number(aar)) >= 20;
  var kerne = function (medTema) { return ['LEGO', medTema ? tema : '', nr, i.navn, aar ? '(' + aar + ')' : ''].filter(Boolean).join(' '); };
  var ekstra = [i.ovp ? 'OVP' : '', i.komplet ? 'komplett' : ''].filter(Boolean).join(' ');
  var titel = [kerne(true), vintage ? 'Vintage' : '', ekstra].filter(Boolean).join(' ');
  if (titel.length > 80) titel = [kerne(true), ekstra].filter(Boolean).join(' ');
  if (titel.length > 80) titel = [kerne(false), ekstra].filter(Boolean).join(' ');
  if (titel.length > 80) titel = titel.slice(0, 80).trim();
  var stand = Number(i.stand) || 0;
  var vDE = stand ? (STAND_DE[stand] || 'starke Gebrauchsspuren') : '', vEN = stand ? (STAND_EN[stand] || 'heavy signs of use') : '';
  // Kun det positive skrives: komplett, OVP og Anleitung står der kun, når det er sandt. Mangler kommer fra noterne.
  var ovpDE = i.ovp ? 'Original-Verpackung (OVP) vorhanden' + (i.aeskeDE ? ' (' + i.aeskeDE + ')' : '') : '';
  var ovpEN = i.ovp ? 'Original box (OVP) included' + (i.aeskeEN ? ' (' + i.aeskeEN + ')' : '') : '';
  var sn = standNavn_(stand);
  var zDE = [sn ? sn[0] + ', siehe Fotos und Beschreibung.' : 'Siehe Fotos und Beschreibung.', i.komplet ? 'Komplett.' : '', ovpDE ? ovpDE + '.' : '',
    i.vejledning ? 'Anleitung vorhanden.' : '', i.noteDE ? 'Hinweis: ' + i.noteDE : ''].filter(Boolean).join(' ');
  var zEN = [sn ? sn[1] + ', see photos and description.' : 'See photos and description.', i.komplet ? 'Complete.' : '', ovpEN ? ovpEN + '.' : '',
    i.vejledning ? 'Building instructions included.' : '', i.noteEN ? 'Note: ' + i.noteEN : ''].filter(Boolean).join(' ');
  var zustand = FLAG_DE + ' ' + zDE + '\n\n' + FLAG_EN + ' ' + zEN;
  var serieDE = tema ? '* Aus der ' + tema + '-Reihe' + (under ? ' (' + under + ')' : '') + (aar ? ', ' + aar : '') : (aar ? '* Erscheinungsjahr ' + aar : '');
  var serieEN = tema ? '* From the ' + tema + ' line' + (under ? ' (' + under + ')' : '') + (aar ? ', ' + aar : '') : (aar ? '* Released ' + aar : '');
  var navnLinje = ['LEGO', tema, nr, i.navn].filter(Boolean).join(' ');
  // null = linjen udelades; '' = bevidst tom linje
  var de = ['>>> English description below <<<', '', TEKST.introDE, '', navnLinje, '', serieDE || null, i.komplet ? '* Komplett' : null, ovpDE ? '* ' + ovpDE : null, i.vejledning ? '* Anleitung vorhanden' : null, stand ? '* Zustand: ' + stand + '/10 – ' + vDE : null, i.noteDE ? '* Hinweis: ' + i.noteDE : null, '* ' + TEKST.fragtDE];
  var en = [TEKST.introEN, '', navnLinje, '', serieEN || null, i.komplet ? '* Complete' : null, ovpEN ? '* ' + ovpEN : null, i.vejledning ? '* Building instructions included' : null, stand ? '* Condition: ' + stand + '/10 — ' + vEN : null, i.noteEN ? '* Note: ' + i.noteEN : null, '* ' + TEKST.fragtEN];
  var rens = function (l) { return l.filter(function (x) { return x !== null; }); };
  return { titel: titel, zustand: zustand, beskrivelse: rens(de).join('\n') + '\n\n---\n\n' + rens(en).join('\n'), navnLinje: navnLinje };
}

function dbOpslag_() {
  var db = ark_(FANE.DB);
  var start = Number(PropertiesService.getScriptProperties().getProperty('DB_START')) || findDbStart_(db) || 3;
  var n = db.getLastRow() - start + 1, map = {};
  if (n > 0) db.getRange(start, 1, n, 5).getDisplayValues().forEach(function (r) { if (r[0] !== '' && !map[r[0]]) map[r[0]] = r; });
  return function (nr) { nr = String(nr); return map[nr] || map[nr + '-1'] || map[nr.replace(/-\d+$/, '')] || null; };
}

function oversaet_(tekst, sprog, cache) {
  if (!tekst) return '';
  var k = sprog + '|' + tekst;
  if (cache[k] === undefined) { try { cache[k] = LanguageApp.translate(tekst, '', sprog); } catch (e) { cache[k] = tekst; } cache[k] = ordliste_(cache[k], sprog); }
  return cache[k];
}

// Faste LEGO-ord efter oversættelse (Google oversætter fx "klodser" til "blocks"/"Blöcke")
var ORDLISTE = {
  en: [[/\b(?:instruction )?manuals?\b/gi, 'building instructions'], [/\binstructions? booklets?\b/gi, 'building instructions'],
    [/\bblocks\b/gi, 'bricks'], [/\bblock\b/gi, 'brick'], [/\bcubes\b/gi, 'bricks'], [/\blabels\b/gi, 'stickers'],
    [/\bmini ?figures?\b/gi, function (m) { return /s$/i.test(m) ? 'minifigures' : 'minifigure'; }],
    [/\bOVP vorhanden\b/g, 'original box included'], [/\bOVP\b/g, 'original box (OVP)']],
  de: [[/\b(?:Handbuch|Handbücher|Bedienungsanleitung(?:en)?|Anleitungsheft)\b/g, 'Bauanleitung'],
    [/\bBlöcke\b/g, 'Steine'], [/\bBlock\b/g, 'Stein'], [/\bKlötze\b/g, 'Steine'], [/\bKlotz\b/g, 'Stein'],
    [/\bEtiketten\b/g, 'Aufkleber'], [/\bMinifiguren?\b/g, function (m) { return m; }], [/\bBox\b/g, 'Karton']]
};
function ordliste_(t, sprog) {
  var l = ORDLISTE[sprog]; if (!l) return t;
  return l.reduce(function (x, r) { return x.replace(r[0], r[1]); }, String(t));
}

function lavListings_(d) {
  var dato = String(d.dato || '');
  var data = laesIndkoeb_();
  var rk = batchRaekker_(data, dato).filter(function (r) {
    return r.v[K.KLAR - 1] === true && String(r.v[K.LAGERSTATUS - 1]) !== 'Solgt' && r.v[K.LISTET - 1] !== true;
  }).sort(function (a, b) { return String(a.v[K.SKU - 1]).localeCompare(String(b.v[K.SKU - 1])); });
  if (!rk.length) return { antal: 0, url: '', saet: [], besked: 'Ingen sæt i købet er klar til salg og endnu ikke listet.' };
  var slaa = dbOpslag_(), cache = {}, aarNu = Number(Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'yyyy'));
  var ud = rk.map(function (r) {
    var v = r.v, dbr = slaa(v[K.SETNR - 1]) || ['', v[K.NAVN - 1], '', '', ''];
    var note = delNote_(v[K.NOTER - 1]);
    var t = listingTekst_({
      setnr: String(v[K.SETNR - 1]), navn: String(v[K.NAVN - 1] || dbr[1]), tema: dbr[2], undertema: dbr[3], aar: dbr[4],
      ovp: v[K.OVP - 1] === 'Ja', komplet: v[K.KOMPLET - 1] === true, vejledning: v[K.VEJLEDNING - 1] === true,
      stand: v[K.STAND - 1], noteDE: oversaet_(note.rest, 'de', cache), noteEN: oversaet_(note.rest, 'en', cache),
      aeskeDE: oversaet_(note.aeske, 'de', cache), aeskeEN: oversaet_(note.aeske, 'en', cache), aarNu: aarNu
    });
    return { sku: String(v[K.SKU - 1]), navn: String(v[K.NAVN - 1]), titel: t.titel, zustand: t.zustand, beskrivelse: t.beskrivelse };
  });
  // Google Doc i købsmappen (erstattes hver gang)
  var mappe = batchMappe_(dato, true), navn = dato + ' Listings', doc;
  var it = mappe.getFilesByName(navn);
  if (it.hasNext()) { doc = DocumentApp.openById(it.next().getId()); doc.getBody().clear(); }
  else { doc = DocumentApp.create(navn); DriveApp.getFileById(doc.getId()).moveTo(mappe); }
  var body = doc.getBody();
  body.appendParagraph(navn).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(ud.length + ' sæt · lavet ' + Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM-yyyy HH:mm'));
  ud.forEach(function (x) {
    body.appendHorizontalRule();
    body.appendParagraph(x.sku + ' · ' + x.navn).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    [['TITEL', x.titel], ['ZUSTANDSBESCHREIBUNG', x.zustand], ['BESCHREIBUNG', x.beskrivelse]].forEach(function (del) {
      body.appendParagraph(del[0]).setHeading(DocumentApp.ParagraphHeading.HEADING4);
      del[1].split('\n').forEach(function (linje) { body.appendParagraph(linje).setHeading(DocumentApp.ParagraphHeading.NORMAL); });
    });
  });
  var foerste = body.getChild(0); if (foerste.getType() === DocumentApp.ElementType.PARAGRAPH && foerste.asParagraph().getText() === '' && body.getNumChildren() > 1) foerste.removeFromParent();
  doc.saveAndClose();
  return { antal: ud.length, url: doc.getUrl(), saet: ud };
}

// Menupunkt: lav listings for et køb (bruges også til at godkende adgang til Google Docs første gang)
function lavListingsMenu() {
  var ui = SpreadsheetApp.getUi();
  var svar = ui.prompt('Lav listings', 'Købsdato (fx 261028):', ui.ButtonSet.OK_CANCEL);
  if (svar.getSelectedButton() !== ui.Button.OK) return;
  try {
    var r = lavListings_({ dato: svar.getResponseText().trim() });
    ui.alert('Lav listings', r.antal ? r.antal + ' sæt er skrevet i dokumentet:\n' + r.url : r.besked, ui.ButtonSet.OK);
  } catch (e) { ui.alert('Lav listings', e.message, ui.ButtonSet.OK); }
}

// ---------- Salg: én ordre (samme dato + køber) indsættes øverst i Salg <år> ----------
// Fragt, gebyr, refusion, eBay-ordrenr. og bilagsnr. skrives kun på ordrens første række (som i Excel).
function registrerSalg_(d) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d.dato || ''));
  if (!m) throw fejl_('Salgsdato mangler.');
  var aar = m[1], fane = FANE['SALG' + aar.slice(2)];
  var sh = fane ? SpreadsheetApp.getActive().getSheetByName(fane) : null;
  if (!sh) throw fejl_('Fanen "Salg ' + aar + '" findes ikke.');
  var koeber = String(d.koeber || '').trim();
  if (!koeber) throw fejl_('Køber mangler.');
  var varer = (d.varer || []).filter(function (v) { return String(v.sku || '').trim(); });
  if (!varer.length) throw fejl_('Ingen varer i ordren.');
  // Tjek SKU'er mod Indkøb
  var data = laesIndkoeb_(), status = {};
  data.raekker.forEach(function (r) { status[String(r.v[K.SKU - 1])] = String(r.v[K.LAGERSTATUS - 1] || ''); });
  var set = {};
  varer.forEach(function (v) {
    var sku = String(v.sku).trim();
    if (status[sku] === undefined) throw fejl_('SKU ' + sku + ' findes ikke i Indkøb.');
    if (status[sku] === 'Solgt') throw fejl_('SKU ' + sku + ' er allerede solgt.');
    if (set[sku]) throw fejl_('SKU ' + sku + ' står to gange i ordren.');
    set[sku] = true;
    if (!(Number(v.pris) >= 0)) throw fejl_('Pris mangler for ' + sku + '.');
  });
  var tal = function (x) { var n = Number(x); return x === '' || x === null || x === undefined || isNaN(n) || n === 0 ? '' : n; };
  var n = varer.length;
  sh.insertRowsBefore(SALG_START, n);
  sh.getRange(SALG_START, 1, n, 16).setBackground(null).setFontColor(null).setFontWeight('normal').setHorizontalAlignment(null).setWrap(false);
  var dato = Utilities.parseDate(m[1] + '-' + m[2] + '-' + m[3], SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  var raekker = varer.map(function (v, i) {
    var f = i === 0;
    return {
      ad: [dato, tekst_(String(v.sku).trim()), koeber, d.platform || 'eBay'],
      fj: [f ? tal(d.fragtUd) : '', f ? tal(d.gebyr) : '', Number(v.pris), f ? tal(d.fragtInd) : '', f ? tal(d.refund) : ''],
      op: [f ? String(d.ordrenr || '') : '', f ? String(d.bilag || '') : '']
    };
  });
  sh.getRange(SALG_START, 1, n, 4).setValues(raekker.map(function (r) { return r.ad; }));
  sh.getRange(SALG_START, 6, n, 5).setValues(raekker.map(function (r) { return r.fj; }));
  sh.getRange(SALG_START, 15, n, 2).setValues(raekker.map(function (r) { return r.op; }));
  sh.getRange(SALG_START, 1, n, 1).setNumberFormat('dd-mm-yyyy');
  sh.getRange(SALG_START, 6, n, 1).setNumberFormat('#,##0.00');
  sh.getRange(SALG_START, 7, n, 4).setNumberFormat('[$€]#,##0.00');
  SpreadsheetApp.flush();
  // Resultat: fortjeneste pr. sæt og ordre som arket regner det
  var v = sh.getRange(SALG_START, 1, n, 13).getValues();
  var res = v.map(function (r) { return { sku: String(r[1]), indkoebspris: Number(r[4]) || 0, fortjeneste: r[11] === '' ? null : Math.round(Number(r[11]) * 100) / 100 }; });
  var ordre = v[0][12] === '' ? null : Math.round(Number(v[0][12]) * 100) / 100;
  var lager = laesIndkoeb_().raekker.filter(function (r) { return set[String(r.v[K.SKU - 1])]; }).map(tilSaet_);
  return { aar: aar, raekker: res, fortjenesteOrdre: ordre, saet: lager };
}

function medLaas_(fn) {
  var laas = LockService.getScriptLock();
  if (!laas.tryLock(30000)) throw fejl_('Arket er optaget. Prøv igen om lidt.');
  try { return fn(); } finally { laas.releaseLock(); }
}

// Alt hvad appen skal bruge for at kunne arbejde uden net
function hentAlt_() {
  var db = ark_(FANE.DB);
  var start = Number(PropertiesService.getScriptProperties().getProperty('DB_START')) || findDbStart_(db) || 3;
  var n = db.getLastRow() - start + 1;
  var dbRaekker = n > 0 ? db.getRange(start, 1, n, 5).getDisplayValues().filter(function (r) { return r[0] !== ''; }) : [];
  var dbs = ark_(FANE.DBS);
  var m = dbs.getLastRow() - 2;
  var salg = m > 0 ? dbs.getRange(3, 1, m, 6).getValues()
    .filter(function (r) { return r[0] !== '' && Number(r[3]) > 0; })
    .map(function (r) { return [String(r[0]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[5])]; }) : [];
  var log = ark_(FANE.LOG);
  var l = log.getLastRow() - START + 1;
  var logRaekker = l > 0 ? log.getRange(START, 1, l, 2).getValues()
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) { return [String(r[0]), Number(r[1])]; }) : [];
  var kurs = {};
  ['SALG25', 'SALG26'].forEach(function (k) { var sh = SpreadsheetApp.getActive().getSheetByName(FANE[k]); if (sh) kurs['20' + k.slice(4)] = Number(sh.getRange('R2').getValue()) || 7.46; });
  return { db: dbRaekker, salg: salg, lager: hentLager_(), log: logRaekker, kurs: kurs };
}

// ---------- Tilføj et sæt til DB fra appen ----------
// Sætnummer som på Rebrickable: "31100-1" gemmes som 31100; andre endelser ("7236-2") bevares.
function dbNummer_(nr) { return String(nr == null ? '' : nr).trim().replace(/-1$/, ''); }
function tilfoejDb_(d) {
  var nr = dbNummer_(d.setnr), navn = String(d.navn || '').trim(), tema = String(d.tema || '').trim();
  var undertema = String(d.undertema || '').trim(), aar = String(d.aar || '').trim();
  if (!nr) throw fejl_('Sætnummer mangler.');
  if (!navn) throw fejl_('Navn mangler.');
  if (!tema) throw fejl_('Tema mangler.');
  if (!/^(19[4-9]\d|20\d\d)$/.test(aar)) throw fejl_('År skal være et årstal, fx 1992.');
  var db = ark_(FANE.DB);
  var start = Number(PropertiesService.getScriptProperties().getProperty('DB_START')) || findDbStart_(db) || 3;
  var sidste = db.getLastRow(), n = sidste - start + 1;
  var v = n > 0 ? db.getRange(start, 1, n, 2).getDisplayValues() : [];
  for (var i = 0; i < v.length; i++) {
    if (v[i][0] === nr || v[i][0] === nr + '-1') {
      // Samme sæt sendt igen fra udbakken (genforsøg) → ok; ellers findes det allerede
      if (v[i][1] === navn) return { setnr: nr, navn: navn, tema: tema, undertema: undertema, aar: aar, gentaget: true };
      throw fejl_('Sæt ' + nr + ' findes allerede i DB som "' + v[i][1] + '".');
    }
  }
  var hoved = db.getRange(start - 1, 6);
  if (!hoved.getValue()) hoved.setValue('Tilføjet').setFontWeight('bold');
  var r = sidste + 1;
  if (r > db.getMaxRows()) db.insertRowsAfter(db.getMaxRows(), 1);
  var dato = Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'dd-MM-yyyy');
  var txt = function (x) { return /^[=+\-@]/.test(x) ? "'" + x : x; }; // tekst må aldrig blive til en formel
  db.getRange(r, 1, 1, 6).setValues([[/^\d+$/.test(nr) ? Number(nr) : tekst_(nr), txt(navn), txt(tema), txt(undertema), Number(aar), 'Tilføjet i appen ' + dato]]);
  SpreadsheetApp.flush();
  return { setnr: nr, navn: navn, tema: tema, undertema: undertema, aar: aar, gentaget: false };
}

function slaaOp_(setnr) {
  if (!setnr) throw fejl_('Intet sætnummer.');
  var db = ark_(FANE.DB);
  var start = Number(PropertiesService.getScriptProperties().getProperty('DB_START')) || findDbStart_(db) || 3;
  var n = db.getLastRow() - start + 1;
  var res = { setnr: setnr, fundet: false, navn: 'Sæt findes ikke', tema: '', undertema: '', aar: '', salg: null };
  if (n > 0) {
    var v = db.getRange(start, 1, n, 5).getDisplayValues(), hit = null;
    for (var i = 0; i < v.length; i++) { if (v[i][0] === setnr) { hit = v[i]; break; } }
    if (!hit) for (var j = 0; j < v.length; j++) { if (v[j][0] === setnr + '-1') { hit = v[j]; break; } }
    if (hit) { res.fundet = true; res.navn = hit[1]; res.tema = hit[2]; res.undertema = hit[3]; res.aar = hit[4]; }
  }
  var dbs = ark_(FANE.DBS), m = dbs.getLastRow() - 2;
  if (m > 0) {
    var s = dbs.getRange(3, 1, m, 6).getValues();
    for (var k = 0; k < s.length; k++) {
      if (String(s[k][0]) === setnr && Number(s[k][3]) > 0) { res.salg = { gns: Number(s[k][2]), antal: Number(s[k][3]), hoejeste: Number(s[k][4]), laveste: Number(s[k][5]) }; break; }
    }
  }
  return res;
}

// ---------- Batch ----------
function opretBatch_(d) {
  var dato = String(d.dato || '');
  if (!/^\d{6}$/.test(dato)) throw fejl_('Købsdato skal være ÅÅMMDD.');
  var pris = Number(d.pris);
  if (!(pris > 0)) throw fejl_('Samlet pris skal være over 0.');
  var saet = d.saet || [];
  if (!saet.length) throw fejl_('Ingen sæt i batchen.');
  saet.forEach(function (s, i) {
    if (!String(s.setnr || '').trim()) throw fejl_('Sæt ' + (i + 1) + ' mangler sætnummer.');
    if (!(Number(s.vaerdi) > 0)) throw fejl_('Sæt ' + s.setnr + ' mangler værdi.');
    if (KILDER.indexOf(s.kilde) < 0) throw fejl_('Sæt ' + s.setnr + ' har ukendt kilde.');
  });
  var log = ark_(FANE.LOG), ind = ark_(FANE.INDKOEB), datoNr = Number(dato);
  if (log.getLastRow() >= START) {
    var eks = log.getRange(START, 1, log.getLastRow() - START + 1, 1).getValues();
    for (var i = 0; i < eks.length; i++) if (String(eks[i][0]) === dato) throw fejl_('Batch ' + dato + ' findes allerede i Indkøbslog.');
  }
  // Indkøbslog: ny række øverst
  log.insertRowsBefore(START, 1);
  log.getRange(START, 1, 1, 13).setBackground(null).setFontColor(null).setFontWeight('normal').setHorizontalAlignment(null).setWrap(false);
  log.getRange(START, 1, 1, 4).setValues([[datoNr, pris, 'Ja', d.noter || '']]);
  log.getRange(START, 1).setNumberFormat('0');
  log.getRange(START, 2).setNumberFormat('#,##0.00');

  // Indkøb: n nye rækker øverst, i den rækkefølge sættene blev tastet
  var n = saet.length;
  ind.insertRowsBefore(START, n);
  ind.getRange(START, 1, n, INDKOEB_KOLONNER).setBackground(null).setFontColor(null).setFontWeight('normal').setHorizontalAlignment(null).setWrap(false);
  var bc = [], e = [], gm = [], ov = [];
  saet.forEach(function (s) {
    var nr = String(s.setnr).trim();
    bc.push([datoNr, /^\d+$/.test(nr) ? Number(nr) : tekst_(nr)]);
    e.push([Number(s.vaerdi)]);
    gm.push(['', s.ovp ? 'Ja' : 'Nej', false, false, false, '', '']);
    ov.push(['', '', '', s.kilde, false, false, '', '']);
  });
  ind.getRange(START, K.DATO, n, 2).setValues(bc);
  ind.getRange(START, K.VAERDI, n, 1).setValues(e);
  ind.getRange(START, K.SALGFOR, n, 7).setValues(gm);
  ind.getRange(START, K.SALGSDATO, n, 8).setValues(ov);
  ind.getRange(START, K.LISTET, n, 1).setValue(false);
  saetValidering_(ind, START, n);
  ind.getRange(START, K.DATO, n, 2).setNumberFormat('0');
  ind.getRange(START, K.VAERDI, n, 1).setNumberFormat('[$€]#,##0.00');
  ind.getRange(START, K.KOEBSPRIS, n, 2).setNumberFormat('#,##0.00');
  SpreadsheetApp.flush();
  sorterKoeb_(dato);
  return hentBatch_(dato);
}

// Kolonnen "Listet" (W) kom til i version 1.4.0 – tilføjes til ark, der er importeret før
function sikrListet_(ind) {
  if (sikrListet_.ok) return;
  if (ind.getMaxColumns() < K.LISTET) ind.insertColumnsAfter(ind.getMaxColumns(), K.LISTET - ind.getMaxColumns());
  var h = ind.getRange(2, K.LISTET);
  if (h.getValue() !== 'Listet') {
    h.setValue('Listet').setBackground(NAVY).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
    ind.getRange(START, K.LISTET, ind.getMaxRows() - START + 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  }
  sikrListet_.ok = true;
}

function laesIndkoeb_() {
  var ind = ark_(FANE.INDKOEB);
  sikrListet_(ind);
  var n = ind.getLastRow() - START + 1;
  if (n < 1) return { ark: ind, raekker: [] };
  var v = ind.getRange(START, 1, n, INDKOEB_KOLONNER).getValues(), raekker = [];
  for (var i = 0; i < v.length; i++) {
    if (v[i][K.DATO - 1] === '' || v[i][K.DATO - 1] === null) continue;
    raekker.push({ raekke: START + i, v: v[i] });
  }
  return { ark: ind, raekker: raekker };
}

function tilSaet_(r) {
  var v = r.v, b = function (x) { return x === true; };
  return {
    sku: String(v[K.SKU - 1]), dato: String(v[K.DATO - 1]), setnr: String(v[K.SETNR - 1]), navn: String(v[K.NAVN - 1]),
    vaerdi: Number(v[K.VAERDI - 1]) || 0, koebspris: Math.round((Number(v[K.KOEBSPRIS - 1]) || 0) * 100) / 100,
    ovp: v[K.OVP - 1] === 'Ja', sorteret: b(v[K.SORTERET - 1]), fotos: b(v[K.FOTOS - 1]), klar: b(v[K.KLAR - 1]),
    stand: v[K.STAND - 1] === '' ? '' : String(v[K.STAND - 1]), platform: String(v[K.PLATFORM - 1] || ''),
    lagerstatus: String(v[K.LAGERSTATUS - 1] || ''), noter: String(v[K.NOTER - 1] || ''), kilde: String(v[K.KILDE - 1] || ''),
    vejledning: b(v[K.VEJLEDNING - 1]), komplet: b(v[K.KOMPLET - 1]), listet: b(v[K.LISTET - 1])
  };
}

function hentBatch_(dato) {
  var data = laesIndkoeb_(), saet = [];
  var mappe = batchMappe_(dato, false);
  var t = mappe ? fotoTaelling_(mappe) : { antal: {} };
  data.raekker.forEach(function (r) {
    if (String(r.v[K.DATO - 1]) !== dato) return;
    var s = tilSaet_(r); s.antalFotos = t.antal[s.sku] || 0; saet.push(s);
  });
  var pris = 0, log = ark_(FANE.LOG);
  if (log.getLastRow() >= START) {
    var lv = log.getRange(START, 1, log.getLastRow() - START + 1, 2).getValues();
    for (var i = 0; i < lv.length; i++) if (String(lv[i][0]) === dato) { pris = Number(lv[i][1]); break; }
  }
  return { dato: dato, pris: pris, saet: saet, status: batchStatus_(batchRaekker_(data, dato), dato) };
}

function hentLager_() { return laesIndkoeb_().raekker.map(tilSaet_); }

function findRaekke_(sku) {
  if (/^#/.test(sku)) throw fejl_('SKU-formlen viser en fejl i arket. Kør CTS → Opdatér formler.');
  var data = laesIndkoeb_();
  for (var i = 0; i < data.raekker.length; i++) if (String(data.raekker[i].v[K.SKU - 1]) === sku) return { ark: data.ark, r: data.raekker[i] };
  throw fejl_('SKU ' + sku + ' findes ikke i Indkøb.');
}

// ---------- Klargøring ----------
function gemKlargoering_(d) {
  var f = findRaekke_(String(d.sku || ''));
  var ark = f.ark, rk = f.r.raekke, sku = String(d.sku);
  var stand = d.stand === '' || d.stand === null || d.stand === undefined ? '' : Number(d.stand);
  if (stand !== '' && !(stand >= 1 && stand <= 10)) throw fejl_('Stand skal være 1–10.');
  if (d.platform && PLATFORME.indexOf(d.platform) < 0) throw fejl_('Ukendt salgsplatform.');
  var mappe = batchMappe_(String(f.r.v[K.DATO - 1]), false);
  var antal = mappe ? (fotoTaelling_(mappe).antal[sku] || 0) : 0;
  var fotos = f.r.v[K.FOTOS - 1] === true || antal > 0;
  var klar = d.klar === true;
  if (klar && !(d.sorteret === true && stand !== '' && fotos)) throw fejl_('Klar til salg kræver: sorteret, stand og mindst ét foto.');
  ark.getRange(rk, K.SORTERET, 1, 5).setValues([[d.sorteret === true, fotos, klar, stand, d.platform || '']]);
  ark.getRange(rk, K.NOTER).setValue(d.noter || '');
  ark.getRange(rk, K.VEJLEDNING, 1, 2).setValues([[d.vejledning === true, d.komplet === true]]);
  SpreadsheetApp.flush();
  var s = tilSaet_(findRaekke_(sku).r);
  s.antalFotos = antal;
  return s;
}

// ---------- Fotos: én mappe pr. købsdato, fotos navngivet <SKU>.NN.jpg ----------
function rodMappe_() {
  var id = PropertiesService.getScriptProperties().getProperty('ROD_MAPPE_ID');
  if (!id) throw fejl_('Fotomappe er ikke sat. Kør CTS → Importér fra Excel.');
  return DriveApp.getFolderById(id);
}

// Købsmappen for en dato: id gemmes i Indkøbslog (skjult kolonne M)
function batchMappe_(dato, opret) {
  var log = ark_(FANE.LOG), n = log.getLastRow() - START + 1, rk = 0;
  if (n > 0) {
    var v = log.getRange(START, 1, n, LK.MAPPEID).getValues();
    for (var i = 0; i < v.length; i++) {
      if (String(v[i][0]) === String(dato)) {
        rk = START + i;
        var id = v[i][LK.MAPPEID - 1];
        if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* slettet – find/opret igen */ } }
        break;
      }
    }
  }
  var rod = rodMappe_(), it = rod.getFoldersByName(String(dato));
  var mappe = it.hasNext() ? it.next() : (opret ? rod.createFolder(String(dato)) : null);
  if (mappe && rk) log.getRange(rk, LK.MAPPEID).setValue(mappe.getId());
  return mappe;
}

// Tæller fotos pr. SKU i en købsmappe
function fotoTaelling_(mappe) {
  var res = { antal: {}, hoejeste: {}, navne: {}, filer: [] };
  var it = mappe.getFiles();
  while (it.hasNext()) {
    var f = it.next(), navn = f.getName();
    res.navne[navn.toUpperCase()] = true; res.filer.push(f);
    var m = /^(.+)\.(\d{2,})\.(jpe?g|png|heic|heif|webp)$/i.exec(navn);
    if (!m) continue;
    res.antal[m[1]] = (res.antal[m[1]] || 0) + 1;
    res.hoejeste[m[1]] = Math.max(res.hoejeste[m[1]] || 0, Number(m[2]));
  }
  return res;
}

// Hvis et SKU har skiftet navn (fx -a/-b), omdøbes fotoene i købsmappen
function synkFotonavne_(dato) {
  var data = laesIndkoeb_(), mappe = batchMappe_(dato, false);
  if (!mappe) return;
  var t = null;
  data.raekker.forEach(function (r) {
    if (String(r.v[K.DATO - 1]) !== String(dato)) return;
    var sku = String(r.v[K.SKU - 1]), gl = String(r.v[K.FOTOSKU - 1] || '');
    if (!gl || gl === sku || /^#/.test(sku)) return;
    t = t || fotoTaelling_(mappe);
    t.filer.forEach(function (f) { var n = f.getName(); if (n.indexOf(gl + '.') === 0) f.setName(sku + n.substring(gl.length)); });
    data.ark.getRange(r.raekke, K.FOTOSKU).setValue(sku);
  });
}

function uploadFoto_(d) {
  var sku = String(d.sku || '');
  if (!d.billede) throw fejl_('Intet billede.');
  var f = findRaekke_(sku);
  var dato = String(f.r.v[K.DATO - 1]);
  var mappe = batchMappe_(dato, true);
  var t = fotoTaelling_(mappe), uploadId = String(d.uploadId || '');
  // Samme upload sendt igen (genforsøg)? Så returneres den eksisterende fil.
  if (uploadId) {
    for (var i = 0; i < t.filer.length; i++) {
      if (t.filer[i].getDescription() === uploadId) return { navn: t.filer[i].getName(), antalFotos: t.antal[sku] || 0, gentaget: true };
    }
  }
  var nr = (t.hoejeste[sku] || 0) + 1;
  var navn = sku + '.' + pad2_(nr) + '.jpg';
  var ny = mappe.createFile(Utilities.newBlob(Utilities.base64Decode(String(d.billede)), 'image/jpeg', navn));
  if (uploadId) ny.setDescription(uploadId);
  f.ark.getRange(f.r.raekke, K.FOTOS).setValue(true);
  if (!f.r.v[K.FOTOSKU - 1]) f.ark.getRange(f.r.raekke, K.FOTOSKU).setValue(sku);
  return { navn: navn, antalFotos: (t.antal[sku] || 0) + 1, gentaget: false };
}
