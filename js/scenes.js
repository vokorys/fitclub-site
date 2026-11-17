/* Сцены по прокрутке (GSAP + ScrollTrigger). Без анимации: ?shot=1, reduced-motion, нет GSAP */
(function () {
  var D = document, H = D.documentElement;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }
  function finalState() {
    $$('.fit-i,.chips li,.step').forEach(function (e) { e.classList.add('lit'); });
    var dl = $('.day-line'); if (dl) dl.style.setProperty('--fill', 1);
  }
  if (H.classList.contains('shot') || H.classList.contains('rm') || !window.gsap || !window.ScrollTrigger) { finalState(); return; }
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  /* 1. единственный «оркестрованный» момент: вход героя */
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero .h1 .ln', { yPercent: 70, opacity: 0, duration: 1.1, stagger: .12 })
    .from('.hero-video', { clipPath: 'inset(12% 8% 12% 8% round 34px)', scale: 1.04, duration: 1.4 }, .1)
    .from('.hero-tag,.hero .lead', { y: 18, opacity: 0, duration: .8, stagger: .08 }, .35)
    .from('.timer', { y: 24, opacity: 0, duration: .9 }, .55)
    .from('.tn b', { yPercent: 60, opacity: 0, duration: .7, stagger: .06 }, .7)
    .from('.hero-cta > *', { y: 16, opacity: 0, duration: .7, stagger: .08 }, .85);

  /* фон: плавно в графит у книги и обратно, без стыков */
  /* 18.11: общий тёмный слой на весь экран убран (давал бордовую полосу посередине страницы).
     Графит теперь только у самого блока книги (css/fix18.css), с мягкими краями; содержимое всегда видно. */
  var top = $('.top'), gift = $('#gift');
  ScrollTrigger.create({ trigger: gift, start: 'top 20%', end: 'bottom 20%', toggleClass: { targets: top, className: 'on-dark' } });
  ScrollTrigger.create({ trigger: gift, start: 'top 75%', end: 'bottom 85%', toggleClass: { targets: D.body, className: 'in-dark' } });

  /* 2. строки «узнала себя» загораются по очереди */
  $$('.fit-i').forEach(function (li) {
    ScrollTrigger.create({ trigger: li, start: 'top 72%', onEnter: function () { li.classList.add('lit'); }, onLeaveBack: function () { li.classList.remove('lit'); } });
  });

  /* 3. пузыри: по прокрутке подсвечиваются по очереди, пока не нажали сами */
  var touched = false; $$('.bub').forEach(function (b) { b.addEventListener('click', function () { touched = true; }); });
  var last = -1;
  ScrollTrigger.create({ trigger: '#inside', start: 'top 55%', end: 'bottom 45%',
    onUpdate: function (s) { if (touched) return; var i = Math.min(5, Math.floor(s.progress * 6)); if (i !== last) { last = i; FC.pickBub(i); } } });
  mm.add('(min-width:900px)', function () {
    $$('.bub').forEach(function (b, i) {
      gsap.fromTo(b, { y: 60 + i * 18 }, { y: -40 - i * 12, ease: 'none', scrollTrigger: { trigger: '#inside', start: 'top bottom', end: 'bottom top', scrub: .6 } });
    });
    gsap.fromTo('.katya-ph img', { scale: 1.12, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.katya', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* 4. линия дня заполняется, темы чата загораются */
  var dl = $('.day-line');
  ScrollTrigger.create({ trigger: '#day', start: 'top 75%', end: 'bottom 55%', scrub: .4, onUpdate: function (s) { dl.style.setProperty('--fill', s.progress.toFixed(3)); } });
  var chips = $$('.chips li');
  ScrollTrigger.create({ trigger: '.chips', start: 'top 85%', end: 'top 40%', scrub: true,
    onUpdate: function (s) { var n = Math.round(s.progress * chips.length); chips.forEach(function (c, i) { c.classList.toggle('lit', i < n); }); } });

  /* счётчики */
  $$('.count').forEach(function (el) {
    var to = +el.getAttribute('data-to'), o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: function () { el.textContent = Math.round(o.v); } });
  });

  /* отзывы и шаги подсвечиваются по очереди */
  function seq(sel, trig) {
    var it = $$(sel);
    ScrollTrigger.create({ trigger: trig, start: 'top 65%', end: 'bottom 50%', scrub: true,
      onUpdate: function (s) { var n = Math.min(it.length - 1, Math.floor(s.progress * it.length)); it.forEach(function (e, i) { e.classList.toggle('lit', sel === '.step' ? i <= n : i === n); }); } });
  }
  seq('.rev', '#reviews'); seq('.step', '#after');

  /* карточка до/после выезжает из-за коллажа */
  gsap.from('.ba-card', { x: 40, duration: 1, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: '.ba', start: 'top 85%', once: true } });

  /* финал: крупный заголовок собирается по словам */
  gsap.from('.final-h', { letterSpacing: '0.08em', opacity: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.final', start: 'top 70%', once: true } });
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
