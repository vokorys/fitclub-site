/* Правки владельца 18.11.2026: круги «идут на зрителя» с инерцией, курсор-капля разбивается о карточки,
   всплески шариков на остальных мелочах. Только мышь; без движения при reduced-motion и в режиме скриншотов. */
(function () {
  'use strict';
  var D = document, H = D.documentElement, FX = window.FX;
  var RM = H.classList.contains('rm'), SHOT = H.classList.contains('shot');
  var FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (RM || SHOT || !FINE || !FX) return;
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }

  /* ---- 6. большие круги: при наведении плавно увеличиваются, будто идут на зрителя (пружина с лёгким перелётом) ---- */
  $$('.bub').forEach(function (b) {
    var s = 1, v = 0, hov = false, run = false;
    var big = b.classList.contains('b1') ? .1 : .07;
    function target() { return (b.classList.contains('on') ? 1.06 : 1) + (hov ? big : 0); }
    function step() {
      var t = target(); v = v * .66 + (t - s) * .09; s += v;  /* инерция: разгон, перелёт, успокоение */
      b.style.scale = s.toFixed(4);
      if (Math.abs(t - s) > .0005 || Math.abs(v) > .0005) requestAnimationFrame(step); else { s = t; b.style.scale = t; run = false; }
    }
    function kick() { if (!run) { run = true; requestAnimationFrame(step); } }
    b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; hov = true; b.classList.add('approach'); kick(); });
    b.addEventListener('pointerleave', function () { hov = false; b.classList.remove('approach'); kick(); });
    new MutationObserver(kick).observe(b, { attributes: true, attributeFilter: ['class'] });
  });

  /* ---- 7. курсор-шарик разбивается ТОЛЬКО о понятные объекты (правка 18.11 день, п.5):
     кнопки, кружки (маркеры списка, номера «Как записаться», большие круги), плашки-статусы.
     Тексты, заголовки, подчёркивания и обычные карточки его не трогают. ---- */
  var cur = D.querySelector('.cursor'), mx = -100, my = -100, lastHit = null;
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  var HIT = '.btn,.foot-btn,.code,.ba-tabs button,.ba-mode button,.bacar-ar,.seg label,.bub,.fit-dot,.step b,.hero-tag,.timer-note';
  window.FC_HIT = HIT;
  D.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var c = e.target.closest && e.target.closest(HIT);
    if (c === lastHit) return;
    lastHit = c;
    if (cur) cur.classList.toggle('hit', !!c);          /* шарик исчезает, пока мышь на объекте, и собирается заново, когда ушла */
    if (!c) return;
    var now = Date.now(); if (c._sp && now - c._sp < 1200) return; c._sp = now;
    var dark = !!c.closest('.gift,.foot'), x = e.clientX || mx, y = e.clientY || my, n = 9 + Math.round(Math.random() * 4);
    for (var i = 0; i < n; i++) {
      var a = -Math.PI * (0.05 + Math.random() * .9), sp = 2 + Math.random() * 4.2;  /* веер вверх и в стороны */
      FX.spawn(x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .36, size: 3 + Math.random() * 6, life: 650 + Math.random() * 300, floor: y + 30 + Math.random() * 30, cls: dark ? 'gold' : 'drop' });
    }
  }, { passive: true });
  D.addEventListener('mouseleave', function () { lastHit = null; if (cur) cur.classList.remove('hit'); });

  /* ---- 8. маленькие всплески на остальных мелочах (номера и круги уже играют в live.js) ---- */
  var SMALL = '.ticks li,.katya-facts p,.price-num,.hero-tag,.seg label,.goals label,.foot-qr a,.tn,.ba-nums li,.bacar-dots button,.lever-stops button';
  D.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    var t = e.target.closest && e.target.closest(SMALL);
    if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
    FX.burst(t, 5, t.closest('.gift,.foot') ? 'gold' : '');
  });
})();
