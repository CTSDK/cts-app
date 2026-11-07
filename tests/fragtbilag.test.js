// Test af fragtbilag-læseren i maskinrummet (MIME-læser + udtræk af firma/ordrenr/dato).
// Kør: node tests/fragtbilag.test.js [sti/til/rigtig.eml]  (uden sti bruges et opdigtet eksempel)
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const Utilities = {
  base64Decode: s => Array.from(Buffer.from(s, 'base64')).map(x => x > 127 ? x - 256 : x),
  newBlob: (data, type, navn) => {
    const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data.map(x => x & 255));
    return { getDataAsString: cs => new TextDecoder(cs || 'utf-8').decode(buf), getBytes: () => Array.from(buf), navn, type,
      getAs: t => ({ type: t, setName() { return this; } }), setName() { return this; } };
  },
  formatDate: () => '07-11-2026'
};
const ctx = { Utilities, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8'), ctx);

const b64 = s => Buffer.from(s).toString('base64').replace(/(.{76})/g, '$1\n');
const indre = (emne, html, pdfNavn) => [
  'Subject: ' + emne, 'Content-Type: multipart/mixed; boundary="IND"', '', '--IND',
  'Content-Type: text/html; charset="utf-8"', 'Content-Transfer-Encoding: base64', '', b64(html), '--IND',
  'Content-Type: application/pdf; name="' + pdfNavn + '"', 'Content-Transfer-Encoding: base64', '', b64('%PDF-1.4 test'), '--IND--', ''].join('\r\n');
const ydre = (...dele) => ['Subject: =?utf-8?Q?Fragt_f=C3=A6rdig?=', 'Content-Type: multipart/mixed; boundary="YD"', '', '--YD',
  'Content-Type: text/plain; charset="utf-8"', 'Content-Transfer-Encoding: quoted-printable', '', 'Hej =C3=A6=C3=B8=C3=A5', '',
  ...dele.flatMap(d => ['--YD', 'Content-Type: message/rfc822', '', d]), '--YD--', ''].join('\r\n');

const cr = indre('Tak for din bestilling', '<div>CoolRunner</div><th>Dato:</th><td>05/10-2026 09:42:02</td><th>Ordrenummber:</th><td>000123456789</td>', '370722.pdf');
const gls = indre('Faktura 21000001 - ordre 4000001', '<p>Hermed fremsendes faktura 21000001 til din ordre 4000001</p><p>GLS Denmark A/S</p>', '21000001.pdf');
const kredit = indre('Kreditnota 5000001 - returordre 2000001', '<p>GLS Denmark A/S kreditnota 5000001 returordre 2000001</p>', 'k.pdf');
const mails = ctx.emlMails_(ydre(cr, gls, kredit));
assert.strictEqual(ctx.mimeOrd_('=?utf-8?Q?Fragt_f=C3=A6rdig?='), 'Fragt færdig');
const navne = mails.flatMap(m => ctx.fragtBilag_(m).map(b => b.navn));
console.log(navne);
assert.deepStrictEqual(Array.from(navne), ['CoolRunner 000123456789 261005.pdf', 'GLS 4000001 faktura 21000001.pdf', 'GLS kreditnota 2000001 faktura 5000001.pdf']);
const f = ctx.fragtInfo_('GLS\nOrdrenummer: 4246792\nKøbsdato: 12/10/2026');
assert.deepStrictEqual([f.firma, f.ordre, f.dato], ['GLS', '4246792', '261012']);

if (process.argv[2]) {   // rigtig mail (ligger ikke i GitHub)
  const alle = ctx.emlMails_(fs.readFileSync(process.argv[2], 'utf8'));
  const res = alle.map(m => ctx.fragtBilag_(m).map(b => b.navn)).flat();
  console.log('mails:', alle.length, 'bilag:', res.length, 'unikke:', new Set(res).size);
  console.log(res.slice(0, 5).join('\n'));
}
console.log('fragtbilag: alle tests OK');
// GLS-faktura vedhæftet direkte (uden mailtekst)
const direkte = ctx.fragtBilag_({ emne: 'x', tekst: 'Hej', html: '', pdf: [{ navn: 'Faktura 21803097 - ordre 4246792.pdf', blob: {} }, { navn: 'andet.pdf', blob: {} }] });
assert.deepStrictEqual(Array.from(direkte.map(b => b.navn)), ['GLS 4246792 faktura 21803097.pdf']);
console.log('fragtbilag (direkte GLS-PDF): OK');
assert.strictEqual(ctx.fragtInfo_('GLS\nOrdrenummer: 2800305\nKøbsdato: 03/25/2025').dato, '250325');
console.log('fragtbilag (amerikansk dato): OK');
