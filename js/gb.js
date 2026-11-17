/* Подключение 3D-подарка и книги из прототипа v3: замена ui.js (без html.dark и клавиши D), рычаг, ленивая загрузка three.js */
window.PROTO = (function () {
  var q = new URLSearchParams(location.search), ls = {}, h = document.documentElement;
  function on(g, fn) { (ls[g] = ls[g] || []).push(fn); }
  function set(g, v) { (ls[g] || []).forEach(function (fn) { fn(v); }); }
  /* параметры адреса подарка: только mode/p/t/hover/book для проверки; bg/color страницы не трогаем */
  var safe = new URLSearchParams(); ['mode', 'p', 't', 'hover', 'book', 'bt', 'rot'].forEach(function (k) { if (q.has(k)) safe.set(k, q.get(k)); });
  return { q: safe, on: on, set: set, rm: h.classList.contains('rm'), touch: h.classList.contains('touch') };
})();

(function () {
  var lever = document.getElementById('lever'); if (!lever) return;
  var stops = [].slice.call(lever.querySelectorAll('.lever-stops button')), modes = ['A', 'B', 'C'], cur = 0;
  function show(n) {
    lever.style.setProperty('--pos', n);
    stops.forEach(function (b, i) { b.setAttribute('aria-checked', i === n ? 'true' : 'false'); b.tabIndex = i === n ? 0 : -1; });
    lever.classList.add('moving'); setTimeout(function () { lever.classList.remove('moving'); }, 220);
  }
  function pick(n) { n = (n + 3) % 3; if (n === cur) return; cur = n; PROTO.set('mode', modes[n]); }
  PROTO.on('mode', function (v) { var n = modes.indexOf(v); if (n >= 0) { cur = n; show(n); } });
  stops.forEach(function (b) { b.addEventListener('click', function () { pick(+b.dataset.n); }); });
  var track = lever.querySelector('.lever-track');
  track.addEventListener('click', function (e) { var r = track.getBoundingClientRect(); pick(Math.max(0, Math.min(2, Math.round((e.clientY - r.top - 22) / ((r.height - 44) / 2))))); });
  lever.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); pick(cur + 1); stops[cur].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); pick(cur - 1); stops[cur].focus(); }
  });
  show(0);
})();

(function () {
  function add(src, ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.body.appendChild(s); }
  add('js/book.js');
  var stage = document.getElementById('gift-stage'), started = false;
  if (document.documentElement.classList.contains('shot')) stage.classList.add('wait');
  function go() {
    if (started) return; started = true;
    var run = function () { stage.classList.remove('wait'); add('js/gift.js'); };
    if (window.THREE) return run();
    /* 18.11: своя копия three.js первой (CDN мог зависнуть без ошибки, и подарок не появлялся) */
    add('vendor/three.min.js', run, function () { add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', run, function () { stage.classList.add('nogl'); }); });
  }
  if (PROTO.rm) { add('js/gift.js'); return; }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '900px 0px' });
    io.observe(stage);
  } else go();
})();
