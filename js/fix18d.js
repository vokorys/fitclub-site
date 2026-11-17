/* Правки владельца 18.11.2026 (день). Подключается последним.
   п.3 плашка статуса, п.4 живые кнопки, п.11 эффекты E1..E12, п.13 проявление блоков, п.14 форма. */
(function () {
  'use strict';
  var D = document, H = D.documentElement, FX = window.FX;
  var RM = H.classList.contains('rm'), SHOT = H.classList.contains('shot');
  var FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Чтобы убрать эффект из п.11: добавить его номер сюда, например OFF = [5, 9] */
  var OFF = [1, 2, 4, 5, 6, 7, 8, 9, 10];  /* 18.11 ночь: отключены тяжёлые (тормоза на прокрутке и при наведении): 1 параллакс видео, 2 3D-наклон фото, 4 дрейф ткани, 5 зум плиток, 6 наклон лент, 7 блик логотипа, 8, 9 параллакс карточек, 10 переливы */
  OFF.forEach(function (n) { H.classList.add('no-fx-' + n); });

  /* ---------- п.14. плавающие подписи: поле заполнено, значит подпись наверху ---------- */
  var fls = $$('.fl');
  function syncFl() { fls.forEach(function (f) { var i = $('input', f); f.classList.toggle('filled', !!(i && i.value)); }); }
  fls.forEach(function (f) { var i = $('input', f); if (i) ['input', 'change', 'blur'].forEach(function (ev) { i.addEventListener(ev, syncFl); }); });
  syncFl(); setInterval(syncFl, 500);  /* промокод подставляется кодом при копировании, события нет */

  /* ---------- п.13. проявление блоков при прокрутке вниз и вверх ---------- */
  if (!RM && !SHOT && 'IntersectionObserver' in window) {
    var RV = ['.fit .fit-list', '.fit .note-big', '.inside .inside-txt', '.inside .bubbles', '.weeks .weeks-head', '.weeks .day', '.weeks .weekly',
      '.katya .katya-ph', '.katya .katya-txt', '.proof .ba-tabs', '.proof .ba-mode', '.proof .ba', '.proof .bacar', '.proof .ba-plaque',
      '.reviews .rv-track', '.reviews .small-note', '.gallery .gal-head', '.gallery .lane', '.food .food-txt', '.gift .gift-head', '.gift .gb',
      '.price .price-main', '.price .price-side', '.after .steps', '.formsc .form-head', '.formsc .form-card', '.faq .faq-list',
      '.final .lead', '.final .btn', '.foot .foot-plate'];
    var dirUp = false, dy0 = scrollY;
    addEventListener('scroll', function () { var y = scrollY; if (Math.abs(y - dy0) > 2) { dirUp = y < dy0; dy0 = y; } }, { passive: true });
    var rvIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) { el.classList.toggle('rvl-up', dirUp); el.classList.add('rvl-go'); }   /* въезжает сверху при прокрутке вверх, снизу при прокрутке вниз */
        else { el.classList.remove('rvl-go'); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
    RV.forEach(function (sel, i) { var el = $(sel); if (!el) return; el.classList.add('rvl'); el.style.setProperty('--rd', ((i % 2) * .08) + 's'); rvIo.observe(el); });
  }

  if (RM || SHOT) return;

  /* ---------- п.3. плашка статуса (режимы «идёт» и «закрыт»): всплеск шариков, как у «Набор открыт» ---------- */
  if (FINE && FX) {
    D.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var t = e.target.closest && e.target.closest('.timer-note');
      if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      FX.burst(t, 9, '');
    });
  }

  if (FINE) (function () {

  /* ---------- п.4. живые кнопки: притяжение к курсору, наклон, нажатие, пружина, свет по краю ---------- */
  var items = $$('.btn,.foot-btn').filter(function (el) { return !el.classList.contains('sticky'); }).map(function (el) {
    return { el: el, x: 0, y: 0, rx: 0, ry: 0, s: 1, vx: 0, vy: 0, vrx: 0, vry: 0, vs: 0, tx: 0, ty: 0, trx: 0, try_: 0, ts: 1, run: false, down: false };
  });
  var raf = 0, last = 0;
  function frame(t) {
    var dt = Math.min(2.2, (t - (last || t)) / 16.7); last = t; var busy = false;
    items.forEach(function (it) {
      if (!it.run) return;
      var k = .16 * dt, d = Math.pow(.74, dt);          /* пружина с перелётом */
      it.vx = (it.vx + (it.tx - it.x) * k) * d; it.x += it.vx * dt;
      it.vy = (it.vy + (it.ty - it.y) * k) * d; it.y += it.vy * dt;
      it.vrx = (it.vrx + (it.trx - it.rx) * k) * d; it.rx += it.vrx * dt;
      it.vry = (it.vry + (it.try_ - it.ry) * k) * d; it.ry += it.vry * dt;
      it.vs = (it.vs + (it.ts - it.s) * k * 1.1) * d; it.s += it.vs * dt;
      var calm = Math.abs(it.tx - it.x) + Math.abs(it.ty - it.y) + Math.abs(it.trx - it.rx) + Math.abs(it.try_ - it.ry) + Math.abs(it.ts - it.s) * 10 + Math.abs(it.vx) + Math.abs(it.vy) + Math.abs(it.vs) * 10 < .05;
      if (calm && it.tx === 0 && it.ty === 0 && it.ts === 1) { it.run = false; it.x = it.y = it.rx = it.ry = 0; it.s = 1; it.el.style.transform = ''; return; }
      it.el.style.transform = 'translate3d(' + it.x.toFixed(2) + 'px,' + it.y.toFixed(2) + 'px,0) perspective(520px) rotateX(' + it.rx.toFixed(2) + 'deg) rotateY(' + it.ry.toFixed(2) + 'deg) scale(' + it.s.toFixed(4) + ')';
      busy = true;
    });
    raf = busy ? requestAnimationFrame(frame) : 0; if (!busy) last = 0;
  }
  function kick(it) { it.run = true; if (!raf) raf = requestAnimationFrame(frame); }
  var PAD = 52;
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    items.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      if (!r.width || r.bottom < -120 || r.top > innerHeight + 120) { if (it.tx || it.ty || it.ts !== 1) { it.tx = it.ty = it.trx = it.try_ = 0; it.ts = 1; kick(it); } return; }
      var cx = r.left + r.width / 2 - it.x, cy = r.top + r.height / 2 - it.y, dx = e.clientX - cx, dy = e.clientY - cy;
      var inside = Math.abs(dx) <= r.width / 2 + PAD && Math.abs(dy) <= r.height / 2 + PAD, over = Math.abs(dx) <= r.width / 2 && Math.abs(dy) <= r.height / 2;
      var maxX = r.width < 320 ? 14 : 9, maxY = 10;
      if (inside) {
        it.tx = clamp(dx * .26, -maxX, maxX); it.ty = clamp(dy * .34, -maxY, maxY);
        it.try_ = clamp(dx / (r.width / 2) * 6, -8, 8); it.trx = clamp(-dy / (r.height / 2) * 5, -6, 6);
        it.ts = it.down ? .93 : (over ? 1.045 : 1.02);
      } else if (it.tx || it.ty || it.ts !== 1) { it.tx = it.ty = it.trx = it.try_ = 0; it.ts = 1; }
      else return;
      kick(it);
    });
  }, { passive: true });
  addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    var b = e.target.closest && e.target.closest('.btn,.foot-btn'); if (!b) return;
    items.forEach(function (it) { if (it.el === b) { it.down = true; it.ts = .93; b.classList.add('pressed'); kick(it); } });
  });
  function release() {
    items.forEach(function (it) { if (it.down) { it.down = false; it.el.classList.remove('pressed'); it.ts = 1.06; kick(it); setTimeout(function () { it.ts = 1.045; kick(it); }, 90); } });
  }
  addEventListener('pointerup', release); addEventListener('pointercancel', release);
  D.addEventListener('mouseleave', function () { items.forEach(function (it) { it.tx = it.ty = it.trx = it.try_ = 0; it.ts = 1; kick(it); }); });

  })();  /* конец блока кнопок (только мышь) */

  /* ---------- п.11. эффекты ---------- */
  var on = function (n) { return OFF.indexOf(n) < 0; };

  /* E1 параллакс видео в первом экране, E2 наклон фото Кати, E9 параллакс карточки карусели */
  function aim(el, fn) {
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = el.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--gx', (nx + .5) * 100 + '%'); el.style.setProperty('--gy', (ny + .5) * 100 + '%'); fn(el, nx, ny);
    });
    el.addEventListener('pointerleave', function () { fn(el, 0, 0); });
  }
  var hv = $('.hero-video');
  if (hv && on(1)) aim(hv, function (el, nx, ny) { el.style.setProperty('--px', (-nx * 18).toFixed(1) + 'px'); el.style.setProperty('--py', (-ny * 18).toFixed(1) + 'px'); });
  var kp = $('.katya-ph');
  if (kp && on(2)) aim(kp, function (el, nx, ny) { el.style.setProperty('--ry', (nx * 9).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-ny * 7).toFixed(2) + 'deg'); });
  var bs = $('#bacarStage');
  if (bs && on(9)) bs.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var c = $('.bacar-card.cur', bs); if (!c) return; var r = c.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    c.style.setProperty('--px', clamp(-nx * 22, -14, 14).toFixed(1) + 'px'); c.style.setProperty('--py', clamp(-ny * 22, -14, 14).toFixed(1) + 'px');
  });

  /* E3 полоса прогресса прокрутки, E4 дрейф ткани, E6 наклон лент от скорости прокрутки */
  var prog = null;
  if (on(3)) { prog = D.createElement('div'); prog.className = 'fx-prog'; prog.setAttribute('aria-hidden', 'true'); D.body.appendChild(prog); }
  var lastY = scrollY, sk = 0, skRun = false;
  function scrollFx() {
    var h = D.documentElement.scrollHeight - innerHeight, y = scrollY;
    if (prog) prog.style.setProperty('--sp', h > 0 ? (y / h).toFixed(4) : 0);
    if (on(4)) H.style.setProperty('--bgy', (h > 0 ? -(y / h - .5) * 56 : 0).toFixed(1) + 'px');  /* ±28 px, запас даёт scale 1.08 */
    if (on(6)) {
      var v = y - lastY; lastY = y; sk += (clamp(v * .12, -5, 5) - sk) * .5;
      H.style.setProperty('--sk', sk.toFixed(2) + 'deg');
      if (!skRun) { skRun = true; requestAnimationFrame(decay); }
    }
  }
  function decay() { sk *= .88; H.style.setProperty('--sk', sk.toFixed(2) + 'deg'); if (Math.abs(sk) > .02) requestAnimationFrame(decay); else { skRun = false; H.style.setProperty('--sk', '0deg'); } }
  addEventListener('scroll', scrollFx, { passive: true }); scrollFx();
})();
