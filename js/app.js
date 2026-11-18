/* Fit Club v7: режимы, таймер, промокоды, до/после, видео, форма. Логика взята из v5. */
(function () {
  'use strict';
  var F = window.FC, D = document, B = D.body, H = D.documentElement;
  var SHOT = H.classList.contains('shot'), RM = H.classList.contains('rm');
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }
  /* ?now=2026-11-24 — проверка других режимов */
  var off = 0; try { var qn = new URLSearchParams(location.search).get('now'); if (qn) off = Date.parse(qn) - Date.now(); } catch (e) {}
  function now() { return Date.now() + off; }
  if (SHOT) $$('img[loading=lazy]').forEach(function (i) { i.loading = 'eager'; });

  /* ---- режим по расписанию ---- */
  function activeMode(n) { var m = F.mode; F.schedule.forEach(function (s) { if (s.from <= n) m = s.mode; }); return m; }
  function applyMode(m) {
    if (B.getAttribute('data-mode') === m) return;
    B.setAttribute('data-mode', m);
    var t = F.modes[m] || {};
    $$('[data-t]').forEach(function (el) { var k = el.getAttribute('data-t'); if (t[k] !== undefined) el.textContent = t[k]; });
  }

  /* ---- таймер ---- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function plural(n, a) { var m = n % 10, h = n % 100; return (h >= 11 && h <= 14) ? a[2] : (m === 1 ? a[0] : (m >= 2 && m <= 4 ? a[1] : a[2])); }
  /* смена цифры: старое значение уезжает вверх, новое въезжает снизу, без полупрозрачных наложений */
  function setNum(el, v) {
    if (!el) return; var old = el.getAttribute('data-v');
    if (old === v) return; el.setAttribute('data-v', v);
    if (old === null || RM || SHOT) { el.textContent = v; return; }
    clearTimeout(el._t);
    el.innerHTML = '<span class="roll"><i>' + old + '</i><i class="nw">' + v + '</i></span>';
    el._t = setTimeout(function () { el.textContent = v; }, 520);
  }
  function tick() {
    var n = now(), m = B.getAttribute('data-mode'), row = $('#cd'), note = $('#cdNote');
    var target = m === 'open' ? F.dates.start : (m === 'closed' ? F.dates.nextStart : null);
    if (m === 'running' && n >= F.dates.start && n <= F.dates.end) {
      var day = Math.floor((n - F.dates.start) / 864e5) + 1, total = Math.round((F.dates.end - F.dates.start) / 864e5);
      row.hidden = true; note.hidden = false; note.textContent = 'Идёт день ' + day + ' из ' + total; return;
    }
    if (!target || target <= n) { row.hidden = true; return; }
    row.hidden = false; note.hidden = true;
    var s = Math.floor((target - n) / 1000), d = Math.floor(s / 86400);
    setNum($('#cdD'), '' + d); setNum($('#cdH'), pad(Math.floor(s % 86400 / 3600)));
    setNum($('#cdM'), pad(Math.floor(s % 3600 / 60))); setNum($('#cdS'), pad(s % 60));
  }
  /* цена по дате (МСК задана в config.js смещением +03:00, сравнение по абсолютному времени); дата не определилась = цена до 22.11 */
  function priceNow() {
    var n = now();
    return (isFinite(n) && isFinite(F.priceFrom) && n >= F.priceFrom) ? F.priceLate : F.price;
  }
  function fmt(v) { return String(v).replace(/\B(?=(\d{3})+$)/g, '\u00a0'); }
  function setT(el, t) { if (el.textContent !== t) el.textContent = t; }
  function prices() {
    var p = priceNow();
    $$('[data-price]').forEach(function (el) { setT(el, fmt(p)); });
    $$('[data-price-txt]').forEach(function (el) { setT(el, fmt(p) + '\u00a0₽'); });
    $$('[data-pl]').forEach(function (el) { setT(el, fmt(p) + '\u00a0₽ за 3\u00a0недели'); });
    $$('[data-sum]').forEach(function (el) { setT(el, fmt(Math.round(p * (100 - +el.getAttribute('data-sum')) / 100)) + '\u00a0₽'); });
  }
  /* промокоды работают пока набор открыт и после старта потока; в закрытом режиме скрыты */
  function promos() {
    var open = B.getAttribute('data-mode') !== 'closed';
    $$('[data-promo]').forEach(function (el) { el.hidden = !open; });
    $$('[data-ret]').forEach(function (el) { el.hidden = !open; });
  }
  function run() { applyMode(activeMode(now())); promos(); prices(); tick(); }
  run(); if (!SHOT) setInterval(run, 1000);

  /* ---- копирование промокодов ---- */
  function copy(txt) {
    function old() {
      var t = D.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; B.appendChild(t); t.select();
      try { D.execCommand('copy'); } catch (e) {} t.remove();
    }
    try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt).catch(old); } catch (e) {}
    var ta =D.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; B.appendChild(ta); ta.select();
    try { D.execCommand('copy'); } catch (e) {} ta.remove(); return Promise.resolve();
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      Promise.resolve(copy(v)).then(function () {
        var h = $('.c-hint', b) || b; b.classList.add('done'); if (!b.hasAttribute('data-was')) b.setAttribute('data-was', h.textContent); h.textContent = 'скопировано';
        var p = $('#fPromo'); if (p && !p.value) p.value = v;
        setTimeout(function () { b.classList.remove('done'); h.textContent = b.getAttribute('data-was'); }, 1600);
      });
    });
  });

  /* ---- до и после ---- */
  var cmp = $('#cmp'), rng = cmp && $('.cmp-r', cmp);
  if (rng) rng.addEventListener('input', function () { cmp.style.setProperty('--p', rng.value + '%'); });
  function showCase(k) {
    var c = F.cases[k]; if (!c) return;
    $$('.ba-tabs [role=tab]').forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-case') === k ? 'true' : 'false'); });
    var ba = $('.ba'); ba.classList.remove('swap'); void ba.offsetWidth; ba.classList.add('swap');
    $('#baDo').src = 'assets/ba/' + c.do + '.jpg'; $('#baPo').src = 'assets/ba/' + c.po + '.jpg';
    var mini = $('#baMini'); mini.hidden = !c.mini; if (c.mini) $('#baMiniImg').src = 'assets/ba/' + c.mini + '.jpg';
    $('#baKick').textContent = c.kick; $('#baHead').textContent = c.head; $('#baSay').textContent = c.say;
    $('#baNums').innerHTML = c.nums.map(function (n) { return '<li' + (n[2] ? ' class="main"' : '') + '><b>' + n[1] + '</b><span>' + n[0] + '</span></li>'; }).join('');
    if (rng) { rng.value = 50; cmp.style.setProperty('--p', '50%'); }
  }
  $$('.ba-tabs [role=tab]').forEach(function (t) { t.addEventListener('click', function () { showCase(t.getAttribute('data-case')); }); });
  showCase('F');

  /* ---- пузыри «что входит» ---- */
  var bubs = $$('.bub');
  function pickBub(b) {
    bubs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    $('#bubT').textContent = b.getAttribute('data-t'); $('#bubP').textContent = b.getAttribute('data-p');
  }
  bubs.forEach(function (b) {
    var pl = D.createElement('span'); pl.className = 'bub-plus'; pl.setAttribute('aria-hidden', 'true'); b.appendChild(pl);
    b.setAttribute('aria-label', b.getAttribute('data-t') + ': подробнее');
    b.addEventListener('click', function () { pickBub(b); var d = $('#bubDetail'); d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash'); });
  });

  /* ---- отзывы: перетаскивание мышью (пальцем листается само) ---- */
  var tr = $('.rv-track');
  if (tr) {
    var down = false, sx = 0, sl = 0, moved = 0, vx = 0, lx = 0, lt = 0, raf;
    tr.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; sx = lx = e.clientX; sl = tr.scrollLeft; lt = performance.now(); vx = 0;
      cancelAnimationFrame(raf); tr.classList.add('drag'); tr.setPointerCapture(e.pointerId);
    });
    tr.addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      tr.scrollLeft = sl - dx; var t = performance.now(); vx = (e.clientX - lx) / Math.max(1, t - lt); lx = e.clientX; lt = t;
    });
    function up() {
      if (!down) return; down = false;
      var v = vx * 16;
      (function glide() { if (Math.abs(v) < .4) { tr.classList.remove('drag'); return; } tr.scrollLeft -= v; v *= .92; raf = requestAnimationFrame(glide); })();
    }
    tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
    tr.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    tr.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  window.FC.pickBub = function (i) { if (bubs[i]) pickBub(bubs[i]); };

  /* ---- живые ленты: копия содержимого для бесконечной прокрутки ---- */
  if (!RM && !SHOT) $$('.lane-in').forEach(function (l) {
    [].slice.call(l.children).forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); l.appendChild(k); });
  });

  /* ---- видео: только когда видно ---- */
  var vids = $$('video[data-src]');
  if (!RM && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (!v.src) v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (v.src) v.pause();
      });
    }, { rootMargin: '200px' });
    vids.forEach(function (v) { io.observe(v); });
  }
  var hv = $('#helloVid'), hs = $('#helloSnd'), hr = $('#helloVolR');
  if (hv && F.helloVideo) { hv.poster = F.helloVideo.poster; hv.src = F.helloVideo.src; }
  if (hv) {
    if (!RM && !SHOT) { var hp = hv.play(); if (hp && hp.catch) hp.catch(function () {}); }
    /* 18.11: громкость по умолчанию 35 % (в наушнике было громко), ползунок и кнопка «Без звука» */
    hv.volume = .35;
    function paintVol() { if (hr) { hr.style.setProperty('--v', hr.value + '%'); hr.setAttribute('aria-valuetext', hr.value + ' %'); } }
    function setSound(on) {
      if (on) { if (hv.muted) { hv.muted = false; hv.currentTime = 0; hv.loop = false; var pp = hv.play(); if (pp && pp.catch) pp.catch(function () {}); } }
      else { hv.muted = true; hv.loop = true; }
      hs.setAttribute('aria-pressed', on ? 'true' : 'false'); $('.snd-t', hs).textContent = on ? 'Без звука' : 'Включить звук';
      var box = $('#helloVol'); if (box) box.classList.toggle('on', on);
    }
    hs.addEventListener('click', function () {
      var on = hv.muted;
      if (on && hv.volume < .02) { hv.volume = .35; if (hr) hr.value = 35; paintVol(); }
      setSound(on);
    });
    if (hr) hr.addEventListener('input', function () {
      var v = (+hr.value) / 100; hv.volume = v; paintVol();
      if (v === 0) setSound(false); else if (hv.muted) setSound(true);
    });
    paintVol();
    hv.addEventListener('ended', function () { hv.muted = true; hv.loop = true; hv.play(); setSound(false); });
  }

  /* ---- форма: заявка уходит сообщением Кате ---- */
  var form = $('#leadForm');
  function setChan() {
    var k = ($('input[name=ctype]:checked', form) || {}).value || 'telegram', c = $('#fContact');
    c.placeholder = F.channels[k].hint; c.setAttribute('inputmode', k === 'phone' ? 'tel' : 'text');
  }
  $$('input[name=ctype]', form).forEach(function (r) { r.addEventListener('change', setChan); }); setChan();
  var again = $('#fAgain');
  again.addEventListener('change', function () {
    var p = $('#fPromo'); if (again.checked) p.value = F.returning.code; else if (p.value === F.returning.code) p.value = '';
  });
  try { var rq = new URLSearchParams(location.search).get('ref'); if (rq) $('#fRef').value = rq.slice(0, 60); } catch (e) {}
  function err(id, t) { $('#' + id).textContent = t || ''; }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = $('#fName').value.trim(), contact = $('#fContact').value.trim(), ok = true,
      ctype = ($('input[name=ctype]:checked', form) || {}).value || 'telegram',
      goal = (($('input[name=goal]:checked', form) || {}).value) || '', mode = B.getAttribute('data-mode'),
      promo = mode !== 'closed' ? $('#fPromo').value.trim().slice(0, 30) : '', ref = mode !== 'closed' ? $('#fRef').value.trim().slice(0, 60) : '';
    err('eName'); err('eContact'); err('eConsent');
    if (name.length < 2) { err('eName', 'Напиши, как тебя зовут'); ok = false; }
    if (contact.length < 3) { err('eContact', 'Напиши, как с тобой связаться'); ok = false; }
    else if (ctype === 'phone' && !/^[+\d][\d\s\-()]{6,}$/.test(contact)) { err('eContact', 'Проверь номер телефона'); ok = false; }
    if (!$('#fConsent').checked) { err('eConsent', 'Нужно согласие на обработку данных'); ok = false; }
    if ($('#fWebsite').value) return;
    if (!ok) { var f = $('.err:not(:empty)', form); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    var l = ['Привет! Это заявка с сайта Fit Club.', 'Имя: ' + name, 'Связь (' + F.channels[ctype].label + '): ' + contact];
    if (goal) l.push('Цель: ' + goal);
    if (again.checked) l.push('Я уже занималась с Катей.');
    if (promo) l.push('Промокод: ' + promo);
    if (ref) l.push('Меня пригласила: ' + ref);
    l.push(mode === 'closed' ? 'Хочу в лист ожидания.' : (mode === 'running' ? 'Хочу вступить в идущий поток.' : 'Хочу на марафон.'));
    var text = l.join('\n');
    $('#formBody').hidden = true; $('#formDone').hidden = false;
    $('#doneCopyText').value = text;
    $('#doneTg').href = F.links.telegramKatya + '?text=' + encodeURIComponent(text);
    $('#formDone').scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  $('#doneCopy').addEventListener('click', function () {
    var b = this; Promise.resolve(copy($('#doneCopyText').value)).then(function () { $('.btn-t', b).textContent = 'Скопировано'; b.classList.add('done'); });
  });

  /* ---- политика ---- */
  var dlg = $('#policy');
  $$('[data-open-policy]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); }); });
  $$('[data-close-policy]').forEach(function (b) { b.addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  /* ---- нижняя кнопка на телефоне: прячется у героя и формы ---- */
  var st = $('#sticky'), vis = {};
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.getAttribute('data-watch')] = e.isIntersecting; });
      st.classList.toggle('on', !vis.form && !vis.hero);
    }, { threshold: 0.05 });
    $$('[data-watch]').forEach(function (el) { so.observe(el); });
  }

  /* ---- FAQ: плавное раскрытие ---- */
  $$('.faq details').forEach(function (d) {
    var s = $('summary', d), p = $('p', d);
    s.addEventListener('click', function (e) {
      if (RM || !p.animate) return; e.preventDefault();
      if (d.open) { var a = p.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 200 }); a.onfinish = function () { d.open = false; }; }
      else { d.open = true; p.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' }); }
    });
  });
})();
