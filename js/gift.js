// Подарок 3D (three.js r128, только ядро). Режимы: A вращение+колыхание, B развязать и открыть, C крутить рукой с инерцией.
// Параметры адреса для проверки: ?mode=A|B|C &color=burgundy|gold &p=0..1 (прогресс B) &t=сек (заморозить время) &hover=1 &rot=рад
(function () {
  var stage = document.getElementById('gift-stage');
  var canvas = document.getElementById('gift-canvas');
  var statusEl = document.getElementById('gift-status');
  var hintEl = document.getElementById('gift-hint');
  var q = PROTO.q;
  var HINTS = {
    A: 'Коробка вращается сама. Нажми на неё (на телефоне коснись): бант развяжется, крышка откинется, внутри мягкий свет.',
    B: 'Коробка открыта. Нажми на неё ещё раз, и она закроется. Так можно открывать и закрывать сколько хочешь.',
    C: 'Зажми мышью или пальцем и крути в любую сторону: отпустишь, и коробка докрутится по инерции.'
  };
  function setHint(m) { hintEl.textContent = HINTS[m]; }
  setHint('A');

  if (PROTO.rm) { statusEl.textContent = 'prefers-reduced-motion: показана статичная картинка, WebGL не запускается'; window.__demo = { gl: false, reason: 'reduced-motion' }; PROTO.on('mode', setHint); return; }
  if (!window.THREE) { fail('three.js не загрузился'); return; }
  var T = THREE;
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('нет контекста');
  } catch (e) { fail('WebGL недоступен: ' + e.message); return; }
  function fail(msg) { stage.classList.add('nogl'); statusEl.textContent = msg + ' (показана статичная картинка)'; window.__demo = { gl: false, reason: msg }; }

  var mobile = PROTO.touch || Math.min(screen.width, screen.height) < 700;
  // против «ступенек»: на компьютере рисуем минимум в 1.5x, на телефоне не больше 2x
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, PROTO.touch ? 1 : 1.5), 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var lin = function (hex) { return new T.Color(hex).convertSRGBToLinear(); };
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.52, 3.55);
  camera.lookAt(0, 0.6, 0);

  // ---------- окружение (своя «студия» вместо RoomEnvironment) ----------
  (function () {
    var env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(12, 12, 12), new T.MeshBasicMaterial({ color: 0x1c1a1e, side: T.BackSide })));
    function box(w, h, x, y, z, rgb) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ side: T.DoubleSide }));
      m.material.color.setRGB(rgb[0], rgb[1], rgb[2]); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    }
    box(6, 6, 0, 5.8, 0.5, [2.2, 2.05, 1.9]);     // верхний софтбокс
    box(3, 4, -5.5, 2, 2.5, [3.0, 2.4, 1.9]);    // тёплый ключевой
    box(2.5, 4, 5.5, 1.5, 1, [1.2, 1.4, 1.8]);   // холодный заполняющий
    box(5, 1.2, 0, 1.2, -5.8, [1.6, 1.5, 1.4]);  // контровой
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.04).texture;
    pm.dispose();
  })();
  var key = new T.DirectionalLight(0xfff1e0, 0.9); key.position.set(-2.5, 4, 3); scene.add(key);
  scene.add(new T.HemisphereLight(0xfff6ee, 0x302028, 0.25));
  var rim = new T.DirectionalLight(0xffe6c8, 0.7); rim.position.set(2.5, 2.2, -3.5); scene.add(rim); // контровой: силуэт на тёмном фоне

  // ---------- текстуры из canvas ----------
  function canvasTex(size, draw) { var c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); var t = new T.CanvasTexture(c); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
  var grain = canvasTex(128, function (g, s) {
    var d = g.createImageData(s, s);
    for (var i = 0; i < d.data.length; i += 4) { var v = 118 + Math.random() * 20; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
  });
  grain.wrapS = grain.wrapT = T.RepeatWrapping; grain.repeat.set(6, 6);
  var blob = canvasTex(128, function (g, s) {
    var r = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(20,8,12,0.75)'); r.addColorStop(0.45, 'rgba(20,8,12,0.35)'); r.addColorStop(1, 'rgba(20,8,12,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  var glowTex = canvasTex(128, function (g, s) {
    var r = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,226,180,0.95)'); r.addColorStop(0.35, 'rgba(255,200,140,0.35)'); r.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });

  // ---------- фактуры (canvas, без внешних файлов) ----------
  function tile(tex, r) { tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(r, r); return tex; }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
  var texLeather = tile(canvasTex(256, function (g, s) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); var R = rnd(7);
    for (var i = 0; i < 1400; i++) {
      var x = R() * s, y = R() * s, r = 2 + R() * 5;
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(170,170,170,.55)'); gr.addColorStop(1, 'rgba(60,60,60,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }), 8);
  var texPaper = tile(canvasTex(256, function (g, s) {
    g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#b4b4b4'; g.lineWidth = 3;            // тиснёная ромбовидная сетка
    for (var i = -s; i < 2 * s; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke(); g.beginPath(); g.moveTo(i, s); g.lineTo(i + s, 0); g.stroke(); }
    var d = g.getImageData(0, 0, s, s), R = rnd(3);
    for (var k = 0; k < d.data.length; k += 4) { var n = (R() - 0.5) * 26; d.data[k] += n; d.data[k + 1] += n; d.data[k + 2] += n; }
    g.putImageData(d, 0, 0);
  }), 3);
  var texVelvet = tile(canvasTex(128, function (g, s) {
    var d = g.createImageData(s, s), R = rnd(11);
    for (var k = 0; k < d.data.length; k += 4) { var v = 110 + R() * 40; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
    g.putImageData(d, 0, 0);
  }), 10);
  var texRib = canvasTex(64, function (g, s) {          // репс: поперечные рубчики
    for (var y = 0; y < s; y++) { var v = 128 + 110 * Math.sin(y / s * Math.PI * 2 * 8); g.fillStyle = 'rgb(' + (v | 0) + ',' + (v | 0) + ',' + (v | 0) + ')'; g.fillRect(0, y, s, 1); }
  });
  texRib.wrapS = texRib.wrapT = T.RepeatWrapping; texRib.repeat.set(1, 6);

  // ---------- материалы ----------
  var matBox = new T.MeshPhysicalMaterial({ color: lin('#0e0d11') });
  var matLining = new T.MeshStandardMaterial({ color: lin('#3e1020'), roughness: 0.85, emissive: lin('#ff8a50'), emissiveIntensity: 0, side: T.BackSide });
  var matTrim = new T.MeshStandardMaterial({ color: lin('#a7a7ae'), metalness: 1, roughness: 0.22 });
  var matRibbon = new T.MeshPhysicalMaterial({ side: T.DoubleSide });
  var matTail = new T.MeshPhysicalMaterial({ side: T.DoubleSide, transparent: true });
  var BOX = {
    satin:   { label: 'чёрный сатин', color: '#0e0d11', roughness: 0.38, clearcoat: 0.32, clearcoatRoughness: 0.3, sheen: '#2c2a33', bump: texVelvet, bumpScale: 0.0008, trim: false },
    velvet:  { label: 'бархат', color: '#0a090c', roughness: 1.0, clearcoat: 0, clearcoatRoughness: 1, sheen: '#4a4552', bump: texVelvet, bumpScale: 0.0012, trim: false },
    paper:   { label: 'бумага с тиснением', color: '#151417', roughness: 0.88, clearcoat: 0, clearcoatRoughness: 1, sheen: null, bump: texPaper, bumpScale: 0.012, trim: false },
    leather: { label: 'кожа', color: '#100e10', roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: null, bump: texLeather, bumpScale: 0.035, trim: false },
    graphite:{ label: 'графит + металл', color: '#1f2024', roughness: 0.62, metalness: 0.0, clearcoat: 0.1, clearcoatRoughness: 0.5, sheen: null, bump: texVelvet, bumpScale: 0.0015, trim: true }
  };
  var boxName = 'satin', ribType = 'satin', ribColor = 'burgundy';
  function setBox(name) {
    var b = BOX[name] || BOX.satin; boxName = name;
    matBox.color.copy(lin(b.color)); matBox.roughness = b.roughness; matBox.metalness = b.metalness || 0;
    matBox.clearcoat = b.clearcoat; matBox.clearcoatRoughness = b.clearcoatRoughness;
    if ('sheen' in matBox) matBox.sheen = b.sheen ? lin(b.sheen) : null;
    matBox.bumpMap = b.bump; matBox.bumpScale = b.bumpScale; matBox.needsUpdate = true;
    trims.forEach(function (m) { m.visible = b.trim; });
  }
  var RIBC = { burgundy: '#652639', gold: '#d2a852' };
  function setRibbon() {
    var c = lin(RIBC[ribColor] || RIBC.burgundy), gold = ribColor === 'gold';
    [matRibbon, matTail].forEach(function (m) {
      m.color.copy(c); m.bumpMap = null; m.bumpScale = 0; m.clearcoat = 0; m.clearcoatRoughness = 0.3;
      if ('sheen' in m) m.sheen = null;
      if (ribType === 'satin') {           // атлас: гладкий, сильный блик
        m.metalness = gold ? 0.85 : 0.05; m.roughness = gold ? 0.3 : 0.3; m.clearcoat = gold ? 0 : 0.3; m.clearcoatRoughness = 0.2; // у золота без лака: иначе белёсый блик сверху
        if ('sheen' in m && !gold) m.sheen = lin('#5e1f31');
      } else if (ribType === 'velvet') {   // бархат: без блика, мягкое свечение по краю
        m.metalness = 0; m.roughness = 1; m.bumpMap = texVelvet; m.bumpScale = 0.002;
        if (gold) m.color.copy(lin('#a77f33'));
        if ('sheen' in m) m.sheen = lin(gold ? '#9c7a3c' : '#7d2c42');
      } else {                             // репс: рубчик поперёк ленты
        m.metalness = gold ? 0.5 : 0; m.roughness = 0.62; m.bumpMap = texRib; m.bumpScale = 0.006;
      }
      m.needsUpdate = true;
    });
    matTrim.color.copy(lin(gold ? '#d2a852' : '#a7a7ae'));
  }

  // ---------- размеры ----------
  var D = 1.0, BH = 0.74, TH = 0.03;      // корпус
  var LW = 1.05, LH = 0.2, LT = 0.035;    // крышка
  var RW = 0.14, RT = 0.006;              // лента
  var BV = 0.018;                         // радиус скругления рёбер
  var root = new T.Group(); scene.add(root);
  var BASE_Q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -0.55);
  root.quaternion.copy(BASE_Q);
  var CS = mobile ? 4 : 6;                // сегменты скругления

  function rrect(w, d, r) {
    var s = new T.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  // скруглённое тело (сплошное или кольцо-стенки) высотой h, низ на y=0
  function rounded(w, d, h, opts) {
    var b = Math.min(BV, h / 3), r = opts.r || 0.05;
    if (opts.wall) b = Math.min(b, opts.wall * 0.3);   // стенка должна быть толще двух скруглений
    var sh = rrect(w - 2 * b, d - 2 * b, Math.max(r - b, 0.005));
    if (opts.wall) { var hw = w - 2 * opts.wall + 2 * b, hd = d - 2 * opts.wall + 2 * b; sh.holes.push(rrect(hw, hd, Math.max(r - opts.wall + b, 0.005))); }
    var g = new T.ExtrudeGeometry(sh, { depth: Math.max(h - 2 * b, 0.001), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: mobile ? 2 : 3, curveSegments: CS });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0); g.computeVertexNormals();
    return g;
  }
  function mbox(w, h, d, mat) { return new T.Mesh(new T.BoxGeometry(w, h, d), mat); }

  // корпус: стенки-кольцо + дно + подкладка (BackSide-коробка видна только изнутри)
  var body = new T.Group(); root.add(body);
  body.add(new T.Mesh(rounded(D, D, BH, { wall: TH, r: 0.05 }), matBox));
  body.add(new T.Mesh(rounded(D - 0.01, D - 0.01, TH, { r: 0.045 }), matBox));
  var lin1 = mbox(D - 2 * TH - 0.004, BH - TH, D - 2 * TH - 0.004, matLining); lin1.position.y = TH + (BH - TH) / 2 + 0.002; body.add(lin1);
  var trims = [];
  function trimRing(w, y, h) { var m = new T.Mesh(rounded(w, w, h, { wall: 0.012, r: 0.055 }), matTrim); m.position.y = y; trims.push(m); return m; }
  body.add(trimRing(D + 0.008, 0, 0.022));
  // лента на корпусе
  var bodyRib = new T.Group(); body.add(bodyRib);
  [[0, D / 2 + RT / 2 + 0.0025, RW, RT], [0, -D / 2 - RT / 2 - 0.0025, RW, RT]].forEach(function (a) { var m = mbox(a[2], BH, a[3], matRibbon); m.position.set(a[0], BH / 2, a[1]); bodyRib.add(m); });
  [[D / 2 + RT / 2 + 0.0025], [-D / 2 - RT / 2 - 0.0025]].forEach(function (a) { var m = mbox(RT, BH, RW, matRibbon); m.position.set(a[0], BH / 2, 0); bodyRib.add(m); });
  // тень и свет внутри
  var shadow = new T.Mesh(new T.PlaneGeometry(2.0, 2.0), new T.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; root.add(shadow);
  var inLight = new T.PointLight(0xffc68a, 0, 2.2, 2); inLight.position.set(0, 0.45, 0); root.add(inLight);
  var glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 }));
  glow.position.set(0, BH + 0.12, 0); glow.scale.set(1.5, 1.1, 1); root.add(glow);

  // крышка: шарнир внизу задней стенки
  var lidHinge = new T.Group(); lidHinge.position.set(0, BH + 0.03 - LH, -LW / 2); root.add(lidHinge);
  var lid = new T.Group(); lid.position.set(0, LH, 0); lidHinge.add(lid);
  var lidC = new T.Group(); lidC.position.z = LW / 2; lid.add(lidC);
  var w;
  w = new T.Mesh(rounded(LW, LW, LT, { r: 0.055 }), matBox); w.position.y = -LT; lidC.add(w);
  w = new T.Mesh(rounded(LW, LW, LH - LT / 2, { wall: 0.022, r: 0.055 }), matBox); w.position.y = -LH; lidC.add(w); // верх стенок уходит под пластину: нет совпадающих граней
  w = mbox(LW - 0.05, LH - LT - 0.004, LW - 0.05, matLining); w.position.y = -LT - (LH - LT) / 2; lidC.add(w);
  w = trimRing(LW + 0.008, -LH, 0.02); lidC.add(w);
  w = trimRing(LW + 0.008, -0.022, 0.024); lidC.add(w);
  var lidRib = new T.Group(); lid.add(lidRib); lidRib.position.set(0, 0, LW / 2);
  (function () {
    var m;
    m = mbox(LW + 2 * RT + 2 * 0.0025, RT, RW, matRibbon); m.position.y = RT / 2 + 0.0025; lidRib.add(m);
    m = mbox(RW, RT, LW + 2 * RT + 2 * 0.0025, matRibbon); m.position.y = RT / 2 + 0.0025 + 0.002; lidRib.add(m);
    m = mbox(RW, LH, RT, matRibbon); m.position.set(0, -LH / 2, LW / 2 + RT / 2 + 0.0025); lidRib.add(m);
    m = mbox(RW, LH, RT, matRibbon); m.position.set(0, -LH / 2, -LW / 2 - RT / 2 - 0.0025); lidRib.add(m);
    m = mbox(RT, LH, RW, matRibbon); m.position.set(LW / 2 + RT / 2 + 0.0025, -LH / 2, 0); lidRib.add(m);
    m = mbox(RT, LH, RW, matRibbon); m.position.set(-LW / 2 - RT / 2 - 0.0025, -LH / 2, 0); lidRib.add(m);
  })();

  // ---------- полоски-ленты с вершинной анимацией ----------
  function Strip(rows, cols, mat) {
    var g = new T.BufferGeometry();
    this.pos = new Float32Array(rows * cols * 3);
    this.uv = new Float32Array(rows * cols * 2);
    g.setAttribute('position', new T.BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new T.BufferAttribute(this.uv, 2));
    var idx = [];
    for (var r = 0; r < rows - 1; r++) for (var c = 0; c < cols - 1; c++) {
      var a = r * cols + c, b = a + 1, d = a + cols, e = d + 1; idx.push(a, d, b, b, d, e);
    }
    g.setIndex(idx);
    this.rows = rows; this.cols = cols; this.geo = g;
    this.mesh = new T.Mesh(g, mat); this.mesh.frustumCulled = false;
  }
  Strip.prototype.setUV = function (len) {
    for (var r = 0; r < this.rows; r++) for (var c = 0; c < this.cols; c++) {
      var o = (r * this.cols + c) * 2; this.uv[o] = c / (this.cols - 1); this.uv[o + 1] = r / (this.rows - 1) * len * 6;
    }
  };
  Strip.prototype.commit = function () { this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); };

  // петля банта: каплевидный контур в плоскости XY, ширина по Z
  var LOOP_PTS = [[0, 0], [0.08, 0.12], [0.24, 0.2], [0.38, 0.16], [0.4, 0.06], [0.26, 0.0], [0.09, -0.01], [0, 0]];
  function makeLoop(sign, phase, size, wid) {
    var curve = new T.CatmullRomCurve3(LOOP_PTS.map(function (p) { return new T.Vector3(p[0] * sign * size, p[1] * size, 0); }), false, 'catmullrom', 0.5);
    var R = mobile ? 26 : 40, base = curve.getSpacedPoints(R - 1);
    var s = new Strip(R, 3, matRibbon); s.setUV(curve.getLength() * 1.4);
    s.update = function (t, amp) {
      for (var r = 0; r < R; r++) {
        var u = r / (R - 1), bulge = Math.sin(Math.PI * u);
        var br = 1 + amp * 0.07 * bulge * Math.sin(t * 2.3 + phase);
        var tw = amp * 0.35 * bulge * Math.sin(t * 1.7 + phase + u * 2);
        var hw = RW * wid * (0.45 + 0.55 * bulge);
        var cx = base[r].x * br, cy = base[r].y * br;
        var wy = Math.sin(tw) * hw, wz = Math.cos(tw) * hw;
        var cup = 0.012 * bulge * size;                     // лёгкая «ложка» по ширине ленты
        for (var c = 0; c < 3; c++) {
          var f = c - 1, o = (r * 3 + c) * 3;
          this.pos[o] = cx + (f === 0 ? 0 : 0); this.pos[o + 1] = cy + f * wy + (f === 0 ? cup : 0); this.pos[o + 2] = f * wz;
        }
      }
      this.commit();
    };
    return s;
  }
  // хвост: лежит на крышке до переднего края, дальше свисает; V-образный вырез на конце
  function makeTail(xe, hang, phase) {
    var R = mobile ? 22 : 30, C = 3;
    var s = new Strip(R, C, matTail);
    var S = new T.Vector3(0, 0.012, LW / 2), E = new T.Vector3(xe, 0.012, LW + 0.014);
    var Ltop = S.distanceTo(E), L = Ltop + hang;
    s.setUV(L);
    var P = [], N = [], tmp = new T.Vector3(), Wv = new T.Vector3(), Tn = new T.Vector3();
    for (var i = 0; i < R; i++) { P.push(new T.Vector3()); N.push(new T.Vector3()); }
    s.update = function (t, amp, drop) {
      for (var r = 0; r < R; r++) {
        var sl = r / (R - 1) * L;
        if (sl <= Ltop) { P[r].copy(S).lerp(E, sl / Ltop); N[r].set(0, 1, 0); }
        else {
          var v = sl - Ltop, h = v / hang;
          P[r].set(E.x + amp * 0.07 * Math.pow(h, 1.6) * Math.sin(t * 1.6 + h * 2.4 + phase),
            E.y - v + amp * 0.02 * h * h * Math.sin(t * 2.1 + phase),
            E.z + 0.006 + amp * 0.05 * Math.pow(h, 1.3) * (0.6 + 0.4 * Math.sin(t * 1.15 + phase)));
          N[r].set(0, 0, 1);
        }
        P[r].y -= drop * (0.15 + 0.85 * sl / L) * 0.35;
        P[r].z += drop * 0.25 * sl / L;
      }
      for (r = 0; r < R; r++) {
        tmp.copy(P[Math.min(r + 1, R - 1)]).sub(P[Math.max(r - 1, 0)]);
        Tn.copy(tmp).normalize();
        Wv.crossVectors(tmp, N[r]).normalize().multiplyScalar(RW * 0.5);
        for (var c = 0; c < C; c++) {
          var f = c - 1, o = (r * C + c) * 3;
          var x = P[r].x + Wv.x * f, y = P[r].y + Wv.y * f, z = P[r].z + Wv.z * f;
          if (r === R - 1 && c === 1) { x -= Tn.x * 0.05; y -= Tn.y * 0.05; z -= Tn.z * 0.05; }
          this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
        }
      }
      this.commit();
    };
    return s;
  }
  // пышный бант: 2 больших петли, 2 малых, узел-обвязка
  var bow = new T.Group(); bow.position.set(0, 0.012, LW / 2); lid.add(bow);
  var bowSpin = new T.Group(); bowSpin.rotation.y = 0.25; bow.add(bowSpin);
  var loops = [
    { s: makeLoop(1, 0, 1.15, 0.66), rot: [-0.32, -0.7, 0.14] },
    { s: makeLoop(-1, 1.3, 1.15, 0.66), rot: [-0.32, 0.7, -0.14] },
    { s: makeLoop(1, 2.1, 0.82, 0.58), rot: [-0.05, -2.25, 0.32] },
    { s: makeLoop(-1, 3.0, 0.82, 0.58), rot: [-0.05, 2.25, -0.32] }
  ];
  loops.forEach(function (l) { l.s.mesh.rotation.set(l.rot[0], l.rot[1], l.rot[2]); bowSpin.add(l.s.mesh); });
  // узел: короткая лента, обёрнутая вокруг центра
  var knotGeo = new T.CylinderGeometry(0.055, 0.06, RW * 0.95, mobile ? 14 : 22, 1, true);
  knotGeo.rotateZ(Math.PI / 2);
  var knot = new T.Mesh(knotGeo, matRibbon); knot.scale.set(1, 0.78, 1); knot.position.y = 0.04; bowSpin.add(knot);
  var knotCap = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), matRibbon); knotCap.scale.set(1.1, 0.7, 0.9); knotCap.position.y = 0.035; bowSpin.add(knotCap);
  var tail1 = makeTail(0.17, 0.52, 0.0), tail2 = makeTail(-0.11, 0.43, 2.1);
  lid.add(tail1.mesh); lid.add(tail2.mesh);

  // ---------- состояние ----------
  var mode = q.get('mode') || 'A';
  var hover = q.get('hover') === '1', pinned = false;
  var swayAmp = 0.35, spinSpeed = 0, spin = 0, p = 0;
  var freezeT = q.has('t') ? parseFloat(q.get('t')) : null;
  var forcedP = q.has('p') ? parseFloat(q.get('p')) : null;
  if (q.has('rot')) spin = parseFloat(q.get('rot'));
  var vel = new T.Vector2(), dragging = false, last = null;

  function smooth(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function setMode(m) {
    mode = m; setHint(m); pinned = false;
    canvas.classList.toggle('drag', m === 'C');
  }
  PROTO.on('mode', setMode);
  PROTO.on('color', function (v) { ribColor = v; setRibbon(); });
  PROTO.on('ribbon', function (v) { ribType = v; setRibbon(); });
  PROTO.on('box', setBox);
  // по умолчанию (решение владельца): чёрный бархат + золотая атласная лента
  ribColor = q.get('color') || 'gold'; ribType = q.get('ribbon') || 'satin';
  setBox(q.get('box') || 'velvet'); setRibbon();
  ['color', 'ribbon', 'box'].forEach(function (k) { if (q.get(k)) PROTO.set(k, q.get(k)); });
  if (q.get('mode')) PROTO.set('mode', q.get('mode')); else setMode('A');

  // ---------- указатель ----------
  var hoverable = matchMedia('(hover: hover)').matches;
  canvas.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; wake(); });
  canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hover = false; });
  /* 18.11: клик открывает (режим B), второй клик закрывает (режим A); рычаг следует за кликом через PROTO */
  canvas.addEventListener('click', function () { if (mode !== 'C') { PROTO.set('mode', mode === 'A' ? 'B' : 'A'); wake(); } });
  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'C') return;
    dragging = true; last = { x: e.clientX, y: e.clientY, t: performance.now() }; vel.set(0, 0);
    canvas.setPointerCapture(e.pointerId); wake();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - last.x, dy = e.clientY - last.y, k = 0.009;
    rotateBy(dx * k, dy * k);
    var dt = Math.max(1, performance.now() - last.t) / 16.7;
    var cl = function (v) { return Math.max(-0.18, Math.min(0.18, v)); };
    vel.set(cl(dx * k / dt), cl(dy * k / dt));
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  function endDrag(e) { if (!dragging) return; dragging = false; if (performance.now() - last.t > 90) vel.set(0, 0); try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  var AX = new T.Vector3(), AY = new T.Vector3(0, 1, 0), qa = new T.Quaternion();
  function rotateBy(ay, ax) {
    AX.set(1, 0, 0).applyQuaternion(camera.quaternion);
    qa.setFromAxisAngle(AY, ay); root.quaternion.premultiply(qa);
    qa.setFromAxisAngle(AX, ax); root.quaternion.premultiply(qa);
  }

  // ---------- размер, видимость ----------
  function resize() {
    var r = canvas.getBoundingClientRect(); if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();
  var visible = true, running = false;
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }, { rootMargin: '100px' }).observe(stage);
  document.addEventListener('visibilitychange', wake);

  var clock = new T.Clock(), time = 0, tq = new T.Quaternion(), qy = new T.Quaternion();
  function frame() {
    if (!visible || document.hidden) { running = false; return; }
    var dt = Math.min(clock.getDelta(), 0.05);
    time = freezeT !== null ? freezeT : time + dt;
    var active = hover || pinned;

    // A: вращение по наведению
    var targetSpin = (mode === 'A' || mode === 'B') ? 0.55 : 0;  /* 18.11: вращается всегда, без наведения */
    spinSpeed += (targetSpin - spinSpeed) * (1 - Math.exp(-dt * 2.5));
    spin += spinSpeed * dt;
    var targetAmp = (mode === 'A' || mode === 'B') ? 1 : 0.35;
    swayAmp += (targetAmp - swayAmp) * (1 - Math.exp(-dt * 2));
    if (freezeT !== null && (mode === 'A' || mode === 'B')) swayAmp = 1;

    // B: прогресс открытия
    var pt = (mode === 'B') ? 1 : 0;
    if (forcedP !== null && mode === 'B') p = forcedP;
    else p += Math.sign(pt - p) * Math.min(Math.abs(pt - p), dt / 2.2);

    // поворот корпуса
    if (mode === 'C') {
      if (!dragging && vel.lengthSq() > 1e-8) { rotateBy(vel.x, vel.y); vel.multiplyScalar(Math.pow(0.94, dt * 60)); }
    } else {
      qy.setFromAxisAngle(AY, spin); tq.copy(BASE_Q).premultiply(qy);
      root.quaternion.slerp(tq, 1 - Math.exp(-dt * 5));
    }

    // таймлайн B
    var untie = smooth(0.0, 0.32, p), bands = smooth(0.18, 0.45, p), open = smooth(0.38, 0.88, p), lit = smooth(0.5, 1.0, p);
    var k = 1 - untie;
    bowSpin.visible = k > 0.01;
    bowSpin.scale.setScalar(Math.max(k, 0.001)); bowSpin.rotation.y = 0.25 + untie * 2.2;
    loops.forEach(function (l, i) { l.s.update(time + i * 0.37, swayAmp); });
    tail1.update(time, swayAmp, untie); tail2.update(time + 0.4, swayAmp * 0.9, untie);
    matTail.opacity = 1 - smooth(0.03, 0.2, p); tail1.mesh.visible = tail2.mesh.visible = matTail.opacity > 0.01;
    matTail.depthWrite = matTail.opacity > 0.98;
    var sb = Math.max(1 - bands, 0.001);
    lidRib.scale.set(sb, sb, sb); lidRib.visible = bands < 0.99;
    bodyRib.scale.y = sb; bodyRib.visible = bands < 0.99;
    var e = open < 1 ? open : 1, back = 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2); // мягкий доворот
    lidHinge.rotation.x = -1.92 * (open === 0 ? 0 : Math.min(back, 1.04));
    var cz = smooth(0.3, 0.9, p); // отодвинуть камеру, чтобы открытая крышка помещалась
    camera.position.set(0, 1.52 + cz * 0.25, 3.55 + cz * 1.0); camera.lookAt(0, 0.6 + cz * 0.32, 0);
    inLight.intensity = lit * 1.1;
    matLining.emissiveIntensity = lit * 0.12;
    glow.material.opacity = lit * 0.75; glow.scale.set(1.2 + lit * 0.5, 0.8 + lit * 0.5, 1);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function wake() { if (!running && visible && !document.hidden) { running = true; clock.getDelta(); requestAnimationFrame(frame); } }
  wake();

  // ---------- отчёт о WebGL ----------
  var gl = renderer.getContext(), info = '';
  try { var ext = gl.getExtension('WEBGL_debug_renderer_info'); info = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (_) {}
  var ver = renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1';
  statusEl.textContent = 'WebGL: работает (' + ver + ', three r' + T.REVISION + ', pixelRatio ' + renderer.getPixelRatio() + ') · ' + info;
  window.__demo = { gl: true, version: ver, renderer: info, three: T.REVISION, pixelRatio: renderer.getPixelRatio(), state: function () { return { mode: mode, p: p, spin: spin, hover: hover, pinned: pinned, q: root.quaternion.toArray().map(function (v) { return +v.toFixed(3); }), vel: [vel.x, vel.y] }; } };
  requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('glok'); }); }); /* 18.11: статичная картинка видна, пока 3D не нарисовал первый кадр */
  console.log('[gift] WebGL ok', window.__demo);
})();
