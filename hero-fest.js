/* Festival canvases for hero C (see hero-c.js festApi and index.html).
   Loaded only while a festival canvas is on. Each canvas is quiet line art in
   the theme's ink and accent plus the festival's own colour tokens
   (site-theme.css), drawn on in the same rectangle as the kundali, with
   gentle transform/opacity loops that hero-c.js pauses off screen and never
   starts for reduced motion. Motifs are authored in small local units and
   placed with mk(); no faces, no caricature. */
(function () {
  'use strict';
  var F = window.AA_FEST = window.AA_FEST || {};
  var NS = 'http://www.w3.org/2000/svg';

  function f(n) { return String(Math.round(n * 10) / 10); }
  function pt(p) { return f(p[0]) + ' ' + f(p[1]); }
  function circ(x, y, r) { return 'M' + f(x - r) + ' ' + f(y) + 'a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(2 * r) + ' 0a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(-2 * r) + ' 0'; }
  function ell(x, y, rx, ry) { return 'M' + f(x - rx) + ' ' + f(y) + 'a' + f(rx) + ' ' + f(ry) + ' 0 1 0 ' + f(2 * rx) + ' 0a' + f(rx) + ' ' + f(ry) + ' 0 1 0 ' + f(-2 * rx) + ' 0'; }
  // A placement: local (x, y) to stage pixels, scaled by s, turned by deg.
  function mk(ox, oy, s, deg, flip) {
    var a = (deg || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), fx = flip ? -1 : 1;
    var t = function (x, y) { x *= fx; return [ox + s * (x * c - y * sn), oy + s * (x * sn + y * c)]; };
    t.s = s; t.ox = ox; t.oy = oy;
    return t;
  }
  // Map a local path (absolute M L C Q Z only) through a placement.
  function X(d, t) {
    var tok = d.match(/[MLCQZ]|-?\d*\.?\d+/g), out = '', nums = [];
    for (var i = 0; i < tok.length; i++) {
      var k = tok[i];
      if (/[MLCQZ]/.test(k)) { out += k; continue; }
      nums.push(+k);
      if (nums.length === 2) { out += pt(t(nums[0], nums[1])) + ' '; nums = []; }
    }
    return out.trim();
  }
  function C(t, x, y, r) { var p = t(x, y); return circ(p[0], p[1], r * t.s); }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function unit(A) { return A.phone ? Math.min(1, A.W / 420) * .72 : Math.max(.6, Math.min(1.3, Math.min(A.W / 1160, A.H / 720))); }
  function g(A, cls, parent) { return A.el('g', cls ? { 'class': cls } : {}, parent); }
  // A soft radial glow (a filled circle) in the festival colour.
  var gid = 0;
  function glow(A, x, y, r, t, parent, op, col) {
    var id = 'hcf-g' + (++gid), c = col || 'var(--fc,var(--lagna))';
    var defs = A.svg.querySelector('defs') || A.el('defs', {}, A.svg);
    var rg = A.el('radialGradient', { id: id }, defs);
    A.el('stop', { offset: '0', style: 'stop-color:' + c + ';stop-opacity:calc(var(--gk,1) * ' + (op || .32) + ')' }, rg);
    A.el('stop', { offset: '.55', style: 'stop-color:' + c + ';stop-opacity:calc(var(--gk,1) * ' + ((op || .32) * .35).toFixed(3) + ')' }, rg);
    A.el('stop', { offset: '1', style: 'stop-color:' + c + ';stop-opacity:0' }, rg);
    return A.el('circle', { cx: f(x), cy: f(y), r: f(r), fill: 'url(#' + id + ')', 'data-t': t + ',1400' }, parent);
  }
  // A disc in the page colour, so things passing behind are hidden.
  function veil(A, x, y, rx, ry, parent) {
    return A.el('ellipse', { cx: f(x), cy: f(y), rx: f(rx), ry: f(ry || rx), style: 'fill:var(--bg);stroke:none' }, parent);
  }

  /* ---------- Shared motifs ---------- */
  // Small bilingual caption in SVG; the site hides the other language by [lang].
  function txt(A, x, y, en, hi, size, t, parent, cls) {
    [['en', en], ['hi', hi]].forEach(function (l) {
      var e = A.el('text', { x: f(x), y: f(y), 'class': cls || 'fcap', lang: l[0], style: 'font-size:' + f(l[0] === 'hi' ? size * 1.12 : size) + 'px', 'data-t': t + ',700' }, parent);
      e.textContent = l[1];
    });
  }
  // A clay diya: open bowl with a lip and a small foot; state lit, past or unlit.
  function lamp(A, x, by, s, state, t, parent) {
    var T = mk(x, by, s);
    A.add('dl3', X('M-31 -17C-25 1 25 1 31 -17C15 -12 -15 -12 -31 -17M-10 -1L-13 6L13 6L10 -1', T), t, 800, parent);
    if (state === 'unlit') { A.add('dl2', X('M-2 -17L0 -21L2 -17', T), t + 300, 300, parent); return null; }
    var fg = g(A, '', parent);
    if (state === 'lit') glow(A, x, by - 26 * s, 34 * s, t + 600, fg, .42);
    var fl = g(A, '', fg);
    var d = X('M0 -42C7 -33 6.5 -24 0 -16C-6.5 -24 -7 -33 0 -42Z', T);
    A.add('flame', d, t + 700, 500, fl);
    if (state === 'past') fg.setAttribute('opacity', '.45');
    return fl;
  }
  // A lotus seen from the side: three layers of petals on a base line.
  function lotus(A, T, t, parent, cls) {
    cls = cls || 'fs';
    A.add(cls, X('M0 0C-7 -9 -7 -20 0 -30C7 -20 7 -9 0 0Z', T), t, 700, parent);
    A.add(cls, X('M0 0C-12 -4 -19 -14 -19 -24C-11 -21 -4 -12 0 0M0 0C12 -4 19 -14 19 -24C11 -21 4 -12 0 0', T), t + 150, 700, parent);
    A.add('dl3', X('M0 0C-17 0 -29 -6 -32 -14C-22 -15 -10 -9 0 0M0 0C17 0 29 -6 32 -14C22 -15 10 -9 0 0', T), t + 300, 700, parent);
    A.add('dl2', X('M-30 3Q0 8 30 3', T), t + 450, 600, parent);
  }
  // A mango leaf from its stalk at local (0,0), pointing along +y.
  function mleaf(A, T, t, parent, cls) {
    A.add(cls || 'dl3', X('M0 0C6 6 7 20 0 34C-7 20 -6 6 0 0ZM0 3L0 30', T), t, 600, parent);
  }

  /* ---------- Navratri: nine nights, nine forms ----------
     The day (index.html AA_navDay: IST date from the active preset's first
     day, or ?day=) picks the Devi's symbol, the day's colour and how many of
     the nine lamps are lit. A ring of garba dancers circles the words. */
  var NAV_COLOURS = { // first IST date of Navratri -> the nine day colours
    '2026-10-11': ['orange', 'white', 'red', 'royal-blue', 'yellow', 'green', 'grey', 'purple', 'peacock-green'],
    '2027-09-30': ['yellow', 'green', 'grey', 'orange', 'white', 'red', 'royal-blue', 'pink', 'purple']
  };
  function navColours() {
    var p = window.AA_CANVAS_PRESET, k = '2026-10-11';
    if (p && p.canvas === 'navratri' && p.from) {
      var d = new Date(Date.parse(p.from) + 19800000);
      var key = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
      if (NAV_COLOURS[key]) k = key;
    }
    return NAV_COLOURS[k];
  }

  // The nine symbols, each about 110 units tall, centred on local (0,0).
  var DEVI = [
    // 1 Shailaputri: trishul rising from a lotus.
    function (A, T, t, p) {
      A.add('fs', X('M0 26L0 -16', T), t, 700, p);
      A.add('ff', X('M0 -58C5 -49 6 -42 0 -34C-6 -42 -5 -49 0 -58Z', T), t + 300, 600, p);
      A.add('fs', X('M0 -34L0 -16M-24 -34C-24 -19 -10 -16 0 -16C10 -16 24 -19 24 -34', T), t + 200, 800, p);
      A.add('fs', X('M-24 -34C-26 -41 -25 -47 -19 -53M24 -34C26 -41 25 -47 19 -53', T), t + 600, 600, p);
      A.add('fs2', X('M-4 -8L4 -8M-4 -3L4 -3', T), t + 800, 400, p);
      lotus(A, mk(T.ox, T.oy + 44 * T.s, T.s), t + 700, p);
    },
    // 2 Brahmacharini: a japa mala and a kamandalu.
    function (A, T, t, p) {
      for (var i = 0; i < 24; i++) {
        var a = Math.PI / 2 + (i + .5) * 2 * Math.PI / 25;
        A.add('fs', C(T, -20 + 25 * Math.cos(a), -8 + 25 * Math.sin(a), 2.3), t + i * 40, 300, p);
      }
      A.add('ff', C(T, -20, 19.5, 3.4), t + 1000, 300, p);
      A.add('fs2', X('M-20 23L-24 40M-20 23L-20 41M-20 23L-16 40', T), t + 1100, 500, p);
      A.add('dl3', X('M14 6C11 24 18 36 29 36C40 36 47 24 44 6Q29 0 14 6Z', T), t + 300, 900, p);
      A.add('dl3', X('M17 4Q29 -2 41 4M16 5C14 -24 44 -24 42 5M44 13C51 11 55 4 57 -3M45 20C53 18 58 9 60 -2', T), t + 700, 800, p);
      A.add('fs2', X('M15 17Q29 23 44 17', T), t + 1000, 500, p);
    },
    // 3 Chandraghanta: a bell hung from a horned crescent.
    function (A, T, t, p) {
      A.add('ff', X('M-26 -56C-17 -36 17 -36 26 -56C14 -45 -14 -45 -26 -56Z', T), t, 900, p);
      A.add('fs', C(T, 0, -36, 3.6), t + 400, 400, p);
      A.add('fs', X('M0 -32L0 -27M-7 -27L7 -27', T), t + 500, 300, p);
      A.add('dl3', X('M-7 -27C-21 -23 -20 -2 -25 14L25 14C20 -2 21 -23 7 -27', T), t + 600, 900, p);
      A.add('fs', X('M-28 16Q0 22 28 16M-21 -6Q0 -1 21 -6', T), t + 1000, 600, p);
      A.add('fs', X('M0 18L0 24', T) + C(T, 0, 27, 3), t + 1300, 400, p);
    },
    // 4 Kushmanda: the sun holding the cosmic egg.
    function (A, T, t, p) {
      var rays = g(A, '', p);
      for (var i = 0; i < 16; i++) {
        var a = i * Math.PI / 8, r1 = i % 2 ? 37 : 44;
        A.add('fs', X('M' + f(30 * Math.cos(a)) + ' ' + f(30 * Math.sin(a)) + 'L' + f(r1 * Math.cos(a)) + ' ' + f(r1 * Math.sin(a)), T), t + 400 + i * 50, 300, rays);
      }
      A.add('ff', C(T, 0, 0, 23), t, 900, p);
      A.add('fs', X('M0 -12C7 -12 9 -3 9 2C9 9 5 12 0 12C-5 12 -9 9 -9 2C-9 -3 -7 -12 0 -12Z', T), t + 500, 700, p);
      A.add('fdot', C(T, 0, 2, 1.8), t + 900, 300, p);
      A.add('dl2', C(T, 0, 0, 50), t + 600, 1000, p);
      return { spin: rays, cx: T.ox, cy: T.oy };
    },
    // 5 Skandamata: the vel rising from a lotus, six stars for Skanda's six faces.
    function (A, T, t, p) {
      A.add('fs', X('M0 26L0 -26', T), t, 700, p);
      A.add('ff', X('M0 -58C10 -46 10 -36 0 -27C-10 -36 -10 -46 0 -58Z', T), t + 300, 700, p);
      A.add('fs2', X('M0 -52L0 -33M-5 -24L5 -24', T), t + 700, 400, p);
      for (var i = 0; i < 6; i++) {
        var a = Math.PI * (1.18 + i * .128), x = 44 * Math.cos(a), y = -14 + 44 * Math.sin(a);
        A.add('fdot', C(T, x, y, 1.9), t + 900 + i * 90, 300, p);
      }
      lotus(A, mk(T.ox, T.oy + 44 * T.s, T.s * 1.15), t + 500, p);
    },
    // 6 Katyayani: the khadga beside a lotus on its stem.
    function (A, T, t, p) {
      A.add('ff', X('M-3 18L-3 -40C-3 -50 1 -57 7 -61C5 -50 4 -42 4 -30L4 18Z', T), t, 900, p);
      A.add('fs', X('M-14 20Q0 15 14 20M-2 21L-2 36M2 21L2 36', T) + C(T, 0, 39, 3), t + 500, 600, p);
      A.add('dl3', X('M-14 46C-20 30 -26 14 -30 -2', T), t + 600, 700, p);
      lotus(A, mk(T.ox - 30 * T.s, T.oy - 2 * T.s, T.s * .62, -14), t + 900, p);
      A.add('dl2', X('M-22 26C-30 22 -34 24 -38 30C-31 31 -26 30 -22 26Z', T), t + 1100, 500, p);
    },
    // 7 Kalaratri: the vajra under the night's stars.
    function (A, T, t, p) {
      var half = 'M0 -12L0 -46M-6 -13C-22 -22 -18 -40 -3 -45M6 -13C22 -22 18 -40 3 -45M-9 -12Q0 -16 9 -12';
      [0, 180].forEach(function (r, i) {
        var H2 = mk(T.ox, T.oy, T.s, r);
        A.add('fs', X(half, H2), t + i * 200, 900, p);
        A.add('ff', X('M0 -56L3 -47L0 -43L-3 -47Z', H2), t + 700 + i * 200, 400, p);
        A.add('fs2', X('M-6 -8Q0 -4 6 -8', H2), t + 800, 300, p);
      });
      A.add('ff', C(T, 0, 0, 4.5), t + 600, 400, p);
      [[-40, -40, 2.4], [38, -30, 1.8], [-34, 20, 1.6], [42, 30, 2.2], [26, -52, 1.4]].forEach(function (s, i) {
        var c = T(s[0], s[1]), r = s[2] * T.s * 2.4;
        A.add('fs2', 'M' + f(c[0]) + ' ' + f(c[1] - r) + 'Q' + f(c[0]) + ' ' + f(c[1]) + ' ' + f(c[0] + r) + ' ' + f(c[1]) + 'Q' + f(c[0]) + ' ' + f(c[1]) + ' ' + f(c[0]) + ' ' + f(c[1] + r) + 'Q' + f(c[0]) + ' ' + f(c[1]) + ' ' + f(c[0] - r) + ' ' + f(c[1]) + 'Q' + f(c[0]) + ' ' + f(c[1]) + ' ' + f(c[0]) + ' ' + f(c[1] - r) + 'Z', t + 900 + i * 120, 400, p);
      });
    },
    // 8 Mahagauri: the damru before a full white moon.
    function (A, T, t, p) {
      A.add('ff2', C(T, 0, -4, 36), t, 1100, p);
      A.add('dl3', X('M-15 -26L15 -26L2 -4L15 18L-15 18L-2 -4Z', T), t + 400, 900, p);
      A.add('fs', X('M-15 -26Q0 -22 15 -26M-15 18Q0 22 15 18M-3 -6L3 -6M-3 -2L3 -2', T), t + 800, 500, p);
      A.add('fs2', X('M2 -4Q16 0 22 10M-2 -4Q-16 0 -22 10', T) + C(T, 23, 12, 2.4) + C(T, -23, 12, 2.4), t + 1100, 500, p);
    },
    // 9 Siddhidatri: the chakra turning above a lotus.
    function (A, T, t, p) {
      var w = g(A, '', p);
      A.add('fs', C(T, 0, -12, 26) + C(T, 0, -12, 20), t, 1000, w);
      A.add('ff', C(T, 0, -12, 5), t + 400, 400, w);
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        A.add('fs2', X('M' + f(5 * Math.cos(a)) + ' ' + f(-12 + 5 * Math.sin(a)) + 'L' + f(20 * Math.cos(a)) + ' ' + f(-12 + 20 * Math.sin(a)), T), t + 500 + i * 60, 300, w);
      }
      for (var j = 0; j < 16; j++) {
        var b = j * Math.PI / 8, b0 = b - .1, b1 = b + .1;
        A.add('fs2', X('M' + f(26 * Math.cos(b0)) + ' ' + f(-12 + 26 * Math.sin(b0)) + 'L' + f(32 * Math.cos(b)) + ' ' + f(-12 + 32 * Math.sin(b)) + 'L' + f(26 * Math.cos(b1)) + ' ' + f(-12 + 26 * Math.sin(b1)), T), t + 800 + j * 40, 300, w);
      }
      lotus(A, mk(T.ox, T.oy + 46 * T.s, T.s * .95), t + 600, p);
      return { spin: w, cx: T.ox, cy: T.oy - 12 * T.s };
    }
  ];

  // A kalash: pot with moli bands, five mango leaves and a coconut.
  function kalash(A, x, by, s, t, parent) {
    var T = mk(x, by, s);
    veil(A, x, by - 50 * s, 44 * s, 52 * s, parent);
    veil(A, x, by - 104 * s, 30 * s, 26 * s, parent);
    [-96, -72, -48, -24].forEach(function (d, i) {
      mleaf(A, mk(x - 10 * s, by - 82 * s, s * (1.05 - i * .06), 180 + d), t + 700 + i * 90, parent, 'lf');
      mleaf(A, mk(x + 10 * s, by - 82 * s, s * (1.05 - i * .06), 180 - d), t + 700 + i * 90, parent, 'lf');
    });
    veil(A, x, by - 102 * s, 16 * s, 20 * s, parent);
    A.add('dl3', X('M0 -124C11 -120 16 -110 16 -100C16 -90 9 -83 0 -83C-9 -83 -16 -90 -16 -100C-16 -110 -11 -120 0 -124Z', T), t + 1100, 700, parent);
    A.add('dl2', X('M-2 -123L-5 -131M0 -124L0 -132M2 -123L5 -131M-8 -118Q-12 -104 -9 -90M8 -118Q12 -104 9 -90M-3 -121Q-5 -104 -3 -86M3 -121Q5 -104 3 -86', T), t + 1500, 500, parent);
    A.add('ff', X('M-16 -98Q0 -90 16 -98L18 -88Q0 -80 -18 -88Z', T), t + 1300, 500, parent);
    A.add('dl3', X('M-16 -80C-18 -68 -42 -64 -42 -42C-42 -20 -28 -8 -18 -6L18 -6C28 -8 42 -20 42 -42C42 -64 18 -68 16 -80', T), t, 1000, parent);
    A.add('dl3', X('M-20 -82Q0 -78 20 -82Q0 -86 -20 -82Z', T), t + 300, 500, parent);
    A.add('fs', X('M-41 -48Q0 -40 41 -48M-38 -30Q0 -22 38 -30', T), t + 600, 700, parent);
    for (var i = -2; i <= 2; i++) A.add('fdot', C(T, i * 12, -38 + Math.abs(i) * -.6, 1.5), t + 900 + i * 40, 200, parent);
    A.add('dl2', X('M-30 -2Q0 6 30 -2', T), t + 400, 600, parent);
  }

  // One garba dancer, local feet at (0,0): raised dandiyas, a flared ghagra.
  function dancer(A, parent, t, flip) {
    var T = mk(0, 0, 1, 0, flip);
    A.add('ff', X('M-3 -32C-6 -24 -15 -16 -27 -9Q-23 -3 -16 -1Q-10 3 -4 0Q2 3 8 0Q15 2 22 -5C14 -14 7 -22 3 -32Z', T), t, 600, parent);
    A.add('fs2', X('M-1 -30C-5 -20 -12 -10 -16 -2M2 -30C3 -20 5 -10 8 0', T), t + 200, 500, parent);
    A.add('dl3', X('M0 -45C1 -40 -1 -36 0 -32M-1 -42Q-9 -44 -12 -53M1 -42Q9 -40 13 -46M-4 1L-6 4M4 1L6 3', T), t + 100, 500, parent);
    A.add('dl3', C(T, 0, -50, 4), t + 100, 400, parent);
    A.add('dl2', X('M1 -42C10 -38 15 -28 24 -27', T), t + 300, 400, parent);
    A.add('fs', X('M-12 -53L-5 -63M13 -46L21 -55', T), t + 350, 400, parent);
  }

  F.navratri = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    var day = window.AA_navDay ? window.AA_navDay() : 1;
    var col = navColours()[day - 1];
    A.hc.style.setProperty('--fc', 'var(--nav-' + col + ')');
    A.frame();

    // The garba ring: dancers circle the words, smaller and fainter at the
    // back (top), as on a floor seen from a little above.
    var cy0 = H * .47, rx = Math.min(W * .43, W / 2 - 60), ry = H * .355;
    var back = g(A, '');
    if (!phone) {
      A.add('dl2', ell(cx, cy0, rx, ry), 900, 2600, back, true);
      var ring = g(A, '');
      var N = 10, per = 140000;
      for (var i = 0; i < N; i++) {
        var gd = g(A, '', ring), inner = g(A, '', gd);
        dancer(A, inner, 2200 + i * 110, i % 2);
        var a0 = i / N;
        var at = function (fr) {
          var a = (a0 + fr) * Math.PI * 2, sn = Math.sin(a), sc = (.66 + .34 * (1 - sn) / 2) * u;
          return { transform: 'translate(' + f(cx + rx * Math.cos(a)) + 'px,' + f(cy0 + ry * sn) + 'px) scale(' + sc.toFixed(3) + ')', opacity: (.42 + .58 * (1 - sn) / 2).toFixed(2) };
        };
        var s0 = at(0);
        gd.style.transform = s0.transform; gd.style.opacity = s0.opacity;
        var kf = [];
        for (var k = 0; k <= 48; k++) kf.push(at(k / 48));
        A.loop(gd, kf, { duration: per, iterations: Infinity, delay: 3200 });
        A.loop(inner, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 1100, iterations: Infinity, delay: 3200 + i * 137 });
      }
    }

    // The day's form, top centre, in the day's colour.
    var sy = phone ? T0 + Math.max(84, H * .12) : T0 + Math.max(66, H * .1), ss = phone ? u * .95 : u * 1.12;
    var sym = g(A, '');
    veil(A, cx, sy, 58 * ss, 62 * ss, sym);
    glow(A, cx, sy, 70 * ss, 300, sym, .22);
    var spin = DEVI[day - 1](A, mk(cx, sy, ss), 700, sym);
    if (spin && spin.spin) {
      spin.spin.style.transformOrigin = f(spin.cx) + 'px ' + f(spin.cy) + 'px';
      A.loop(spin.spin, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 90000, iterations: Infinity, delay: 3000 });
    }

    // Nine lamps along the bottom, one for each night: the nights gone glow
    // softly, tonight's is bright, the nights to come wait unlit. The kalash
    // stands behind the fifth.
    var s = phone ? Math.min(.46, W / 820) : .78 * u, gap = phone ? (W - 48) / 9 : Math.min(84 * u, (W - 200) / 9);
    var by = phone ? B - 96 : B - Math.max(22, H * .035);
    // The kalash stands on a low step above the fifth lamp, so all nine show.
    var ks = phone ? s * 1.05 : s * 1.12, kb = by - 50 * s;
    kalash(A, cx, kb, ks, 1400);
    A.add('dl2', 'M' + pt([cx - 40 * ks, kb + 2 * s]) + 'L' + pt([cx + 40 * ks, kb + 2 * s]), 1300, 600);
    for (var n = 0; n < 9; n++) {
      var st = n + 1 < day ? 'past' : n + 1 === day ? 'lit' : 'unlit';
      // The fifth lamp burns at the kalash's foot.
      var lx = cx + (n - 4) * gap, ly = by;
      var fl = lamp(A, lx, ly, s, st, 1600 + n * 180);
      if (fl && st === 'lit') {
        var fb = ly - 16 * s;
        fl.style.transformOrigin = f(lx) + 'px ' + f(fb) + 'px';
        A.loop(fl, [{ transform: 'scale(1,1)' }, { transform: 'scale(.94,1.07)' }, { transform: 'scale(1.03,.96)' }, { transform: 'scale(1,1)' }], { duration: 1700, iterations: Infinity, delay: 3600, easing: 'ease-in-out' });
      }
    }
  };

  /* ---------- Dussehra (Vijayadashami): good prevails ----------
     A bow in the left column, its arrow in flight across the top leaving a
     fine trail of light to a burst; the lamp of truth below the words,
     between apta leaves. */
  function apta(A, T, t, parent) {
    A.add('dl3', X('M0 0C-10 -4 -17 -16 -11 -25C-7 -29 -1 -25 0 -19C1 -25 7 -29 11 -25C17 -16 10 -4 0 0ZM0 0L0 -18M0 0L0 8', T), t, 700, parent);
  }
  F.dussehra = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // The bow, tilted to aim up and right: its belly towards the target, the
    // string drawn back with the arrow nocked. At the release the string
    // snaps straight and the arrow flies the trail to the burst.
    var bh = phone ? Math.min(120, H * .16) : Math.min(250 * u, H * .34);
    var bw = bh * .16, aim = phone ? -28 : -14;
    var bx = phone ? L + 62 : L + Math.max(110, 150 * u), byc = phone ? T0 + 40 + bh / 2 : T0 + 24 + bh / 2;
    // Local frame: +x is the arrow's way, the bow stands along y.
    var ca = Math.cos(aim * Math.PI / 180), sa = Math.sin(aim * Math.PI / 180);
    var BT = function (x, y) { return [bx + x * ca - y * sa, byc + x * sa + y * ca]; };
    BT.s = 1; BT.ox = bx; BT.oy = byc;
    var h2 = bh / 2;
    function limb(o) {
      return X('M-6 ' + (-h2) + 'C' + (bw * .9 + o) + ' ' + (-bh * .36) + ' ' + (bw + o) + ' ' + (-bh * .1) + ' ' + (bw + o) + ' 0C' + (bw + o) + ' ' + (bh * .1) + ' ' + (bw * .9 + o) + ' ' + (bh * .36) + ' -6 ' + h2, BT);
    }
    A.add('ac2', limb(0), 700, 1100);
    A.add('dl3', limb(-4 * u), 800, 1100);
    A.add('ac', X('M-6 ' + (-h2) + 'Q-12 ' + (-h2 - 6) + ' -17 ' + (-h2 - 1) + 'M-6 ' + h2 + 'Q-12 ' + (h2 + 6) + ' -17 ' + (h2 + 1), BT), 1500, 400);
    A.add('ac', X('M' + (bw - 3) + ' -10L' + (bw + 3) + ' -10M' + (bw - 3) + ' 10L' + (bw + 3) + ' 10M' + (bw - 3) + ' 0L' + (bw + 3) + ' 0', BT), 1500, 300);
    var nockX = -bw * 1.1, nock = BT(nockX, 0), aLen = bw * 2.1 + 34 * u;
    var drawnS = g(A, ''), restS = g(A, '');
    A.add('dl3', X('M-6 ' + (-h2) + 'L' + nockX + ' 0L-6 ' + h2, BT), 1300, 600, drawnS);
    A.add('dl3', X('M-6 ' + (-h2) + 'L-6 ' + h2, BT), 0, 1, restS);
    if (A.reduce) drawnS.style.opacity = '0';
    else {
      restS.style.opacity = '0';
      A.loop(drawnS, [{ opacity: 1 }, { opacity: 0 }], { delay: 2000, duration: 90, fill: 'forwards' });
      A.loop(restS, [{ opacity: 0 }, { opacity: 1 }], { delay: 2000, duration: 90, fill: 'forwards' });
    }

    // The flight: from the nock, along the aim, over the top to the burst.
    var p0 = nock, p2 = phone ? [R - 48, T0 + 96] : [R - Math.max(150, 190 * u), T0 + Math.max(70, H * .12)];
    var topY = phone ? T0 + 6 : T0 - H * .02, dd = (p0[1] - topY) / Math.max(.2, -sa);
    var p1 = [p0[0] + ca * dd, p0[1] + sa * dd];
    if (p1[0] > p2[0] - 40) { p1[0] = p2[0] - 40; }
    var trail = 'M' + pt(p0) + 'Q' + pt(p1) + ' ' + pt(p2);
    var id = 'hcf-trail';
    var defs = A.svg.querySelector('defs') || A.el('defs', {});
    var lg = A.el('linearGradient', { id: id, gradientUnits: 'userSpaceOnUse', x1: f(p0[0]), y1: f(p0[1]), x2: f(p2[0]), y2: f(p2[1]) }, defs);
    A.el('stop', { offset: '0', style: 'stop-color:var(--lagna);stop-opacity:.55' }, lg);
    A.el('stop', { offset: '.5', style: 'stop-color:var(--lagna);stop-opacity:.4' }, lg);
    A.el('stop', { offset: '1', style: 'stop-color:var(--lagna);stop-opacity:.95' }, lg);
    A.add('trail', trail, 2000, 1700);
    // A few sparks left hanging in the air along the way.
    for (var sp = 1; sp <= 7; sp++) {
      var st = .25 + sp * .09, mt0 = 1 - st, spx = mt0 * mt0 * p0[0] + 2 * mt0 * st * p1[0] + st * st * p2[0], spy = mt0 * mt0 * p0[1] + 2 * mt0 * st * p1[1] + st * st * p2[1];
      var sk = g(A, '');
      A.el('circle', { 'class': 'adot', cx: f(spx + (sp % 2 ? 5 : -4) * u), cy: f(spy + (sp % 2 ? 7 : 10) * u), r: f((sp % 3 ? 1.2 : 1.8) * u), 'data-t': (2400 + sp * 200) + ',600' }, sk);
      A.loop(sk, [{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 2600 + sp * 330, iterations: Infinity, delay: 4200 + sp * 170, easing: 'ease-in-out' });
    }
    // Burst where the arrow arrives.
    var bg = g(A, '');
    glow(A, p2[0], p2[1], 46 * u, 3500, bg, .4);
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6, r0 = 16 * u, r1 = (i % 2 ? 26 : 34) * u;
      A.add('ac', 'M' + pt([p2[0] + r0 * Math.cos(a), p2[1] + r0 * Math.sin(a)]) + 'L' + pt([p2[0] + r1 * Math.cos(a), p2[1] + r1 * Math.sin(a)]), 3500 + i * 30, 400, bg);
    }
    bg.style.transformOrigin = f(p2[0]) + 'px ' + f(p2[1]) + 'px';
    A.loop(bg, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.08)', opacity: .7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 3600, iterations: Infinity, delay: 4200, easing: 'ease-in-out' });
    // The arrow (its tip at local 0): at rest on the string, then in flight.
    var pts = [], lens = [0], tot = 0;
    for (var k = 0; k <= 120; k++) {
      var tt = k / 120, mt = 1 - tt;
      pts.push([mt * mt * p0[0] + 2 * mt * tt * p1[0] + tt * tt * p2[0], mt * mt * p0[1] + 2 * mt * tt * p1[1] + tt * tt * p2[1]]);
      if (k) { tot += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); lens.push(tot); }
    }
    function along(dist) {
      var k = 1;
      while (k < 120 && lens[k] < dist) k++;
      var a = pts[k - 1], b = pts[k], r = (dist - lens[k - 1]) / Math.max(1e-6, lens[k] - lens[k - 1]);
      return 'translate(' + f(a[0] + (b[0] - a[0]) * r) + 'px,' + f(a[1] + (b[1] - a[1]) * r) + 'px) rotate(' + (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI).toFixed(1) + 'deg)';
    }
    var arW = g(A, ''), ar = g(A, '', arW), AT = mk(0, 0, u);
    A.el('path', { 'class': 'ac2', d: 'M' + f(-aLen) + ' 0L' + f(-2 * u) + ' 0' }, ar);
    A.el('path', { 'class': 'ff', style: '--fc:var(--lagna)', d: X('M2 0L-11 -5L-8 0L-11 5Z', AT) }, ar);
    A.el('path', { 'class': 'ac', d: 'M' + f(-aLen + 6 * u) + ' 0L' + f(-aLen - 2 * u) + ' ' + f(-6 * u) + 'M' + f(-aLen + 12 * u) + ' 0L' + f(-aLen + 4 * u) + ' ' + f(-6 * u) + 'M' + f(-aLen + 6 * u) + ' 0L' + f(-aLen - 2 * u) + ' ' + f(6 * u) + 'M' + f(-aLen + 12 * u) + ' 0L' + f(-aLen + 4 * u) + ' ' + f(6 * u) }, ar);
    ar.style.transform = along(tot);
    if (!A.reduce && ar.animate) {
      var kf = [];
      for (var j = 0; j <= 48; j++) {
        var e = j / 48, ez = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
        kf.push({ transform: along(aLen + (tot - aLen) * ez) });
      }
      A.loop(ar, kf, { duration: 1700, delay: 2000, fill: 'backwards' });
      A.loop(arW, [{ opacity: 0 }, { opacity: 1 }], { delay: 1300, duration: 600, fill: 'backwards' });
    }

    // The lamp of truth: a samai on its foot, a tall steady flame.
    var ls = phone ? .62 : u * 1.08, lx = cx, lb = phone ? B - 70 : B - Math.max(20, H * .03), LT = mk(lx, lb, ls);
    A.add('dl3', X('M-30 0Q0 -8 30 0Q0 6 -30 0ZM-14 -3C-10 -12 -6 -16 -4 -22L4 -22C6 -16 10 -12 14 -3', LT), 1200, 900);
    A.add('dl3', X('M-4 -22L-3 -70M4 -22L3 -70', LT), 1500, 700);
    A.add('ac', X('M-8 -34L8 -34M-7 -50L7 -50M-6 -62L6 -62', LT) + C(LT, 0, -42, 3) + C(LT, 0, -56, 2.6), 1800, 600);
    A.add('dl3', X('M-30 -78C-24 -66 24 -66 30 -78C14 -74 -14 -74 -30 -78ZM-3 -70L-6 -66M3 -70L6 -66', LT), 2000, 700);
    var lf = g(A, '');
    glow(A, lx, lb - 104 * ls, 64 * ls, 2600, lf, .5);
    var fl = g(A, '', lf);
    A.add('flame', X('M0 -128C10 -114 9 -100 0 -84C-9 -100 -10 -114 0 -128Z', LT), 2700, 600, fl);
    A.add('ac', X('M0 -112C3 -106 3 -100 0 -94C-3 -100 -3 -106 0 -112Z', LT), 2900, 400, fl);
    fl.style.transformOrigin = f(lx) + 'px ' + f(lb - 84 * ls) + 'px';
    A.loop(fl, [{ transform: 'scale(1,1)' }, { transform: 'scale(.95,1.05)' }, { transform: 'scale(1.02,.97)' }, { transform: 'scale(1,1)' }], { duration: 2200, iterations: Infinity, delay: 3600, easing: 'ease-in-out' });
    // Victory flags in both lower columns, fluttering towards the words.
    if (!phone) {
      [1, -1].forEach(function (sd, fi) {
        var fx = sd > 0 ? R - Math.max(110, 150 * u) : L + Math.max(110, 150 * u), fh = H * .4, fb2 = B - Math.max(20, H * .03), FT = mk(fx, fb2, 1);
        A.add('dl3', 'M' + pt([fx - 6 * u, fb2]) + 'L' + pt([fx + 6 * u, fb2]) + 'M' + pt([fx, fb2]) + 'L' + pt([fx, fb2 - fh]), 900 + fi * 120, 1200);
        A.add('ac', C(FT, 0, -fh - 5 * u, 4 * u) + 'M' + pt([fx, fb2 - fh - 9 * u]) + 'L' + pt([fx, fb2 - fh - 18 * u]), 1900 + fi * 120, 400);
        var flag = g(A, ''), fw = 92 * u * sd, fy = fb2 - fh;
        A.add('flag', 'M' + pt([fx, fy]) + 'Q' + pt([fx - fw * .5, fy + 8 * u]) + ' ' + pt([fx - fw, fy + 22 * u]) + 'L' + pt([fx - fw * .42, fy + 31 * u]) +
          'Q' + pt([fx - fw * .7, fy + 44 * u]) + ' ' + pt([fx - fw * .9, fy + 60 * u]) + 'Q' + pt([fx - fw * .45, fy + 60 * u]) + ' ' + pt([fx, fy + 64 * u]) + 'Z', 2100 + fi * 120, 900, flag);
        flag.style.transformOrigin = f(fx) + 'px ' + f(fy + 32 * u) + 'px';
        A.loop(flag, [{ transform: 'skewY(0deg) scaleX(1)' }, { transform: 'skewY(' + (-2.5 * sd) + 'deg) scaleX(.97)' }, { transform: 'skewY(' + (1.5 * sd) + 'deg) scaleX(1)' }, { transform: 'skewY(0deg) scaleX(1)' }], { duration: 4200 + fi * 500, iterations: Infinity, delay: 3400 + fi * 300, easing: 'ease-in-out' });
        A.add('dl2', 'M' + pt([fx - 40 * u, fb2]) + 'Q' + pt([fx, fb2 - 6 * u]) + ' ' + pt([fx + 40 * u, fb2]), 1000, 600);
      });
    }
    // Apta leaves, the gold of Dussehra, either side of the lamp.
    var ax = phone ? 70 : 110 * u;
    [-1, 1].forEach(function (sd) {
      apta(A, mk(lx + sd * ax, lb - 2, ls * 1.2, sd * 28), 2200, null);
      apta(A, mk(lx + sd * (ax + 34 * ls), lb - 2, ls, sd * 52), 2350, null);
    });
  };

  /* ---------- Shared: colour groups, clipping, drifting specks ---------- */
  function cg(A, col, parent) { var e = g(A, '', parent); e.style.setProperty('--fc', col); return e; }
  function clipFrame(A) {
    var defs = A.svg.querySelector('defs') || A.el('defs', {});
    var cp = A.el('clipPath', { id: 'hcf-clip' }, defs);
    A.el('rect', { x: f(A.L), y: f(A.T), width: f(A.R - A.L), height: f(A.B - A.T) }, cp);
    return A.el('g', { 'clip-path': 'url(#hcf-clip)' });
  }
  // A speck that rises and fades, over and over (static and faint for reduced motion).
  function speck(A, x, y, r, col, dx, dy, dur, delay, parent) {
    var c = A.el('circle', { cx: f(x), cy: f(y), r: f(r), style: 'fill:' + col }, parent);
    if (A.reduce) { c.setAttribute('opacity', '.5'); return; }
    A.loop(c, [{ transform: 'translate(0,0)', opacity: 0 }, { opacity: .9, offset: .25 }, { opacity: .7, offset: .7 }, { transform: 'translate(' + f(dx) + 'px,' + f(dy) + 'px)', opacity: 0 }],
      { duration: dur, delay: delay, iterations: Infinity, fill: 'backwards', easing: 'ease-out' });
  }
  function breathe(A, node, x, y, dur, delay, amt) {
    node.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
    A.loop(node, [{ transform: 'scale(1)' }, { transform: 'scale(' + (amt || 1.05) + ')' }, { transform: 'scale(1)' }], { duration: dur, delay: delay, iterations: Infinity, easing: 'ease-in-out' });
  }

  /* ---------- Holi: gulal in six colours ----------
     Soft clouds of colour bloom from the four corners with a spray of
     droplets, two pichkaris aim their jets at each other across the lower
     columns, a row of gulal thalis sits below the words and specks of
     colour drift up. The only canvas that keeps its colours in B&W. */
  var HOLI = ['pink', 'orange', 'yellow', 'green', 'blue', 'purple'];
  function hcol(k) { return 'var(--holi-' + k + ')'; }
  function pichkari(A, T, t, col, parent) {
    var gp = cg(A, col, parent);
    A.add('ff', X('M-62 -8L-4 -8Q0 -8 0 -4L0 4Q0 8 -4 8L-62 8Q-66 8 -66 4L-66 -4Q-66 -8 -62 -8Z', T), t, 900, gp);
    A.add('dl3', X('M0 -5L20 -2L20 2L0 5M-66 0L-94 0M-94 -12L-94 12M-99 -12Q-103 0 -99 12', T), t + 300, 800, gp);
    A.add('fs2', X('M-50 -8L-50 8M-34 -8L-34 8M-18 -8L-18 8', T), t + 600, 400, gp);
    return gp;
  }
  F.holi = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(7);
    A.hc.style.removeProperty('--fc');
    A.frame();
    var clip = clipFrame(A);
    // Clouds and bursts at the corners.
    var corners = [[L, T0, ['pink', 'orange', 'yellow']], [R, T0, ['blue', 'purple', 'green']], [L, B, ['green', 'yellow', 'blue']], [R, B, ['purple', 'pink', 'orange']]];
    var cr = phone ? 84 : Math.min(150 * u, H * .24);
    corners.forEach(function (c, ci) {
      var sx = c[0] === L ? 1 : -1, sy = c[1] === T0 ? 1 : -1, ox = c[0] + sx * cr * .35, oy = c[1] + sy * cr * .3;
      var cl = g(A, '', clip);
      c[2].forEach(function (k, j) {
        var a = (j - 1) * .7, d = cr * (j ? .55 : 0);
        glow(A, ox + sx * d * Math.cos(.6 + a), oy + sy * d * Math.sin(.6 + a), cr * (1 - j * .18), 600 + ci * 150 + j * 120, cl, phone ? .4 : .5, hcol(k));
      });
      breathe(A, cl, ox, oy, 9000 + ci * 1300, 3000 + ci * 400, 1.06);
      // A fan of powder thrown towards the middle: dense near the cloud,
      // finer and sparser further out, with a few splashed drops.
      var base = Math.atan2(sy * 1, sx * 1.5), n = phone ? 26 : 46, pd = [g(A, ''), g(A, ''), g(A, '')];
      c[2].forEach(function (k, j) { pd[j].style.setProperty('--fc', hcol(k)); });
      for (var i = 0; i < n; i++) {
        var a2 = base + (rn() - .5) * 1.5, q = Math.pow(rn(), .8), r1 = cr * (.45 + q * .85);
        var rr = (phone ? .8 : 1) * u * (3.2 - q * 2.4) * (.6 + rn() * .6);
        A.add('fdot', circ(ox + r1 * Math.cos(a2), oy + r1 * Math.sin(a2), Math.max(.7, rr)), 1200 + ci * 140 + q * 900, 500, pd[i % 3]);
      }
      for (var dI = 0; dI < 3; dI++) {
        var a3 = base + (dI - 1) * .38, r3 = cr * (1.12 + dI * .06), dx3 = Math.cos(a3), dy3 = Math.sin(a3), x3 = ox + r3 * dx3, y3 = oy + r3 * dy3, w3 = 3.2 * u, l3 = 12 * u;
        A.add('ff', 'M' + pt([x3 + dx3 * l3 * .5, y3 + dy3 * l3 * .5]) + 'Q' + pt([x3 - dy3 * w3, y3 + dx3 * w3]) + ' ' + pt([x3 - dx3 * l3 * .5, y3 - dy3 * l3 * .5]) + 'Q' + pt([x3 + dy3 * w3, y3 - dx3 * w3]) + ' ' + pt([x3 + dx3 * l3 * .5, y3 + dy3 * l3 * .5]) + 'Z', 2000 + ci * 140 + dI * 80, 400, pd[dI]);
      }
    });
    // Two pichkaris, their jets arcing towards each other.
    if (!phone) {
      [-1, 1].forEach(function (sd, pi) {
        var px = sd < 0 ? L + Math.max(130, 175 * u) : R - Math.max(130, 175 * u), py = T0 + H * .62, ang = sd < 0 ? -34 : 214;
        var PT = mk(px, py, u * 1.3, ang), col = hcol(sd < 0 ? 'pink' : 'blue');
        var gp = pichkari(A, PT, 1500 + pi * 200, col);
        var tip = PT(22, 0), dir = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)];
        for (var j = 0; j < 14; j++) {
          var tt = (j + 1) * 17 * u, x = tip[0] + dir[0] * tt, y = tip[1] + dir[1] * tt + .0021 * tt * tt / u;
          var dg = g(A, '', gp);
          A.el('circle', { 'class': 'fdot', cx: f(x), cy: f(y), r: f((2.6 - j * .12) * u), 'data-t': (2400 + pi * 200 + j * 60) + ',400' }, dg);
          A.loop(dg, [{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 1400, delay: 3500 + j * 100, iterations: Infinity, easing: 'ease-in-out' });
        }
      });
    }
    // Gulal thalis below the words: a plate and a heap of powder each.
    var nT = 5, sp = phone ? Math.min(66, (W - 40) / 5) : 100 * u, ts = phone ? .72 : u * 1.25, ty = phone ? B - 150 : B - Math.max(28, H * .05);
    ['pink', 'yellow', 'green', 'blue', 'orange'].forEach(function (k, i) {
      var x = cx + (i - (nT - 1) / 2) * sp, TT = mk(x, ty, ts), gt = cg(A, hcol(k));
      A.add('heap', X('M-24 -3C-19 -24 19 -24 24 -3Z', TT), 1800 + i * 140, 700, gt, true);
      A.add('dl3', X('M-34 -3Q0 5 34 -3Q0 -9 -34 -3ZM-30 -1Q0 7 30 -1', TT), 1600 + i * 140, 800, gt);
      A.add('fdot', C(TT, -6, -16, 1.4) + C(TT, 5, -19, 1.1) + C(TT, 12, -11, 1.3), 2300 + i * 140, 400, gt);
    });
    // Specks of colour drifting up the side columns and the top band.
    var nS = phone ? 14 : 30;
    for (var s = 0; s < nS; s++) {
      var side = s % 2 ? 1 : -1, x0 = phone ? L + 16 + rn() * (W - 32) : (side < 0 ? L + 24 + rn() * W * .2 : R - 24 - rn() * W * .2);
      var y0 = phone ? (s % 3 ? T0 + 40 + rn() * H * .2 : B - 160 - rn() * 60) : T0 + H * .2 + rn() * H * .6;
      speck(A, x0, y0, (1.2 + rn() * 2) * u, hcol(HOLI[s % 6]), (rn() - .5) * 40, -(40 + rn() * 70), 7000 + rn() * 5000, 2600 + rn() * 6000);
    }
  };

  /* ---------- More shared motifs ---------- */
  function sparkle(x, y, r) {
    return 'M' + f(x) + ' ' + f(y - r) + 'Q' + f(x) + ' ' + f(y) + ' ' + f(x + r) + ' ' + f(y) + 'Q' + f(x) + ' ' + f(y) + ' ' + f(x) + ' ' + f(y + r) +
      'Q' + f(x) + ' ' + f(y) + ' ' + f(x - r) + ' ' + f(y) + 'Q' + f(x) + ' ' + f(y) + ' ' + f(x) + ' ' + f(y - r) + 'Z';
  }
  // A crescent whose horns point along deg (0 = right).
  function crescent(x, y, r, deg) {
    var a = (deg - 90) * Math.PI / 180, b = (deg + 90) * Math.PI / 180;
    var p1 = [x + r * Math.cos(a), y + r * Math.sin(a)], p2 = [x + r * Math.cos(b), y + r * Math.sin(b)];
    return 'M' + pt(p1) + 'A' + f(r) + ' ' + f(r) + ' 0 1 0 ' + pt(p2) + 'A' + f(r * 1.18) + ' ' + f(r * 1.18) + ' 0 0 1 ' + pt(p1) + 'Z';
  }
  function star5(x, y, R, r, rot) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var a = (rot || 0) * Math.PI / 180 - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + pt([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
    return d + 'Z';
  }
  // A night sky: tiny stars, a few twinkling.
  function stars(A, n, box, seed, parent) {
    var rn = rnd(seed), u = unit(A);
    for (var i = 0; i < n; i++) {
      var x = box[0] + rn() * (box[2] - box[0]), y = box[1] + rn() * (box[3] - box[1]), big = rn() < .3;
      var sg = g(A, '', parent);
      if (big) A.add('fs2', sparkle(x, y, (3 + rn() * 2.5) * u), 1200 + i * 50, 400, sg);
      else A.el('circle', { 'class': 'idot', cx: f(x), cy: f(y), r: f((.8 + rn() * .9) * u), 'data-t': (1000 + i * 40) + ',500' }, sg);
      if (rn() < .45) A.loop(sg, [{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 2400 + rn() * 3000, delay: 3000 + rn() * 3000, iterations: Infinity, easing: 'ease-in-out' });
    }
  }
  function sway(A, node, x, y, deg, dur, delay) {
    node.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
    A.loop(node, [{ transform: 'rotate(' + (-deg) + 'deg)' }, { transform: 'rotate(' + deg + 'deg)' }], { duration: dur, delay: delay, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
  }
  function flicker(A, node, x, y, delay) {
    node.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
    A.loop(node, [{ transform: 'scale(1,1)' }, { transform: 'scale(.94,1.07)' }, { transform: 'scale(1.03,.96)' }, { transform: 'scale(1,1)' }], { duration: 1700 + (delay % 700), iterations: Infinity, delay: delay, easing: 'ease-in-out' });
  }
  // A small lit lamp with its flicker; returns nothing.
  function litLamp(A, x, by, s, t, parent) {
    var fl = lamp(A, x, by, s, 'lit', t, parent);
    if (fl) flicker(A, fl, x, by - 16 * s, 3400 + t % 900);
  }
  function M2(a) { return 'M' + a.map(pt).join('L'); }
  function sideX(A, u) { return [A.L + Math.max(110, 150 * u), A.R - Math.max(110, 150 * u)]; }

  /* ---------- Karwa Chauth: the moon through the sieve ---------- */
  function karwa(A, T, t, p) {
    A.add('dl3', X('M-26 -6C-37 -20 -35 -48 -16 -56L16 -56C35 -48 37 -20 26 -6ZM-18 -6L-14 0L14 0L18 -6M-14 -56L-12 -62L12 -62L14 -56', T), t, 1000, p);
    A.add('dl3', X('M27 -30C39 -34 45 -42 49 -50M29 -22C41 -26 47 -36 52 -47M49 -50L52 -47', T), t + 400, 600, p);
    A.add('fs', X('M-32 -38Q0 -31 32 -38M-30 -24Q0 -18 30 -24', T), t + 600, 600, p);
    for (var i = -2; i <= 2; i++) A.add('fdot', C(T, i * 11, -31 + Math.abs(i) * -.3, 1.4), t + 800, 200, p);
    A.add('dl3', X('M-16 -62Q0 -72 16 -62', T), t + 700, 400, p);
  }
  F['karwa-chauth'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.setProperty('--fc', 'var(--fest-red)');
    A.frame();
    stars(A, phone ? 14 : 28, phone ? [L + 10, T0 + 10, R - 10, T0 + 200] : [L + 30, T0 + 20, R - 30, T0 + H * .5], 11);
    // The moon, then the chalni over it: a rim, a mesh, a ring of dots.
    var my = phone ? T0 + 110 : T0 + Math.max(84, H * .14), mr = (phone ? 30 : 36) * u / (phone ? .72 : 1), cr2 = mr * 1.62;
    if (phone) { mr = 30; cr2 = 48; }
    var mg = g(A, '');
    veil(A, cx, my, cr2 + 10, cr2 + 10, mg);
    var gl = g(A, '', mg);
    glow(A, cx, my, mr * 2.4, 600, gl, .45, 'var(--lagna)');
    breathe(A, gl, cx, my, 6000, 3000, 1.08);
    A.add('ff2', circ(cx, my, mr), 700, 1000, cg(A, 'var(--lagna)', mg));
    A.add('dl2', circ(cx - mr * .3, my - mr * .2, mr * .16) + circ(cx + mr * .28, my + mr * .3, mr * .11) + circ(cx + mr * .1, my - mr * .45, mr * .08), 1300, 600, mg);
    var defs = A.svg.querySelector('defs') || A.el('defs', {});
    var cp = A.el('clipPath', { id: 'hcf-chalni' }, defs);
    A.el('circle', { cx: f(cx), cy: f(my), r: f(cr2 - 3) }, cp);
    var mesh = A.el('g', { 'clip-path': 'url(#hcf-chalni)' }, mg), step = Math.max(6, cr2 / 7), md = '';
    for (var k = -8; k <= 8; k++) { md += 'M' + f(cx + k * step) + ' ' + f(my - cr2) + 'L' + f(cx + k * step) + ' ' + f(my + cr2) + 'M' + f(cx - cr2) + ' ' + f(my + k * step) + 'L' + f(cx + cr2) + ' ' + f(my + k * step); }
    A.add('dl2', md, 1500, 900, mesh, true);
    A.add('fs', circ(cx, my, cr2) + circ(cx, my, cr2 - 4), 1100, 1100, mg);
    for (var d = 0; d < 16; d++) { var a = d * Math.PI / 8; A.add('fdot', circ(cx + (cr2 + 7) * Math.cos(a), my + (cr2 + 7) * Math.sin(a), 1.6), 1900 + d * 40, 200, mg); }
    // The thali: the karwa in the middle, a lamp either side, sweets.
    var ts = phone ? .68 : u * 1.05, ty = phone ? B - 96 : B - Math.max(26, H * .045), TT = mk(cx, ty, ts);
    A.add('dl3', X('M-120 0Q0 22 120 0Q0 -18 -120 0ZM-112 4Q0 26 112 4', TT), 1200, 1000);
    karwa(A, mk(cx, ty - 2 * ts, ts * 1.15), 1500);
    litLamp(A, cx - 78 * ts, ty - 1, ts * .62, 2000);
    litLamp(A, cx + 78 * ts, ty - 1, ts * .62, 2100);
    // Kumkum, rice and sweets on the thali; a small flame on the karwa's lid.
    A.add('ff', C(TT, -44, -5, 6), 2300, 400, cg(A, 'var(--fest-red)'));
    var rice = '';
    for (var ri = 0; ri < 9; ri++) rice += C(TT, 36 + (ri % 3) * 4 - 4, -4 - Math.floor(ri / 3) * 3, 1.1);
    A.add('idot', rice, 2400, 300);
    A.add('fs', C(TT, 56, -5, 4.5) + C(TT, -58, -4, 4.5), 2450, 300, cg(A, 'var(--fest-marigold)'));
    var lid = g(A, ''), lp = mk(cx, ty - 2 * ts, ts * 1.15)(0, -70);
    glow(A, lp[0], lp[1] - 6 * ts, 18 * ts, 2600, lid, .5, 'var(--lagna)');
    A.add('flame', X('M0 -84C5 -78 5 -73 0 -68C-5 -73 -5 -78 0 -84Z', mk(cx, ty - 2 * ts, ts * 1.15)), 2700, 400, lid);
    flicker(A, lid, lp[0], lp[1], 3500);
    // The moon rises into the sieve.
    if (!A.reduce) A.loop(mg, [{ transform: 'translateY(' + f(cr2 * .7) + 'px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 2400, delay: 300, fill: 'backwards', easing: 'cubic-bezier(.2,.7,0,1)' });
    // Mehndi paisleys in the side columns.
    if (!phone) sideX(A, u).forEach(function (x, i) {
      var P = mk(x, T0 + H * .5, u * 1.75, i ? 14 : -14, i === 1), pg = g(A, '');
      A.add('ac', X('M0 52C-36 46 -42 -4 -16 -30C-4 -42 18 -42 21 -27C23 -16 13 -11 7 -17C3 -21 6 -27 11 -26', P), 1400 + i * 150, 1400, pg);
      A.add('dl3', X('M0 42C-26 37 -31 0 -12 -19C-3 -28 10 -28 12 -20', P), 1700 + i * 150, 1000, pg);
      A.add('fs2', X('M-3 32C-14 18 -16 2 -8 -10M-3 32C6 20 4 4 -8 -10M-8 -10C-12 0 -12 14 -3 32', P), 2000 + i * 150, 800, pg);
      for (var q = 0; q < 9; q++) { var tq = q / 8, xx = -34 + tq * 30, yy = 30 - tq * 62; A.add('fdot', C(P, -36 + q * 2.4 + (q > 4 ? (q - 4) * 3 : 0), 40 - q * 9.6, 1.3), 2300 + q * 50, 200, pg); }
    });
  };

  /* ---------- Chhath: the sun over the water, offerings in soops ---------- */
  function soop(A, T, t, p) {
    A.add('dl3', X('M-48 0L48 0Q44 -20 0 -26Q-44 -20 -48 0ZM-40 -4Q0 -20 40 -4M-30 -10Q0 -22 30 -10', T), t, 900, p);
    A.add('lf', X('M-34 -8C-30 -22 -14 -28 -2 -24M-30 -6C-24 -18 -10 -22 0 -18M-26 -4C-20 -14 -8 -16 2 -13', T), t + 400, 600, p);
    A.add('fs', C(T, 10, -11, 6.5) + C(T, 22, -8, 5.5), t + 600, 400, p);
    A.add('fs2', X('M7 -11L13 -11M10 -14L10 -8M19 -8L25 -8', T), t + 800, 300, p);
  }
  F.chhath = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    var hy = phone ? B - 120 : B - Math.max(70, 96 * u), sr = phone ? 40 : 58 * u;
    // The rising sun, clipped at the horizon, with rays.
    var defs = A.svg.querySelector('defs') || A.el('defs', {});
    var cp = A.el('clipPath', { id: 'hcf-sky' }, defs);
    A.el('rect', { x: f(L), y: f(T0), width: f(R - L), height: f(hy - T0) }, cp);
    var sky = A.el('g', { 'clip-path': 'url(#hcf-sky)' }), sun = g(A, '', sky);
    glow(A, cx, hy, sr * 2.6, 600, sun, .5, 'var(--lagna)');
    A.add('ff', circ(cx, hy, sr), 800, 1200, cg(A, 'var(--lagna)', sun));
    var rays = g(A, '', sun);
    for (var i = 0; i <= 12; i++) {
      var a = Math.PI + i * Math.PI / 12, r0 = sr * 1.18, r1 = sr * (i % 2 ? 1.42 : 1.6);
      A.add('ac', 'M' + pt([cx + r0 * Math.cos(a), hy + r0 * Math.sin(a)]) + 'L' + pt([cx + r1 * Math.cos(a), hy + r1 * Math.sin(a)]), 1600 + i * 50, 400, rays);
    }
    rays.style.transformOrigin = f(cx) + 'px ' + f(hy) + 'px';
    A.loop(rays, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.06)', opacity: .7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 5000, delay: 3200, iterations: Infinity, easing: 'ease-in-out' });
    if (!A.reduce) A.loop(sun, [{ transform: 'translateY(' + f(sr * .6) + 'px)' }, { transform: 'translateY(0)' }], { duration: 2600, delay: 400, fill: 'backwards', easing: 'cubic-bezier(.2,.7,0,1)' });
    // The horizon and the water: rows of ripples drifting, the sun's path on it.
    A.add('dl3', 'M' + pt([L, hy]) + 'L' + pt([R, hy]), 600, 1400);
    var clip = clipFrame(A), rows = phone ? 4 : 5, rn = rnd(5);
    for (var r = 1; r <= rows; r++) {
      var y = hy + r * (B - hy) / (rows + 1), row = g(A, '', clip), d = '', x = L - 60 + rn() * 40;
      while (x < R + 60) { var w = (18 + rn() * 34) * u; d += 'M' + f(x) + ' ' + f(y) + 'Q' + f(x + w / 2) + ' ' + f(y - 3) + ' ' + f(x + w) + ' ' + f(y); x += w + (14 + rn() * 30) * u; }
      A.add('dl2', d, 900 + r * 120, 1200, row);
      A.loop(row, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (r % 2 ? 14 : -14) + 'px)' }], { duration: 7000 + r * 900, delay: 3000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
      var hw = sr * (1.1 - r * .16), sh = g(A, '', clip);
      A.add('ac', 'M' + pt([cx - hw, y + 2]) + 'L' + pt([cx + hw, y + 2]), 1800 + r * 100, 400, sh);
      A.loop(sh, [{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 2200 + r * 400, delay: 3200 + r * 200, iterations: Infinity, easing: 'ease-in-out' });
    }
    // Soops with offerings either side, standing in the water.
    var ss = phone ? .7 : u * 1.5, sx = phone ? 112 : 255 * u;
    soop(A, mk(cx - sx, hy - 4, ss), 1600);
    soop(A, mk(cx + sx, hy - 4, ss, 0, true), 1700);
    // Sugarcane in both side columns, leaves swaying at the top.
    var xs = phone ? [L + 22, R - 22] : [L + Math.max(70, 90 * u), R - Math.max(70, 90 * u)];
    xs.forEach(function (x0, si) {
      var top = phone ? hy - 150 : T0 + H * .16, sd = si ? -1 : 1;
      [0, 1].forEach(function (k) {
        var x = x0 + sd * k * 16 * u, lean = sd * (k ? 14 : 6) * u, yb = hy, yt = top + k * 30 * u;
        A.add('dl3', 'M' + pt([x, yb]) + 'L' + pt([x + lean, yt]) + 'M' + pt([x + 5 * u, yb]) + 'L' + pt([x + lean + 5 * u, yt]), 900 + k * 150, 1400);
        var nodes = '';
        for (var yy = yb - 34 * u; yy > yt + 10; yy -= 34 * u) { var fx = x + lean * (yb - yy) / (yb - yt); nodes += 'M' + pt([fx - 1, yy]) + 'L' + pt([fx + 6 * u, yy]); }
        A.add('dl3', nodes, 1500, 500);
        var tx = x + lean + 2.5 * u, nl = phone ? 3 : 5;
        for (var j = 0; j < nl; j++) {
          var fy = yt + j * (phone ? 26 : 40) * u, fx2 = x + 2.5 * u + lean * (yb - fy) / (yb - yt), side = (j + k) % 2 ? 1 : -1;
          var l = (phone ? 44 : 70 + j * 8) * u, lg = g(A, '');
          A.add('lfo', 'M' + pt([fx2, fy]) + 'Q' + pt([fx2 + side * l * .55, fy - l * .5]) + ' ' + pt([fx2 + side * l, fy + l * .12]), 2000 + j * 90, 700, lg);
          sway(A, lg, fx2, fy, 2.2, 3400 + j * 500 + si * 300, 3000);
        }
        var tg = g(A, '');
        A.add('lfo', 'M' + pt([tx, yt]) + 'Q' + pt([tx - 4 * u, yt - 30 * u]) + ' ' + pt([tx + 8 * u, yt - 52 * u]) + 'M' + pt([tx, yt]) + 'Q' + pt([tx + 14 * u, yt - 24 * u]) + ' ' + pt([tx + 30 * u, yt - 34 * u]), 2300, 600, tg);
        sway(A, tg, tx, yt, 3, 3900 + k * 600, 3000);
      });
    });
    // Three birds crossing the top band.
    if (!phone) {
      var bg = g(A, '');
      [[-.18, .1], [-.13, .07], [-.08, .12]].forEach(function (b, i) {
        var bx = cx + b[0] * W, by = T0 + b[1] * H, s = (7 + i) * u;
        A.add('dl3', 'M' + pt([bx - s, by - s * .4]) + 'Q' + pt([bx - s * .4, by - s * .5]) + ' ' + pt([bx, by]) + 'Q' + pt([bx + s * .4, by - s * .5]) + ' ' + pt([bx + s, by - s * .4]), 2400 + i * 120, 500, bg);
      });
      A.loop(bg, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + f(W * .06) + 'px,-6px)' }], { duration: 9000, delay: 3000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    }
  };

  /* ---------- Makar Sankranti, Pongal, Lohri, Bihu, Uttarayan ---------- */
  function kite(A, x, y, s, rot, col, t, parent) {
    var kg = cg(A, col, parent), T = mk(x, y, s, rot);
    A.add('ff', X('M0 -32L24 0L0 0Z', T), t + 300, 600, kg);
    A.add('dl3', X('M0 -32L24 0L0 34L-24 0ZM0 -32L0 34', T), t, 900, kg);
    A.add('fs', X('M-24 0Q0 -12 24 0', T), t + 400, 500, kg);
    A.add('ff', X('M0 34L-6 44L6 44Z', T), t + 700, 300, kg);
    A.add('fs2', X('M0 44Q5 52 -2 60Q-6 66 0 72', T), t + 800, 400, kg);
    return { g: kg, at: T(0, 6) };
  }
  F.sankranti = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // Uttarayan: the sun, small, high in the middle.
    if (!phone) {
      var sy = T0 + Math.max(56, H * .09), sg = g(A, '');
      glow(A, cx, sy, 44 * u, 500, sg, .4, 'var(--lagna)');
      A.add('ff', circ(cx, sy, 14 * u), 700, 800, cg(A, 'var(--lagna)', sg));
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; A.add('ac', 'M' + pt([cx + 19 * u * Math.cos(a), sy + 19 * u * Math.sin(a)]) + 'L' + pt([cx + (i % 2 ? 25 : 29) * u * Math.cos(a), sy + (i % 2 ? 25 : 29) * u * Math.sin(a)]), 1000 + i * 40, 300, sg); }
      breathe(A, sg, cx, sy, 6000, 3000, 1.06);
    }
    // Kites high on both sides, their strings sagging down to the corners.
    var K = phone ? [[.16, .1, .7, -12, 'var(--fest-red)'], [.42, .05, .5, 8, 'var(--fest-sky)'], [.84, .12, .72, 14, 'var(--fest-saffron)']]
      : [[.1, .17, 1, -12, 'var(--fest-red)'], [.25, .07, .66, 8, 'var(--fest-sky)'], [.9, .15, 1, 14, 'var(--fest-saffron)'], [.74, .06, .7, -6, 'var(--fest-leaf)'], [.95, .45, .58, 6, 'var(--lagna)']];
    K.forEach(function (k, i) {
      var x = L + k[0] * W, y = T0 + (phone ? k[1] * H + 30 : k[1] * H + 40 * u), s = k[2] * (phone ? 1 : u);
      var holder = g(A, ''), kk = kite(A, x, y, s, k[3], k[4], 900 + i * 220, holder);
      var ex = k[0] < .5 ? L : R, ey = phone ? T0 + H * .3 : B, mx = (kk.at[0] + ex) / 2 + (k[0] < .5 ? 30 : -30), my = Math.max(kk.at[1], ey) - (ey - kk.at[1]) * .18;
      A.add('dl2', 'M' + pt(kk.at) + 'Q' + pt([mx, my]) + ' ' + pt([ex, ey]), 1400 + i * 220, 1600);
      holder.style.transformOrigin = f(kk.at[0]) + 'px ' + f(kk.at[1]) + 'px';
      A.loop(holder, [{ transform: 'rotate(-3deg) translateY(0)' }, { transform: 'rotate(3deg) translateY(-4px)' }], { duration: 2600 + i * 500, delay: 3000 + i * 200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    });
    // The pongal pot boiling over on three stones, sugarcane crossed behind.
    var ps = phone ? .66 : u * 1.25, py = phone ? B - 84 : B - Math.max(22, H * .035), PT = mk(cx, py, ps), cane = g(A, '');
    A.add('dl3', X('M-70 0L44 -170M70 0L-44 -170M-63 0L51 -170M63 0L-51 -170', PT), 1000, 1400, cane);
    var nd = '';
    for (var nn = 1; nn < 7; nn++) { var tn = nn / 7; nd += X('M' + f(-70 + 114 * tn - 3) + ' ' + f(-170 * tn) + 'L' + f(-70 + 114 * tn + 10) + ' ' + f(-170 * tn) + 'M' + f(70 - 114 * tn + 3) + ' ' + f(-170 * tn) + 'L' + f(70 - 114 * tn - 10) + ' ' + f(-170 * tn), PT); }
    A.add('dl3', nd, 1700, 500, cane);
    A.add('lf', X('M44 -170Q52 -196 76 -204M44 -170Q38 -198 20 -214M-44 -170Q-52 -196 -76 -204M-44 -170Q-38 -198 -20 -214', PT), 2000, 600, cane);
    veil(A, cx, py - 60 * ps, 50 * ps, 46 * ps);
    var PU = mk(cx, py - 16 * ps, ps);
    A.add('dl3', X('M-34 -10C-48 -26 -46 -60 -22 -68L22 -68C46 -60 48 -26 34 -10Z', PU), 1200, 1000);
    A.add('fs', X('M-43 -44Q0 -36 43 -44M-40 -26Q0 -18 40 -26', PU), 1600, 600, cg(A, 'var(--fest-red)'));
    for (var q = -3; q <= 3; q++) A.add('fdot', C(PU, q * 10, -35, 1.4), 1800, 200, cg(A, 'var(--fest-saffron)'));
    A.add('dl3', X('M-26 -68Q-24 -84 -12 -80Q-6 -92 4 -84Q12 -92 18 -80Q30 -82 26 -68M-24 -66Q-29 -58 -24 -52M22 -66Q26 -59 22 -53', PU), 2000, 800);
    A.add('lf', X('M-20 -66C-30 -76 -36 -90 -34 -100C-26 -92 -22 -80 -20 -66M20 -66C30 -76 36 -90 34 -100C26 -92 22 -80 20 -66', PU), 2200, 600);
    A.add('dl3', X('M-46 0Q-44 -10 -32 -10Q-24 -10 -24 0ZM-10 0Q-8 -9 0 -9Q8 -9 10 0ZM24 0Q24 -10 32 -10Q44 -10 46 0Z', PT), 1100, 700);
    var fire = g(A, '');
    [-17, 17].forEach(function (fx, j) {
      var fg = g(A, '', fire);
      A.add('flame', X('M' + fx + ' -26C' + (fx + 6) + ' -18 ' + (fx + 6) + ' -9 ' + fx + ' -2C' + (fx - 6) + ' -9 ' + (fx - 6) + ' -18 ' + fx + ' -26Z', PT), 2400 + j * 100, 400, fg);
      flicker(A, fg, cx + fx * ps, py - 2 * ps, 3300 + j * 400);
    });
  };

  /* ---------- Maha Shivratri ---------- */
  function trifoil(A, T, t, p) {
    A.add('lf', X('M0 0C-6 -10 -6 -22 0 -30C6 -22 6 -10 0 0ZM0 0C-10 -2 -20 -10 -24 -18C-14 -18 -6 -10 0 0ZM0 0C10 -2 20 -10 24 -18C14 -18 6 -10 0 0ZM0 0L0 10', T), t, 700, p);
  }
  F.shivratri = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    stars(A, phone ? 12 : 26, phone ? [L + 10, T0 + 10, R - 10, T0 + 200] : [L + 30, T0 + 20, R - 30, T0 + H * .45], 21);
    // The crescent Shiva wears, high in the middle.
    var my = phone ? T0 + 96 : T0 + Math.max(70, H * .11), mr = phone ? 24 : 30 * u, mg = g(A, '');
    glow(A, cx, my, mr * 2.6, 500, mg, .4, 'var(--lagna)');
    A.add('ff', crescent(cx, my, mr, -40), 700, 1100, cg(A, 'var(--lagna)', mg));
    breathe(A, mg, cx, my, 6500, 3000, 1.05);
    var xs = sideX(A, u);
    if (!phone) {
      // Trishul with a damru tied below the prongs, left column.
      var tx = xs[0], tt = T0 + H * .2, tb = B - Math.max(24, H * .04), TT = mk(tx, tt, u * 1.2);
      A.add('dl3', 'M' + pt([tx - 1.5, tt + 24 * u]) + 'L' + pt([tx - 1.5, tb]) + 'M' + pt([tx + 1.5, tt + 24 * u]) + 'L' + pt([tx + 1.5, tb]), 800, 1500);
      A.add('ac2', X('M0 -40C5 -31 6 -24 0 -16C-6 -24 -5 -31 0 -40ZM0 -16L0 20M-24 -16C-24 3 -10 6 0 6C10 6 24 3 24 -16M-24 -16C-26 -24 -25 -30 -19 -36M24 -16C26 -24 25 -30 19 -36', TT), 1300, 1200);
      A.add('ac', X('M-5 12L5 12M-5 16L5 16', TT), 1900, 300);
      var dm = g(A, ''), dy = tt + 44 * u * 1.2, DT = mk(tx + 1.5, dy, u);
      A.add('dl3', X('M0 0Q10 2 14 10', DT), 2000, 300, dm);
      A.add('dl3', X('M2 10L26 10L16 24L26 38L2 38L12 24Z', DT), 2100, 700, dm);
      A.add('ac', X('M2 10Q14 13 26 10M2 38Q14 41 26 38M10 22L18 22M10 26L18 26', DT), 2400, 400, dm);
      A.add('fs2', X('M16 24Q26 28 30 34M12 24Q2 28 -2 34', DT) + C(DT, 30, 35, 2) + C(DT, -2, 35, 2), 2600, 400, cg(A, 'var(--lagna)', dm));
      sway(A, dm, tx + 1.5, dy, 5, 2600, 3200);
      // A rudraksha mala hanging, bilva below, right column.
      var rx = xs[1], rt = T0 + H * .22, rb = T0 + H * .62, mal = g(A, '');
      A.add('dl3', circ(rx, rt - 6 * u, 3 * u), 900, 300, mal);
      for (var b = 1; b < 34; b++) {
        var t2 = b / 34, xx = rx + 30 * u * Math.sin(Math.PI * 2 * t2), yy = rt + (rb - rt) * (1 - Math.cos(Math.PI * 2 * t2)) / 2;
        A.add('bead', circ(xx, yy, 4.4 * u), 1100 + b * 40, 300, mal);
        A.add('dl2', 'M' + pt([xx - 2 * u, yy - 1 * u]) + 'L' + pt([xx + 2 * u, yy + 1 * u]), 1300 + b * 40, 200, mal);
      }
      A.add('ac', circ(rx, rb + 6 * u, 4.6 * u) + 'M' + pt([rx, rb + 11 * u]) + 'L' + pt([rx - 4 * u, rb + 30 * u]) + 'M' + pt([rx, rb + 11 * u]) + 'L' + pt([rx, rb + 32 * u]) + 'M' + pt([rx, rb + 11 * u]) + 'L' + pt([rx + 4 * u, rb + 30 * u]), 2400, 500, mal);
      sway(A, mal, rx, rt - 6 * u, 1.2, 4200, 3300);
      trifoil(A, mk(rx - 22 * u, B - 30 * u, u * 1.2, -20), 2200);
      trifoil(A, mk(rx + 20 * u, B - 26 * u, u, 24), 2350);
    }
    // The lingam on its pedestal, the tripundra, a bilva leaf, water falling.
    var ls = phone ? .62 : u * 1.05, lb = phone ? B - 80 : B - Math.max(22, H * .035), LT = mk(cx, lb, ls);
    A.add('dl3', X('M-74 -26L74 -26Q80 -26 80 -20L80 -14Q80 -8 74 -8L-74 -8Q-80 -8 -80 -14L-80 -20Q-80 -26 -74 -26ZM-62 -8L-56 0L56 0L62 -8M80 -22L126 -16L126 -10L80 -12', LT), 1100, 1200);
    A.add('dl3', X('M-30 -26C-30 -100 30 -100 30 -26', LT), 1500, 1000);
    A.add('ac', X('M-22 -58Q0 -54 22 -58M-24 -50Q0 -46 24 -50M-25 -42Q0 -38 25 -42', LT), 2100, 600);
    A.add('fdot', C(LT, 0, -50, 2.4), 2500, 200, cg(A, 'var(--fest-red)'));
    trifoil(A, mk(cx, lb - 82 * ls, ls * .8), 2600);
    if (!phone) { litLamp(A, cx - 160 * u, lb, u * .62, 2300); litLamp(A, cx + 160 * u, lb, u * .62, 2400); }
    var drop = g(A, ''), d0 = lb - 140 * ls;
    A.add('ff', X('M0 -6C4 0 4 4 0 6C-4 4 -4 0 0 -6Z', mk(cx, d0, ls * 1.2)), 2800, 300, cg(A, 'var(--fest-sky)', drop));
    if (!A.reduce) A.loop(drop, [{ transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .85 }, { transform: 'translateY(' + f(42 * ls) + 'px)', opacity: 0 }], { duration: 2400, delay: 3400, iterations: Infinity, easing: 'ease-in' });
  };

  /* ---------- Ganesh Chaturthi ---------- */
  function marigold(A, x, y, r, col, t, parent) {
    var mg = cg(A, col, parent), d = '';
    for (var i = 0; i <= 12; i++) {
      var a = i * Math.PI / 6, a2 = a + Math.PI / 12;
      d += (i ? 'Q' + pt([x + r * 1.25 * Math.cos(a - Math.PI / 12), y + r * 1.25 * Math.sin(a - Math.PI / 12)]) + ' ' : 'M') + pt([x + r * Math.cos(a), y + r * Math.sin(a)]);
    }
    A.add('ff', d + 'Z', t, 500, mg);
    A.add('fdot', circ(x, y, r * .3), t + 200, 200, mg);
  }
  function hibiscus(A, T, t, p) {
    var hg = cg(A, 'var(--fest-red)', p);
    for (var i = 0; i < 5; i++) A.add('ff', X('M0 0C10 -6 14 -22 6 -30C2 -34 -4 -32 -6 -28C-12 -18 -8 -6 0 0Z', mk(T.ox, T.oy, T.s, i * 72)), t + i * 80, 600, hg);
    A.add('fs', X('M0 0L12 -36', T), t + 500, 400, hg);
    A.add('fdot', C(T, 12, -37, 2) + C(T, 9, -33, 1.4) + C(T, 15, -33, 1.4), t + 800, 200, cg(A, 'var(--fest-marigold)', p));
    A.add('lf', X('M-6 8C-20 14 -34 30 -36 44C-22 40 -10 26 -6 8ZM-6 8L-30 38', T), t + 300, 600, p);
  }
  function modak(A, T, t, p) {
    A.add('mod', X('M-13 0C-16 -10 -8 -22 0 -31C8 -22 16 -10 13 0Q0 3 -13 0Z', T), t, 600, p);
    A.add('dl2', X('M-6 -1Q-7 -14 0 -29M6 -1Q7 -14 0 -29M0 1L0 -27', T), t + 300, 400, p);
  }
  F['ganesh-chaturthi'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // Om, high in the middle, in the accent with a soft glow.
    var oy = phone ? T0 + 100 : T0 + Math.max(70, H * .11), os = phone ? 60 : 66 * u, og = g(A, '');
    glow(A, cx, oy, os * 1.2, 500, og, .35, 'var(--lagna)');
    var om = A.el('text', { x: f(cx), y: f(oy), 'class': 'om', style: 'font-size:' + f(os) + 'px', 'data-t': '800,1400' }, og);
    om.textContent = 'ॐ';
    breathe(A, og, cx, oy, 6500, 3000, 1.04);
    // Strands of marigolds hanging from the top corners, a leaf at the end of each.
    var nS = phone ? 3 : 4, gap = phone ? 22 : 34 * u;
    [-1, 1].forEach(function (sd) {
      for (var i = 0; i < nS; i++) {
        var x = sd < 0 ? L + (phone ? 18 : 40 * u) + i * gap : R - (phone ? 18 : 40 * u) - i * gap, len = (phone ? [120, 80, 50] : [H * .42, H * .3, H * .2, H * .12])[i], st = g(A, '');
        A.add('dl2', 'M' + pt([x, T0]) + 'L' + pt([x, T0 + len]), 800 + i * 100, 900, st);
        var r = phone ? 5 : 7 * u;
        for (var y = T0 + r * 1.6, k = 0; y < T0 + len - r; y += r * 2.5, k++) marigold(A, x, y, r, k % 2 ? 'var(--fest-saffron)' : 'var(--fest-marigold)', 1100 + i * 100 + k * 40, st);
        mleaf(A, mk(x, T0 + len - 2, phone ? .5 : .7 * u, 0), 1800 + i * 100, st, 'lf');
        sway(A, st, x, T0, 1.2 + i * .3, 3600 + i * 400, 3000 + i * 200);
      }
    });
    // Hibiscus in the lower side columns.
    if (!phone) sideX(A, u).forEach(function (x, i) { hibiscus(A, mk(x, T0 + H * .62, u * 1.25, i ? 12 : -12), 1500 + i * 150); });
    // A plate of modaks with durva either side and the mouse beside them.
    var ms = phone ? .7 : u * 1.15, my = phone ? B - 84 : B - Math.max(24, H * .04), MT = mk(cx, my, ms);
    A.add('dl3', X('M-72 0Q0 16 72 0Q0 -12 -72 0ZM-64 3Q0 18 64 3', MT), 1300, 900);
    [[0, -56], [-15, -30], [15, -30], [-30, -4], [0, -4], [30, -4]].forEach(function (m, i) { modak(A, mk(cx + m[0] * ms, my + m[1] * ms, ms), 1600 + i * 120); });
    A.add('fs2', X('M-8 -86L0 -96L8 -86', MT), 2400, 300, cg(A, 'var(--fest-leaf)'));
    [-1, 1].forEach(function (sd) {
      var bx = cx + sd * 104 * ms, d = '';
      for (var j = 0; j < 7; j++) { var a = (-90 + sd * (j - 3) * 11) * Math.PI / 180, l = (28 + (j % 3) * 8) * ms; d += 'M' + pt([bx, my]) + 'Q' + pt([bx + Math.cos(a) * l * .4 + sd * 4, my + Math.sin(a) * l * .6]) + ' ' + pt([bx + Math.cos(a) * l, my + Math.sin(a) * l]); }
      A.add('lfo', d, 2000, 700);
    });
    var mx = cx + (phone ? 130 : 180 * u), mt = mk(mx, my, ms * 1.1), mo = g(A, '');
    A.add('dl3', X('M18 0C22 -16 6 -24 -8 -20C-16 -18 -22 -12 -26 -6L-30 -5C-28 -2 -24 0 -20 0ZM18 -2C30 0 34 -10 28 -14C24 -16 22 -12 25 -10M-28 -6L-37 -9M-28 -5L-37 -3M-12 0L-14 3M6 0L8 3', mt), 2200, 900, mo);
    A.add('dl3', C(mt, -8, -21, 5), 2400, 300, mo);
    A.add('fdot', C(mt, -19, -11, 1.3), 2600, 200, cg(A, 'var(--fg)', mo));
  };

  /* ---------- Janmashtami ---------- */
  function feather(A, base, len, ang, t) {
    var T = mk(base[0], base[1], 1, ang), d = '', u = len / 300;
    A.add('dl3', X('M0 0Q' + f(len * .06) + ' ' + f(-len * .5) + ' 0 ' + f(-len * .9), T), t, 1200);
    for (var i = 4; i < 26; i++) {
      var tt = i / 26, y = -len * .9 * tt, x = len * .06 * 2 * tt * (1 - tt), bl = (6 + 34 * Math.pow(tt, 1.3)) * u * (tt > .78 ? .8 : 1);
      d += 'M' + f(x) + ' ' + f(y) + 'Q' + f(x - bl * .5) + ' ' + f(y - bl * .4) + ' ' + f(x - bl) + ' ' + f(y - bl * .9) + 'M' + f(x) + ' ' + f(y) + 'Q' + f(x + bl * .5) + ' ' + f(y - bl * .4) + ' ' + f(x + bl) + ' ' + f(y - bl * .9);
    }
    A.add('lfo', X(d, T), t + 400, 1400);
    var ey = -len * .86;
    A.add('lf', X('M0 ' + f(ey - 34 * u) + 'C' + f(26 * u) + ' ' + f(ey - 20 * u) + ' ' + f(22 * u) + ' ' + f(ey + 22 * u) + ' 0 ' + f(ey + 26 * u) + 'C' + f(-22 * u) + ' ' + f(ey + 22 * u) + ' ' + f(-26 * u) + ' ' + f(ey - 20 * u) + ' 0 ' + f(ey - 34 * u) + 'Z', T), t + 1200, 700);
    A.add('pf', X('M0 ' + f(ey - 20 * u) + 'C' + f(16 * u) + ' ' + f(ey - 10 * u) + ' ' + f(14 * u) + ' ' + f(ey + 14 * u) + ' 0 ' + f(ey + 16 * u) + 'C' + f(-14 * u) + ' ' + f(ey + 14 * u) + ' ' + f(-16 * u) + ' ' + f(ey - 10 * u) + ' 0 ' + f(ey - 20 * u) + 'Z', T), t + 1400, 600, cg(A, 'var(--fest-sky)'));
    A.add('pf', X('M0 ' + f(ey - 7 * u) + 'C' + f(8 * u) + ' ' + f(ey - 2 * u) + ' ' + f(7 * u) + ' ' + f(ey + 8 * u) + ' 0 ' + f(ey + 9 * u) + 'C' + f(-7 * u) + ' ' + f(ey + 8 * u) + ' ' + f(-8 * u) + ' ' + f(ey - 2 * u) + ' 0 ' + f(ey - 7 * u) + 'Z', T), t + 1600, 500, cg(A, 'var(--lagna)'));
  }
  F.janmashtami = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // The dahi handi on its rope, swinging a little.
    var hs = phone ? .8 : u * 1.1, hy = phone ? T0 + 40 : T0 + 8, x0 = phone ? L + 20 : L + W * .2, x1 = phone ? R - 20 : R - W * .2;
    A.add('dl3', 'M' + pt([x0, T0]) + 'Q' + pt([cx, hy + 26 * hs]) + ' ' + pt([x1, T0]), 700, 1400);
    var hg = g(A, ''), HT = mk(cx, hy + 13 * hs + 62 * hs, hs);
    A.add('dl3', X('M0 -62L-30 -8M0 -62L30 -8M0 -62L0 -46M-30 -8L16 24M30 -8L-16 24M-34 6L0 28L34 6', HT), 1300, 900, hg);
    A.add('dl3', X('M-16 -26C-16 -20 -34 -14 -34 4C-34 22 -18 30 0 30C18 30 34 22 34 4C34 -14 16 -20 16 -26', HT), 1500, 900, hg);
    A.add('dl3', X('M-18 -27Q0 -22 18 -27Q0 -32 -18 -27Z', HT), 1700, 400, hg);
    A.add('ff', X('M-18 -27Q-10 -42 0 -38Q10 -42 18 -27Q0 -22 -18 -27Z', HT), 1900, 500, cg(A, 'var(--fest-saffron)', hg));
    A.add('fs', X('M-3 -40L0 -46L3 -40', HT), 2100, 200, cg(A, 'var(--fest-saffron)', hg));
    A.add('fs', X('M-33 0Q0 8 33 0M-30 12Q0 19 30 12', HT), 2000, 500, cg(A, 'var(--fest-red)', hg));
    sway(A, hg, cx, hy + 13 * hs, 2.5, 2800, 3200);
    // Peacock feather (left) and flute (right) leaning in.
    if (!phone) {
      var xs = sideX(A, u);
      feather(A, [xs[0] - 50 * u, B - 20 * u], Math.min(H * .66, 440 * u), 16, 1100);
      var f0 = [xs[1] + 60 * u, B - 70 * u], f1 = [xs[1] - 60 * u, T0 + H * .4], dx = f1[0] - f0[0], dy = f1[1] - f0[1], ln = Math.hypot(dx, dy), nx = -dy / ln * 4 * u, ny = dx / ln * 4 * u;
      nx *= 1.5; ny *= 1.5;
      A.add('ac', 'M' + pt([f0[0] + nx, f0[1] + ny]) + 'L' + pt([f1[0] + nx, f1[1] + ny]) + 'M' + pt([f0[0] - nx, f0[1] - ny]) + 'L' + pt([f1[0] - nx, f1[1] - ny]) + 'M' + pt([f0[0] + nx, f0[1] + ny]) + 'Q' + pt([f0[0] - dx * .02, f0[1] - dy * .02]) + ' ' + pt([f0[0] - nx, f0[1] - ny]) + 'M' + pt([f1[0] + nx, f1[1] + ny]) + 'Q' + pt([f1[0] + dx * .02, f1[1] + dy * .02]) + ' ' + pt([f1[0] - nx, f1[1] - ny]), 1200, 1400);
      var bands = '', holes = '';
      [.05, .09, .91, .95].forEach(function (q) { var px = f0[0] + dx * q, py = f0[1] + dy * q; bands += 'M' + pt([px + nx * 1.4, py + ny * 1.4]) + 'L' + pt([px - nx * 1.4, py - ny * 1.4]); });
      A.add('ac', bands, 2000, 400);
      for (var hI = 0; hI < 7; hI++) { var q2 = .5 + hI * .055; holes += circ(f0[0] + dx * q2, f0[1] + dy * q2, 1.7 * u); }
      holes += circ(f0[0] + dx * .2, f0[1] + dy * .2, 2.2 * u);
      A.add('dl3', holes, 2200, 500);
      var tg = g(A, ''), tp = [f0[0] + dx * .12, f0[1] + dy * .12];
      A.add('fs', 'M' + pt(tp) + 'Q' + pt([tp[0] + 6 * u, tp[1] + 20 * u]) + ' ' + pt([tp[0] + 2 * u, tp[1] + 36 * u]) + circ(tp[0] + 2 * u, tp[1] + 40 * u, 3.2 * u), 2400, 500, cg(A, 'var(--fest-red)', tg));
      var fr = '';
      for (var r = -3; r <= 3; r++) fr += 'M' + pt([tp[0] + 2 * u, tp[1] + 43 * u]) + 'L' + pt([tp[0] + 2 * u + r * 2 * u, tp[1] + 58 * u]);
      A.add('fs2', fr, 2700, 400, cg(A, 'var(--fest-red)', tg));
      sway(A, tg, tp[0], tp[1], 4, 2600, 3300);
    } else {
      feather(A, [L + 30, B - 40], 170, 18, 1100);
    }
    // A pot of butter below the words, small footprints walking to it.
    var ms = phone ? .7 : u * 1.15, my = phone ? B - 84 : B - Math.max(24, H * .04), MT = mk(cx, my, ms);
    A.add('dl3', X('M-22 -4C-34 -14 -32 -40 -14 -46L14 -46C32 -40 34 -14 22 -4ZM-16 -4L-12 0L12 0L16 -4M-15 -46L-13 -52L13 -52L15 -46', MT), 1500, 900);
    A.add('fs', X('M-28 -28Q0 -22 28 -28', MT), 1900, 500, cg(A, 'var(--fest-red)'));
    A.add('mod', X('M-14 -52Q-16 -62 -8 -62Q-6 -70 2 -66Q10 -70 12 -60Q18 -58 14 -52Z', MT), 2100, 500);
  };

  /* ---------- Raksha Bandhan: one rakhi thread around the words ---------- */
  function rosette(A, x, y, r, t, parent) {
    var rg = g(A, '', parent);
    veil(A, x, y, r * 1.08, r * 1.08, rg);
    var outer = g(A, '', rg), od = '';
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8, a1 = a - .17, a2 = a + .17;
      od += 'M' + pt([x + r * .66 * Math.cos(a1), y + r * .66 * Math.sin(a1)]) + 'Q' + pt([x + r * 1.02 * Math.cos(a - .05), y + r * 1.02 * Math.sin(a - .05)]) + ' ' + pt([x + r * Math.cos(a), y + r * Math.sin(a)]) + 'Q' + pt([x + r * 1.02 * Math.cos(a + .05), y + r * 1.02 * Math.sin(a + .05)]) + ' ' + pt([x + r * .66 * Math.cos(a2), y + r * .66 * Math.sin(a2)]);
    }
    A.add('ac', od, t, 1000, outer);
    outer.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
    A.loop(outer, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 120000, delay: 3000, iterations: Infinity });
    var mid = cg(A, 'var(--fest-red)', rg);
    for (var j = 0; j < 8; j++) { var b = j * Math.PI / 4; A.add('ff', circ(x + r * .46 * Math.cos(b), y + r * .46 * Math.sin(b), r * .2), t + 300 + j * 60, 400, mid); }
    A.add('ff', circ(x, y, r * .3), t + 700, 400, cg(A, 'var(--fest-marigold)', rg));
    for (var k = 0; k < 12; k++) { var c = k * Math.PI / 6; A.add('adot', circ(x + r * .38 * Math.cos(c), y + r * .38 * Math.sin(c), r * .03 + .6), t + 900 + k * 30, 200, rg); }
    A.add('adot', circ(x, y, r * .13), t + 1000, 300, rg);
    var sp = g(A, '', rg);
    A.add('fs2', sparkle(x - r * 1.25, y - r * .55, r * .14) + sparkle(x + r * 1.3, y - r * .4, r * .11) + sparkle(x + r * 1.05, y + r * .8, r * .09), t + 1400, 400, cg(A, 'var(--lagna)', sp));
    A.loop(sp, [{ opacity: 1 }, { opacity: .3 }, { opacity: 1 }], { duration: 2600, delay: 3400, iterations: Infinity, easing: 'ease-in-out' });
  }
  F['raksha-bandhan'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    var pts = [], amp = (phone ? 1.6 : 2.2) * u, period = (phone ? 10 : 14) * u, i, n = 900;
    var cy0, rx, ry, rosY, rosR;
    if (!phone) {
      cy0 = T0 + H * .47; rx = Math.min(W * .45, W / 2 - 50); ry = H * .43; rosY = cy0 + ry; rosR = 46 * u;
      for (i = 0; i <= n; i++) { var a = Math.PI / 2 + i / n * Math.PI * 2; pts.push([cx + rx * Math.cos(a), cy0 + ry * Math.sin(a)]); }
    } else {
      rosY = B - 120; rosR = 34;
      for (i = 0; i <= n; i++) { var tt = i / n, x = L + (R - L) * tt; pts.push([x, rosY - 40 + 40 * Math.sin(Math.PI * tt)]); }
    }
    // Two strands twisted about the path: red and gold.
    var len = 0, sA = '', sB = '';
    for (i = 0; i < pts.length; i++) {
      if (i) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], dl = Math.hypot(dx, dy) || 1;
      var nx = -dy / dl, ny = dx / dl, o = amp * Math.sin(len / period * Math.PI * 2);
      sA += (i ? 'L' : 'M') + pt([pts[i][0] + nx * o, pts[i][1] + ny * o]);
      sB += (i ? 'L' : 'M') + pt([pts[i][0] - nx * o, pts[i][1] - ny * o]);
    }
    var th = g(A, '');
    A.add('fs', sA, 900, 2600, cg(A, 'var(--fest-red)', th));
    A.add('ac', sB, 1000, 2600, th);
    // Beads along the thread.
    var acc = 0, step = phone ? 46 : 96 * u, nextAt = step * .6;
    for (i = 1; i < pts.length; i++) {
      acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc >= nextAt) { nextAt += step; var bp = pts[i]; if (Math.hypot(bp[0] - cx, bp[1] - rosY) > rosR * 1.6) A.add('ff', circ(bp[0], bp[1], 3.2 * u), 1800 + i, 300, cg(A, 'var(--fest-marigold)')); }
    }
    rosette(A, cx, rosY, rosR, 1600);
    // The knot and two tassels where the ends meet (top), or at both ends on phones.
    var ends = phone ? [[L + 6, rosY - 40], [R - 6, rosY - 40]] : [[cx, cy0 - ry]];
    ends.forEach(function (e, ei) {
      var kg = g(A, '');
      if (!phone) A.add('fs', 'M' + pt([e[0] - 8 * u, e[1]]) + 'Q' + pt([e[0], e[1] - 10 * u]) + ' ' + pt([e[0] + 8 * u, e[1]]) + 'Q' + pt([e[0], e[1] + 10 * u]) + ' ' + pt([e[0] - 8 * u, e[1]]), 3000, 400, cg(A, 'var(--fest-red)', kg));
      [-1, 1].forEach(function (sd, j) {
        if (phone && j) return;
        var tx = e[0] + (phone ? 0 : sd * 10 * u), ty = e[1], tg = g(A, '', kg), tl = (phone ? 30 : 46) * u, fr = '';
        A.add('fs', 'M' + pt([tx, ty]) + 'Q' + pt([tx + sd * 6 * u, ty + tl * .5]) + ' ' + pt([tx + sd * 3 * u, ty + tl]), 3100, 400, cg(A, 'var(--fest-red)', tg));
        A.add('ff', circ(tx + sd * 3 * u, ty + tl + 4 * u, 3.6 * u), 3300, 300, cg(A, 'var(--fest-marigold)', tg));
        for (var r = -3; r <= 3; r++) fr += 'M' + pt([tx + sd * 3 * u, ty + tl + 8 * u]) + 'L' + pt([tx + sd * 3 * u + r * 1.8 * u, ty + tl + 22 * u]);
        A.add('fs2', fr, 3400, 300, cg(A, 'var(--fest-red)', tg));
        sway(A, tg, tx, ty, 3, 2400 + j * 500, 3600);
      });
    });
  };

  /* ---------- Onam: pookalam and nilavilakku ---------- */
  var PK = ['var(--fest-saffron)', 'var(--fest-marigold)', 'var(--fest-red)', 'var(--fest-leaf)'];
  function pookalam(A, x, y, r, t, parent, quarter) {
    var pg = g(A, '', parent), P = function (rr, a) { return [x + rr * Math.cos(a), y + rr * Math.sin(a)]; };
    var groups = PK.map(function (c) { return cg(A, c, pg); }), white = g(A, '', pg);
    // Outer scallops.
    var n1 = 24, r1 = r * .84;
    for (var i = 0; i < n1; i++) { var a = i * 2 * Math.PI / n1, da = 2 * Math.PI / n1; A.add('pf', 'M' + pt(P(r1, a)) + 'Q' + pt(P(r * 1.08, a + da / 2)) + ' ' + pt(P(r1, a + da)) + 'Z', t + 600, 500, groups[i % 4]); }
    // Wedges, alternately red and white.
    var n2 = 16, r2 = r * .66;
    for (var j = 0; j < n2; j++) {
      var b = j * 2 * Math.PI / n2, db = 2 * Math.PI / n2, w = 'M' + pt(P(r2, b)) + 'L' + pt(P(r1, b)) + 'A' + f(r1) + ' ' + f(r1) + ' 0 0 1 ' + pt(P(r1, b + db)) + 'L' + pt(P(r2, b + db)) + 'A' + f(r2) + ' ' + f(r2) + ' 0 0 0 ' + pt(P(r2, b)) + 'Z';
      A.add(j % 2 ? 'pw' : 'pf', w, t + 400, 500, j % 2 ? white : groups[2]);
    }
    // Pointed green petals, then round marigold petals, a red heart.
    var n3 = 12, r3 = r * .44;
    for (var k = 0; k < n3; k++) { var c = k * 2 * Math.PI / n3, dc = 2 * Math.PI / n3; A.add('pf', 'M' + pt(P(r3, c)) + 'Q' + pt(P(r2 * .92, c + dc * .2)) + ' ' + pt(P(r2, c + dc / 2)) + 'Q' + pt(P(r2 * .92, c + dc * .8)) + ' ' + pt(P(r3, c + dc)) + 'Z', t + 250, 500, groups[3]); }
    var n4 = 8, r4 = r * .3;
    for (var m = 0; m < n4; m++) { var e = m * 2 * Math.PI / n4; A.add('pf', circ(x + (r3 + r4) / 2 * Math.cos(e), y + (r3 + r4) / 2 * Math.sin(e), (r3 - r4) * .55), t + 120, 500, groups[m % 2]); }
    A.add('pf', circ(x, y, r4 * .8), t, 500, groups[2]);
    A.add('dl3', circ(x, y, r1) + circ(x, y, r2) + circ(x, y, r3), t + 800, 900, pg);
    return pg;
  }
  function nilavilakku(A, x, by, s, t) {
    var T = mk(x, by, s), lg = g(A, '');
    A.add('dl3', X('M-40 0L40 0L30 -14L-30 -14ZM-24 -14L24 -14L16 -26L-16 -26Z', T), t, 800, lg);
    A.add('ac', X('M-3 -26L-3 -224M3 -26L3 -224', T), t + 300, 1200, lg);
    A.add('ac', X('M-10 -62Q0 -50 10 -62Q0 -74 -10 -62ZM-12 -122Q0 -108 12 -122Q0 -136 -12 -122ZM-9 -180Q0 -170 9 -180Q0 -190 -9 -180Z', T), t + 700, 600, lg);
    A.add('ac2', X('M-46 -226Q0 -206 46 -226Q0 -238 -46 -226Z', T), t + 1100, 700, lg);
    A.add('dl3', X('M0 -236L0 -258M0 -258C5 -264 5 -270 0 -276C-5 -270 -5 -264 0 -258Z', T), t + 1300, 500, lg);
    [-34, -17, 0, 17, 34].forEach(function (fx, i) {
      var fy = -230 + Math.abs(fx) * .1, fg = g(A, '', lg), p = T(fx, fy);
      if (i === 2) return;
      glow(A, p[0], p[1] - 10 * s, 18 * s, t + 1600, fg, .4, 'var(--lagna)');
      A.add('flame', X('M' + fx + ' ' + (fy - 20) + 'C' + (fx + 5) + ' ' + (fy - 13) + ' ' + (fx + 5) + ' ' + (fy - 6) + ' ' + fx + ' ' + fy + 'C' + (fx - 5) + ' ' + (fy - 6) + ' ' + (fx - 5) + ' ' + (fy - 13) + ' ' + fx + ' ' + (fy - 20) + 'Z', T), t + 1700 + i * 80, 400, fg);
      flicker(A, fg, p[0], p[1], 3300 + i * 230);
    });
  }
  F.onam = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    var clip = clipFrame(A);
    var pr = phone ? 132 : Math.min(H * .25, 190 * u);
    var big = pookalam(A, cx, B, pr, 1200, clip);
    var qr = phone ? 82 : Math.min(H * .2, 150 * u);
    pookalam(A, L, T0, qr, 900, clip);
    pookalam(A, R, T0, qr, 1000, clip);
    if (!phone) sideX(A, u).forEach(function (x, i) { nilavilakku(A, x, B - Math.max(20, H * .03), Math.min(H * .5, 340 * u) / 276, 1300 + i * 150); });
  };

  /* ---------- Gudi Padwa, Ugadi, Cheti Chand: the new year ---------- */
  function neem(A, x, y, s, ang, t, p) {
    var T = mk(x, y, s, ang), d = 'M0 0L0 34';
    for (var i = 0; i < 4; i++) { var yy = 6 + i * 8; d += 'M0 ' + yy + 'Q-8 ' + (yy + 1) + ' -11 ' + (yy + 6) + 'Q-4 ' + (yy + 6) + ' 0 ' + yy + 'M0 ' + yy + 'Q8 ' + (yy + 1) + ' 11 ' + (yy + 6) + 'Q4 ' + (yy + 6) + ' 0 ' + yy; }
    A.add('lfo', X(d, T), t, 700, p);
  }
  function gudi(A, x, by, h, s, t, flip) {
    var gg = g(A, ''), top = by - h;
    A.add('dl3', 'M' + pt([x - 2 * s, by]) + 'L' + pt([x - 2 * s, top + 40 * s]) + 'M' + pt([x + 2 * s, by]) + 'L' + pt([x + 2 * s, top + 40 * s]), t, 1300, gg);
    var nd = '';
    for (var y = by - 40 * s; y > top + 60 * s; y -= 46 * s) nd += 'M' + pt([x - 3 * s, y]) + 'L' + pt([x + 3 * s, y]);
    A.add('dl3', nd, t + 600, 400, gg);
    var T = mk(x, top, s);
    // The cloth below the pot, swaying from its tie.
    var cl = cg(A, 'var(--fest-saffron)', gg);
    A.add('flag', X('M0 30C-14 40 -28 72 -34 112Q-22 106 -11 116Q0 108 11 116Q22 106 34 112C28 72 14 40 0 30Z', T), t + 900, 900, cl);
    A.add('fs', X('M-34 112Q-22 106 -11 116Q0 108 11 116Q22 106 34 112M-3 34L-17 110M3 34L17 110M0 33L0 110', T), t + 1300, 600, cg(A, 'var(--fest-red)', cl));
    cl.style.transformOrigin = f(x) + 'px ' + f(top + 30 * s) + 'px';
    A.loop(cl, [{ transform: 'skewX(0deg)' }, { transform: 'skewX(' + (flip ? -3 : 3) + 'deg)' }, { transform: 'skewX(0deg)' }], { duration: 4200, delay: 3200, iterations: Infinity, easing: 'ease-in-out' });
    // The inverted kalash on top, with bands.
    A.add('ac2', X('M-14 30C-26 24 -28 4 -16 -6C-8 -12 8 -12 16 -6C28 4 26 24 14 30ZM-16 30L16 30L12 36L-12 36Z', T), t + 700, 800, gg);
    A.add('ac', X('M-24 10Q0 16 24 10M-22 20Q0 26 22 20', T), t + 1100, 400, gg);
    // Neem and mango leaves and a sugar garland at the neck.
    mleaf(A, mk(x - 8 * s, top + 38 * s, s * .9, 40), t + 1500, gg, 'lf');
    mleaf(A, mk(x + 8 * s, top + 38 * s, s * .9, -40), t + 1550, gg, 'lf');
    neem(A, x - 2 * s, top + 38 * s, s * .9, 12, t + 1600, gg);
    var sg = '';
    for (var i = 0; i < 9; i++) { var a = Math.PI * (.1 + i * .1); sg += circ(x + 22 * s * Math.cos(a), top + 40 * s + 26 * s * Math.sin(a), 2.6 * s); }
    A.add('dl3', sg, t + 1700, 500, gg);
    A.add('dl2', 'M' + pt([x - 30 * s, by]) + 'Q' + pt([x, by - 6 * s]) + ' ' + pt([x + 30 * s, by]), t, 500, gg);
  }
  F['ugadi-gudi-padwa'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // A thoranam of mango leaves with neem sprigs across the top.
    var x0 = phone ? L + 8 : L + 40 * u, x1 = phone ? R - 8 : R - 40 * u, ty = T0 + (phone ? 10 : 6), sag = phone ? 10 : 18 * u;
    A.add('dl3', 'M' + pt([x0, ty]) + 'Q' + pt([cx, ty + sag * 2]) + ' ' + pt([x1, ty]), 800, 1400);
    var n = Math.round((x1 - x0) / (phone ? 22 : 30 * u));
    for (var i = 1; i < n; i++) {
      var tt = i / n, x = x0 + (x1 - x0) * tt, y = ty + sag * 4 * tt * (1 - tt), lg = g(A, '');
      if (i % 4 === 2) neem(A, x, y, phone ? .7 : u, 0, 1300 + i * 30, lg);
      else mleaf(A, mk(x, y, (phone ? .75 : u * 1.1) * (i % 2 ? 1 : .86), 0), 1200 + i * 30, lg, 'lf');
      sway(A, lg, x, y, 2, 3000 + (i % 5) * 400, 3000 + i * 40);
    }
    // Two gudis in the side columns.
    if (!phone) sideX(A, u).forEach(function (x, i) { gudi(A, x, B - Math.max(20, H * .03), Math.min(H * .6, 420 * u), u * 1.15, 1100 + i * 150, i === 1); });
    else { gudi(A, L + 46, B - 40, 200, .6, 1100, false); gudi(A, R - 46, B - 40, 200, .6, 1200, true); }
    // A lotus rangoli below the words.
    var rs = phone ? .6 : u, ry = phone ? B - 96 : B - Math.max(70, 84 * u), RT = mk(cx, ry, rs), rg = g(A, '');
    for (var k = 0; k < 8; k++) A.add('fs', X('M0 -10C8 -18 8 -34 0 -44C-8 -34 -8 -18 0 -10Z', mk(cx, ry, rs, k * 45)), 1800 + k * 70, 500, cg(A, k % 2 ? 'var(--fest-saffron)' : 'var(--fest-red)', rg));
    A.add('ac', C(RT, 0, 0, 8) + C(RT, 0, 0, 50), 1700, 800, rg);
    for (var d = 0; d < 24; d++) { var a = d * Math.PI / 12; A.add('fdot', C(RT, 58 * Math.cos(a), 58 * Math.sin(a), 1.6), 2300 + d * 20, 200, cg(A, 'var(--lagna)', rg)); }
  };

  /* ---------- Eid ul-Fitr / al-Adha ---------- */
  function fanoos(A, x, top, len, s, t) {
    var lg = g(A, ''), T = mk(x, top + len, s);
    A.add('dl2', 'M' + pt([x, top]) + 'L' + pt([x, top + len]), t, 900, lg);
    A.add('ac', X('M0 0L0 6', T) + C(T, 0, 9, 3), t + 400, 300, lg);
    A.add('ac', X('M-12 26C-12 16 12 16 12 26ZM0 12L0 17M-15 26L15 26L12 31L-12 31Z', T), t + 600, 600, lg);
    A.add('dl3', X('M-12 31L-17 52L-12 74L12 74L17 52L12 31ZM-4 31L-6 52L-4 74M4 31L6 52L4 74', T), t + 800, 800, lg);
    A.add('ac', X('M-12 74L12 74L8 80L-8 80ZM0 80L0 88', T) + C(T, 0, 91, 2.2), t + 1100, 500, lg);
    var gl = g(A, '', lg), c = T(0, 52);
    glow(A, c[0], c[1], 26 * s, t + 1300, gl, .5, 'var(--lagna)');
    A.add('flame', X('M0 44C4 48 4 54 0 60C-4 54 -4 48 0 44Z', T), t + 1400, 400, gl);
    flicker(A, gl, c[0], c[1] + 8 * s, 3200 + t % 700);
    sway(A, lg, x, top, 1.6, 3000 + len % 900, 3000);
  }
  F.eid = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    stars(A, phone ? 12 : 24, phone ? [L + 10, T0 + 10, R - 10, T0 + 200] : [L + 30, T0 + 20, R - 30, T0 + H * .5], 31);
    // Crescent and star, high in the middle.
    var my = phone ? T0 + 96 : T0 + Math.max(72, H * .11), mr = phone ? 26 : 32 * u, mg = g(A, '');
    glow(A, cx, my, mr * 2.6, 500, mg, .4, 'var(--lagna)');
    A.add('ff', crescent(cx - mr * .15, my, mr, 20), 700, 1100, cg(A, 'var(--lagna)', mg));
    A.add('ff', star5(cx + mr * .62, my - mr * .2, mr * .32, mr * .13, 15), 1400, 500, cg(A, 'var(--lagna)', mg));
    breathe(A, mg, cx, my, 6500, 3000, 1.05);
    // Lanterns hanging at different heights on both sides.
    var ls = phone ? .62 : u * 1.05, set = phone ? [[.07, 50], [.2, 90]] : [[.07, H * .2], [.16, H * .34], [.25, H * .12]];
    set.forEach(function (q, i) {
      fanoos(A, L + q[0] * W, T0, q[1], ls, 900 + i * 200);
      fanoos(A, R - q[0] * W, T0, q[1], ls, 1000 + i * 200);
    });
    // A quiet skyline of domes and minarets below the words.
    var ss = phone ? .52 : Math.min(u * 1.05, (H * .24) / 150), sy = B - (phone ? 30 : Math.max(16, H * .02)), ST = mk(cx, sy, ss);
    A.add('dl3', X('M-300 0L300 0', ST), 900, 1200);
    A.add('dl3', X('M-70 0L-70 -70L70 -70L70 0M-56 -70C-56 -120 -20 -134 0 -150C20 -134 56 -120 56 -70M0 -150L0 -162', ST), 1200, 1400);
    A.add('ac', crescent(ST(0, -168)[0], ST(0, -168)[1], 5 * ss, -60), 2400, 400);
    A.add('dl2', X('M-16 0L-16 -34Q0 -52 16 -34L16 0M-50 -16L-50 -40Q-40 -52 -30 -40L-30 -16M30 -16L30 -40Q40 -52 50 -40L50 -16', ST), 1800, 900);
    [-1, 1].forEach(function (sd) {
      A.add('dl3', X('M' + (sd * 90) + ' 0L' + (sd * 90) + ' -44L' + (sd * 160) + ' -44L' + (sd * 160) + ' 0M' + (sd * 98) + ' -44C' + (sd * 98) + ' -70 ' + (sd * 125) + ' -82 ' + (sd * 125) + ' -88C' + (sd * 125) + ' -82 ' + (sd * 152) + ' -70 ' + (sd * 152) + ' -44', ST), 1400, 1100);
      A.add('dl3', X('M' + (sd * 214) + ' 0L' + (sd * 214) + ' -150M' + (sd * 228) + ' 0L' + (sd * 228) + ' -150M' + (sd * 208) + ' -110L' + (sd * 234) + ' -110M' + (sd * 208) + ' -150L' + (sd * 234) + ' -150M' + (sd * 212) + ' -150C' + (sd * 212) + ' -166 ' + (sd * 221) + ' -172 ' + (sd * 221) + ' -180C' + (sd * 221) + ' -172 ' + (sd * 230) + ' -166 ' + (sd * 230) + ' -150', ST), 1600, 1100);
      A.add('dl2', X('M' + (sd * 116) + ' 0L' + (sd * 116) + ' -22Q' + (sd * 125) + ' -32 ' + (sd * 134) + ' -22L' + (sd * 134) + ' 0', ST), 2000, 500);
    });
  };

  /* ---------- Christmas ---------- */
  function tree(A, x, by, s, t) {
    var T = mk(x, by, s), tg0 = g(A, ''), tg = g(A, '');
    A.add('mod', X('M0 -132L-80 -36Q-40 -22 0 -32Q40 -22 80 -36Z', T), t, 900, tg0);
    A.add('mod', X('M0 -182L-58 -98Q-29 -86 0 -95Q29 -86 58 -98Z', T), t + 200, 900, tg0);
    A.add('mod', X('M0 -224L-36 -160Q-18 -150 0 -157Q18 -150 36 -160Z', T), t + 400, 900, tg0);
    var gd = '';
    [[-62, -58, 54, -44], [-42, -116, 40, -104], [-24, -168, 22, -160]].forEach(function (q) { for (var k = 0; k <= 9; k++) { var tt = k / 9, xx = q[0] + (q[2] - q[0]) * tt, yy = q[1] + (q[3] - q[1]) * tt + 10 * Math.sin(Math.PI * tt); gd += C(T, xx, yy, 1.1); } });
    A.add('fdot', gd, t + 900, 600, cg(A, 'var(--lagna)', tg));
    A.add('dl3', X('M-8 -32L-8 0L8 0L8 -32', T), t, 500, tg0);
    var orn = [[-30, -52, 'var(--fest-red)'], [22, -60, 'var(--fest-sky)'], [-6, -44, 'var(--lagna)'], [50, -44, 'var(--fest-leaf)'], [-48, -44, 'var(--fest-marigold)'], [-18, -110, 'var(--fest-sky)'], [16, -118, 'var(--fest-red)'], [-2, -172, 'var(--fest-red)'], [36, -104, 'var(--lagna)']];
    orn.forEach(function (o, i) {
      var og = cg(A, o[2], tg);
      A.add('ff', C(T, o[0], o[1], 4), t + 1000 + i * 80, 300, og);
      if (i % 3 === 0) A.loop(og, [{ opacity: 1 }, { opacity: .4 }, { opacity: 1 }], { duration: 1800 + i * 200, delay: 3200 + i * 150, iterations: Infinity, easing: 'ease-in-out' });
    });
    var sg = g(A, '', tg), sp = T(0, -238);
    glow(A, sp[0], sp[1], 26 * s, t + 1500, sg, .5, 'var(--lagna)');
    A.add('ff', star5(sp[0], sp[1], 13 * s, 5.5 * s, 0), t + 1500, 500, cg(A, 'var(--lagna)', sg));
    breathe(A, sg, sp[0], sp[1], 3200, 3300, 1.1);
    A.add('dl3', X('M24 0L24 -22L52 -22L52 0ZM38 -22L38 0M24 -12L52 -12', T), t + 900, 500, tg);
    A.add('fs', X('M38 -22Q30 -32 34 -26Q38 -32 42 -26Q46 -32 38 -22', T), t + 1300, 300, cg(A, 'var(--fest-red)', tg));
    A.add('dl3', X('M-56 0L-56 -16L-32 -16L-32 0ZM-44 -16L-44 0', T), t + 1000, 500, tg);
  }
  F.christmas = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(41);
    A.hc.style.removeProperty('--fc');
    A.frame();
    // A string of lights across the top, twinkling.
    var x0 = phone ? L + 6 : L + 30 * u, x1 = phone ? R - 6 : R - 30 * u, ty = T0 + 4, n = phone ? 4 : 7, sw = (x1 - x0) / n, sag = phone ? 18 : 30 * u, d = 'M' + pt([x0, ty]);
    for (var i = 0; i < n; i++) d += 'Q' + pt([x0 + sw * (i + .5), ty + sag * 2]) + ' ' + pt([x0 + sw * (i + 1), ty]);
    A.add('dl3', d, 800, 1600);
    var cols = ['var(--fest-red)', 'var(--fest-leaf)', 'var(--lagna)', 'var(--fest-sky)'], k = 0;
    for (var j = 0; j < n; j++) for (var q = 1; q < 6; q++) {
      var tt = q / 6, bx = x0 + sw * (j + tt), by = ty + sag * 4 * tt * (1 - tt), bg = cg(A, cols[k % 4]), BT = mk(bx, by, phone ? .7 : u);
      A.add('ff', X('M0 0L0 4M-3 4L3 4L3 7L-3 7ZM0 7C5 10 6 16 0 21C-6 16 -5 10 0 7Z', BT), 1400 + k * 25, 300, bg);
      A.loop(bg, [{ opacity: 1 }, { opacity: .3 }, { opacity: 1 }], { duration: 1600 + (k % 5) * 400, delay: 3000 + (k * 173) % 2000, iterations: Infinity, easing: 'ease-in-out' });
      k++;
    }
    // Trees in the side columns, gifts at their feet.
    if (!phone) sideX(A, u).forEach(function (x, i) { tree(A, x, B - Math.max(18, H * .025), Math.min(u * 1.25, (H * .62) / 250), 1100 + i * 150); });
    else { tree(A, L + 52, B - 30, .62, 1100); tree(A, R - 52, B - 30, .62, 1200); }
    // A few slow snowflakes.
    var nS = phone ? 10 : 22;
    for (var s2 = 0; s2 < nS; s2++) {
      var sx = phone ? L + 10 + rn() * (W - 20) : (s2 % 2 ? L + 30 + rn() * W * .25 : R - 30 - rn() * W * .25);
      speck(A, sx, T0 + 40 + rn() * H * .4, (1.1 + rn() * 1.4) * u, 'color-mix(in srgb,var(--fg) 45%,var(--bg))', (rn() - .5) * 30, 90 + rn() * 60, 9000 + rn() * 5000, 2600 + rn() * 6000);
    }
  };

  /* ---------- New Year: fireworks in fine lines ---------- */
  function burst(A, x, y, r, col, t, i) {
    var bg = cg(A, col), d = '', dots = '', rn = rnd(100 + i);
    for (var k = 0; k < 28; k++) {
      var a = k * Math.PI * 2 / 28 + rn() * .06, r0 = r * .22, r1 = r * (.78 + rn() * .22);
      d += 'M' + pt([x + r0 * Math.cos(a), y + r0 * Math.sin(a)]) + 'Q' + pt([x + (r0 + r1) / 2 * Math.cos(a), y + (r0 + r1) / 2 * Math.sin(a) + r * .02]) + ' ' + pt([x + r1 * Math.cos(a), y + r1 * Math.sin(a) + r * .05]);
      dots += circ(x + (r1 + r * .07) * Math.cos(a), y + (r1 + r * .07) * Math.sin(a) + r * .07, Math.max(1, r * .022));
    }
    A.add('fs2', d, t, 900, bg);
    A.add('fdot', dots, t + 600, 500, bg);
    var inner = '';
    for (var m = 0; m < 12; m++) { var b = m * Math.PI / 6; inner += circ(x + r * .42 * Math.cos(b), y + r * .42 * Math.sin(b), Math.max(.9, r * .018)); }
    A.add('fdot', inner, t + 400, 400, bg);
    A.add('fs', sparkle(x, y, r * .1), t + 200, 300, bg);
    bg.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
    A.loop(bg, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.05)', opacity: 0, offset: .35 }, { transform: 'scale(.55)', opacity: 0, offset: .42 }, { transform: 'scale(1)', opacity: 1, offset: .62 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 7000 + i * 900, delay: 4000 + i * 1300, iterations: Infinity, easing: 'ease-out' });
  }
  F['new-year'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(51);
    A.hc.style.removeProperty('--fc');
    A.frame();
    var set = phone ? [[.2, .1, 58, 'var(--lagna)'], [.8, .13, 66, 'var(--holi-pink)'], [.5, .04, 36, 'var(--fest-sky)']]
      : [[.13, .22, 92, 'var(--lagna)'], [.87, .2, 100, 'var(--holi-pink)'], [.3, .09, 52, 'var(--fest-sky)'], [.7, .1, 58, 'var(--fest-leaf)'], [.08, .62, 46, 'var(--holi-purple)'], [.93, .6, 50, 'var(--lagna)']];
    set.forEach(function (b, i) {
      var x = L + b[0] * W, y = T0 + b[1] * H + (phone ? 40 : 0), r = b[2] * (phone ? 1 : u);
      if (!phone) A.add('dl2', 'M' + pt([x + (b[0] < .5 ? -1 : 1) * r * .3, B]) + 'Q' + pt([x, (y + B) / 2]) + ' ' + pt([x, y + r * .3]), 600 + i * 150, 900);
      burst(A, x, y, r, b[3], 1300 + i * 250, i);
    });
    // Confetti specks rising from the bottom band.
    var nS = phone ? 12 : 26;
    for (var s2 = 0; s2 < nS; s2++) speck(A, L + 20 + rn() * (W - 40), B - 30 - rn() * H * .15, (1 + rn() * 1.6) * u, ['var(--lagna)', 'var(--holi-pink)', 'var(--fest-sky)', 'var(--fest-leaf)'][s2 % 4], (rn() - .5) * 30, -(50 + rn() * 70), 7000 + rn() * 5000, 2600 + rn() * 5000);
  };

  /* ---------- Purnima: Sharad, Kartik, Buddha, Guru ---------- */
  F.purnima = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(61);
    A.hc.style.removeProperty('--fc');
    A.frame();
    stars(A, phone ? 12 : 26, phone ? [L + 10, T0 + 10, R - 10, T0 + 200] : [L + 30, T0 + 20, R - 30, T0 + H * .5], 61);
    // The full moon, high and bright.
    var my = phone ? T0 + 100 : T0 + Math.max(78, H * .12), mr = phone ? 34 : 42 * u, mg = g(A, '');
    glow(A, cx, my, mr * 2.8, 500, mg, .5, 'var(--lagna)');
    A.add('ff2', circ(cx, my, mr), 700, 1200, cg(A, 'var(--lagna)', mg));
    A.add('dl2', circ(cx - mr * .32, my - mr * .2, mr * .17) + circ(cx + mr * .3, my + mr * .28, mr * .12) + circ(cx + mr * .12, my - mr * .44, mr * .08) + circ(cx - mr * .1, my + mr * .4, mr * .07), 1300, 600, mg);
    breathe(A, mg, cx, my, 7000, 3000, 1.04);
    // Two faint halo rings round the moon.
    var halo = g(A, '');
    halo.setAttribute('opacity', '.6');
    A.add('fs2', circ(cx, my, mr * 1.45) + circ(cx, my, mr * 1.8), 1500, 1400, cg(A, 'var(--lagna)', halo));
    breathe(A, halo, cx, my, 9000, 3400, 1.03);
    // Still water below, the moon's path on it, lotuses and floating lamps.
    var hy = phone ? B - 130 : B - Math.max(80, 110 * u);
    A.add('dl3', 'M' + pt([L, hy]) + 'L' + pt([R, hy]), 700, 1400);
    var clip = clipFrame(A), rows = 4;
    for (var r = 1; r <= rows; r++) {
      var y = hy + r * (B - hy) / (rows + 1), row = g(A, '', clip), d = '', x = L - 60 + rn() * 40;
      while (x < R + 60) { var w = (22 + rn() * 34) * u; d += 'M' + f(x) + ' ' + f(y) + 'Q' + f(x + w / 2) + ' ' + f(y - 2.5) + ' ' + f(x + w) + ' ' + f(y); x += w + (18 + rn() * 34) * u; }
      A.add('dl2', d, 900 + r * 120, 1200, row);
      A.loop(row, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (r % 2 ? 12 : -12) + 'px)' }], { duration: 8000 + r * 900, delay: 3000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
      var sh = g(A, '', clip), hw = mr * (.9 - r * .14);
      A.add('ac', 'M' + pt([cx - hw, y + 2]) + 'L' + pt([cx + hw, y + 2]), 1800 + r * 100, 400, sh);
      A.loop(sh, [{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 2400 + r * 400, delay: 3200 + r * 200, iterations: Infinity, easing: 'ease-in-out' });
    }
    var ls = phone ? .62 : u * 1.05;
    (phone ? [-.32, .32] : [-.3, .3]).forEach(function (q, i) {
      var lx = cx + q * W, LT = mk(lx, hy + 4 * ls, ls);
      lotus(A, LT, 1600 + i * 150);
      A.add('lfo', X('M-34 6Q-50 0 -60 8Q-48 14 -34 6M34 6Q50 0 60 8Q48 14 34 6', LT), 1900, 500);
    });
    if (!phone) [-.14, .14, -.44, .44].forEach(function (q, i) {
      var lx = cx + q * W, ly = hy + (i < 2 ? 34 : 22) * u, fg = g(A, '');
      litLamp(A, lx, ly, u * .55, 2000 + i * 150, fg);
      A.loop(fg, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (i % 2 ? -6 : 6) + 'px,1.5px)' }], { duration: 6000 + i * 700, delay: 3200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    });
    // What the day is for: kheer under the moonlight (Sharad), lamps set
    // afloat (Kartik), bodhi leaves (Buddha), marigold garlands (Guru).
    var occ = null, pre = window.AA_CANVAS_PRESET;
    try { occ = new URLSearchParams(location.search).get('occasion'); } catch (e) {}
    if (!occ && pre && pre.canvas === 'purnima') occ = String(pre.id).split('-')[0];
    if (occ === 'sharad') {
      var bx = phone ? cx : cx - W * .17, bb = hy - 2, bs = phone ? .7 : u * 1.15, BT = mk(bx, bb, bs);
      if (!phone) {
        var beam = g(A, '');
        A.add('fs2', 'M' + pt([cx - mr * .5, my + mr]) + 'L' + pt([bx, bb - 40 * bs]), 2600, 1600, cg(A, 'color-mix(in srgb,var(--lagna) 60%,transparent)', beam), true);
        A.loop(beam, [{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 4200, delay: 4200, iterations: Infinity, easing: 'ease-in-out' });
      }
      if (phone) BT = mk(cx, hy - 2, bs);
      A.add('mod', X('M-34 -18Q-30 4 0 6Q30 4 34 -18Z', BT), 1800, 700);
      A.add('dl3', X('M-36 -18Q0 -12 36 -18Q0 -24 -36 -18ZM-12 6L-14 12L14 12L12 6', BT), 1900, 600);
      A.add('fdot', C(BT, -10, -19, 1.4) + C(BT, 6, -20, 1.4) + C(BT, 14, -18, 1.2), 2300, 300, cg(A, 'var(--fest-saffron)'));
      var stm = g(A, '');
      A.add('dl2', X('M-8 -26Q-12 -34 -6 -40Q0 -46 -4 -54M6 -26Q2 -34 8 -40Q14 -46 10 -54', BT), 2400, 700, stm);
      A.loop(stm, [{ transform: 'translateY(0)', opacity: .9 }, { transform: 'translateY(-6px)', opacity: .2 }], { duration: 3200, delay: 3400, iterations: Infinity, easing: 'ease-out' });
    } else if (occ === 'kartik') {
      var nL = phone ? 5 : 9;
      for (var k = 0; k < nL; k++) {
        var lx2 = L + (k + .5) * W / nL + (k % 2 ? 10 : -10), ly2 = hy + (k % 2 ? 26 : 46) * (phone ? .7 : u), fg2 = g(A, '');
        if (Math.abs(lx2 - cx) < mr * 1.2) continue;
        litLamp(A, lx2, ly2, (phone ? .4 : u * .45), 2300 + k * 90, fg2);
        A.loop(fg2, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (k % 2 ? -5 : 5) + 'px,1.5px)' }], { duration: 5200 + k * 400, delay: 3300, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
      }
    } else if (occ === 'buddha') {
      [[L + (phone ? 30 : 70 * u), 1], [R - (phone ? 30 : 70 * u), -1]].forEach(function (c, ci) {
        for (var q = 0; q < 3; q++) {
          var x = c[0] + c[1] * q * (phone ? 26 : 44 * u), len = (phone ? [70, 46, 26] : [H * .26, H * .17, H * .1])[q], lg = g(A, '');
          A.add('lfo', 'M' + pt([x, T0]) + 'L' + pt([x, T0 + len]), 900 + q * 120, 800, lg);
          A.add('lf', X('M0 0C-14 4 -22 18 -18 30C-14 40 -4 44 0 58C4 44 14 40 18 30C22 18 14 4 0 0ZM0 2L0 54', mk(x, T0 + len, (phone ? .6 : u * .9))), 1400 + q * 150, 700, lg);
          sway(A, lg, x, T0, 1.6 + q * .4, 3600 + q * 500 + ci * 300, 3000);
        }
      });
    } else if (occ === 'guru') {
      [-1, 1].forEach(function (sd) {
        var x0 = sd < 0 ? L : R, x1 = cx + sd * (phone ? 60 : W * .2), d = 'M' + pt([x0, T0 + 4]) + 'Q' + pt([(x0 + x1) / 2, T0 + (phone ? 50 : 70 * u)]) + ' ' + pt([x1, T0 + 4]);
        A.add('dl2', d, 900, 1200);
        for (var m = 1; m < 10; m++) {
          var tt = m / 10, px = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * (x0 + x1) / 2 + tt * tt * x1, py = (1 - tt) * (1 - tt) * (T0 + 4) + 2 * (1 - tt) * tt * (T0 + (phone ? 50 : 70 * u)) + tt * tt * (T0 + 4);
          marigold(A, px, py, (phone ? 4 : 6) * u, m % 2 ? 'var(--fest-saffron)' : 'var(--fest-marigold)', 1300 + m * 60);
        }
      });
    }
  };

  /* ---------- Quiet days: no celebration ---------- */
  // Pitru Paksha: one steady lamp on a leaf, kusha grass, water for tarpan.
  F['pitru-paksha'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.setProperty('--fc', 'color-mix(in srgb,var(--fg) 55%,var(--bg))');
    A.frame();
    // A thin waning moon (Krishna paksha) and a few faint stars, nothing more.
    var my = phone ? T0 + 96 : T0 + Math.max(70, H * .11);
    A.add('dl3', crescent(cx, my, phone ? 20 : 24 * u, 200), 900, 1600);
    var st = g(A, '');
    st.setAttribute('opacity', '.6');
    stars(A, phone ? 6 : 12, phone ? [L + 20, T0 + 20, R - 20, T0 + 180] : [L + 60, T0 + 30, R - 60, T0 + H * .32], 71, st);
    var s = phone ? .8 : u * 1.25, by = phone ? B - 96 : B - Math.max(30, H * .05), PT = mk(cx, by, s);
    // The leaf plate and the lamp, its flame barely moving.
    A.add('dl3', X('M-58 6Q0 22 58 6Q0 -8 -58 6ZM-50 7L50 7M-30 3L-38 12M-10 2L-14 12M10 2L14 12M30 3L38 12', PT), 1000, 1200);
    lamp(A, cx, by, s * .95, 'unlit', 1300);
    var fg = g(A, '');
    glow(A, cx, by - 26 * s, 40 * s, 2000, fg, .3, 'var(--lagna)');
    A.add('flame', X('M0 -42C7 -33 6.5 -24 0 -16C-6.5 -24 -7 -33 0 -42Z', mk(cx, by, s * .95)), 2100, 700, fg);
    fg.style.transformOrigin = f(cx) + 'px ' + f(by - 16 * s) + 'px';
    A.loop(fg, [{ transform: 'scale(1,1)' }, { transform: 'scale(.97,1.03)' }, { transform: 'scale(1,1)' }], { duration: 5200, delay: 3400, iterations: Infinity, easing: 'ease-in-out' });
    // Kusha grass laid to the left, tied with a ring.
    var kx = cx - (phone ? 110 : 190 * u), KT = mk(kx, by, s, -8), kd = '';
    for (var i = 0; i < 9; i++) { var o = (i - 4) * 2.4; kd += 'M-70 ' + f(o * .4) + 'Q0 ' + f(o - 4) + ' ' + f(72 + (i % 3) * 6) + ' ' + f(o * 1.6 - 10); }
    A.add('fs2', X(kd, KT), 1400, 1400);
    A.add('dl3', X('M-30 -7Q-24 -12 -18 -7Q-24 -2 -30 -7ZM-44 -6Q-50 -16 -40 -18Q-32 -18 -36 -8', KT), 2100, 500);
    // A copper lota tilted over a small plate, a thin stream and sesame.
    var lx = cx + (phone ? 110 : 190 * u), LT = mk(lx, by, s);
    A.add('dl3', X('M-30 4Q0 12 30 4Q0 -2 -30 4Z', LT), 1500, 600);
    A.add('fdot', C(LT, -8, 3, 1.1) + C(LT, -2, 5, 1.1) + C(LT, 5, 3, 1.1) + C(LT, 11, 5, 1.1) + C(LT, -14, 5, 1.1), 2300, 300, cg(A, 'var(--fg)'));
    var LT2 = mk(lx - 4 * s, by - 52 * s, s, -24);
    A.add('ac', X('M-12 -10C-22 -6 -24 12 -12 20C-4 24 4 24 12 20C24 12 22 -6 12 -10ZM-12 -10L-10 -16L10 -16L12 -10M-14 -17Q0 -21 14 -17', LT2), 1700, 900);
    var sp = LT2(13, -17);
    A.add('dl2', 'M' + pt(sp) + 'Q' + pt([sp[0] + 8 * s, sp[1] + 12 * s]) + ' ' + pt([lx + 2 * s, by - 1 * s]), 2500, 900);
  };

  // An eclipse, drawn as geometry: the three bodies in line and the shadow cones,
  // and the sequence as seen from India across the top. No fear, no dosh.
  F.eclipse = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    var ev = window.AA_pickEvent ? window.AA_pickEvent('eclipse') : ['', 'solar'], solar = ev[1] === 'solar';
    A.hc.style.removeProperty('--fc');
    A.frame();
    var yd = phone ? B - 110 : B - Math.max(70, H * .13), sx = phone ? L + 40 : L + W * .1, rS = phone ? 26 : 42 * u;
    var sg = g(A, '');
    glow(A, sx, yd, rS * 2, 600, sg, .35, 'var(--lagna)');
    A.add('ff', circ(sx, yd, rS), 700, 1000, cg(A, 'var(--lagna)', sg));
    for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; A.add('ac', 'M' + pt([sx + rS * 1.15 * Math.cos(a), yd + rS * 1.15 * Math.sin(a)]) + 'L' + pt([sx + rS * 1.32 * Math.cos(a), yd + rS * 1.32 * Math.sin(a)]), 1000 + i * 30, 300, sg); }
    A.add('dl2', 'M' + pt([sx, yd]) + 'L' + pt([R - (phone ? 6 : 20), yd]), 800, 1600, null, true);
    var mid = phone ? L + W * .58 : L + W * .6, rMid = solar ? (phone ? 6 : 9 * u) : (phone ? 14 : 22 * u);
    // Tangents from the Sun past the middle body: the umbra closes, the penumbra opens.
    var apex = mid + rMid * (mid - sx) / (rS - rMid), far = solar ? Math.min(apex + rMid * 2, R - 30) : R - (phone ? 14 : 40);
    var yu = function (x) { return yd - rS + (rS - rMid) * (x - sx) / (mid - sx); }, yp = function (x) { return yd - rS + (rS + rMid) * (x - sx) / (mid - sx); };
    var cone = g(A, '', clipFrame(A));
    A.add('dl2', 'M' + pt([sx, yd - rS]) + 'L' + pt([apex, yd]) + 'M' + pt([sx, yd + rS]) + 'L' + pt([apex, yd]), 1500, 1400, cone);
    A.add('dl2', 'M' + pt([sx, yd - rS]) + 'L' + pt([far, yp(far)]) + 'M' + pt([sx, yd + rS]) + 'L' + pt([far, 2 * yd - yp(far)]), 1700, 1400, cone);
    var shade = cg(A, 'var(--fg)', cone);
    A.add('shade', 'M' + pt([mid, yd - rMid]) + 'L' + pt([apex, yd]) + 'L' + pt([mid, yd + rMid]) + 'Z', 2600, 900, shade, true);
    if (solar) {
      // Moon between; the Earth just past the tip of the Moon's shadow.
      var ex = Math.min(R - (phone ? 30 : 60 * u), apex + (phone ? 22 : 34 * u)), rE = phone ? 20 : 30 * u;
      A.add('mod', circ(mid, yd, rMid), 1300, 700);
      A.add('dl3', circ(ex, yd, rE), 1300, 900);
      A.add('dl2', 'M' + pt([ex - rE, yd]) + 'Q' + pt([ex, yd + rE * .35]) + ' ' + pt([ex + rE, yd]) + 'M' + pt([ex, yd - rE]) + 'Q' + pt([ex - rE * .35, yd]) + ' ' + pt([ex, yd + rE]), 1600, 700);
    } else {
      // Earth between; the Moon just inside the penumbra, above the umbra.
      // Umbra edge at mx is yu(mx) mirrored below the axis; penumbra edge is yp(mx).
      var mx = R - (phone ? 34 : 70 * u), rM = phone ? 7 : 10 * u, ub = Math.abs(yd - yu(mx)), pb = Math.abs(yp(mx) - yd), my = yd + Math.max(ub + rM * 1.3, (ub + pb) / 2);
      A.add('mod', circ(mid, yd, rMid), 1300, 800);
      A.add('dl2', 'M' + pt([mid - rMid, yd]) + 'Q' + pt([mid, yd + rMid * .35]) + ' ' + pt([mid + rMid, yd]), 1600, 600);
      A.add('dl3', circ(mx, my, rM), 1800, 600);
    }
    // The sequence across the top band.
    var n = phone ? 5 : 7, gap = phone ? (W - 60) / (n - 1) : Math.min(78 * u, W * .07), ty = phone ? T0 + 90 : T0 + Math.max(64, H * .1), r = phone ? 13 : 16 * u;
    for (var k = 0; k < n; k++) {
      var x = cx + (k - (n - 1) / 2) * gap, q = (k - (n - 1) / 2) / ((n - 1) / 2), dg = g(A, '');
      if (solar) {
        A.add('ff2', circ(x, ty, r), 1200 + k * 160, 500, cg(A, 'var(--lagna)', dg));
        A.add('mod', circ(x - q * r * 2.2, ty - r * 1.7, r * 1.02), 1500 + k * 160, 500, dg);
      } else {
        A.add('ff2', circ(x, ty, r), 1200 + k * 160, 500, cg(A, 'var(--lagna)', dg));
        var sh = g(A, '', dg);
        sh.setAttribute('opacity', (.12 + .5 * (1 - Math.abs(q))).toFixed(2));
        A.add('dim', circ(x - q * r * .5, ty + r * .25, r * 1.04), 1500 + k * 160, 500, sh, true);
      }
    }
    // Local times for Delhi (timeanddate.com), small, under the sequence.
    if (ev[4]) txt(A, cx, ty + r + (phone ? 22 : 28 * u), ev[4], ev[5], phone ? 10.5 : 12 * Math.max(1, u), 2400);
  };

  // A planet changing sign: an arc of the zodiac, the planet crossing the line.
  var PLANET = {
    ju: '<path d="M5.4 8.2C5.4 4.4 11.2 4 11.2 8.2c0 3.4-3.6 5.6-6.2 8H19M15.6 3.6V21"/>',
    sa: '<path d="M6.4 5.2h6.2M9.5 2.4V19M9.5 12.6c0-3.6 6.6-4 6.6 0 0 3-3 4-3 6.5 0 2 2.1 2.6 3.9 1.2"/>',
    ra: '<path d="M7.6 16.6C3.4 12.6 5 4.6 12 4.6s8.6 8 4.4 12"/><circle cx="7" cy="18.8" r="2.2"/><circle cx="17" cy="18.8" r="2.2"/>'
  };
  PLANET.ke = '<path d="M7.6 7.4C3.4 11.4 5 19.4 12 19.4s8.6-8 4.4-12"/><circle cx="7" cy="5.2" r="2.2"/><circle cx="17" cy="5.2" r="2.2"/>';
  var SIGN_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  var SIGN_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
  var PNAME = { ju: ['Jupiter', 'गुरु'], sa: ['Saturn', 'शनि'], ra: ['Rahu', 'राहु'], ke: ['Ketu', 'केतु'] };
  function zfont() {
    if (document.getElementById('hcf-zfont')) return;
    var l = document.createElement('link');
    l.id = 'hcf-zfont'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols&display=swap&text=' + encodeURIComponent('♈♉♊♋♌♍♎♏♐♑♒♓→');
    document.head.appendChild(l);
  }
  function zg(k) { return String.fromCharCode(0x2648 + ((k % 12) + 12) % 12) + '︎'; }
  F.transit = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    var ev = window.AA_pickEvent ? window.AA_pickEvent('transit') : ['', 'ju', 3, 4, 0], from = ev[2], to = ev[3], back = ev[4] === 1;
    var right = back ? from : to, left = back ? to : from;
    zfont();
    A.hc.style.removeProperty('--fc');
    A.frame();
    var R0 = phone ? 520 : H * 1.45, bw = phone ? 30 : 38 * u, R1 = R0 - bw, oy = T0 + (phone ? 70 : Math.max(76, H * .13)) + R0;
    var half = Math.asin(Math.min(.98, (W / 2) / R0)), a0 = -Math.PI / 2 - half, a1 = -Math.PI / 2 + half;
    var P = function (r, a) { return [cx + r * Math.cos(a), oy + r * Math.sin(a)]; };
    var arc = function (r) { var p0 = P(r, a0), p1 = P(r, a1); return 'M' + pt(p0) + 'A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + pt(p1); };
    var clip = clipFrame(A);
    // The new sign's segment, softly lit.
    var nA = back ? -Math.PI / 2 - Math.PI / 6 : -Math.PI / 2, nB = nA + Math.PI / 6;
    A.add('ff2', 'M' + pt(P(R1, nA)) + 'L' + pt(P(R0, nA)) + 'A' + f(R0) + ' ' + f(R0) + ' 0 0 1 ' + pt(P(R0, nB)) + 'L' + pt(P(R1, nB)) + 'A' + f(R1) + ' ' + f(R1) + ' 0 0 0 ' + pt(P(R1, nA)) + 'Z', 2600, 1200, cg(A, 'var(--lagna)', clip));
    A.add('dl3', arc(R0) + arc(R1), 700, 1800, clip);
    var dv = '', tk = '';
    for (var k = -6; k <= 6; k++) { var a = -Math.PI / 2 + k * Math.PI / 6; if (a < a0 || a > a1) continue; dv += 'M' + pt(P(R1, a)) + 'L' + pt(P(R0, a)); }
    A.add('dl3', dv, 1300, 900, clip);
    for (var n = -20; n <= 20; n++) { var b = -Math.PI / 2 + n * Math.PI * 2 / 27 + Math.PI / 54; if (b < a0 || b > a1) continue; tk += 'M' + pt(P(R1, b)) + 'L' + pt(P(R1 - (n % 3 ? 5 : 9) * u, b)); }
    A.add('dl2', tk, 1500, 900, clip);
    // Sign glyphs in the band: right of the line is `right`, then onwards.
    for (var s2 = -3; s2 <= 3; s2++) {
      var c = -Math.PI / 2 + (s2 + .5) * Math.PI / 6; if (c < a0 + .02 || c > a1 - .02) continue;
      var gp = P(R1 + bw / 2, c), idx = s2 >= 0 ? right + s2 : left + s2 + 1, on = idx % 12 === ((to % 12) + 12) % 12;
      var tx = A.el('text', { x: f(gp[0]), y: f(gp[1]), 'class': on ? 'zg on' : 'zg', style: 'font-size:' + f(bw * .62) + 'px', 'data-t': (1700 + Math.abs(s2) * 120) + ',600' }, clip);
      tx.textContent = zg(idx);
    }
    // The line between the signs, in the accent.
    A.add('ac2', 'M' + pt(P(R1 - 8 * u, -Math.PI / 2)) + 'L' + pt(P(R0 + 8 * u, -Math.PI / 2)), 2200, 500);
    // The planet, crossing from the old sign into the new one, its path dotted.
    var pr = R0 + (phone ? 26 : 34 * u), aFrom = -Math.PI / 2 + (back ? 1 : -1) * Math.PI / 12 * 1.1, aTo = -Math.PI / 2 + (back ? -1 : 1) * Math.PI / 14;
    var trail = '';
    for (var tq = 0; tq <= 12; tq++) { var ta = aFrom + (aTo - aFrom) * tq / 12, tp = P(pr, ta); trail += circ(tp[0], tp[1], (.8 + tq * .08) * u); }
    A.add('fdot', trail, 2600, 2000, cg(A, 'color-mix(in srgb,var(--lagna) 55%,transparent)'), true);
    var pw = g(A, ''), pg = g(A, '', pw), gs = (phone ? 1.3 : 1.7) * u;
    var at = function (a) { var p = P(pr, a); return 'translate(' + f(p[0]) + 'px,' + f(p[1]) + 'px)'; };
    glow(A, 0, 0, 30 * u, 2400, pg, .5, 'var(--lagna)');
    var gl = A.el('g', { 'class': 'pg', transform: 'translate(' + f(-12 * gs) + ' ' + f(-12 * gs) + ') scale(' + gs.toFixed(3) + ')', 'data-t': '2300,700' }, pg);
    gl.innerHTML = PLANET[ev[1]] || PLANET.ju;
    pg.style.transform = at(aTo);
    if (!A.reduce) {
      var kf = [];
      for (var j = 0; j <= 30; j++) { var e = j / 30, ez = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; kf.push({ transform: at(aFrom + (aTo - aFrom) * ez) }); }
      A.loop(pg, kf, { duration: 4200, delay: 2600, fill: 'backwards' });
    }
    // Below the words: old sign, arrow, new sign, named; Ketu's pair too for Rahu.
    var by = phone ? B - 120 : B - Math.max(70, H * .11), fs = phone ? 28 : 34 * u, sp = phone ? 58 : 74 * u;
    var pairs = ev[1] === 'ra' ? [['ra', from, to, cx - (phone ? 92 : 170 * u)], ['ke', (from + 6) % 12, (to + 6) % 12, cx + (phone ? 92 : 170 * u)]] : [[ev[1], from, to, cx]];
    if (phone && pairs.length > 1) { sp = 40; fs = 24; }
    pairs.forEach(function (q, i) {
      var x = q[3], t0 = 2000 + i * 300;
      var t1 = A.el('text', { x: f(x - sp), y: f(by), 'class': 'zg', style: 'font-size:' + f(fs) + 'px', 'data-t': t0 + ',700' });
      t1.textContent = zg(q[1]);
      A.add('ac', 'M' + pt([x - sp * .45, by]) + 'L' + pt([x + sp * .45, by]) + 'M' + pt([x + sp * .3, by - 6 * u]) + 'L' + pt([x + sp * .45, by]) + 'L' + pt([x + sp * .3, by + 6 * u]), t0 + 400, 700);
      var t2 = A.el('text', { x: f(x + sp), y: f(by), 'class': 'zg on', style: 'font-size:' + f(fs) + 'px', 'data-t': (t0 + 800) + ',700' });
      t2.textContent = zg(q[2]);
      var cs = (phone ? 10 : 11) * Math.max(1, u);
      txt(A, x - sp, by + fs * .95, SIGN_EN[q[1]], SIGN_HI[q[1]], cs, t0 + 900);
      txt(A, x + sp, by + fs * .95, SIGN_EN[q[2]], SIGN_HI[q[2]], cs, t0 + 1000, null, 'fcap on');
      var mg = A.el('g', { 'class': 'pg', transform: 'translate(' + f(x - 9 * u) + ' ' + f(by - fs * 1.25 - 9 * u) + ') scale(' + (.75 * u).toFixed(3) + ')', 'data-t': (t0 + 1100) + ',600' });
      mg.innerHTML = PLANET[q[0]];
      txt(A, x, by - fs * 1.25 + 16 * u, PNAME[q[0]][0] + (back ? ' (retrograde)' : ''), PNAME[q[0]][1] + (back ? ' (वक्री)' : ''), cs, t0 + 1200);
    });
  };

  /* ---------- More festivals ---------- */
  function shankh(A, T, t, p) {
    // A right-handed conch standing on its tip: spire of whorls, the body,
    // the open lip on the right, a few ridges.
    A.add('mod', X('M0 -50C10 -40 27 -20 28 4C30 26 18 44 0 52C-12 44 -22 30 -24 14C-26 -4 -14 -30 0 -50Z', T), t, 900, p);
    A.add('ac', X('M-5 -44Q0 -48 5 -44M-9 -35Q0 -41 9 -35M-13 -25Q0 -32 13 -25', T), t + 400, 600, p);
    A.add('ac', X('M8 -18C24 -8 24 22 6 42M8 -18C14 0 14 22 6 42', T), t + 600, 700, p);
    A.add('dl3', X('M-20 -2Q-12 4 -21 14M-17 24Q-10 28 -14 36M0 52L1 60', T), t + 900, 500, p);
  }
  function chakra(A, x, y, r, t, p) {
    var w = g(A, '', p), d = circ(x, y, r) + circ(x, y, r * .78) + circ(x, y, r * .2);
    for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; d += 'M' + pt([x + r * .2 * Math.cos(a), y + r * .2 * Math.sin(a)]) + 'L' + pt([x + r * .78 * Math.cos(a), y + r * .78 * Math.sin(a)]); }
    A.add('ac', d, t, 1000, w);
    var fl = '';
    for (var j = 0; j < 24; j++) { var b = j * Math.PI / 12; fl += 'M' + pt([x + r * Math.cos(b - .08), y + r * Math.sin(b - .08)]) + 'L' + pt([x + r * 1.18 * Math.cos(b), y + r * 1.18 * Math.sin(b)]) + 'L' + pt([x + r * Math.cos(b + .08), y + r * Math.sin(b + .08)]); }
    A.add('ac', fl, t + 500, 700, w);
    w.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
    A.loop(w, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 80000, delay: 3000, iterations: Infinity });
    return w;
  }
  function tulsi(A, x, by, s, t) {
    var T = mk(x, by, s);
    A.add('dl3', X('M-34 0L34 0L30 -10L-30 -10ZM-26 -10L-26 -70L26 -70L26 -10M-32 -70L32 -70L28 -80L-28 -80Z', T), t, 1000);
    A.add('ac', X('M-14 -24L-14 -56Q0 -66 14 -56L14 -24Z', T), t + 500, 600);
    A.add('fdot', C(T, 0, -40, 2.4), t + 900, 200, cg(A, 'var(--fest-red)'));
    A.add('dl3', X('M0 -80L0 -150M0 -100L-16 -118M0 -112L14 -132M0 -126L-12 -144', T), t + 700, 700);
    var ld = '';
    [[0, -150, 0], [-16, -118, -40], [14, -132, 40], [-12, -144, -30], [8, -104, 50], [-8, -92, -60], [6, -140, 20]].forEach(function (q) { ld += X('M0 0C5 -4 6 -10 0 -16C-6 -10 -5 -4 0 0Z', mk(T(q[0], q[1])[0], T(q[0], q[1])[1], s * .9, q[2])); });
    A.add('lf', ld, t + 1000, 800);
    A.add('fdot', C(T, 4, -154, 1.6) + C(T, -3, -156, 1.6) + C(T, 0, -160, 1.6), t + 1600, 300, cg(A, 'var(--holi-purple)'));
  }
  F['dev-uthani'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    stars(A, phone ? 8 : 14, phone ? [L + 10, T0 + 10, R - 10, T0 + 180] : [L + 40, T0 + 20, R - 40, T0 + H * .3], 81);
    // Prabodhini, the awakening: first light at the top, rays opening.
    var dy = phone ? T0 + 84 : T0 + Math.max(60, H * .09), dg = g(A, ''), dr = phone ? 18 : 22 * u;
    glow(A, cx, dy, dr * 3, 500, dg, .4, 'var(--lagna)');
    A.add('ff', 'M' + pt([cx - dr, dy]) + 'A' + f(dr) + ' ' + f(dr) + ' 0 0 1 ' + pt([cx + dr, dy]) + 'Z', 700, 900, cg(A, 'var(--lagna)', dg));
    var rays = '';
    for (var k = 0; k <= 8; k++) { var a = Math.PI + k * Math.PI / 8; rays += 'M' + pt([cx + dr * 1.3 * Math.cos(a), dy + dr * 1.3 * Math.sin(a)]) + 'L' + pt([cx + dr * (k % 2 ? 1.7 : 2) * Math.cos(a), dy + dr * (k % 2 ? 1.7 : 2) * Math.sin(a)]); }
    A.add('ac', rays + 'M' + pt([cx - dr * 2.6, dy]) + 'L' + pt([cx + dr * 2.6, dy]), 1000, 800, dg);
    breathe(A, dg, cx, dy, 6000, 3000, 1.05);
    // The sugarcane mandap of Tulsi Vivah: four canes leaning in, tied at
    // the top with a red thread, strings of marigolds hanging inside.
    var s = phone ? .66 : u * 1.25, by = phone ? B - 70 : B - Math.max(22, H * .035), mh = phone ? 150 : Math.min(H * .3, 220 * u), apex = [cx, by - mh];
    var cane = g(A, '');
    [-1, 1].forEach(function (sd) {
      [0].forEach(function (k2) {
        var bx = cx + sd * (phone ? 92 + k2 * 16 : 150 * u), tx = cx - sd * (8 + k2 * 6) * u, ty = apex[1] - k2 * 8 * u;
        A.add('dl3', 'M' + pt([bx - 2.5 * u, by]) + 'L' + pt([tx - 2.5 * u, ty]) + 'M' + pt([bx + 2.5 * u, by]) + 'L' + pt([tx + 2.5 * u, ty]), 900 + k2 * 150, 1400, cane);
        var nd = '';
        for (var q = 1; q < 7; q++) { var tq = q / 7, nx = bx + (tx - bx) * tq, ny = by + (ty - by) * tq; nd += 'M' + pt([nx - 3.5 * u, ny + 1.5 * sd * u]) + 'L' + pt([nx + 3.5 * u, ny - 1.5 * sd * u]); }
        A.add('dl3', nd, 1600, 500, cane);
        var lg = g(A, '', cane);
        A.add('lfo', 'M' + pt([tx, ty]) + 'Q' + pt([tx - sd * 26 * u, ty - 34 * u]) + ' ' + pt([tx - sd * 58 * u, ty - 22 * u]) + 'M' + pt([tx, ty]) + 'Q' + pt([tx - sd * 10 * u, ty - 40 * u]) + ' ' + pt([tx - sd * 20 * u, ty - 58 * u]), 2100 + k2 * 100, 600, lg);
        sway(A, lg, tx, ty, 2.4, 3600 + k2 * 500, 3000);
      });
      var mx = cx + sd * (phone ? 50 : 80 * u), st = g(A, ''), len = mh * .55;
      A.add('dl2', 'M' + pt([mx, apex[1] + mh * .28]) + 'L' + pt([mx, apex[1] + mh * .28 + len]), 1800, 700, st);
      for (var m = 0; m < 6; m++) marigold(A, mx, apex[1] + mh * .3 + m * len / 6, (phone ? 4 : 5.5) * u, m % 2 ? 'var(--fest-saffron)' : 'var(--fest-marigold)', 2000 + m * 60, st);
      sway(A, st, mx, apex[1] + mh * .28, 1.6, 3400 + sd * 300, 3200);
    });
    A.add('fs', circ(apex[0], apex[1] + 2 * u, 7 * u) + 'M' + pt([apex[0] - 2, apex[1] + 9 * u]) + 'Q' + pt([apex[0] - 8 * u, apex[1] + 22 * u]) + ' ' + pt([apex[0] - 4 * u, apex[1] + 30 * u]) + 'M' + pt([apex[0] + 2, apex[1] + 9 * u]) + 'Q' + pt([apex[0] + 8 * u, apex[1] + 22 * u]) + ' ' + pt([apex[0] + 4 * u, apex[1] + 30 * u]), 2300, 500, cg(A, 'var(--fest-red)'));
    tulsi(A, cx, by, s, 1200);
    // Five lamps in an arc before the tulsi.
    for (var l = 0; l < 5; l++) {
      var off = l - 2, lx = cx + off * (phone ? 34 : 50 * u), ly = by + Math.abs(off) * -4 * u;
      if (off === 0) continue;
      litLamp(A, lx, ly, (phone ? .42 : u * .55), 2200 + Math.abs(off) * 150);
    }
    // Vishnu's shankh (left) and chakra (right), each in its own light.
    if (!phone) {
      var xs = sideX(A, u), yy = T0 + H * .5;
      var sg = g(A, '');
      glow(A, xs[0], yy, 70 * u, 1200, sg, .22, 'var(--lagna)');
      shankh(A, mk(xs[0], yy, u * 1.35, -16), 1400, sg);
      var cgp = g(A, '');
      glow(A, xs[1], yy, 70 * u, 1300, cgp, .22, 'var(--lagna)');
      chakra(A, xs[1], yy, 40 * u, 1500, cgp);
    }
  };

  function veena(A, x, by, h, s, t) {
    var g1 = g(A, ''), top = by - h;
    A.add('ac', 'M' + pt([x - 3 * s, by - 40 * s]) + 'L' + pt([x - 3 * s, top + 30 * s]) + 'M' + pt([x + 3 * s, by - 40 * s]) + 'L' + pt([x + 3 * s, top + 30 * s]), t, 1300, g1);
    A.add('mod', circ(x, by - 26 * s, 28 * s), t + 300, 800, g1);
    A.add('ac', circ(x, by - 26 * s, 20 * s), t + 600, 600, g1);
    A.add('mod', circ(x, top + 20 * s, 18 * s), t + 400, 800, g1);
    var fr = '';
    for (var y = by - 70 * s; y > top + 46 * s; y -= 22 * s) fr += 'M' + pt([x - 6 * s, y]) + 'L' + pt([x + 6 * s, y]);
    A.add('dl3', fr, t + 900, 500, g1);
    A.add('dl2', 'M' + pt([x - 1.2 * s, by - 54 * s]) + 'L' + pt([x - 1.2 * s, top + 2 * s]) + 'M' + pt([x + 1.2 * s, by - 54 * s]) + 'L' + pt([x + 1.2 * s, top + 2 * s]), t + 1100, 900, g1);
    A.add('ac', 'M' + pt([x, top + 2 * s]) + 'C' + pt([x + 4 * s, top - 10 * s]) + ' ' + pt([x + 14 * s, top - 12 * s]) + ' ' + pt([x + 12 * s, top - 2 * s]), t + 1300, 400, g1);
  }
  F['vasant-panchami'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(91);
    A.hc.style.setProperty('--fc', 'var(--fest-marigold)');
    A.frame();
    // A mustard field in flower along the bottom.
    var clip = clipFrame(A), fy = phone ? B - 40 : B - 16 * u, n = phone ? 22 : 54;
    for (var i = 0; i < n; i++) {
      var x = L + (i + rn() * .6) * (W / n), h = (phone ? 40 : 60) * u * (.6 + rn() * .7), sg = g(A, '', clip);
      A.add('lfo', 'M' + pt([x, fy + 20]) + 'Q' + pt([x + (rn() - .5) * 10, fy - h / 2]) + ' ' + pt([x + (rn() - .5) * 8, fy - h]), 900 + i * 15, 700, sg);
      var tx = x + (rn() - .5) * 8, ty = fy - h, fd = '';
      for (var k = 0; k < 4; k++) fd += circ(tx + (rn() - .5) * 9 * u, ty - rn() * 8 * u, (1.4 + rn()) * u);
      A.add('fdot', fd, 1500 + i * 15, 400, sg);
      if (i % 3 === 0) sway(A, sg, x, fy + 20, 1.5, 3000 + (i % 7) * 400, 3000 + i * 30);
    }
    // The veena (left) and books with a lotus (right).
    if (!phone) {
      var xs = sideX(A, u);
      var vg = g(A, '');
      veena(A, xs[0], B - Math.max(70, H * .12), H * .58, u * 1.15, 1200);
      var bs = u * 1.2, bx = xs[1], bb = B - Math.max(80, H * .14), BT = mk(bx, bb, bs);
      A.add('mod', X('M-44 0L44 0L44 -12L-44 -12ZM-40 -12L40 -12L40 -24L-40 -24ZM-46 -24L46 -24L46 -36L-46 -36Z', BT), 1300, 900);
      A.add('fs', X('M-40 -6L40 -6M-36 -18L36 -18M-42 -30L42 -30', BT), 1700, 500);
      lotus(A, mk(bx, bb - 38 * bs, bs * .9), 1900);
    }
    // A swan's feather of a sun, soft, at the top.
    var sy = phone ? T0 + 96 : T0 + Math.max(66, H * .1), sgg = g(A, '');
    glow(A, cx, sy, 48 * u, 500, sgg, .45);
    A.add('ff', circ(cx, sy, 15 * u), 700, 900, sgg);
    breathe(A, sgg, cx, sy, 6000, 3000, 1.06);
  };

  F['ram-navami'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // The sun of the Suryavansh, high in the middle.
    var sy = phone ? T0 + 96 : T0 + Math.max(76, H * .12), sr = phone ? 22 : 28 * u, sg = g(A, '');
    glow(A, cx, sy, sr * 2.8, 500, sg, .45, 'var(--lagna)');
    A.add('ff', circ(cx, sy, sr), 700, 900, cg(A, 'var(--lagna)', sg));
    var rays = g(A, '', sg), rd = '';
    for (var i = 0; i < 24; i++) { var a = i * Math.PI / 12, r1 = sr * (i % 2 ? 1.45 : 1.75); rd += 'M' + pt([cx + sr * 1.2 * Math.cos(a), sy + sr * 1.2 * Math.sin(a)]) + 'L' + pt([cx + r1 * Math.cos(a), sy + r1 * Math.sin(a)]); }
    A.add('ac', rd, 1000, 800, rays);
    rays.style.transformOrigin = f(cx) + 'px ' + f(sy) + 'px';
    A.loop(rays, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 120000, delay: 3000, iterations: Infinity });
    // An Ayodhya gateway below the words, saffron flags on its towers.
    var gs = phone ? .55 : Math.min(u, (H * .24) / 170), gy = phone ? B - 30 : B - Math.max(16, H * .02), GT = mk(cx, gy, gs);
    A.add('dl3', X('M-150 0L-150 -110L-120 -110L-120 0M120 0L120 -110L150 -110L150 0M-120 -90L120 -90M-120 -100L120 -100M-80 0L-80 -60Q0 -120 80 -60L80 0M-158 -110L-112 -110L-120 -130L-150 -130ZM112 -110L158 -110L150 -130L120 -130Z', GT), 1000, 1600);
    A.add('dl3', X('M-135 -130L-135 -150M135 -130L135 -150M-40 -100Q0 -150 40 -100', GT), 1600, 700);
    A.add('ac', X('M-60 0L-60 -50Q0 -96 60 -50L60 0', GT), 1900, 900);
    [-135, 135].forEach(function (fx, i) {
      var fg = g(A, ''), p0 = GT(fx, -150);
      A.add('flag', X('M' + fx + ' -150L' + (fx + (i ? -30 : 30)) + ' -143L' + fx + ' -136Z', GT), 2200 + i * 100, 500, fg);
      fg.style.transformOrigin = f(p0[0]) + 'px ' + f(p0[1]) + 'px';
      A.loop(fg, [{ transform: 'skewY(0deg)' }, { transform: 'skewY(' + (i ? 4 : -4) + 'deg)' }, { transform: 'skewY(0deg)' }], { duration: 3400 + i * 500, delay: 3200, iterations: Infinity, easing: 'ease-in-out' });
    });
    // Bow (left) and a quiver of arrows (right).
    if (!phone) {
      var xs = sideX(A, u), bh = H * .46, bx = xs[0], byc = T0 + H * .55, bw = bh * .14;
      A.add('ac2', 'M' + pt([bx - bw * .2, byc - bh / 2]) + 'C' + pt([bx + bw * 1.1, byc - bh * .36]) + ' ' + pt([bx + bw * 1.2, byc - bh * .1]) + ' ' + pt([bx + bw * 1.2, byc]) + 'C' + pt([bx + bw * 1.2, byc + bh * .1]) + ' ' + pt([bx + bw * 1.1, byc + bh * .36]) + ' ' + pt([bx - bw * .2, byc + bh / 2]), 1100, 1200);
      A.add('dl3', 'M' + pt([bx - bw * .2, byc - bh / 2]) + 'L' + pt([bx - bw * .2, byc + bh / 2]), 1500, 600);
      A.add('ac', 'M' + pt([bx + bw * 1.05, byc - 10 * u]) + 'L' + pt([bx + bw * 1.35, byc - 10 * u]) + 'M' + pt([bx + bw * 1.05, byc + 10 * u]) + 'L' + pt([bx + bw * 1.35, byc + 10 * u]), 1800, 300);
      var qx = xs[1], qy = T0 + H * .55, QT = mk(qx, qy, u * 1.2, 12);
      A.add('mod', X('M-16 -60L16 -60L13 70L-13 70Z', QT), 1200, 900);
      A.add('fs', X('M-15 -40L15 -40M-14 40L14 40', QT), 1600, 400, cg(A, 'var(--fest-red)'));
      var ad = '';
      [-8, 0, 8].forEach(function (ax, j) { ad += X('M' + ax + ' -60L' + (ax + j - 1) + ' -100M' + (ax - 5) + ' -92L' + (ax + j - 1) + ' -104L' + (ax + 5) + ' -92M' + (ax - 4) + ' -64L' + ax + ' -74L' + (ax + 4) + ' -64', QT); });
      A.add('ac', ad, 1800, 800);
    }
  };

  F['hanuman-jayanti'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.setProperty('--fc', 'var(--fest-saffron)');
    A.frame();
    // The rising sun he leapt for, small and high.
    var sy = phone ? T0 + 90 : T0 + Math.max(66, H * .1), sg = g(A, '');
    glow(A, cx, sy, 52 * u, 500, sg, .5);
    A.add('ff', circ(cx, sy, 17 * u), 700, 900, sg);
    breathe(A, sg, cx, sy, 6000, 3000, 1.06);
    // The gada, standing in the left column (or below the words on phones).
    var gx = phone ? cx - 90 : sideX(A, u)[0], gb = phone ? B - 60 : B - Math.max(24, H * .04), gh = phone ? 160 : H * .62, gs = phone ? .7 : u * 1.2, GT = mk(gx, gb - gh, gs);
    A.add('dl3', 'M' + pt([gx - 3 * gs, gb]) + 'L' + pt([gx - 3 * gs, gb - gh + 60 * gs]) + 'M' + pt([gx + 3 * gs, gb]) + 'L' + pt([gx + 3 * gs, gb - gh + 60 * gs]), 900, 1300);
    A.add('ff', X('M0 0C22 0 34 18 34 36C34 54 22 64 0 64C-22 64 -34 54 -34 36C-34 18 -22 0 0 0Z', GT), 1300, 1000);
    A.add('fs', X('M-34 30Q0 40 34 30M-30 48Q0 56 30 48M0 0L0 -12M-6 -12L6 -12', GT) + C(GT, 0, -16, 4), 1700, 600);
    A.add('fs', 'M' + pt([gx - 6 * gs, gb - 30 * gs]) + 'L' + pt([gx + 6 * gs, gb - 30 * gs]) + 'M' + pt([gx - 6 * gs, gb - 50 * gs]) + 'L' + pt([gx + 6 * gs, gb - 50 * gs]), 1800, 300);
    // The mountain with the glowing sanjeevani herb, right column.
    var mx = phone ? cx + 90 : sideX(A, u)[1], mb = phone ? B - 60 : B - Math.max(24, H * .04), ms = phone ? .6 : u * 1.25, MT = mk(mx, mb, ms);
    A.add('dl3', X('M-80 0L-44 -70L-30 -56L-6 -110L20 -74L34 -90L80 0ZM-44 -70L-36 -40M-6 -110L-2 -60M34 -90L30 -50', MT), 1100, 1500);
    var hg = g(A, ''), hp = MT(-6, -110);
    glow(A, hp[0], hp[1] - 12 * ms, 34 * ms, 2300, hg, .55, 'var(--fest-leaf)');
    A.add('lfo', X('M-6 -110L-6 -128M-6 -118Q-16 -126 -18 -134M-6 -122Q4 -130 8 -138M-6 -128Q-8 -138 -4 -144', MT), 2400, 600, hg);
    breathe(A, hg, hp[0], hp[1] - 12 * ms, 4000, 3200, 1.12);
    // A saffron flag below the words.
    var fg = g(A, ''), fx = cx, fyb = phone ? B - 60 : B - Math.max(24, H * .04), fh = phone ? 80 : 120 * u;
    A.add('dl3', 'M' + pt([fx, fyb]) + 'L' + pt([fx, fyb - fh]), 1200, 900);
    A.add('flag', 'M' + pt([fx, fyb - fh]) + 'L' + pt([fx + 54 * u, fyb - fh + 16 * u]) + 'L' + pt([fx, fyb - fh + 34 * u]) + 'Z', 1900, 700, fg);
    fg.style.transformOrigin = f(fx) + 'px ' + f(fyb - fh + 17 * u) + 'px';
    A.loop(fg, [{ transform: 'skewY(0deg)' }, { transform: 'skewY(4deg) scaleX(.96)' }, { transform: 'skewY(0deg)' }], { duration: 3600, delay: 3200, iterations: Infinity, easing: 'ease-in-out' });
  };

  F['akshaya-tritiya'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(111);
    A.hc.style.setProperty('--fc', 'var(--lagna)');
    A.frame();
    // A kalash of rice crowned with gold coins, coin stacks either side.
    var s = phone ? .85 : u * 1.2, by = phone ? B - 80 : B - Math.max(22, H * .035), KT = mk(cx, by, s);
    A.add('dl3', X('M-16 -80C-18 -68 -42 -64 -42 -42C-42 -20 -28 -8 -18 -6L18 -6C28 -8 42 -20 42 -42C42 -64 18 -68 16 -80ZM-20 -82Q0 -78 20 -82Q0 -86 -20 -82Z', KT), 1000, 1100);
    A.add('fs', X('M-41 -48Q0 -40 41 -48M-38 -30Q0 -22 38 -30', KT), 1500, 600, cg(A, 'var(--fest-red)'));
    A.add('mod', X('M-22 -82Q-18 -104 0 -108Q18 -104 22 -82Z', KT), 1700, 600);
    var rice = '';
    for (var i = 0; i < 16; i++) rice += C(KT, (rn() - .5) * 34, -86 - rn() * 18, .9);
    A.add('idot', rice, 2000, 400);
    [[-8, -104, 0], [6, -100, 0], [0, -112, 0]].forEach(function (c, j) { A.add('ff', X('M-7 0Q0 -4 7 0Q0 4 -7 0Z', mk(KT(c[0], c[1])[0], KT(c[0], c[1])[1], s * 1.2, -10 + j * 10)), 2200 + j * 100, 400); });
    [-1, 1].forEach(function (sd) {
      for (var k = 0; k < (sd < 0 ? 5 : 4); k++) {
        var x = cx + sd * 90 * s, y = by - k * 7 * s;
        A.add('ff', ell(x, y - 3 * s, 16 * s, 4.5 * s), 1800 + k * 90, 300);
      }
    });
    // Glints rising, slow, and soft sparkles.
    var nS = phone ? 10 : 20;
    for (var q = 0; q < nS; q++) {
      var sx = phone ? L + 20 + rn() * (W - 40) : (q % 2 ? L + 40 + rn() * W * .22 : R - 40 - rn() * W * .22), sy2 = T0 + H * (phone ? .05 + rn() * .2 : .15 + rn() * .6);
      var sp = g(A, '');
      A.add('fs2', sparkle(sx, sy2, (3 + rn() * 4) * u), 1600 + q * 60, 400, sp);
      A.loop(sp, [{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }], { duration: 2400 + rn() * 2400, delay: 3000 + rn() * 3000, iterations: Infinity, easing: 'ease-in-out' });
    }
    // Barley stalks (yava) in the lower side columns.
    if (!phone) sideX(A, u).forEach(function (x, i) {
      var d = '', yb = B - Math.max(24, H * .04), top = T0 + H * .5;
      [-14, 0, 14].forEach(function (o, j) {
        var tx = x + o * u + (j - 1) * 8 * u, ty = top + Math.abs(o) * 2 * u;
        d += 'M' + pt([x + o * .3 * u, yb]) + 'Q' + pt([x + o * u, (yb + ty) / 2]) + ' ' + pt([tx, ty]);
        for (var g2 = 0; g2 < 6; g2++) { var gy = ty + g2 * 9 * u; d += X('M0 0C4 -3 5 -8 2 -12C-1 -8 -2 -3 0 0ZM0 0C-4 -3 -5 -8 -2 -12C1 -8 2 -3 0 0Z', mk(tx, gy, u, 0)); }
      });
      A.add('fs', d, 1300 + i * 150, 1500, cg(A, 'var(--fest-marigold)'));
    });
  };

  F['rath-yatra'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.removeProperty('--fc');
    A.frame();
    // The chariot below the words: a tiered canopy, a flag, wheels.
    var s = phone ? .55 : Math.min(u * 1.05, (H * .26) / 190), by = phone ? B - 40 : B - Math.max(18, H * .025), CT = mk(cx, by, s);
    A.add('dl3', X('M-110 -40L110 -40L110 -60L-110 -60ZM-96 -60L-96 -110L96 -110L96 -60M-60 -60L-60 -110M60 -60L60 -110M0 -60L0 -110', CT), 1000, 1500);
    A.add('ff', X('M-104 -110L104 -110L80 -136L-80 -136ZM-80 -136L80 -136L58 -160L-58 -160ZM-58 -160L58 -160L30 -184L-30 -184Z', CT), 1500, 1100, cg(A, 'var(--fest-red)'));
    A.add('fs', X('M-104 -110L104 -110L80 -136L-80 -136ZM-58 -160L58 -160L30 -184L-30 -184Z', CT), 1700, 800, cg(A, 'var(--fest-marigold)'));
    A.add('dl3', X('M0 -184L0 -214M-4 -186C-4 -194 4 -194 4 -186', CT), 2000, 500);
    var fg = g(A, ''), fp = CT(0, -214);
    A.add('flag', X('M0 -214L34 -207L0 -200Z', CT), 2300, 500, fg);
    fg.style.transformOrigin = f(fp[0]) + 'px ' + f(fp[1]) + 'px';
    A.loop(fg, [{ transform: 'skewY(0deg)' }, { transform: 'skewY(5deg) scaleX(.95)' }, { transform: 'skewY(0deg)' }], { duration: 3000, delay: 3200, iterations: Infinity, easing: 'ease-in-out' });
    [-80, -27, 27, 80].forEach(function (wx, i) {
      var c = CT(wx, -20), r = 20 * s, wg = g(A, ''), d = circ(c[0], c[1], r) + circ(c[0], c[1], r * .25);
      for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; d += 'M' + pt([c[0] + r * .25 * Math.cos(a), c[1] + r * .25 * Math.sin(a)]) + 'L' + pt([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
      A.add('ac', d, 1300 + i * 100, 900, wg);
    });
    // A great wheel turning slowly in each side column, and the ropes.
    if (!phone) sideX(A, u).forEach(function (x, i) {
      var y = T0 + H * .5, r = Math.min(70 * u, H * .11), wg = g(A, ''), d = circ(x, y, r) + circ(x, y, r * .86) + circ(x, y, r * .2);
      for (var k = 0; k < 16; k++) { var a = k * Math.PI / 8; d += 'M' + pt([x + r * .2 * Math.cos(a), y + r * .2 * Math.sin(a)]) + 'L' + pt([x + r * .86 * Math.cos(a), y + r * .86 * Math.sin(a)]); }
      A.add('ac', d, 1100 + i * 150, 1400, wg);
      var dots = '';
      for (var m = 0; m < 16; m++) { var b = (m + .5) * Math.PI / 8; dots += circ(x + r * .93 * Math.cos(b), y + r * .93 * Math.sin(b), 1.6 * u); }
      A.add('fdot', dots, 2000, 400, cg(A, 'var(--fest-red)', wg));
      wg.style.transformOrigin = f(x) + 'px ' + f(y) + 'px';
      A.loop(wg, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (i ? -360 : 360) + 'deg)' }], { duration: 60000, delay: 3000, iterations: Infinity });
      var c0 = CT(i ? 110 : -110, -50);
      A.add('dl2', 'M' + pt(c0) + 'Q' + pt([(c0[0] + x) / 2, c0[1] + 30 * u]) + ' ' + pt([x + (i ? -1 : 1) * 20 * u, B - 8]), 1800, 1200);
    });
  };

  F.teej = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone, rn = rnd(121);
    A.hc.style.setProperty('--fc', 'var(--fest-leaf)');
    A.frame();
    // Monsoon clouds along the top, a slow drizzle.
    var cl = g(A, '');
    (phone ? [[.18, .08, .7], [.75, .1, .8]] : [[.12, .08, 1], [.3, .05, .7], [.7, .06, .8], [.88, .09, 1]]).forEach(function (c, i) {
      var x = L + c[0] * W, y = T0 + c[1] * H + 20, s = c[2] * u * (phone ? .8 : 1.1), CT = mk(x, y, s);
      A.add('dl3', X('M-50 10Q-56 -6 -38 -8Q-34 -26 -14 -22Q-2 -38 18 -26Q38 -30 40 -10Q56 -8 50 10Z', CT), 800 + i * 150, 1100, cl);
    });
    cl.style.transformOrigin = 'center';
    A.loop(cl, [{ transform: 'translateX(0)' }, { transform: 'translateX(10px)' }], { duration: 9000, delay: 3000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    var nD = phone ? 12 : 26;
    for (var d = 0; d < nD; d++) {
      var dx = phone ? L + 20 + rn() * (W - 40) : (d % 2 ? L + 30 + rn() * W * .26 : R - 30 - rn() * W * .26), dy = T0 + H * (phone ? .12 : .16) + rn() * 40;
      var dr = A.el('path', { 'class': 'fs2', d: 'M' + pt([dx, dy]) + 'L' + pt([dx - 2, dy + 8 * u]), style: '--fc:var(--fest-sky)' });
      if (A.reduce) continue;
      A.loop(dr, [{ transform: 'translate(0,0)', opacity: 0 }, { opacity: .8, offset: .2 }, { transform: 'translate(-8px,' + f(H * .3) + 'px)', opacity: 0 }], { duration: 3000 + rn() * 2500, delay: 2600 + rn() * 4000, iterations: Infinity, fill: 'backwards', easing: 'ease-in' });
    }
    // A flower-twined swing hanging from a branch, left column, gently swinging.
    var sx = phone ? L + 60 : sideX(A, u)[0], top = T0 + 4, seatY = phone ? T0 + H * .26 : T0 + H * .62, sw = (phone ? 28 : 46) * u, swg = g(A, '');
    A.add('dl3', 'M' + pt([sx - sw, top]) + 'L' + pt([sx - sw, seatY]) + 'M' + pt([sx + sw, top]) + 'L' + pt([sx + sw, seatY]), 1000, 1300, swg);
    A.add('mod', 'M' + pt([sx - sw - 8 * u, seatY]) + 'L' + pt([sx + sw + 8 * u, seatY]) + 'L' + pt([sx + sw + 8 * u, seatY + 8 * u]) + 'L' + pt([sx - sw - 8 * u, seatY + 8 * u]) + 'Z', 1600, 600, swg);
    for (var f2 = 0; f2 < 7; f2++) { var fy = top + 30 + f2 * (seatY - top - 40) / 7; marigold(A, sx - sw, fy, 4 * u, 'var(--holi-pink)', 1800 + f2 * 60, swg); marigold(A, sx + sw, fy + 10, 4 * u, 'var(--fest-marigold)', 1830 + f2 * 60, swg); }
    sway(A, swg, sx, top, 2.2, 3200, 3000);
    // Green bangles and a mehndi motif below the words; a peacock feather right.
    var bs = phone ? .7 : u * 1.15, by = phone ? B - 90 : B - Math.max(40, H * .07);
    for (var b = 0; b < 6; b++) A.add(b % 3 === 1 ? 'ac' : 'fs', ell(cx - 40 * bs + b * 6 * bs, by - b * 2 * bs, 30 * bs, 10 * bs), 1500 + b * 120, 600);
    for (var b2 = 0; b2 < 5; b2++) A.add(b2 % 2 ? 'ac' : 'fs', ell(cx + 46 * bs + b2 * 5 * bs, by - b2 * 2 * bs, 26 * bs, 9 * bs), 1700 + b2 * 120, 600);
    if (!phone) feather(A, [sideX(A, u)[1] + 40 * u, B - 20 * u], Math.min(H * .6, 380 * u), -14, 1300);
  };

  F['nag-panchami'] = function (A) {
    var u = unit(A), L = A.L, T0 = A.T, R = A.R, B = A.B, W = A.W, H = A.H, cx = (L + R) / 2, phone = A.phone;
    A.hc.style.setProperty('--fc', 'var(--fest-leaf)');
    A.frame();
    // A calm serpent coiled beside a bowl of milk, its hood raised.
    var s = phone ? .7 : u * 1.45, by = phone ? B - 70 : B - Math.max(24, H * .04), ST = mk(cx + 40 * s, by, s);
    A.add('fs', X('M-60 -6C-60 -26 60 -26 60 -6C60 14 -60 14 -60 -6ZM-44 -12C-44 -28 44 -28 44 -12C44 2 -44 2 -44 -12ZM-28 -18C-28 -30 28 -30 28 -18C28 -8 -28 -8 -28 -18Z', ST), 1000, 1800);
    A.add('fs', X('M60 -6C70 4 78 10 92 8M-24 -20C-22 -44 -12 -66 -8 -84M-14 -18C-12 -42 -2 -64 2 -84', ST), 1800, 900);
    A.add('ff', X('M-3 -82C-22 -86 -30 -104 -24 -118C-18 -130 -8 -136 -3 -136C2 -136 12 -130 18 -118C24 -104 16 -86 -3 -82Z', ST), 2400, 700);
    A.add('fs2', X('M-10 -112C-10 -118 -4 -118 -3 -112C-2 -118 4 -118 4 -112C4 -106 -2 -106 -3 -110C-4 -106 -10 -106 -10 -112ZM-3 -136C-6 -142 -4 -148 -3 -150C-2 -148 0 -142 -3 -136', ST), 2800, 500);
    var dots = '';
    for (var i = 0; i < 18; i++) { var a = i * Math.PI / 9; dots += C(ST, 44 * Math.cos(a), -12 + 16 * Math.sin(a), 1.2); }
    A.add('fdot', dots, 2600, 400);
    var bw = mk(cx - 90 * s, by, s);
    A.add('dl3', X('M-30 -16Q0 -10 30 -16Q28 2 0 4Q-28 2 -30 -16ZM-30 -16Q0 -22 30 -16', bw), 1400, 900);
    A.add('mod', X('M-26 -16Q0 -12 26 -16Q0 -20 -26 -16Z', bw), 1800, 500);
    A.add('fdot', C(bw, -40, 2, 2) + C(bw, 40, 2, 2), 2200, 200, cg(A, 'var(--fest-red)'));
    // Serpent rangoli lines in the side columns, flowers at their heads.
    if (!phone) sideX(A, u).forEach(function (x, i) {
      var d = 'M' + pt([x, B - 40 * u]);
      for (var k = 0; k < 6; k++) { var y0 = B - 40 * u - k * H * .08; d += 'Q' + pt([x + (k % 2 ? 26 : -26) * u, y0 - H * .04]) + ' ' + pt([x, y0 - H * .08]); }
      A.add('fs', d, 1200 + i * 150, 1800);
      lotus(A, mk(x, B - 40 * u - H * .48 - 6 * u, u * .9), 2400 + i * 150);
    });
  };
})();
