/**
 * CTS-appen – maskinrum (Google Apps Script)
 * ------------------------------------------
 * Indsættes i Apps Script-projektet, der hører til Google Sheets-filen "cts-app"
 * (Udvidelser → Apps Script). Se docs/GUIDE.md.
 *
 * Indhold:
 *  - Menu "CTS" i regnearket: opsæt testark, vis API-nøgle.
 *  - doPost: API som appen kalder. Alle kald kræver den hemmelige nøgle.
 *
 * Ingen data ligger i denne fil. Nøglen gemmes i scriptets egenskaber
 * (Script Properties) og aldrig i koden.
 */

var VERSION = '1.0.4';

// ---------- Faner og kolonner ----------
var FANE = {
  LOG: 'Indkøbslog',
  INDKOEB: 'Indkøb',
  LAGER: 'Lager',
  SALG: 'Salg 2026',
  DBS: 'DB Salgspriser',
  DB: 'DB'
};

// Indkøb: kolonnenumre (1 = A). Række 1 = titel, række 2 = overskrift, data fra række 3.
var K = {
  SKU: 1, DATO: 2, SETNR: 3, NAVN: 4, VAERDI: 5, KOEBSPRIS: 6, SALGFOR: 7, OVP: 8,
  SORTERET: 9, FOTOS: 10, KLAR: 11, STAND: 12, PLATFORM: 13, LAGERSTATUS: 14,
  SALGSDATO: 15, SALGSPRIS: 16, NOTER: 17, KILDE: 18, VEJLEDNING: 19, KOMPLET: 20, MAPPEID: 21
};
var INDKOEB_KOLONNER = 21;
var START = 3; // første datarække i Indkøb og Indkøbslog

var PLATFORME = ['eBay', 'Catawiki', 'BrickLink', 'DBA / Facebook', 'Andet', 'Platform ikke valgt'];
var KILDER = ['Egne salg', 'BrickLink', 'eBay', 'Egen vurdering'];

// ======================================================================
//  MENU I REGNEARKET
// ======================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CTS')
    .addItem('1. Opsæt testark', 'opsaetTestark')
    .addItem('2. Vis API-nøgle', 'visNoegle')
    .addItem('Opdatér formler (bevarer data)', 'opdaterFormler')
    .addSeparator()
    .addItem('Lav ny API-nøgle', 'nyNoegle')
    .addItem('Tjek opsætning', 'tjekOpsaetning')
    .addToUi();
}

function visNoegle() {
  var n = hentNoegle_();
  SpreadsheetApp.getUi().alert('API-nøgle',
    'Kopiér nøglen herunder og indsæt den i appen under Indstillinger.\n\n' + n +
    '\n\nDel den ikke med andre.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function nyNoegle() {
  var ui = SpreadsheetApp.getUi();
  var svar = ui.alert('Lav ny API-nøgle',
    'Den gamle nøgle holder op med at virke, og du skal indtaste den nye i appen. Fortsæt?',
    ui.ButtonSet.YES_NO);
  if (svar !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().setProperty('API_NOEGLE', lavNoegle_());
  visNoegle();
}

function hentNoegle_() {
  var p = PropertiesService.getScriptProperties();
  var n = p.getProperty('API_NOEGLE');
  if (!n) { n = lavNoegle_(); p.setProperty('API_NOEGLE', n); }
  return n;
}

function lavNoegle_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function tjekOpsaetning() {
  var ss = SpreadsheetApp.getActive();
  var linjer = [];
  [FANE.LOG, FANE.INDKOEB, FANE.LAGER, FANE.SALG, FANE.DBS, FANE.DB].forEach(function (f) {
    linjer.push((ss.getSheetByName(f) ? '✓ ' : '✗ MANGLER: ') + f);
  });
  var p = PropertiesService.getScriptProperties();
  var rod = p.getProperty('ROD_MAPPE_ID');
  var rodNavn = '✗ ikke sat';
  try { if (rod) rodNavn = '✓ ' + stiTil_(DriveApp.getFolderById(rod)); } catch (e) { rodNavn = '✗ findes ikke'; }
  linjer.push('Fotomappe: ' + rodNavn);
  linjer.push('API-nøgle: ' + (p.getProperty('API_NOEGLE') ? '✓ sat' : '✗ ikke sat'));
  linjer.push('Version: ' + VERSION);
  SpreadsheetApp.getUi().alert('Tjek opsætning', linjer.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

function stiTil_(mappe) {
  var dele = [mappe.getName()];
  var it = mappe.getParents();
  var tael = 0;
  while (it.hasNext() && tael < 5) { var m = it.next(); dele.unshift(m.getName()); it = m.getParents(); tael++; }
  return dele.join('/');
}

// ======================================================================
//  OPSÆTNING AF TESTARK
// ======================================================================

function opsaetTestark() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();

  var db = ss.getSheetByName(FANE.DB);
  if (!db) { ui.alert('Fanen "DB" findes ikke. Opsætningen er stoppet, intet er ændret.'); return; }
  var dbStart = findDbStart_(db);
  if (!dbStart) {
    ui.alert('Kan ikke finde overskriften "Lego number" i fanen DB (række 1–5). Opsætningen er stoppet, intet er ændret.');
    return;
  }

  var svar = ui.alert('Opsæt testark',
    'Dette SLETTER alle faner i "' + ss.getName() + '" undtagen DB og bygger ' +
    'Indkøbslog, Indkøb, Lager, Salg 2026 og DB Salgspriser forfra (tomme, med formler).\n\n' +
    'Kør det KUN i testkopien. Fortsæt?', ui.ButtonSet.YES_NO);
  if (svar !== ui.Button.YES) return;

  try {
    // Slet alle andre faner og navngivne områder, der pegede på dem
    ss.setActiveSheet(db);
    ss.getSheets().forEach(function (sh) { if (sh.getName() !== FANE.DB) proev_(function () { ss.deleteSheet(sh); }, 'slette fanen ' + sh.getName()); });
    ss.getNamedRanges().forEach(function (r) { try { r.remove(); } catch (e) { /* ignorer */ } });
    SpreadsheetApp.flush();
    Utilities.sleep(1500);

    var dbA = "DB!$A$" + dbStart + ":$A";
    var dbB = "DB!$B$" + dbStart + ":$B";
    var dbC = "DB!$C$" + dbStart + ":$C";
    var dbD = "DB!$D$" + dbStart + ":$D";
    PropertiesService.getScriptProperties().setProperty('DB_START', String(dbStart));

    // Formler skrives med engelsk syntaks (komma mellem argumenter). Arket sættes midlertidigt
    // til engelsk landestandard, mens formlerne skrives, og derefter tilbage til dansk.
    var landestandard = ss.getSpreadsheetLocale();
    ss.setSpreadsheetLocale('en_US');
    SpreadsheetApp.flush();
    trin_('Indkøbslog', function () { byggIndkoebslog_(ss); });
    trin_('Indkøb', function () { byggIndkoeb_(ss, dbA, dbB); });
    trin_('Salg 2026', function () { byggSalg_(ss); });
    trin_('DB Salgspriser', function () { byggDbSalgspriser_(ss, dbA, dbC); });
    trin_('Lager', function () { byggLager_(ss, dbA, dbC, dbD); });
    SpreadsheetApp.flush();
    ss.setSpreadsheetLocale(landestandard || 'da_DK');
    SpreadsheetApp.flush();
  } catch (err) {
    try { if (landestandard) ss.setSpreadsheetLocale(landestandard); } catch (e) { /* ignorer */ }
    ui.alert('Opsætningen stoppede',
      String(err.message || err) + '\n\nDet er ufarligt: kør CTS → 1. Opsæt testark igen. ' +
      'Virker det stadig ikke, så send et skærmbillede af denne besked til Claude.', ui.ButtonSet.OK);
    return;
  }

  // Rækkefølge på fanerne
  var orden = [FANE.LOG, FANE.INDKOEB, FANE.LAGER, FANE.SALG, FANE.DBS, FANE.DB];
  orden.forEach(function (navn, i) {
    var sh = ss.getSheetByName(navn); ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1);
  });
  ss.setActiveSheet(ss.getSheetByName(FANE.INDKOEB));

  // Drive-mapper: CTS/Test og CTS/Lager ved siden af regnearket
  var cts = mappeForRegneark_(ss);
  var test = underMappe_(cts, 'Test');
  underMappe_(cts, 'Lager');
  var p = PropertiesService.getScriptProperties();
  p.setProperty('ROD_MAPPE_ID', test.getId());
  p.setProperty('TILSTAND', 'test');
  hentNoegle_();

  var fejl = tjekFormler_(ss);
  ui.alert(fejl.length ? 'Bygget – men med formelfejl' : 'Færdig',
    (fejl.length ? 'Disse celler viser fejl – send et skærmbillede til Claude:\n' + fejl.join('\n') + '\n\n' : 'Testarket er bygget, og formlerne virker.\n') +
    'Fotos gemmes i: ' + stiTil_(test) +
    '\n\nNæste trin: CTS → 2. Vis API-nøgle.', ui.ButtonSet.OK);
}

// Kør et byggetrin; ved fejl i Googles tjeneste ventes der og prøves igen (op til 3 gange).
function trin_(navn, fn) {
  proev_(function () {
    var gl = SpreadsheetApp.getActive().getSheetByName(navn);
    if (gl) SpreadsheetApp.getActive().deleteSheet(gl); // rest fra et tidligere forsøg
    fn();
  }, 'bygge fanen ' + navn);
  SpreadsheetApp.flush();
}

function proev_(fn, hvad) {
  var sidste;
  for (var i = 0; i < 3; i++) {
    try { return fn(); } catch (e) { sidste = e; SpreadsheetApp.flush(); Utilities.sleep(2000 * (i + 1)); }
  }
  throw new Error('Kunne ikke ' + hvad + ': ' + (sidste && sidste.message));
}

// Finder formelceller, der viser en fejlværdi
function tjekFormler_(ss) {
  var celler = [[FANE.LOG, 'C2'], [FANE.LOG, 'D2'], [FANE.LOG, 'E2'], [FANE.LOG, 'F2'],
    [FANE.INDKOEB, 'A2'], [FANE.INDKOEB, 'D2'], [FANE.INDKOEB, 'F2'], [FANE.INDKOEB, 'N2'],
    [FANE.DBS, 'A3'], [FANE.LAGER, 'A3']];
  var fejl = [];
  celler.forEach(function (c) {
    var sh = ss.getSheetByName(c[0]); if (!sh) return;
    var v = sh.getRange(c[1]).getDisplayValue();
    if (/^#/.test(v)) fejl.push(c[0] + '!' + c[1] + ': ' + v);
  });
  // Også fejl i de enkelte rækker (fx kun ved dubletter)
  var ind = ss.getSheetByName(FANE.INDKOEB);
  if (ind && ind.getLastRow() >= START) {
    var vis = ind.getRange(START, 1, ind.getLastRow() - START + 1, K.LAGERSTATUS).getDisplayValues();
    vis.forEach(function (raekke, i) {
      [K.SKU, K.NAVN, K.KOEBSPRIS, K.LAGERSTATUS].forEach(function (k) {
        if (/^#/.test(raekke[k - 1]) && fejl.length < 15) fejl.push(FANE.INDKOEB + ' række ' + (START + i) + ', kolonne ' + String.fromCharCode(64 + k) + ': ' + raekke[k - 1]);
      });
    });
  }
  return fejl;
}

function findDbStart_(db) {
  var v = db.getRange(1, 1, 5, 1).getDisplayValues();
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]).trim().toLowerCase() === 'lego number') return i + 2; // data starter rækken under
  }
  return 0;
}

function mappeForRegneark_(ss) {
  var it = DriveApp.getFileById(ss.getId()).getParents();
  if (it.hasNext()) return it.next();
  return DriveApp.getRootFolder();
}

function underMappe_(foraeldre, navn) {
  var it = foraeldre.getFoldersByName(navn);
  return it.hasNext() ? it.next() : foraeldre.createFolder(navn);
}

function nyFane_(ss, navn, titel, overskrifter, overskriftRaekke) {
  var sh = ss.insertSheet(ss.getSheets().length);
  sh.setName(navn);
  var n = overskrifter.length;
  sh.getRange(1, 1, 1, n).merge().setValue(titel)
    .setBackground('#1f3864').setFontColor('#ffffff').setFontWeight('bold')
    .setFontSize(13).setHorizontalAlignment('center');
  sh.getRange(overskriftRaekke, 1, 1, n).setValues([overskrifter])
    .setBackground('#1f3864').setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center').setWrap(true);
  sh.setFrozenRows(overskriftRaekke);
  return sh;
}

// Formler lægges i overskriftsrækken og bruger INDIRECT, så de ikke forskydes,
// når appen indsætter nye rækker øverst.
function byggIndkoebslog_(ss) {
  var sh = nyFane_(ss, FANE.LOG, 'INDKØBSLOG — Copenhagen Treasures and Services (TEST)',
    ['Indkøbsdato', 'Samlet køb (DKK)', 'Sæt i alt', 'Solgt', 'Klar (På lager)', 'Ikke klar', 'Noter'], 2);
  formlerIndkoebslog_(sh);
  sh.getRange('A3:A').setNumberFormat('0');
  sh.getRange('B3:B').setNumberFormat('#,##0.00');
  sh.setColumnWidths(1, 6, 120); sh.setColumnWidth(7, 400);
}

function byggIndkoeb_(ss, dbA, dbB) {
  var sh = nyFane_(ss, FANE.INDKOEB, 'INDKØB — Copenhagen Treasures and Services (TEST)',
    ['SKU', 'Købsdato', 'Set nr.', 'Navn', 'BL or eBay Average (€)', 'Købspris (DKK)',
      'Sættes til salg for:', 'Original Box', 'Sorteret', 'Fotos', 'Klar til salg', 'Stand (1-10)',
      'Salgsplatform', 'Lagerstatus', 'Salgsdato', 'Salgspris', 'Noter',
      'Værdikilde', 'Vejledning', 'Komplet', 'MappeID'], 2);

  formlerIndkoeb_(sh, dbA, dbB);

  var max = sh.getMaxRows();
  saetValidering_(sh, START, max - START + 1);
  sh.getRange('B3:C').setNumberFormat('0');
  sh.getRange('E3:E').setNumberFormat('[$€]#,##0.00');
  sh.getRange('F3:G').setNumberFormat('#,##0.00');
  sh.setColumnWidth(1, 140); sh.setColumnWidth(4, 260); sh.setColumnWidth(17, 300);
  sh.hideColumns(K.MAPPEID);
}

function formlerIndkoebslog_(sh) {
  sh.getRange('C2').setFormula(
    '=LET(logdato,INDIRECT("A3:A"),inddato,INDIRECT("\'Indkøb\'!B3:B"),' +
    '{"Sæt i alt";ARRAYFORMULA(IF(logdato="","",COUNTIF(inddato,logdato)))})');
  sh.getRange('D2').setFormula(
    '=LET(logdato,INDIRECT("A3:A"),inddato,INDIRECT("\'Indkøb\'!B3:B"),indstatus,INDIRECT("\'Indkøb\'!N3:N"),' +
    '{"Solgt";ARRAYFORMULA(IF(logdato="","",COUNTIFS(inddato,logdato,indstatus,"Solgt")))})');
  sh.getRange('E2').setFormula(
    '=LET(logdato,INDIRECT("A3:A"),inddato,INDIRECT("\'Indkøb\'!B3:B"),indstatus,INDIRECT("\'Indkøb\'!N3:N"),' +
    '{"Klar (På lager)";ARRAYFORMULA(IF(logdato="","",COUNTIFS(inddato,logdato,indstatus,"På lager")))})');
  sh.getRange('F2').setFormula(
    '=LET(logdato,INDIRECT("A3:A"),ialt,INDIRECT("C3:C"),solgte,INDIRECT("D3:D"),klare,INDIRECT("E3:E"),' +
    '{"Ikke klar";ARRAYFORMULA(IF(logdato="","",ialt-solgte-klare))})');
}

function formlerIndkoeb_(sh, dbA, dbB) {
  // A: SKU = Købsdato-Setnr, + -a/-b/... ved dubletter (også første række)
  sh.getRange('A2').setFormula(
    '=LET(datoer,INDIRECT("B3:B"),saetnr,INDIRECT("C3:C"),raekker,ARRAYFORMULA(ROW(datoer)),' +
    '{"SKU";ARRAYFORMULA(IF(datoer="","",datoer&"-"&saetnr&IF(COUNTIFS(datoer,datoer,saetnr,saetnr)>1,' +
    '"-"&CHAR(96+COUNTIFS(datoer,datoer,saetnr,saetnr,raekker,"<="&raekker)),"")))})');
  // D: Navn fra DB (prøver også "<nr>-1")
  sh.getRange('D2').setFormula(
    '=LET(saetnr,INDIRECT("C3:C"),dbtabel,{ARRAYFORMULA(TO_TEXT(' + dbA + ')),' + dbB + '},' +
    '{"Navn";ARRAYFORMULA(IF(saetnr="","",IFERROR(VLOOKUP(TO_TEXT(saetnr),dbtabel,2,FALSE),' +
    'IFERROR(VLOOKUP(TO_TEXT(saetnr)&"-1",dbtabel,2,FALSE),"Sæt findes ikke"))))})');
  // F: Købspris = batchpris × (værdi / sum af batchens værdier)
  sh.getRange('F2').setFormula(
    '=LET(datoer,INDIRECT("B3:B"),vaerdier,INDIRECT("E3:E"),' +
    'logtabel,{INDIRECT("\'Indkøbslog\'!A3:A"),INDIRECT("\'Indkøbslog\'!B3:B")},' +
    '{"Købspris (DKK)";ARRAYFORMULA(IF(datoer="","",IFERROR(VLOOKUP(datoer,logtabel,2,FALSE)*vaerdier/SUMIF(datoer,datoer,vaerdier),0)))})');
  // N: Lagerstatus = Solgt hvis SKU findes i Salg 2026, ellers På lager hvis Klar til salg
  sh.getRange('N2').setFormula(
    '=LET(skuer,INDIRECT("A3:A"),klar,INDIRECT("K3:K"),solgteskuer,INDIRECT("\'Salg 2026\'!B4:B"),' +
    '{"Lagerstatus";ARRAYFORMULA(IF(skuer="","",IF(COUNTIF(solgteskuer,skuer)>0,"Solgt",IF(klar=TRUE,"På lager",""))))})');
}

function formlerDbSalgspriser_(sh, dbA, dbC) {
  // Samme beregning som Excel: alle salg med SKU og pris > 0, grupperet på sætnummer
  sh.getRange('A3').setFormula(
    '=IFERROR(LET(salgsku,INDIRECT("\'Salg 2026\'!B4:B"),salgpris,INDIRECT("\'Salg 2026\'!H4:H"),' +
    'gyldig,ARRAYFORMULA((salgsku<>"")*ISNUMBER(salgpris)*(N(salgpris)>0)),' +
    'skuliste,FILTER(salgsku,gyldig=1),prisliste,FILTER(salgpris,gyldig=1),' +
    'nrliste,ARRAYFORMULA(IFERROR(REGEXEXTRACT(TO_TEXT(skuliste),"^[^-]*-([^-]+)"),TO_TEXT(skuliste))),' +
    'unikke,UNIQUE(nrliste),' +
    'temaer,ARRAYFORMULA(IFERROR(VLOOKUP(unikke,{ARRAYFORMULA(TO_TEXT(' + dbA + ')),' + dbC + '},2,FALSE),"")),' +
    'antal,MAP(unikke,LAMBDA(saet,SUM(ARRAYFORMULA(--(nrliste=saet))))),' +
    'snit,MAP(unikke,LAMBDA(saet,SUM(ARRAYFORMULA((nrliste=saet)*prisliste))/SUM(ARRAYFORMULA(--(nrliste=saet))))),' +
    'hoejest,MAP(unikke,LAMBDA(saet,MAX(FILTER(prisliste,nrliste=saet)))),' +
    'lavest,MAP(unikke,LAMBDA(saet,MIN(FILTER(prisliste,nrliste=saet)))),' +
    'visnr,ARRAYFORMULA(IFERROR(VALUE(unikke),unikke)),' +
    'SORT(HSTACK(visnr,temaer,snit,antal,hoejest,lavest),1,TRUE)),"")');
}

function formlerLager_(sh, dbA, dbC, dbD) {
  // Viser sæt der er sorteret + fotograferet + klar til salg + på lager. Overskriv ikke cellerne.
  sh.getRange('A3').setFormula(
    '=IFERROR(LET(' +
    'skuer,INDIRECT("\'Indkøb\'!A3:A"),saetnr,INDIRECT("\'Indkøb\'!C3:C"),navne,INDIRECT("\'Indkøb\'!D3:D"),' +
    'sorteret,INDIRECT("\'Indkøb\'!I3:I"),fotos,INDIRECT("\'Indkøb\'!J3:J"),klar,INDIRECT("\'Indkøb\'!K3:K"),' +
    'stand,INDIRECT("\'Indkøb\'!L3:L"),platform,INDIRECT("\'Indkøb\'!M3:M"),status,INDIRECT("\'Indkøb\'!N3:N"),' +
    'noter,INDIRECT("\'Indkøb\'!Q3:Q"),' +
    'temaer,ARRAYFORMULA(IFERROR(VLOOKUP(TO_TEXT(saetnr),{ARRAYFORMULA(TO_TEXT(' + dbA + ')),' + dbC + '},2,FALSE),"")),' +
    'undertemaer,ARRAYFORMULA(IFERROR(VLOOKUP(TO_TEXT(saetnr),{ARRAYFORMULA(TO_TEXT(' + dbA + ')),' + dbD + '},2,FALSE),"")),' +
    'vis,ARRAYFORMULA((sorteret=TRUE)*(fotos=TRUE)*(klar=TRUE)*(status="På lager")),' +
    'SORT(FILTER({skuer,stand,platform,saetnr,navne,temaer,undertemaer,noter},vis=1),4,TRUE)),"")');
}

// Skriver formlerne igen uden at røre data (bruges når en formel er rettet i en ny version)
function opdaterFormler() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive();
  var db = ss.getSheetByName(FANE.DB);
  var dbStart = db ? findDbStart_(db) : 0;
  if (!dbStart) { ui.alert('Kan ikke finde fanen DB med overskriften "Lego number".'); return; }
  var dbA = "DB!$A$" + dbStart + ":$A", dbB = "DB!$B$" + dbStart + ":$B";
  var dbC = "DB!$C$" + dbStart + ":$C", dbD = "DB!$D$" + dbStart + ":$D";
  var ark = function (n) { var sh = ss.getSheetByName(n); if (!sh) throw new Error('Fanen ' + n + ' mangler. Kør Opsæt testark.'); return sh; };
  var landestandard = ss.getSpreadsheetLocale();
  try {
    ss.setSpreadsheetLocale('en_US'); SpreadsheetApp.flush();
    formlerIndkoebslog_(ark(FANE.LOG));
    formlerIndkoeb_(ark(FANE.INDKOEB), dbA, dbB);
    formlerDbSalgspriser_(ark(FANE.DBS), dbA, dbC);
    formlerLager_(ark(FANE.LAGER), dbA, dbC, dbD);
    SpreadsheetApp.flush();
  } catch (e) {
    ss.setSpreadsheetLocale(landestandard || 'da_DK');
    ui.alert('Formlerne blev ikke opdateret', String(e.message || e), ui.ButtonSet.OK); return;
  }
  ss.setSpreadsheetLocale(landestandard || 'da_DK'); SpreadsheetApp.flush();
  var fejl = tjekFormler_(ss);
  ui.alert(fejl.length ? 'Formler opdateret – men med fejl' : 'Formler opdateret',
    (fejl.length ? 'Send et skærmbillede til Claude:\n' + fejl.join('\n') : 'Alle formler virker. Data er ikke ændret.') + '\nVersion ' + VERSION,
    ui.ButtonSet.OK);
}

// Afkrydsning, rullelister og formater på et område af rækker i Indkøb
function saetValidering_(sh, fra, antal) {
  if (antal < 1) return;
  var cb = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  [K.SORTERET, K.FOTOS, K.KLAR, K.VEJLEDNING, K.KOMPLET].forEach(function (k) {
    sh.getRange(fra, k, antal, 1).setDataValidation(cb);
  });
  var liste = function (v) { return SpreadsheetApp.newDataValidation().requireValueInList(v, true).setAllowInvalid(false).build(); };
  sh.getRange(fra, K.OVP, antal, 1).setDataValidation(liste(['Ja', 'Nej']));
  sh.getRange(fra, K.STAND, antal, 1).setDataValidation(liste(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']));
  sh.getRange(fra, K.PLATFORM, antal, 1).setDataValidation(liste(PLATFORME));
  sh.getRange(fra, K.KILDE, antal, 1).setDataValidation(liste(KILDER));
}

function byggSalg_(ss) {
  var sh = nyFane_(ss, FANE.SALG, 'SALG 2026 — Copenhagen Treasures and Services (TEST)',
    ['Salgsdato', 'SKU', 'Køber', 'Platform', 'Indkøbspris (DKK)', 'Udgift Fragt', 'Portals gebyr',
      'Ordre Sum', 'Fragt (modtaget)', 'Refunderet (EUR)', 'Ordre Sum + Fragt (DKK)',
      'Fortjeneste sæt (DKK)', 'Fortjeneste Ordre (DKK)', 'Skattepligtigt', 'eBay-ordrenr.', 'Bilagsnr'], 3);
  sh.getRange('A3:A').setNumberFormat('dd-mm-yyyy');
}

function byggDbSalgspriser_(ss, dbA, dbC) {
  var sh = nyFane_(ss, FANE.DBS, 'DB SALGSPRISER — Copenhagen Treasures and Services (opslag, EUR)',
    ['Sæt nr.', 'Tema', 'Gns. salgspris (€)', 'Antal salg', 'Højeste salgspris (€)', 'Laveste pris (€)'], 2);
  formlerDbSalgspriser_(sh, dbA, dbC);
  sh.getRange('C3:C').setNumberFormat('[$€]#,##0.00');
  sh.getRange('E3:F').setNumberFormat('[$€]#,##0.00');
}

function byggLager_(ss, dbA, dbC, dbD) {
  var sh = nyFane_(ss, FANE.LAGER, 'LAGER — Copenhagen Treasures and Services (TEST)',
    ['SKU', 'Stand', 'Til salg på', 'Set nr.', 'Navn', 'Theme', 'Subtheme', 'Noter'], 2);
  formlerLager_(sh, dbA, dbC, dbD);
  sh.setColumnWidth(1, 140); sh.setColumnWidth(5, 260); sh.setColumnWidth(8, 300);
}

// ======================================================================
//  API (kaldes fra appen)
// ======================================================================

function doGet() {
  return ContentService.createTextOutput('CTS maskinrum kører (version ' + VERSION + ').');
}

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
  hentLager: function () { return hentLager_(); }
};

function medLaas_(fn) {
  var laas = LockService.getScriptLock();
  if (!laas.tryLock(30000)) throw fejl_('Arket er optaget. Prøv igen om lidt.');
  try { return fn(); } finally { laas.releaseLock(); }
}

function ark_(navn) {
  var sh = SpreadsheetApp.getActive().getSheetByName(navn);
  if (!sh) throw fejl_('Fanen "' + navn + '" findes ikke. Kør CTS → Opsæt testark.');
  return sh;
}

// ---------- Opslag ----------
function slaaOp_(setnr) {
  if (!setnr) throw fejl_('Intet sætnummer.');
  var db = ark_(FANE.DB);
  var start = Number(PropertiesService.getScriptProperties().getProperty('DB_START')) || findDbStart_(db) || 3;
  var n = db.getLastRow() - start + 1;
  var res = { setnr: setnr, fundet: false, navn: 'Sæt findes ikke', tema: '', undertema: '', aar: '', salg: null };
  if (n > 0) {
    var v = db.getRange(start, 1, n, 5).getDisplayValues();
    var hit = null;
    for (var i = 0; i < v.length; i++) { if (v[i][0] === setnr) { hit = v[i]; break; } }
    if (!hit) for (var j = 0; j < v.length; j++) { if (v[j][0] === setnr + '-1') { hit = v[j]; break; } }
    if (hit) { res.fundet = true; res.navn = hit[1]; res.tema = hit[2]; res.undertema = hit[3]; res.aar = hit[4]; }
  }
  var dbs = ark_(FANE.DBS);
  var m = dbs.getLastRow() - 2;
  if (m > 0) {
    var s = dbs.getRange(3, 1, m, 6).getValues();
    for (var k = 0; k < s.length; k++) {
      if (String(s[k][0]) === setnr && Number(s[k][3]) > 0) {
        res.salg = { gns: Number(s[k][2]), antal: Number(s[k][3]), hoejeste: Number(s[k][4]), laveste: Number(s[k][5]) };
        break;
      }
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

  var log = ark_(FANE.LOG);
  var ind = ark_(FANE.INDKOEB);
  var datoNr = Number(dato);

  // Findes batchen allerede?
  if (log.getLastRow() >= START) {
    var eks = log.getRange(START, 1, log.getLastRow() - START + 1, 1).getValues();
    for (var i = 0; i < eks.length; i++) if (String(eks[i][0]) === dato) throw fejl_('Batch ' + dato + ' findes allerede i Indkøbslog.');
  }

  // Indkøbslog: ny række øverst
  log.insertRowsBefore(START, 1);
  log.getRange(START, 1, 1, 2).setValues([[datoNr, pris]]);
  log.getRange(START, 7).setValue(d.noter || '');
  log.getRange(START, 1, 1, 7).setBackground(null).setFontColor(null).setFontWeight('normal').setHorizontalAlignment(null);
  log.getRange(START, 1).setNumberFormat('0');
  log.getRange(START, 2).setNumberFormat('#,##0.00');

  // Indkøb: n nye rækker øverst, i den rækkefølge sættene blev tastet
  var n = saet.length;
  ind.insertRowsBefore(START, n);
  ind.getRange(START, 1, n, INDKOEB_KOLONNER).setBackground(null).setFontColor(null).setFontWeight('normal').setHorizontalAlignment(null);
  var bc = [], e = [], gm = [], ou = [];
  saet.forEach(function (s) {
    var nr = String(s.setnr).trim();
    bc.push([datoNr, /^\d+$/.test(nr) ? Number(nr) : nr]);
    e.push([Number(s.vaerdi)]);
    //       G (salg for), H OVP, I Sorteret, J Fotos, K Klar, L Stand, M Platform
    gm.push(['', s.ovp ? 'Ja' : 'Nej', false, false, false, '', '']);
    //       O, P, Q Noter, R Kilde, S Vejledning, T Komplet, U MappeID
    ou.push(['', '', '', s.kilde, false, false, '']);
  });
  ind.getRange(START, K.DATO, n, 2).setValues(bc);
  ind.getRange(START, K.VAERDI, n, 1).setValues(e);
  ind.getRange(START, K.SALGFOR, n, 7).setValues(gm);
  ind.getRange(START, K.SALGSDATO, n, 7).setValues(ou);
  saetValidering_(ind, START, n);
  ind.getRange(START, K.DATO, n, 2).setNumberFormat('0');
  ind.getRange(START, K.VAERDI, n, 1).setNumberFormat('[$€]#,##0.00');
  ind.getRange(START, K.KOEBSPRIS, n, 2).setNumberFormat('#,##0.00');
  SpreadsheetApp.flush();

  // Mapper til fotos + omdøbning ved dubletter
  synkMapper_(dato);
  return hentBatch_(dato);
}

// Læs alle rækker i Indkøb (værdier + viste værdier)
function laesIndkoeb_() {
  var ind = ark_(FANE.INDKOEB);
  var n = ind.getLastRow() - START + 1;
  if (n < 1) return { ark: ind, raekker: [] };
  var v = ind.getRange(START, 1, n, INDKOEB_KOLONNER).getValues();
  var raekker = [];
  for (var i = 0; i < v.length; i++) {
    if (v[i][K.DATO - 1] === '' || v[i][K.DATO - 1] === null) continue;
    raekker.push({ raekke: START + i, v: v[i] });
  }
  return { ark: ind, raekker: raekker };
}

function tilSaet_(r) {
  var v = r.v;
  var b = function (x) { return x === true; };
  return {
    sku: String(v[K.SKU - 1]),
    dato: String(v[K.DATO - 1]),
    setnr: String(v[K.SETNR - 1]),
    navn: String(v[K.NAVN - 1]),
    vaerdi: Number(v[K.VAERDI - 1]) || 0,
    koebspris: Math.round((Number(v[K.KOEBSPRIS - 1]) || 0) * 100) / 100,
    ovp: v[K.OVP - 1] === 'Ja',
    sorteret: b(v[K.SORTERET - 1]),
    fotos: b(v[K.FOTOS - 1]),
    klar: b(v[K.KLAR - 1]),
    stand: v[K.STAND - 1] === '' ? '' : String(v[K.STAND - 1]),
    platform: String(v[K.PLATFORM - 1] || ''),
    lagerstatus: String(v[K.LAGERSTATUS - 1] || ''),
    noter: String(v[K.NOTER - 1] || ''),
    kilde: String(v[K.KILDE - 1] || ''),
    vejledning: b(v[K.VEJLEDNING - 1]),
    komplet: b(v[K.KOMPLET - 1])
  };
}

function hentBatch_(dato) {
  var data = laesIndkoeb_();
  var saet = [];
  data.raekker.forEach(function (r) {
    if (String(r.v[K.DATO - 1]) !== dato) return;
    var s = tilSaet_(r);
    s.antalFotos = antalFotos_(r.v[K.MAPPEID - 1]);
    saet.push(s);
  });
  var pris = 0;
  var log = ark_(FANE.LOG);
  if (log.getLastRow() >= START) {
    var lv = log.getRange(START, 1, log.getLastRow() - START + 1, 2).getValues();
    for (var i = 0; i < lv.length; i++) if (String(lv[i][0]) === dato) { pris = Number(lv[i][1]); break; }
  }
  return { dato: dato, pris: pris, saet: saet };
}

function hentLager_() {
  return laesIndkoeb_().raekker.map(tilSaet_);
}

function findRaekke_(sku) {
  var data = laesIndkoeb_();
  for (var i = 0; i < data.raekker.length; i++) {
    if (String(data.raekker[i].v[K.SKU - 1]) === sku) return { ark: data.ark, r: data.raekker[i] };
  }
  throw fejl_('SKU ' + sku + ' findes ikke i Indkøb.');
}

// ---------- Klargøring ----------
function gemKlargoering_(d) {
  var f = findRaekke_(String(d.sku || ''));
  var ark = f.ark, rk = f.r.raekke;
  var stand = d.stand === '' || d.stand === null || d.stand === undefined ? '' : Number(d.stand);
  if (stand !== '' && !(stand >= 1 && stand <= 10)) throw fejl_('Stand skal være 1–10.');
  if (d.platform && PLATFORME.indexOf(d.platform) < 0) throw fejl_('Ukendt salgsplatform.');
  var fotos = f.r.v[K.FOTOS - 1] === true || antalFotos_(f.r.v[K.MAPPEID - 1]) > 0;
  var klar = d.klar === true;
  if (klar && !(d.sorteret === true && stand !== '' && fotos)) {
    throw fejl_('Klar til salg kræver: sorteret, stand og mindst ét foto.');
  }
  ark.getRange(rk, K.SORTERET).setValue(d.sorteret === true);
  ark.getRange(rk, K.FOTOS).setValue(fotos);
  ark.getRange(rk, K.KLAR).setValue(klar);
  ark.getRange(rk, K.STAND).setValue(stand);
  ark.getRange(rk, K.PLATFORM).setValue(d.platform || '');
  ark.getRange(rk, K.NOTER).setValue(d.noter || '');
  ark.getRange(rk, K.VEJLEDNING).setValue(d.vejledning === true);
  ark.getRange(rk, K.KOMPLET).setValue(d.komplet === true);
  SpreadsheetApp.flush();
  var r = findRaekke_(String(d.sku)).r;
  var s = tilSaet_(r);
  s.antalFotos = antalFotos_(r.v[K.MAPPEID - 1]);
  return s;
}

// ---------- Fotos og mapper ----------
function rodMappe_() {
  var id = PropertiesService.getScriptProperties().getProperty('ROD_MAPPE_ID');
  if (!id) throw fejl_('Fotomappe er ikke sat. Kør CTS → Opsæt testark.');
  return DriveApp.getFolderById(id);
}

function antalFotos_(mappeId) {
  if (!mappeId) return 0;
  try {
    var it = DriveApp.getFolderById(mappeId).getFiles(), n = 0;
    while (it.hasNext()) { if (/\.\d{2,}\.jpg$/i.test(it.next().getName())) n++; }
    return n;
  } catch (e) { return 0; }
}

// Opretter manglende mapper og omdøber mapper/fotos, hvis et SKU har skiftet navn (fx -a/-b).
function synkMapper_(dato) {
  var data = laesIndkoeb_();
  var rod = rodMappe_();
  data.raekker.forEach(function (r) {
    if (dato && String(r.v[K.DATO - 1]) !== dato) return;
    var sku = String(r.v[K.SKU - 1]);
    if (!sku) return;
    var id = r.v[K.MAPPEID - 1];
    var mappe = null;
    if (id) { try { mappe = DriveApp.getFolderById(id); } catch (e) { mappe = null; } }
    if (!mappe) {
      var it = rod.getFoldersByName(sku);
      mappe = it.hasNext() ? it.next() : rod.createFolder(sku);
      data.ark.getRange(r.raekke, K.MAPPEID).setValue(mappe.getId());
      return;
    }
    var gammel = mappe.getName();
    if (gammel === sku) return;
    mappe.setName(sku);
    var filer = mappe.getFiles();
    while (filer.hasNext()) {
      var fil = filer.next();
      var navn = fil.getName();
      if (navn.indexOf(gammel + '.') === 0) fil.setName(sku + navn.substring(gammel.length));
    }
  });
}

function uploadFoto_(d) {
  var sku = String(d.sku || '');
  if (!d.billede) throw fejl_('Intet billede.');
  var f = findRaekke_(sku);
  var id = f.r.v[K.MAPPEID - 1];
  var mappe = null;
  if (id) { try { mappe = DriveApp.getFolderById(id); } catch (e) { mappe = null; } }
  if (!mappe) {
    mappe = rodMappe_().createFolder(sku);
    f.ark.getRange(f.r.raekke, K.MAPPEID).setValue(mappe.getId());
  }
  // Samme upload sendt igen (genforsøg)? Så returneres den eksisterende fil.
  var hoejeste = 0, filer = mappe.getFiles(), uploadId = String(d.uploadId || '');
  while (filer.hasNext()) {
    var fil = filer.next();
    if (uploadId && fil.getDescription() === uploadId) {
      return { navn: fil.getName(), antalFotos: antalFotos_(mappe.getId()), gentaget: true };
    }
    var m = /\.(\d{2,})\.jpg$/i.exec(fil.getName());
    if (m) hoejeste = Math.max(hoejeste, Number(m[1]));
  }
  var nr = hoejeste + 1;
  var navn = sku + '.' + (nr < 10 ? '0' + nr : String(nr)) + '.jpg';
  var blob = Utilities.newBlob(Utilities.base64Decode(String(d.billede)), 'image/jpeg', navn);
  var ny = mappe.createFile(blob);
  if (uploadId) ny.setDescription(uploadId);
  f.ark.getRange(f.r.raekke, K.FOTOS).setValue(true);
  return { navn: navn, antalFotos: antalFotos_(mappe.getId()), gentaget: false };
}
