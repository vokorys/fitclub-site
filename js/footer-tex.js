/* Фон подвала рисуется кодом под точный размер плашки (с учётом плотности экрана): без растягивания картинки.
   Металл: шлифованная сталь с анизотропным бликом. Карбон: кованый карбон (хлопья) под лаком. */
(function () {
  var plate = document.querySelector('.foot-plate'); if (!plate) return;
  var cv = document.createElement('canvas'); cv.className = 'foot-cv'; cv.setAttribute('aria-hidden', 'true');
  plate.insertBefore(cv, plate.firstChild);
  var H = document.documentElement, last = '';
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function metal(g, w, h, r) {
    var cs = getComputedStyle(H), A = cs.getPropertyValue('--fm-a').trim() || '#1C1E22', Bc = cs.getPropertyValue('--fm-b').trim() || '#3A3E44', hc = (cs.getPropertyValue('--fm-h').trim() || '235,240,245') + ',';
    g.fillStyle = '#2A2D32'; g.fillRect(0, 0, w, h);
    var base = g.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, A); base.addColorStop(.45, Bc); base.addColorStop(1, A);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    /* шлифовка: тысячи тонких горизонтальных штрихов разной яркости и длины */
    var n = Math.round(w * h / 90);
    for (var i = 0; i < n; i++) {
      var y = r() * h, x = r() * w - w * .2, len = w * (.15 + r() * .9), a = r() * .09;
      g.fillStyle = r() < .5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + (a * 1.4) + ')';
      g.fillRect(x, y, len, r() < .8 ? 1 : 2);
    }
    /* анизотропные блики: вытянутые по горизонтали световые полосы */
    [[.30, .38, .32], [.72, .62, .18]].forEach(function (b) {
      g.save(); g.translate(w * b[0], h * b[1]); g.scale(w * .9 / h, 1);
      var rg = g.createRadialGradient(0, 0, 0, 0, 0, h * .7);
      rg.addColorStop(0, 'rgba(' + hc + b[2] + ')'); rg.addColorStop(1, 'rgba(' + hc + '0)');
      g.fillStyle = rg; g.fillRect(-h, -h, h * 2, h * 2); g.restore();
    });
  }
  function carbon(g, w, h, r) {
    g.fillStyle = '#0E0F11'; g.fillRect(0, 0, w, h);
    var s = Math.max(w, h), n = Math.min(9000, Math.round(w * h / 380));
    for (var i = 0; i < n; i++) {
      var x = r() * w, y = r() * h, L = s * (.012 + r() * .05), W = L * (.18 + r() * .4), a = r() * Math.PI;
      /* яркость хлопья зависит от угла волокна к свету: как у настоящего кованого карбона */
      var lit = Math.pow(Math.abs(Math.cos(a - .7)), 3), c = 14 + lit * 70 + r() * 10;
      g.save(); g.translate(x, y); g.rotate(a);
      var lg = g.createLinearGradient(-L, 0, L, 0);
      lg.addColorStop(0, 'rgb(' + (c * .55 | 0) + ',' + (c * .56 | 0) + ',' + (c * .6 | 0) + ')');
      lg.addColorStop(.5, 'rgb(' + (c | 0) + ',' + (c | 0) + ',' + (c * 1.05 | 0) + ')');
      lg.addColorStop(1, 'rgb(' + (c * .5 | 0) + ',' + (c * .5 | 0) + ',' + (c * .55 | 0) + ')');
      g.fillStyle = lg; g.beginPath();
      g.moveTo(-L, 0); g.lineTo(-L * .3, -W); g.lineTo(L * .6, -W * .7); g.lineTo(L, 0); g.lineTo(L * .2, W); g.lineTo(-L * .7, W * .8); g.closePath(); g.fill();
      /* волокна внутри хлопья */
      if (i % 3 === 0) {
        g.strokeStyle = 'rgba(255,255,255,' + (.02 + lit * .05) + ')'; g.lineWidth = 1; g.beginPath();
        for (var k = -W; k < W; k += 3) { g.moveTo(-L * .8, k * .7); g.lineTo(L * .8, k * .7); }
        g.stroke();
      }
      g.restore();
    }
    /* лак: мягкий диагональный блик и глубина по краям */
    var cl = g.createLinearGradient(0, 0, w, h);
    cl.addColorStop(0, 'rgba(255,255,255,0)'); cl.addColorStop(.42, 'rgba(255,255,255,.07)'); cl.addColorStop(.5, 'rgba(255,255,255,.16)'); cl.addColorStop(.58, 'rgba(255,255,255,.05)'); cl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cl; g.fillRect(0, 0, w, h);
    var vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  }
  function draw() {
    var r = plate.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr), kind = H.getAttribute('data-footk') || 'metal', th = (H.getAttribute('data-theme') || '') + (H.getAttribute('data-acc') || ''), key = w + 'x' + h + kind + th;
    if (!w || !h || key === last) return; last = key;
    cv.width = w; cv.height = h;
    if (kind !== 'metal' && kind !== 'carbon') return;
    var g = cv.getContext('2d'), rr = rnd(kind === 'carbon' ? 7 : 3);
    (kind === 'carbon' ? carbon : metal)(g, w, h, rr);
  }
  var t; function soon() { clearTimeout(t); t = setTimeout(draw, 120); }
  if ('ResizeObserver' in window) new ResizeObserver(soon).observe(plate); else addEventListener('resize', soon);
  new MutationObserver(soon).observe(H, { attributes: true, attributeFilter: ['data-footk', 'data-theme'] });
  draw();
})();
