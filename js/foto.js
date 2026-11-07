// Kamera, nedskalering til JPG og upload-kø med genforsøg.
(function (rod) {
  'use strict';

  var MAKS_SIDE = 3000;   // længste side i pixels (Thomas 07-11: 3000 px / 92 %)
  var KVALITET = 0.92;    // JPG-kvalitet

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
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 4032 }, height: { ideal: 3024 } }
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

  var MAKS_KILDE = 4032; // råbillede før beskæring (holder hukommelsen nede på iPhone)

  function tilLaerred(kilde, b, h, maks) {
    var s = Math.min(1, maks / Math.max(b, h));
    var c = document.createElement('canvas');
    c.width = Math.round(b * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(kilde, 0, 0, c.width, c.height);
    return c;
  }

  function tilJpg(kilde, b, h) {
    var c = tilLaerred(kilde, b, h, MAKS_SIDE);
    var dataUrl = c.toDataURL('image/jpeg', KVALITET);
    return { dataUrl: dataUrl, base64: dataUrl.split(',')[1], bredde: c.width, hoejde: c.height };
  }

  // Råbillede fra live-kameraet (til beskæring)
  function tagRaa(video) {
    if (!video.videoWidth) throw new Error('Kameraet er ikke klar endnu.');
    return tilLaerred(video, video.videoWidth, video.videoHeight, MAKS_KILDE);
  }

  // Fil fra <input type=file> (også HEIC på iPhone – Safari afkoder den) → råbillede
  function filTilRaa(fil) {
    return new Promise(function (ok, fejl) {
      var url = URL.createObjectURL(fil);
      var img = new Image();
      img.onload = function () {
        try { ok(tilLaerred(img, img.naturalWidth, img.naturalHeight, MAKS_KILDE)); } catch (e) { fejl(e); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { URL.revokeObjectURL(url); fejl(new Error('Billedet kunne ikke læses.')); };
      img.src = url;
    });
  }

  // Beskær råbilledet til {x,y,w,h} og lav færdig JPG (længste side maks. 3000 px)
  function beskaerTilJpg(raa, r) {
    r = r || { x: 0, y: 0, w: raa.width, h: raa.height };
    var c = document.createElement('canvas');
    c.width = Math.max(1, r.w); c.height = Math.max(1, r.h);
    c.getContext('2d').drawImage(raa, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
    return tilJpg(c, c.width, c.height);
  }

  // Lille miniature til visning i appen (gemmes sammen med fotoet i udbakken)
  function miniature(dataUrl) {
    return new Promise(function (ok) {
      var img = new Image();
      img.onload = function () { ok(tilLaerred(img, img.naturalWidth, img.naturalHeight, 240).toDataURL('image/jpeg', 0.7)); };
      img.onerror = function () { ok(''); };
      img.src = dataUrl;
    });
  }

  rod.Foto = { startKamera: startKamera, stopKamera: stopKamera, kameraKoerer: kameraKoerer, tagRaa: tagRaa, filTilRaa: filTilRaa, beskaerTilJpg: beskaerTilJpg, miniature: miniature };
})(this);
