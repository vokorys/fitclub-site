/* «Живые мелочи»: в покое спокойно, при наведении оживает.
   Частицы-шарики (пинбол), свет за курсором на карточках, буквы заголовков проявляются и переливаются,
   золотые искры на тёмном блоке, карусель историй до/после. */
(function () {
  'use strict';
  var D = document, H = D.documentElement, F = window.FC || {};
  var RM = H.classList.contains('rm'), SHOT = H.classList.contains('shot');
  var FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }
  function css(v) { return getComputedStyle(H).getPropertyValue(v).trim(); }

  /* ---------- 1. частицы: шарики разлетаются, подпрыгивают и гаснут ---------- */
  var layer = D.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true'); D.body.appendChild(layer);
  var parts = [], running = false;
  function tick(t) {
    var now = performance.now();
    parts = parts.filter(function (p) {
      var dt = Math.min(32, now - p.t) / 16.7; p.t = now;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.floor !== null && p.y > p.floor) { p.y = p.floor; p.vy *= -0.55; p.vx *= 0.8; }  /* отскок, как в пинболе */
      var age = (now - p.born) / p.life;
      p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + (1 - age * .6) + ')';
      p.el.style.opacity = age < .7 ? 1 : (1 - age) / .3;
      if (age >= 1) { p.el.remove(); return false; }
      return true;
    });
    if (parts.length) requestAnimationFrame(tick); else running = false;
  }
  function spawn(x, y, o) {
    var el = D.createElement('i'); el.className = 'fx-p' + (o.cls ? ' ' + o.cls : '');
    var s = o.size || (5 + Math.random() * 7); el.style.width = el.style.height = s + 'px'; el.style.margin = (-s / 2) + 'px';
    layer.appendChild(el);
    parts.push({ el: el, x: x, y: y, vx: o.vx, vy: o.vy, g: o.g || .32, floor: o.floor === undefined ? null : o.floor, t: performance.now(), born: performance.now(), life: o.life || 950 });
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function burst(el, n, cls) {
    if (RM) return;
    var now = Date.now(); if (el._b && now - el._b < 700) return; el._b = now;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 4.5;
      spawn(cx + Math.cos(a) * r.width * .3, cy + Math.sin(a) * r.height * .3, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5, floor: cy + r.height * .5 + 26, cls: cls });
    }
  }
  window.FX = { spawn: spawn, burst: burst };  /* 18.11: общий слой частиц для fix18.js */
  if (FINE) {
    D.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var t = e.target.closest && e.target.closest('[data-burst],.bub,.mb,.code,.ba-tabs button,.bacar-ar,.vp-seg button');
      if (!t || t.contains(e.relatedTarget)) return;
      var big = t.matches('[data-burst],.bub');
      burst(t, big ? 14 : 8, t.closest('.foot,.gift') ? 'gold' : '');
    });
  }
  /* касание на телефоне: маленький всплеск у номеров и кругов */
  D.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var t = e.target.closest && e.target.closest('[data-burst],.bub,.code'); if (t) burst(t, 10);
  });

  /* ---------- 2. мягкий свет за курсором на карточках ---------- */
  var GLOW = '.rev,.promo,.step,.inside-detail,.ba-card,.form-card,.timer,.note-big,.bacar-card';
  $$(GLOW).forEach(function (el) { el.classList.add('glow'); });
  if (FINE) D.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.glow'); if (!el) return;
    var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- 3. буквы заголовков: проявляются при прокрутке, переливаются при наведении ---------- */
  $$('.h2').forEach(function (h) {
    if (h.querySelector('.ch')) return;
    var words = h.textContent.trim().split(/\s+/), k = 0;
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(function (w) {
      return '<span class="w" aria-hidden="true">' + w.split('').map(function (c) { return '<span class="ch" style="--i:' + (k++) + '">' + c + '</span>'; }).join('') + '</span>';
    }).join(' ');
  });
  if (RM || SHOT || !('IntersectionObserver' in window)) $$('.h2').forEach(function (h) { h.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .4 });
    $$('.h2').forEach(function (h) { io.observe(h); });
  }

  /* ---------- 4. золотые искры за курсором на тёмном блоке ---------- */
  var gift = $('#gift'), lastS = 0;
  if (gift && FINE && !RM) gift.addEventListener('pointermove', function (e) {
    if (e.target.closest('canvas,.book,.lever')) return;
    var n = Date.now(); if (n - lastS < 45) return; lastS = n;
    spawn(e.clientX, e.clientY, { vx: (Math.random() - .5) * 1.2, vy: -0.6 - Math.random(), g: -0.015, size: 3 + Math.random() * 4, life: 1200, cls: 'spark' });
  });

  /* ---------- 5. карусель историй до/после (второй вариант блока) ---------- */
  var stage = $('#bacarStage'), dots = $('#bacarDots'); if (!stage) return;
  var C = F.cases || {}, items = [];
  ['F', 'A', 'C', 'B'].forEach(function (k) { var c = C[k]; if (c) items.push({ type: 'ba', c: c }); });
  items.splice(1, 0, { type: 'video', src: 'assets/video/katya_talk1.mp4', poster: 'assets/video/katya_talk1.jpg', kick: 'Катя', head: 'На связи каждый день', text: 'Поддержка в закрытом чате' });
  items.splice(4, 0, { type: 'video', src: 'assets/video/gym_explain.mp4', poster: 'assets/video/gym_explain.jpg', kick: 'Тренировки', head: 'Катя объясняет каждое упражнение', text: 'Дома или в зале' });
  stage.innerHTML = items.map(function (it, i) {
    if (it.type === 'video') return '<article class="bacar-card vid" data-i="' + i + '"><video muted loop playsinline preload="none" poster="' + it.poster + '" data-src="' + it.src + '"></video>' +
      '<button class="play" type="button" aria-label="Смотреть видео: ' + it.head + '"><span></span></button>' +
      '<div class="bacar-cap"><p class="k">' + it.kick + '</p><h3>' + it.head + '</h3><p class="t">' + it.text + '</p></div></article>';
    var c = it.c, main = c.nums[0];
    return '<article class="bacar-card" data-i="' + i + '"><img class="po" src="assets/ba/' + c.po + '.jpg" alt="После" loading="lazy"><figure class="do"><img src="assets/ba/' + c.do + '.jpg" alt="До" loading="lazy"><figcaption>до</figcaption></figure>' +
      '<div class="bacar-cap"><p class="k">' + c.kick + '</p><h3>' + c.head + '</h3><p class="num"><b>' + main[1] + '</b> ' + main[0].toLowerCase() + '</p></div></article>';
  }).join('');
  dots.innerHTML = items.map(function (_, i) { return '<button type="button" aria-label="История ' + (i + 1) + '"></button>'; }).join('');
  var cards = $$('.bacar-card', stage), cur = 0;
  function lay() {
    cards.forEach(function (el, i) {
      var o = i - cur, a = Math.abs(o), w = stage.clientWidth < 700 ? 74 : 54;
      el.style.transform = 'translateX(calc(-50% + ' + (o * w) + '%)) translateZ(' + (-a * 120) + 'px) rotateY(' + (-o * 14) + 'deg) scale(' + (1 - Math.min(a, 2) * .1) + ')';
      el.style.zIndex = 10 - a; el.style.opacity = a > 2 ? 0 : 1; el.classList.toggle('cur', o === 0);
      el.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
      var v = $('video', el); if (v && o !== 0 && !v.paused) { v.pause(); el.classList.remove('playing'); }
    });
    $$('button', dots).forEach(function (b, i) { b.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
  }
  function go(n) { cur = Math.max(0, Math.min(cards.length - 1, n)); lay(); }
  $$('.bacar-ar').forEach(function (b) { b.addEventListener('click', function () { go(cur + (+b.getAttribute('data-dir'))); }); });
  $$('button', dots).forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
  stage.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
  cards.forEach(function (el, i) {
    el.addEventListener('click', function (e) {
      if (moved) return;
      if (i !== cur) { go(i); return; }
      var v = $('video', el); if (!v) return;
      if (!v.src) v.src = v.getAttribute('data-src');
      if (v.paused) { v.play(); el.classList.add('playing'); } else { v.pause(); el.classList.remove('playing'); }
    });
  });
  var sx = null, moved = false;
  stage.addEventListener('pointerdown', function (e) { sx = e.clientX; moved = false; });
  stage.addEventListener('pointermove', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 8) moved = true; });
  stage.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); setTimeout(function () { moved = false; }, 0); });
  addEventListener('resize', lay); lay();

  /* переключатель «Сравнение / Карусель» */
  var modes = $$('.ba-mode [role=tab]');
  function mode(m) {
    modes.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-bam') === m ? 'true' : 'false'); });
    $('#bacar').hidden = m !== 'car'; $('#baCmp').hidden = m === 'car'; $('.ba-tabs').hidden = m === 'car';
    if (m === 'car') lay();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  modes.forEach(function (b) { b.addEventListener('click', function () { mode(b.getAttribute('data-bam')); }); });
  var qm = new URLSearchParams(location.search).get('ba'); if (qm === 'car') mode('car');

  /* сцены по прокрутке пересчитываются, когда меняется высота страницы (шрифты, фото, заголовки) */
  if (window.ScrollTrigger) {
    var rt, lastH = 0;
    var re = function () { clearTimeout(rt); rt = setTimeout(function () { var h = D.body.scrollHeight; if (h !== lastH) { lastH = h; ScrollTrigger.refresh(); } }, 200); };
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(re);
    if ('ResizeObserver' in window) new ResizeObserver(re).observe(D.body);
    re();
  }
})();
