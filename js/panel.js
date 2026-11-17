/* Панель вариантов (тема, знак FC, тонкая настройка), знак FC из glyphs.js, курсор-точка, отклик кнопок, свет на подвале */
(function () {
  var D = document, H = D.documentElement;
  var KEYS = ['theme', 'mark', 'logo', 'bg', 'acc', 'foot'];
  var DEF = { theme: 'burg', mark: 'svyazka', logo: 'flat', bg: 'silk', acc: 'auto', foot: 'carbon' };   /* утверждённый стиль */
  var btn = D.getElementById('vpBtn'), vp = D.getElementById('vp');

  /* подвал «как в теме»: материал берётся из токена темы --tfoot */
  function footk() {
    var f = H.getAttribute('data-foot') || 'auto';
    if (f === 'auto') f = (getComputedStyle(H).getPropertyValue('--tfoot') || 'metal').trim() || 'metal';
    H.setAttribute('data-footk', f);
  }
  function mark() {
    [].forEach.call(vp.querySelectorAll('.vp-seg'), function (s) {
      var k = s.getAttribute('data-k'), cur = H.getAttribute('data-' + k) || DEF[k];
      [].forEach.call(s.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === cur ? 'true' : 'false'); });
    });
  }
  function save() { var o = {}; KEYS.forEach(function (k) { o[k] = H.getAttribute('data-' + k); }); try { localStorage.setItem('fc7v3', JSON.stringify(o)); } catch (e) {} }
  function apply(k, v) { H.classList.add('vswitch'); H.setAttribute('data-' + k, v); footk(); if (k === 'mark') logos(); mark(); save(); setTimeout(function () { H.classList.remove('vswitch'); }, 700); }
  function open(o) { vp.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
  btn.addEventListener('click', function () { open(vp.hidden); });
  vp.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-vp-close')) { open(false); btn.focus(); return; }
    if (b.hasAttribute('data-vp-reset')) { KEYS.forEach(function (k) { H.setAttribute('data-' + k, DEF[k]); }); footk(); logos(); mark(); save(); return; }
    var s = b.closest('.vp-seg'); if (s) apply(s.getAttribute('data-k'), b.getAttribute('data-v'));
  });
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !vp.hidden) { open(false); btn.focus(); } });
  KEYS.forEach(function (k) { if (!H.getAttribute('data-' + k)) H.setAttribute('data-' + k, DEF[k]); });
  footk(); mark();

  /* ---- знак FC: «Буквы» или один из 6 рисунков glyphs.js; объёмный = выдавливание + свет ---- */
  function svgFor(v, uid) {
    var pad = 2, w = v.w + pad * 2 + 6, h = v.h + pad * 2 + 6, ex = '';
    for (var i = 6; i >= 1; i--) ex += '<path class="m-ex" transform="translate(' + (i * .55) + ' ' + (i * .8) + ')" d="' + v.d + '"/>';
    return '<svg viewBox="' + (-pad) + ' ' + (-pad) + ' ' + w + ' ' + h + '" role="img" aria-label="FC">' +
      '<defs><linearGradient id="fcg' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="currentColor"/><stop offset=".45" stop-color="currentColor" stop-opacity=".78"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset=".62" stop-color="currentColor" stop-opacity=".9"/><stop offset="1" stop-color="currentColor"/></linearGradient>' +
      '<linearGradient id="fcs' + uid + '" x1="0" x2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="fcc' + uid + '"><path d="' + v.d + '"/></clipPath></defs>' + ex +
      '<path class="m-top" style="fill:url(#fcg' + uid + ')" d="' + v.d + '"/>' +
      '<g clip-path="url(#fcc' + uid + ')"><rect class="m-sheen" style="fill:url(#fcs' + uid + ')" x="0" y="0" width="' + v.w + '" height="' + v.h + '"/></g></svg>';
  }
  function logos() {
    var m = H.getAttribute('data-mark') || 'text', G = window.FC_GLYPHS || [], v = null;
    G.forEach(function (g) { if (g.id === m) v = g; });
    [].forEach.call(D.querySelectorAll('.logo-fc'), function (el, i) {
      if (!v) { el.classList.remove('svgm'); el.textContent = 'FC'; return; }
      el.classList.add('svgm'); el.innerHTML = svgFor(v, i);
    });
  }
  logos();

  /* шапка: подложка после прокрутки */
  var top = D.querySelector('.top');
  function sc() { top.classList.toggle('scrolled', scrollY > 30); }
  addEventListener('scroll', sc, { passive: true }); sc();

  /* кнопки: свет под курсором и волна при нажатии */
  D.addEventListener('pointermove', function (e) {
    var b = e.target.closest && e.target.closest('.btn'); if (!b) return;
    var r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  D.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn'); if (!b || H.classList.contains('rm')) return;
    var r = b.getBoundingClientRect(), i = D.createElement('i'); i.className = 'rip';
    i.style.left = (e.clientX - r.left) + 'px'; i.style.top = (e.clientY - r.top) + 'px'; b.appendChild(i); setTimeout(function () { i.remove(); }, 700);
  });

  /* свет на подвале идёт за мышью */
  var plate = D.querySelector('.foot-plate');
  if (plate) plate.addEventListener('pointermove', function (e) {
    var r = plate.getBoundingClientRect(); plate.style.setProperty('--lx', (e.clientX - r.left) + 'px'); plate.style.setProperty('--ly', (e.clientY - r.top) + 'px');
  });

  /* курсор-точка: только мышь, слой под текстом (z-index 1) */
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || H.classList.contains('rm')) return;
  var cur = D.querySelector('.cursor'), x = -100, y = -100, cx = -100, cy = -100, run = false;
  function loop() { cx += (x - cx) * .18; cy += (y - cy) * .18; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; if (Math.abs(x - cx) + Math.abs(y - cy) > .3) requestAnimationFrame(loop); else run = false; }
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return; x = e.clientX; y = e.clientY;
    cur.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,input,label,.book,canvas')));
    if (!run) { run = true; requestAnimationFrame(loop); }
  }, { passive: true });
  D.addEventListener('mouseleave', function () { x = y = -100; });
})();
