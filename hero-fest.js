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
  function glow(A, x, y, r, t, parent, op) {
    var id = 'hcf-g' + (++gid);
    var defs = A.svg.querySelector('defs') || A.el('defs', {}, A.svg);
    var rg = A.el('radialGradient', { id: id }, defs);
    A.el('stop', { offset: '0', style: 'stop-color:var(--fc,var(--lagna));stop-opacity:calc(var(--gk,1) * ' + (op || .32) + ')' }, rg);
    A.el('stop', { offset: '.55', style: 'stop-color:var(--fc,var(--lagna));stop-opacity:calc(var(--gk,1) * ' + ((op || .32) * .35).toFixed(3) + ')' }, rg);
    A.el('stop', { offset: '1', style: 'stop-color:var(--fc,var(--lagna));stop-opacity:0' }, rg);
    return A.el('circle', { cx: f(x), cy: f(y), r: f(r), fill: 'url(#' + id + ')', 'data-t': t + ',1400' }, parent);
  }
  // A disc in the page colour, so things passing behind are hidden.
  function veil(A, x, y, rx, ry, parent) {
    return A.el('ellipse', { cx: f(x), cy: f(y), rx: f(rx), ry: f(ry || rx), style: 'fill:var(--bg);stroke:none' }, parent);
  }

  /* ---------- Shared motifs ---------- */
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
    '2026-10-11': ['orange', 'white', 'red', 'royal-blue', 'yellow', 'green', 'grey', 'purple', 'peacock-green']
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
    var cy0 = H * .47, rx = Math.min(W * .43, W / 2 - 60), ry = H * .33;
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
          var a = (a0 + fr) * Math.PI * 2, sn = Math.sin(a), sc = (.72 + .3 * (sn + 1) / 2) * u;
          return { transform: 'translate(' + f(cx + rx * Math.cos(a)) + 'px,' + f(cy0 + ry * sn) + 'px) scale(' + sc.toFixed(3) + ')', opacity: (.5 + .5 * (sn + 1) / 2).toFixed(2) };
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
    var ks = phone ? s * 1.05 : s * 1.3;
    kalash(A, cx, by - 20 * s, ks, 1400);
    for (var n = 0; n < 9; n++) {
      var st = n + 1 < day ? 'past' : n + 1 === day ? 'lit' : 'unlit';
      // The fifth lamp burns at the kalash's foot.
      var lx = cx + (n - 4) * gap, ly = by;
      if (n === 4) { ly = by + 4 * s; veil(A, lx, ly - 8 * s, 34 * s, 12 * s); }
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
    // The bow: a recurve limb drawn double, a grip, a straight string.
    var bh = phone ? Math.min(130, H * .17) : Math.min(320 * u, H * .52);
    var bx = phone ? L + 40 : L + Math.max(110, 150 * u), byc = phone ? T0 + 24 + bh / 2 : T0 + H * .55;
    var bw = bh * .13;
    var top = [bx + bw * .25, byc - bh / 2], bot = [bx + bw * .25, byc + bh / 2];
    function limb(o) {
      return 'M' + pt([top[0] + o, top[1]]) + 'C' + pt([bx - bw * 1.1 + o, byc - bh * .36]) + ' ' + pt([bx - bw * 1.2 + o, byc - bh * .1]) + ' ' + pt([bx - bw * 1.2 + o, byc]) +
        'C' + pt([bx - bw * 1.2 + o, byc + bh * .1]) + ' ' + pt([bx - bw * 1.1 + o, byc + bh * .36]) + ' ' + pt([bot[0] + o, bot[1]]);
    }
    A.add('ac2', limb(0), 700, 1100);
    A.add('dl3', limb(-4 * u), 800, 1100);
    A.add('ac', 'M' + pt(top) + 'Q' + pt([top[0] + bw * .5, top[1] - bw * .5]) + ' ' + pt([top[0] + bw * .65, top[1] - bw * .1]) +
      'M' + pt(bot) + 'Q' + pt([bot[0] + bw * .5, bot[1] + bw * .5]) + ' ' + pt([bot[0] + bw * .65, bot[1] + bw * .1]), 1500, 400);
    A.add('ac', 'M' + pt([bx - bw * 1.25, byc - 9 * u]) + 'L' + pt([bx - bw * .95, byc - 9 * u]) + 'M' + pt([bx - bw * 1.25, byc + 9 * u]) + 'L' + pt([bx - bw * .95, byc + 9 * u]), 1500, 300);
    A.add('dl3', 'M' + pt(top) + 'L' + pt(bot), 1300, 600);

    // The flight: from the string to the burst, top right.
    var p0 = [top[0], byc], p2 = phone ? [R - 48, T0 + 96] : [R - Math.max(150, 190 * u), T0 + Math.max(70, H * .12)];
    var p1 = phone ? [cx - 20, T0 - 10] : [cx - 120 * u, T0 - H * .08];
    var trail = 'M' + pt(p0) + 'Q' + pt(p1) + ' ' + pt(p2);
    var id = 'hcf-trail';
    var defs = A.svg.querySelector('defs') || A.el('defs', {});
    var lg = A.el('linearGradient', { id: id, gradientUnits: 'userSpaceOnUse', x1: f(p0[0]), y1: f(p0[1]), x2: f(p2[0]), y2: f(p2[1]) }, defs);
    A.el('stop', { offset: '0', style: 'stop-color:var(--lagna);stop-opacity:0' }, lg);
    A.el('stop', { offset: '.7', style: 'stop-color:var(--lagna);stop-opacity:.45' }, lg);
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
    // The arrow, travelling the trail by arc length, then at rest at the burst.
    var pts = [], lens = [0], tot = 0;
    for (var k = 0; k <= 80; k++) {
      var tt = k / 80, mt = 1 - tt;
      pts.push([mt * mt * p0[0] + 2 * mt * tt * p1[0] + tt * tt * p2[0], mt * mt * p0[1] + 2 * mt * tt * p1[1] + tt * tt * p2[1]]);
      if (k) { tot += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); lens.push(tot); }
    }
    function along(fr) {
      var want = fr * tot, k = 1;
      while (k < 80 && lens[k] < want) k++;
      var a = pts[k - 1], b = pts[k];
      return 'translate(' + f(b[0]) + 'px,' + f(b[1]) + 'px) rotate(' + (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI).toFixed(1) + 'deg)';
    }
    var ar = g(A, ''), AT = mk(0, 0, u);
    A.el('path', { 'class': 'ac2', d: X('M-56 0L-2 0', AT) }, ar);
    A.el('path', { 'class': 'ff', style: '--fc:var(--lagna)', d: X('M2 0L-11 -5L-8 0L-11 5Z', AT) }, ar);
    A.el('path', { 'class': 'ac', d: X('M-50 0L-58 -6M-44 0L-52 -6M-50 0L-58 6M-44 0L-52 6', AT) }, ar);
    var end = along(1);
    ar.style.transform = end;
    if (!A.reduce && ar.animate) {
      var kf = [];
      for (var j = 0; j <= 40; j++) {
        var e = j / 40, ez = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
        kf.push({ transform: along(ez), opacity: j === 0 ? 0 : 1 });
      }
      A.loop(ar, kf, { duration: 1700, delay: 2000, fill: 'backwards' });
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
    // The victory flag in the right column, fluttering towards the words.
    if (!phone) {
      var fx = R - Math.max(110, 150 * u), fh = Math.min(300 * u, H * .5), fb2 = B - Math.max(20, H * .03), FT = mk(fx, fb2, 1);
      A.add('dl3', 'M' + pt([fx - 6 * u, fb2]) + 'L' + pt([fx + 6 * u, fb2]) + 'M' + pt([fx, fb2]) + 'L' + pt([fx, fb2 - fh]), 900, 1200);
      A.add('ac', C(FT, 0, -fh - 5 * u, 4 * u) + 'M' + pt([fx, fb2 - fh - 9 * u]) + 'L' + pt([fx, fb2 - fh - 18 * u]), 1900, 400);
      var flag = g(A, ''), fw = 96 * u, fy = fb2 - fh;
      A.add('flag', 'M' + pt([fx, fy]) + 'Q' + pt([fx - fw * .5, fy + 8 * u]) + ' ' + pt([fx - fw, fy + 22 * u]) + 'L' + pt([fx - fw * .42, fy + 31 * u]) +
        'Q' + pt([fx - fw * .7, fy + 44 * u]) + ' ' + pt([fx - fw * .9, fy + 60 * u]) + 'Q' + pt([fx - fw * .45, fy + 60 * u]) + ' ' + pt([fx, fy + 64 * u]) + 'Z', 2100, 900, flag);
      flag.style.transformOrigin = f(fx) + 'px ' + f(fy + 32 * u) + 'px';
      A.loop(flag, [{ transform: 'skewY(0deg) scaleX(1)' }, { transform: 'skewY(-2.5deg) scaleX(.97)' }, { transform: 'skewY(1.5deg) scaleX(1)' }, { transform: 'skewY(0deg) scaleX(1)' }], { duration: 4200, iterations: Infinity, delay: 3400, easing: 'ease-in-out' });
      A.add('dl2', 'M' + pt([fx - 40 * u, fb2]) + 'Q' + pt([fx, fb2 - 6 * u]) + ' ' + pt([fx + 40 * u, fb2]), 1000, 600);
    }
    // Apta leaves, the gold of Dussehra, either side of the lamp.
    var ax = phone ? 70 : 110 * u;
    [-1, 1].forEach(function (sd) {
      apta(A, mk(lx + sd * ax, lb - 2, ls * 1.2, sd * 28), 2200, null);
      apta(A, mk(lx + sd * (ax + 34 * ls), lb - 2, ls, sd * 52), 2350, null);
    });
  };
})();
