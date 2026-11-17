/* Рисунок букв FC: 6 вариантов. Единый источник для плоского SVG и для 3D (Three.js).
   Координаты: высота букв 100, y вниз. Каждый вариант = куски (pieces), кусок = набор многоугольников. */
(function (root) {
  const R = Math.PI / 180;
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const arc = (cx, cy, rx, ry, a0, a1, n) => {
    const p = [];
    for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * R; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return p;
  };
  // кольцевой сегмент: наружная дуга a0o→a1o, обратно по внутренней a1i→a0i
  const band = (cx, cy, rxo, ryo, rxi, ryi, a0o, a1o, a0i, a1i, n = 72) =>
    arc(cx, cy, rxo, ryo, a0o, a1o, n).concat(arc(cx, cy, rxi, ryi, a1i, a0i, n));
  // буква C, открытая вправо, концы срезаны вертикально по x = xc
  const cutC = (cx, cy, rxo, ryo, rxi, ryi, xc) => {
    const ao = Math.acos((xc - cx) / rxo) / R, ai = Math.acos((xc - cx) / rxi) / R;
    return band(cx, cy, rxo, ryo, rxi, ryi, ao, 360 - ao, ai, 360 - ai, 96);
  };
  // отсечение многоугольника полуплоскостью (Сазерленд — Ходжман)
  const clipY = (poly, lim, keepAbove) => {
    const inside = p => keepAbove ? p[1] <= lim : p[1] >= lim;
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) { const t = (lim - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, lim]); }
    }
    return out;
  };
  const skew = (k) => p => [p[0] + (100 - p[1]) * k, p[1]];

  // «Связка» одним контуром: стержень F, средняя черта, верхняя черта, переходящая в C
  const svyazka = () => {
    const cx = 100, ro = 50, ri = 34, xc = 130, ao = Math.acos((xc - cx) / ro) / R, ai = Math.acos((xc - cx) / ri) / R;
    const aj = 180 + Math.asin((50 - 16) / ro) / R; // где наружная дуга встречает низ верхней черты
    return [[0, 0]].concat(arc(cx, 50, ro, ro, 270, 360 - ao, 48), arc(cx, 50, ri, ri, 360 - ai, ai, 120), arc(cx, 50, ro, ro, ao, aj, 72),
      [[16, 16], [16, 43], [38, 43], [38, 58], [16, 58], [16, 100], [0, 100]]);
  };
  const V = [];

  // 1. «Связка»: верхняя черта F перетекает в C
  V.push({
    id: 'svyazka', name: 'Связка', idea: 'Верхняя черта F перетекает в C: две буквы одним движением. Ровная средняя толщина.',
    font: "'Manrope', sans-serif", fw: 700, text: 'Fit Club', ls: '0.01em', tt: 'none',
    pieces: [
      { polys: [svyazka()], move: [0, 0, 6] }
    ]
  });

  // 2. «Грань»: гранёная, косые срезы, тяжёлая
  (function () {
    const X0 = 70, X1 = 164, t = 24, c = 20, ci = c - t * 0.4142;
    const F = [[0, 0], [64, 0], [52, 22], [24, 22], [24, 40], [52, 40], [42, 60], [24, 60], [24, 100], [0, 100]];
    const C = [[X0 + c, 0], [X1, 0], [X1 - 13, t], [X0 + t + ci, t], [X0 + t, t + ci], [X0 + t, 100 - t - ci],
      [X0 + t + ci, 100 - t], [X1 - 13, 100 - t], [X1, 100], [X0 + c, 100], [X0, 100 - c], [X0, c]];
    V.push({
      id: 'gran', name: 'Грань', idea: 'Гранёные буквы с косыми срезами, как у снаряда или гантели. Сила без грубости.',
      font: "'Unbounded', sans-serif", fw: 600, text: 'FIT CLUB', ls: '0.06em', tt: 'uppercase',
      pieces: [{ polys: [F], move: [-4, 0, 5] }, { polys: [C], move: [4, 0, 5] }]
    });
  })();

  // 3. «Контраст»: толстые основные штрихи и тонкие соединительные (как в журнальных шрифтах)
  V.push({
    id: 'kontrast', name: 'Контраст', idea: 'Толстый стержень и тонкие засечки, как в журнальной обложке. Женственно и дорого; тонкие места не тоньше 10 % высоты.',
    font: "'Cormorant Garamond', serif", fw: 600, text: 'Fit Club', ls: '0.01em', tt: 'none',
    pieces: [
      { polys: [[[-8, 0], [59, 0], [59, 26], [49, 26], [49, 10], [22, 10], [22, 45], [32, 45], [32, 37], [41, 37], [41, 63], [32, 63], [32, 55], [22, 55], [22, 90], [32, 90], [32, 100], [-8, 100], [-8, 90], [0, 90], [0, 10], [-8, 10]]], move: [0, 0, 5] },
      { polys: [cutC(112, 50, 44, 50, 22, 40, 130)], move: [0, 0, -5] }
    ]
  });

  // 4. «Внутри»: F вложена в C
  V.push({
    id: 'vnutri', name: 'Внутри', idea: 'F внутри C: клуб, который держит тебя. Тонкая линия, много воздуха.',
    font: "'Manrope', sans-serif", fw: 500, text: 'FIT CLUB', ls: '0.28em', tt: 'uppercase',
    pieces: [
      { polys: [cutC(50, 50, 50, 50, 38, 38, 78)], move: [0, 0, -3] },
      { polys: [[[27, 27], [87, 27], [87, 37], [38, 37], [38, 46], [60, 46], [60, 55], [38, 55], [38, 73], [27, 73]]], move: [0, 0, 16] }
    ]
  });

  // 5. «Шаг»: трафарет, буквы из отдельных частей с паузами
  (function () {
    const cx = 141, ro = 50, ri = 28, xc = cx + 24;
    const ao = Math.acos(24 / ro) / R, ai = Math.acos(24 / ri) / R;
    V.push({
      id: 'shag', name: 'Шаг', idea: 'Трафарет: буквы из частей с паузами, как шаги и подходы. В движении части расходятся и собираются.',
      font: "'Montserrat', sans-serif", fw: 700, text: 'Fit Club', ls: '0em', tt: 'none',
      pieces: [
        { polys: [rect(0, 0, 22, 100)], move: [-6, 0, 4] },
        { polys: [rect(31, 0, 46, 22)], move: [2, -6, 10] },
        { polys: [rect(31, 41, 36, 20)], move: [4, 0, 14] },
        { polys: [band(cx, 50, ro, ro, ri, ri, 188, 360 - ao, 188, 360 - ai, 72)], move: [3, -6, 8] },
        { polys: [band(cx, 50, ro, ro, ri, ri, ao, 172, ai, 172, 72)], move: [3, 6, 12] }
      ]
    });
  })();

  // 6. «Сцепка»: наклон, средняя черта F проходит сквозь C
  (function () {
    const C = cutC(100, 50, 50, 50, 33, 33, 128), k = Math.tan(10 * R), s = skew(k);
    V.push({
      id: 'scepka', name: 'Сцепка', idea: 'Наклон вперёд, черта F проходит сквозь C: движение и «мы вместе». Динамичный вариант для видео.',
      font: "'Montserrat', sans-serif", fw: 600, text: 'Fit Club', ls: '0em', tt: 'none', italic: true,
      pieces: [
        { polys: [[[0, 0], [54, 0], [54, 17], [17, 17], [17, 42], [82, 42], [82, 58], [17, 58], [17, 100], [0, 100]]].map(p => p.map(s)), move: [-4, 0, 8] },
        { polys: [clipY(C, 33, true), clipY(C, 67, false)].map(p => p.map(s)), move: [3, 0, -4] }
      ]
    });
  })();

  // нормализация: убрать дубли точек, сдвинуть в (0,0), посчитать габарит
  const clean = poly => poly.filter((p, i) => { const q = poly[(i + poly.length - 1) % poly.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-3; });
  const area = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  V.forEach(v => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    v.pieces.forEach(pc => pc.polys = pc.polys.map(clean).map(p => area(p) < 0 ? p.slice().reverse() : p));
    v.pieces.forEach(pc => pc.polys.forEach(p => p.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); })));
    v.pieces.forEach(pc => pc.polys = pc.polys.map(p => p.map(([x, y]) => [+(x - x0).toFixed(2), +(y - y0).toFixed(2)])));
    v.w = +(x1 - x0).toFixed(2); v.h = +(y1 - y0).toFixed(2);
    v.pieces.forEach(pc => pc.d = pc.polys.map(p => 'M' + p.map(q => q[0] + ' ' + q[1]).join('L') + 'Z').join(''));
    v.d = v.pieces.map(pc => pc.d).join('');
  });

  root.FC_GLYPHS = V;
  if (typeof module !== 'undefined') module.exports = V;
})(typeof window !== 'undefined' ? window : globalThis);
