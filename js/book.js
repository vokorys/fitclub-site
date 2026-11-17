// Книга: наведение открывает (компьютер), касание переключает (телефон), Enter/пробел с клавиатуры.
(function () {
  var book = document.getElementById('book'); if (!book) return;
  var hint = document.getElementById('book-hint');
  var hoverable = matchMedia('(hover: hover)').matches;
  var pinned = false;
  if (PROTO.rm) { hint.textContent = 'Уменьшение движения включено: книга показана неподвижно.'; return; }
  function setOpen(v) { book.classList.toggle('open', v); book.setAttribute('aria-pressed', v ? 'true' : 'false'); }
  if (hoverable) {
    book.addEventListener('mouseenter', function () { setOpen(true); });
    book.addEventListener('mouseleave', function () { if (!pinned) setOpen(false); });
    book.addEventListener('click', function () { pinned = !pinned; setOpen(pinned || book.matches(':hover')); });
  } else {
    hint.textContent = 'Коснись книги: она откроется и пролистает страницы. Ещё касание: закроется.';
    book.addEventListener('click', function () { pinned = !pinned; setOpen(pinned); });
  }
  book.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = !pinned; setOpen(pinned); }
  });
  // ?book=open — сразу открыта (для скриншотов), ?book=mid — середина анимации
  var b = PROTO.q.get('book');
  if (b === 'open') { book.classList.add('instant'); setOpen(true); pinned = true; }
  // ?book=freeze&bt=1.4 — открыть и остановить анимацию на заданной секунде (кадры для проверки)
  if (b === 'freeze') {
    var bt = parseFloat(PROTO.q.get('bt') || '1') * 1000;
    setOpen(true); pinned = true;
    requestAnimationFrame(function () { document.getAnimations().forEach(function (a) { a.pause(); a.currentTime = bt; }); });
  }
  if (b === 'play') { setTimeout(function () { setOpen(true); pinned = true; }, 300); }
})();
