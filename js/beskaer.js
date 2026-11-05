// Fri beskæring af ét foto: træk i hjørner/kanter, træk inde i rammen for at flytte.
// Beskaer.aabn(kilde) → Promise med {x, y, w, h} i kildens pixels, eller null ved "Tag om".
(function (rod) {
  'use strict';

  var MIN = 40; // mindste rammestørrelse på skærmen (px)
  var el, flade, lærred, ramme, kilde, skala, visB, visH, r, svarFn, traek;

  function byg() {
    el = document.createElement('div');
    el.className = 'beskaer'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Beskær foto');
    el.innerHTML =
      '<div class="beskaer-top">Træk i hjørnerne for at beskære</div>' +
      '<div class="beskaer-flade"><canvas></canvas>' +
      '<div class="b-ramme">' +
      ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(function (h) { return '<i data-h="' + h + '"></i>'; }).join('') +
      '</div></div>' +
      '<div class="beskaer-knapper">' +
      '<button type="button" class="knap" data-b="om">Tag om</button>' +
      '<button type="button" class="knap" data-b="hele">Hele billedet</button>' +
      '<button type="button" class="knap knap-gul" data-b="ok">Brug foto</button></div>';
    document.body.appendChild(el);
    flade = el.querySelector('.beskaer-flade');
    lærred = el.querySelector('canvas');
    ramme = el.querySelector('.b-ramme');

    flade.addEventListener('pointerdown', start);
    flade.addEventListener('pointermove', flyt);
    flade.addEventListener('pointerup', slut);
    flade.addEventListener('pointercancel', slut);
    el.querySelector('[data-b="om"]').addEventListener('click', function () { luk(null); });
    el.querySelector('[data-b="hele"]').addEventListener('click', function () { r = { x: 0, y: 0, w: visB, h: visH }; tegn(); });
    el.querySelector('[data-b="ok"]').addEventListener('click', function () {
      luk({
        x: Math.round(r.x / skala), y: Math.round(r.y / skala),
        w: Math.round(r.w / skala), h: Math.round(r.h / skala)
      });
    });
    window.addEventListener('resize', function () { if (!el.hidden) layout(true); });
  }

  function layout(behold) {
    var kb = kilde.width, kh = kilde.height;
    var maksB = flade.clientWidth, maksH = flade.clientHeight;
    var gl = behold && r ? { x: r.x / skala, y: r.y / skala, w: r.w / skala, h: r.h / skala } : null;
    skala = Math.min(maksB / kb, maksH / kh);
    visB = Math.round(kb * skala); visH = Math.round(kh * skala);
    lærred.width = visB; lærred.height = visH;
    lærred.style.width = visB + 'px'; lærred.style.height = visH + 'px';
    lærred.style.left = Math.round((maksB - visB) / 2) + 'px';
    lærred.style.top = Math.round((maksH - visH) / 2) + 'px';
    lærred.getContext('2d').drawImage(kilde, 0, 0, visB, visH);
    if (gl) r = { x: gl.x * skala, y: gl.y * skala, w: gl.w * skala, h: gl.h * skala };
    else { var m = Math.round(Math.min(visB, visH) * 0.06); r = { x: m, y: m, w: visB - 2 * m, h: visH - 2 * m }; }
    tegn();
  }

  function tegn() {
    ramme.style.left = (parseFloat(lærred.style.left) + r.x) + 'px';
    ramme.style.top = (parseFloat(lærred.style.top) + r.y) + 'px';
    ramme.style.width = r.w + 'px';
    ramme.style.height = r.h + 'px';
  }

  function punkt(e) {
    var b = lærred.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  }

  function start(e) {
    var h = e.target.getAttribute && e.target.getAttribute('data-h');
    var p = punkt(e);
    var inde = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    if (!h && !inde) return;
    e.preventDefault();
    flade.setPointerCapture(e.pointerId);
    traek = { h: h || 'flyt', p: p, r: { x: r.x, y: r.y, w: r.w, h: r.h }, id: e.pointerId };
  }

  function flyt(e) {
    if (!traek || e.pointerId !== traek.id) return;
    e.preventDefault();
    var p = punkt(e), dx = p.x - traek.p.x, dy = p.y - traek.p.y, o = traek.r, h = traek.h;
    var x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
    if (h === 'flyt') {
      var nx = Math.max(0, Math.min(visB - o.w, o.x + dx));
      var ny = Math.max(0, Math.min(visH - o.h, o.y + dy));
      r = { x: nx, y: ny, w: o.w, h: o.h }; tegn(); return;
    }
    if (h.indexOf('w') >= 0) x1 = Math.max(0, Math.min(x2 - MIN, o.x + dx));
    if (h.indexOf('e') >= 0) x2 = Math.min(visB, Math.max(x1 + MIN, o.x + o.w + dx));
    if (h.indexOf('n') >= 0) y1 = Math.max(0, Math.min(y2 - MIN, o.y + dy));
    if (h.indexOf('s') >= 0) y2 = Math.min(visH, Math.max(y1 + MIN, o.y + o.h + dy));
    r = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }; tegn();
  }

  function slut(e) { if (traek && e.pointerId === traek.id) traek = null; }

  function luk(v) {
    el.hidden = true;
    document.body.classList.remove('laast');
    var fn = svarFn; svarFn = null;
    if (fn) fn(v);
  }

  function aabn(k) {
    if (!el) byg();
    kilde = k; r = null;
    el.hidden = false;
    document.body.classList.add('laast');
    return new Promise(function (ok) {
      svarFn = ok;
      requestAnimationFrame(function () { layout(false); });
    });
  }

  rod.Beskaer = { aabn: aabn, erAaben: function () { return !!(el && !el.hidden); } };
})(this);
