// Kamera, nedskalering til JPG og upload-kø med genforsøg.
(function (rod) {
  'use strict';

  var MAKS_SIDE = 1600;   // længste side i pixels
  var KVALITET = 0.85;    // JPG-kvalitet

  // ---------- Live-kamera ----------
  var stroem = null;

  async function startKamera(video) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Live-kamera understøttes ikke her. Brug "Tag foto med telefonens kamera".');
    }
    stopKamera(video);
    try {
      stroem = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }
      });
    } catch (e) { e.trin = 'tilladelse'; throw e; }
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.srcObject = stroem;
    // play() kan afvises af iOS uden at kameraet er blokeret – videoen har autoplay, så det ignoreres
    try { await video.play(); } catch (e) { /* ignorer */ }
    return true;
  }

  function stopKamera(video) {
    if (stroem) { stroem.getTracks().forEach(function (t) { t.stop(); }); stroem = null; }
    if (video) video.srcObject = null;
  }

  function kameraKoerer() { return !!(stroem && stroem.active); }

  function tilJpg(kilde, b, h) {
    var s = Math.min(1, MAKS_SIDE / Math.max(b, h));
    var c = document.createElement('canvas');
    c.width = Math.round(b * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(kilde, 0, 0, c.width, c.height);
    var dataUrl = c.toDataURL('image/jpeg', KVALITET);
    return { dataUrl: dataUrl, base64: dataUrl.split(',')[1], bredde: c.width, hoejde: c.height };
  }

  function tagBillede(video) {
    if (!video.videoWidth) throw new Error('Kameraet er ikke klar endnu.');
    return tilJpg(video, video.videoWidth, video.videoHeight);
  }

  // Fil fra <input type=file> (også HEIC på iPhone – Safari afkoder den) → JPG
  function filTilJpg(fil) {
    return new Promise(function (ok, fejl) {
      var url = URL.createObjectURL(fil);
      var img = new Image();
      img.onload = function () {
        try { ok(tilJpg(img, img.naturalWidth, img.naturalHeight)); } catch (e) { fejl(e); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { URL.revokeObjectURL(url); fejl(new Error('Billedet kunne ikke læses.')); };
      img.src = url;
    });
  }

  // ---------- Upload-kø (ét foto ad gangen) ----------
  function Koe(sendFn, paaAendring) {
    this.poster = [];
    this.koerer = false;
    this.send = sendFn;
    this.paaAendring = paaAendring || function () {};
  }
  Koe.prototype.tilfoej = function (sku, jpg) {
    var post = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      sku: sku, jpg: jpg, status: 'venter', forsoeg: 0, navn: '', fejl: ''
    };
    this.poster.push(post);
    this.paaAendring(post);
    this.koer();
    return post;
  };
  Koe.prototype.proevIgen = function (id) {
    var p = this.poster.find(function (x) { return x.id === id; });
    if (p && p.status === 'fejl') { p.status = 'venter'; p.forsoeg = 0; p.fejl = ''; this.paaAendring(p); this.koer(); }
  };
  Koe.prototype.ventende = function () {
    return this.poster.filter(function (p) { return p.status !== 'ok' && p.status !== 'fejl'; }).length;
  };
  Koe.prototype.koer = async function () {
    if (this.koerer) return;
    this.koerer = true;
    try {
      for (;;) {
        var p = this.poster.find(function (x) { return x.status === 'venter'; });
        if (!p) break;
        p.status = 'sender'; this.paaAendring(p);
        try {
          var svar = await this.send(p);
          p.status = 'ok'; p.navn = svar.navn; p.svar = svar; p.jpg.base64 = null; // frigør hukommelse
        } catch (e) {
          p.forsoeg++;
          if (e.fraServer || p.forsoeg >= 4) { p.status = 'fejl'; p.fejl = e.message; }
          else {
            p.status = 'venter'; p.fejl = 'Dårlig forbindelse – prøver igen …';
            this.paaAendring(p);
            await new Promise(function (r) { setTimeout(r, 2000 * Math.pow(2, p.forsoeg - 1)); });
          }
        }
        this.paaAendring(p);
      }
    } finally { this.koerer = false; }
  };

  rod.Foto = { startKamera: startKamera, stopKamera: stopKamera, kameraKoerer: kameraKoerer, tagBillede: tagBillede, filTilJpg: filTilJpg, Koe: Koe };
})(this);
