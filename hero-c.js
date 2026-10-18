/* Hero C, "The page is a kundali", the default hero (see index.html).
   Draws the North Indian chart at the stage's pixel size so every hairline is
   crisp and the geometry is exact: outer square, both full diagonals, and the
   inner diamond through the side midpoints, making twelve houses. The chart
   draws itself once (stroke-dashoffset), then the words arrive (CSS). Hover,
   focus or tap a house for one line of what it does. Nothing loops; the
   entrance waits until the hero is on screen in a visible tab. */
(function () {
  'use strict';
  var root = document.documentElement;
  var hc = document.getElementById('hero-c');
  if (!hc || root.classList.contains('hero-a-on') || root.classList.contains('hero-b-on')) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = hc.querySelector('[data-hc-stage]');
  var svg = hc.querySelector('[data-hc-lines]');
  var cap = hc.querySelector('[data-hc-cap]');
  var labels = {};
  Array.prototype.forEach.call(hc.querySelectorAll('.hc-h'), function (b) { labels[b.getAttribute('data-h')] = b; });

  /* What each house holds. The bhava's own meaning comes first, then one
     truthful line about the feature that lives there. */
  var H = {
    1:  ['Self', 'तनु', 'Your birth chart from exact time and place, with dashas and yogas explained.', 'सटीक जन्म समय और स्थान से आपकी कुंडली, दशा और योग समझाए हुए।'],
    2:  ['Face', 'मुख', 'One photo of your face, read in plain words.', 'चेहरे की एक फ़ोटो, सरल शब्दों में पढ़ी हुई।'],
    3:  ['Hands', 'हाथ', 'Photograph your palm and it reads the major lines.', 'हथेली की फ़ोटो लें, यह मुख्य रेखाएं पढ़ती है।'],
    4:  ['Home', 'सुख', 'Today’s tithi, nakshatra and muhurat for your city.', 'आपके शहर के लिए आज की तिथि, नक्षत्र और मुहूर्त।'],
    5:  ['Intellect', 'बुद्धि', 'Ask AshvaAI anything about your chart. Every answer shows its working.', 'अपनी कुंडली के बारे में AshvaAI से कुछ भी पूछें। हर जवाब अपना हिसाब दिखाता है।'],
    6:  ['Daily life', 'दिनचर्या', 'Chaldean name numbers and your Lo Shu grid, with the full working.', 'कैल्डियन नामांक और आपका लो शू ग्रिड, पूरे हिसाब के साथ।'],
    7:  ['Marriage', 'विवाह', 'Ashtakoota matching out of 36 gunas, every koota and dosha explained.', '36 गुणों का अष्टकूट मिलान, हर कूट और दोष समझाया हुआ।'],
    8:  ['Hidden', 'गूढ़', 'Lal Kitab readings and simple remedies from your own chart.', 'आपकी अपनी कुंडली से लाल किताब फल और सरल उपाय।'],
    9:  ['Fortune', 'भाग्य', 'Daily, weekly and monthly horoscope for your sign.', 'आपकी राशि का दैनिक, साप्ताहिक और मासिक राशिफल।'],
    10: ['Karma', 'कर्म', 'Kundali, matching and numerology reports as PDFs to keep and share.', 'कुंडली, मिलान और अंक ज्योतिष रिपोर्ट, PDF में रखने और भेजने के लिए।'],
    11: ['Gains', 'लाभ', 'Rank several kundalis against yours in one go.', 'कई कुंडलियों को एक साथ अपनी कुंडली से मिलाकर क्रम में देखें।'],
    12: ['Moksha', 'मोक्ष', 'Pooja booking and astrologer calls, in preparation.', 'पूजा बुकिंग और ज्योतिषी से कॉल, तैयारी में।']
  };
  function hi() { return root.getAttribute('data-lang') === 'hi'; }
  function setHint() { cap.setAttribute('data-hint', hi() ? 'किसी भाव को छुएं' : 'Tap a house'); }
  setHint();

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- The canvas ----------
     The drawing behind the words is one of a few canvases, chosen by
     html[data-canvas] (index.html sets it before first paint). Each one is
     drawn at the stage's pixel size into the same rectangle, so a swap never
     moves the words. */
  var drawn = reduce, want = false, hits = {};
  var narrow = window.matchMedia ? matchMedia('(max-width: 768px)') : { matches: false };
  function canvasId() {
    var c = root.getAttribute('data-canvas');
    return (window.AA_CANVASES || []).indexOf(c) >= 0 ? c : 'kundali-north';
  }
  function pts(a) { return a.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '); }
  function P(d) { return 'M' + d.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('L'); }
  function f2(n) { return n.toFixed(2); }

  // North Indian: outer square, both full diagonals and the inner diamond
  // through the side midpoints make twelve houses, Lagna at the top.
  function north(q, g, lines) {
    var house = {
      1: [q.tm, q.ur, q.c, q.ul], 2: [q.tl, q.tm, q.ul], 3: [q.tl, q.ul, q.lm], 4: [q.lm, q.ul, q.c, q.ll],
      5: [q.lm, q.ll, q.bl], 6: [q.bl, q.ll, q.bm], 7: [q.bm, q.ll, q.c, q.lr], 8: [q.bm, q.lr, q.br],
      9: [q.br, q.lr, q.rm], 10: [q.rm, q.lr, q.c, q.ur], 11: [q.rm, q.ur, q.tr], 12: [q.tr, q.ur, q.tm]
    };
    for (var h = 1; h <= 12; h++) hits[h] = el('polygon', { 'class': 'hit', 'data-h': h, points: pts(house[h]) }, g);
    // [class, path, "delay,duration" ms]: the frame from the Lagna point
    // both ways, the diagonals, the diamond.
    lines.push(['hl', P([q.tm, q.tr, q.br, q.bm]), '550,1800'], ['hl', P([q.tm, q.tl, q.bl, q.bm]), '550,1800'],
      ['hl', P([q.tl, q.br]), '700,1700'], ['hl', P([q.tr, q.bl]), '700,1700'],
      ['hl', P([q.tm, q.rm, q.bm]), '850,1600'], ['hl', P([q.tm, q.lm, q.bm]), '850,1600'],
      ['lagna', P([q.ul, q.tm, q.ur]), '2200,1000']);
  }

  // South Indian: a four by four grid with the middle four cells open. The
  // signs are fixed (Pisces top left, then clockwise); Lagna sits in Aries,
  // so house 1 is the second cell of the top row and the houses run clockwise.
  var SOUTH = { 1: [1, 0], 2: [2, 0], 3: [3, 0], 4: [3, 1], 5: [3, 2], 6: [3, 3], 7: [2, 3], 8: [1, 3], 9: [0, 3], 10: [0, 2], 11: [0, 1], 12: [0, 0] };
  function south(q, g, lines) {
    var L = q.tl[0], T = q.tl[1], R = q.br[0], B = q.br[1], cw = (R - L) / 4, ch = (B - T) / 4;
    function X(i) { return L + cw * i; }
    function Y(j) { return T + ch * j; }
    for (var h = 1; h <= 12; h++) {
      var c = SOUTH[h];
      hits[h] = el('polygon', { 'class': 'hit', 'data-h': h, points: pts([[X(c[0]), Y(c[1])], [X(c[0] + 1), Y(c[1])], [X(c[0] + 1), Y(c[1] + 1)], [X(c[0]), Y(c[1] + 1)]]) }, g);
    }
    lines.push(['hl', P([q.tm, q.tr, q.br, q.bm]), '550,1800'], ['hl', P([q.tm, q.tl, q.bl, q.bm]), '550,1800'],
      ['hl', P([[X(1), T], [X(1), B]]), '700,1600'], ['hl', P([[X(3), T], [X(3), B]]), '700,1600'],
      ['hl', P([[L, Y(1)], [R, Y(1)]]), '760,1600'], ['hl', P([[L, Y(3)], [R, Y(3)]]), '760,1600'],
      ['hl', P([[X(2), T], [X(2), Y(1)]]), '1000,900'], ['hl', P([[X(2), Y(3)], [X(2), B]]), '1000,900'],
      ['hl', P([[L, Y(2)], [X(1), Y(2)]]), '1000,900'], ['hl', P([[X(3), Y(2)], [R, Y(2)]]), '1000,900'],
      // Lagna: the house 1 cell in the accent, with the customary slash
      // across its corner.
      ['lagna', P([[X(1), Y(1)], [X(1), T], [X(2), T], [X(2), Y(1)], [X(1), Y(1)]]), '2200,1000'],
      ['lagna', P([[X(1), T + ch * .34], [X(1) + ch * .34, T]]), '2900,400']);
  }

  // Diya (Diwali): the same frame, a toran of mango leaves and marigolds
  // hanging from the top, a quarter rangoli in each corner and a row of
  // diyas along the bottom, lit one by one from the middle. On phones only
  // the toran and the lamps, behind the words.
  function diya(q, lines, W, H, phone) {
    var L = q.tl[0], T = q.tl[1], R = q.br[0], B = q.br[1];
    if (!phone) lines.push(['hl', P([q.tm, q.tr, q.br, q.bm]), '550,1800'], ['hl', P([q.tm, q.tl, q.bl, q.bm]), '550,1800']);
    // Toran: swags of a cord with a leaf at every knot and a marigold at the
    // bottom of every swag.
    // On desktop the toran starts and ends clear of the corner rangoli.
    var rr = Math.min(W, H) * .11, tl = phone ? L : L + rr * 1.3, tr = phone ? R : R - rr * 1.3;
    var n = Math.max(4, Math.round((tr - tl) / (phone ? 70 : 132)));
    var sw = (tr - tl) / n, sag = Math.min(phone ? 14 : 24, H * .035), leaf = Math.min(phone ? 18 : 28, H * .04);
    var ty = phone ? T + 8 : T, d = 'M' + f2(tl) + ' ' + f2(ty);
    for (var i = 0; i < n; i++) {
      var x0 = tl + sw * i, x1 = x0 + sw;
      d += 'Q' + f2(x0 + sw / 2) + ' ' + f2(ty + sag * 2) + ' ' + f2(x1) + ' ' + f2(ty);
    }
    lines.push(['dl', d, '900,1500']);
    for (var k = 1; k < n; k++) {
      var lx = tl + sw * k, ly = ty, w = leaf * .32, t = (900 + k * 60) + ',700';
      lines.push(['dl', 'M' + f2(lx) + ' ' + f2(ly) + 'C' + f2(lx + w) + ' ' + f2(ly + leaf * .3) + ' ' + f2(lx + w * .7) + ' ' + f2(ly + leaf * .8) + ' ' + f2(lx) + ' ' + f2(ly + leaf) +
        'C' + f2(lx - w * .7) + ' ' + f2(ly + leaf * .8) + ' ' + f2(lx - w) + ' ' + f2(ly + leaf * .3) + ' ' + f2(lx) + ' ' + f2(ly) + 'M' + f2(lx) + ' ' + f2(ly + leaf * .15) + 'L' + f2(lx) + ' ' + f2(ly + leaf * .8), t]);
    }
    for (var m = 0; m < n; m++) {
      var mx = tl + sw * (m + .5), my = ty + sag + (phone ? 4 : 6), r = phone ? 3.5 : 5;
      lines.push(['ac', 'M' + f2(mx - r) + ' ' + f2(my) + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0', (1500 + m * 60) + ',600']);
      lines.push(['dl', 'M' + f2(mx - r * 1.9) + ' ' + f2(my) + 'a' + (r * 1.9) + ' ' + (r * 1.9) + ' 0 1 0 ' + f2(r * 3.8) + ' 0a' + (r * 1.9) + ' ' + (r * 1.9) + ' 0 1 0 ' + f2(-r * 3.8) + ' 0', (1500 + m * 60) + ',700']);
    }
    // Corner rangoli: three quarter rings, lotus petals between the inner
    // two, dots round the outside.
    if (!phone) {
      [[L, B, -1], [R, B, -1], [L, T, 1], [R, T, 1]].forEach(function (c, ci) {
        var cx = c[0], cy = c[1], sx = cx === L ? 1 : -1, sy = cy === T ? 1 : -1, t0 = 1200 + ci * 120;
        function pt(rad, a) { return [cx + sx * rad * Math.cos(a), cy + sy * rad * Math.sin(a)]; }
        function arc(rad) { var a = pt(rad, 0), b = pt(rad, Math.PI / 2); return 'M' + f2(a[0]) + ' ' + f2(a[1]) + 'A' + f2(rad) + ' ' + f2(rad) + ' 0 0 ' + (sx * sy > 0 ? 1 : 0) + ' ' + f2(b[0]) + ' ' + f2(b[1]); }
        lines.push(['dl', arc(rr * .42), t0 + ',800'], ['dl', arc(rr * .62), t0 + ',800'], ['dl', arc(rr), (t0 + 100) + ',900']);
        for (var j = 0; j < 5; j++) {
          var a = (j + .5) * Math.PI / 10, a0 = pt(rr * .62, a), a1 = pt(rr, a), sp = .13;
          var c1 = pt(rr * .81, a - sp), c2 = pt(rr * .81, a + sp);
          lines.push(['ac', 'M' + f2(a0[0]) + ' ' + f2(a0[1]) + 'Q' + f2(c1[0]) + ' ' + f2(c1[1]) + ' ' + f2(a1[0]) + ' ' + f2(a1[1]) + 'Q' + f2(c2[0]) + ' ' + f2(c2[1]) + ' ' + f2(a0[0]) + ' ' + f2(a0[1]), (t0 + 500 + j * 80) + ',600']);
        }
        for (var e = 0; e <= 6; e++) {
          var dp = pt(rr * 1.14, e * Math.PI / 12);
          el('circle', { 'class': 'dot', cx: f2(dp[0]), cy: f2(dp[1]), r: 1.4 }, svg);
        }
      });
    }
    // A few sparkles in the side columns, twinkling once lit (diyaLife).
    if (!phone) [[.07, .3, 7], [.17, .22, 5], [.12, .52, 6], [.93, .28, 7], [.83, .2, 5], [.88, .5, 6]].forEach(function (k, i) {
      var x = L + (R - L) * k[0], y = T + (B - T) * k[1], r = k[2];
      lines.push(['ac spk', 'M' + f2(x) + ' ' + f2(y - r) + 'Q' + f2(x) + ' ' + f2(y) + ' ' + f2(x + r) + ' ' + f2(y) + 'Q' + f2(x) + ' ' + f2(y) + ' ' + f2(x) + ' ' + f2(y + r) + 'Q' + f2(x) + ' ' + f2(y) + ' ' + f2(x - r) + ' ' + f2(y) + 'Q' + f2(x) + ' ' + f2(y) + ' ' + f2(x) + ' ' + f2(y - r), (2600 + i * 150) + ',500']);
    });
    // The lamps: an open bowl with a lip, a small foot, and a flame.
    var count = phone ? 5 : (W > 1000 ? 9 : 7);
    var s = Math.min(phone ? 34 : 54, (R - L) / (count * 2.4), H * .085);
    var gap = Math.min((R - L) * (phone ? .19 : .085), s * 2.6);
    var by = phone ? B - 84 : B - Math.max(28, H * .06);
    for (var dI = 0; dI < count; dI++) {
      var off = dI - (count - 1) / 2, cx = (L + R) / 2 + off * gap, y1 = by - s * .34;
      var order = Math.abs(off), t1 = 1800 + order * 220;
      var bowl = 'M' + f2(cx - s * .62) + ' ' + f2(y1) + 'C' + f2(cx - s * .5) + ' ' + f2(by + s * .02) + ' ' + f2(cx + s * .5) + ' ' + f2(by + s * .02) + ' ' + f2(cx + s * .62) + ' ' + f2(y1) +
        'C' + f2(cx + s * .3) + ' ' + f2(y1 + s * .1) + ' ' + f2(cx - s * .3) + ' ' + f2(y1 + s * .1) + ' ' + f2(cx - s * .62) + ' ' + f2(y1) +
        'M' + f2(cx - s * .2) + ' ' + f2(by - s * .02) + 'L' + f2(cx - s * .26) + ' ' + f2(by + s * .12) + 'L' + f2(cx + s * .26) + ' ' + f2(by + s * .12) + 'L' + f2(cx + s * .2) + ' ' + f2(by - s * .02);
      lines.push(['dl', bowl, t1 + ',800']);
      var fb = y1 + s * .02, fh = s * .5, fw = s * .15;
      lines.push(['flame', 'M' + f2(cx) + ' ' + f2(fb - fh) + 'C' + f2(cx + fw) + ' ' + f2(fb - fh * .55) + ' ' + f2(cx + fw * .9) + ' ' + f2(fb - fh * .1) + ' ' + f2(cx) + ' ' + f2(fb) +
        'C' + f2(cx - fw * .9) + ' ' + f2(fb - fh * .1) + ' ' + f2(cx - fw) + ' ' + f2(fb - fh * .55) + ' ' + f2(cx) + ' ' + f2(fb - fh) + 'Z', (t1 + 700) + ',500']);
    }
  }

  function build() {
    var r = stage.getBoundingClientRect();
    var W = Math.round(r.width), Ht = Math.round(r.height);
    if (W < 10 || Ht < 10) return;
    lastW = W; lastH = Ht;
    var cv = canvasId(), phone = narrow.matches;
    // Festival motifs use a 390px minimum design width. Scale the whole
    // drawing proportionally on narrow phones, with no cropped side motifs.
    if (phone && W < 390) { Ht = Ht * 390 / W; W = 390; }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + f2(Ht));
    svg.innerHTML = '';
    hits = {};
    // Half a pixel in so the 1px frame lands on whole device pixels.
    var o = .5, L = o, T = o, R = W - o, B = Ht - o, cx = W / 2, cy = Ht / 2;
    var q = { tm: [cx, T], rm: [R, cy], bm: [cx, B], lm: [L, cy], tl: [L, T], tr: [R, T], br: [R, B], bl: [L, B], c: [cx, cy],
      // Where the diagonals cross the inner diamond.
      ul: [(L + cx) / 2, (T + cy) / 2], ur: [(R + cx) / 2, (T + cy) / 2], ll: [(L + cx) / 2, (B + cy) / 2], lr: [(R + cx) / 2, (B + cy) / 2] };
    var g = el('g', {}, svg), lines = [];
    festPending = false;
    if (cv === 'diya') diya(q, lines, W, Ht, phone);
    else if (cv === 'kundali-south') south(q, g, lines);
    else if (cv === 'kundali-north') north(q, g, lines);
    else if (window.AA_FEST && window.AA_FEST[cv]) window.AA_FEST[cv](festApi(q, lines, W, Ht, phone));
    else { festPending = true; loadFest(); return; }
    // Four lines from the corners of the screen (as it stands at the top of
    // the page) to the chart's corners. They slide in with the intro, then
    // stay as a faint hairline; rebuilt with the chart on every resize. They
    // end exactly at the screen's edges, so they never widen the page.
    if (!phone) {
      var vw = document.documentElement.clientWidth, vh = window.innerHeight;
      var pageTop = r.top + (window.scrollY || window.pageYOffset || 0);
      var x0 = -r.left, x1 = vw - r.left, y0 = -pageTop, y1 = Math.max(vh - pageTop, B + 40);
      [[[x0, y0], q.tl], [[x1, y0], q.tr], [[x1, y1], q.br], [[x0, y1], q.bl]].forEach(function (e) {
        lines.push(['edge', P([e[0], e[1]]), '0,900']);
      });
    }
    lines.forEach(function (d) {
      var p = el('path', { 'class': d[0], d: d[1], 'data-t': d[2] }, d[3] || svg);
      if (d[4]) { p.setAttribute('data-fade', ''); return; }
      var len = Math.ceil(p.getTotalLength()) + 2;
      p.style.strokeDasharray = len + ' ' + len;
      p.style.strokeDashoffset = drawn ? '0' : String(len);
      if (d[0] === 'flame' && !drawn) p.style.opacity = '0';
      p._len = len;
    });
    // Everything else with a time (fills, glows, text, fading paths) fades in.
    if (!drawn) Array.prototype.forEach.call(svg.querySelectorAll('[data-t]'), function (n) {
      if (n.tagName !== 'path' || n.hasAttribute('data-fade')) n.style.opacity = '0';
    });
    if (cv === 'diya') diyaLife();
    else if (cv.indexOf('kundali') === 0 && !phone) chartLife();
    if (want && !drawn) draw();
  }

  /* Diya, alive: a warm glow under every flame, each flame flickering on its
     own beat, the sparkles twinkling. The charts: the Lagna outline breathes.
     Transform and opacity only; nothing runs for reduced motion. */
  function diyaLife() {
    var defs = el('defs', {}, null);
    svg.insertBefore(defs, svg.firstChild);
    var rg = el('radialGradient', { id: 'hc-dg' }, defs);
    el('stop', { offset: '0', style: 'stop-color:var(--lagna);stop-opacity:calc(var(--gk,1) * .5)' }, rg);
    el('stop', { offset: '.5', style: 'stop-color:var(--lagna);stop-opacity:calc(var(--gk,1) * .16)' }, rg);
    el('stop', { offset: '1', style: 'stop-color:var(--lagna);stop-opacity:0' }, rg);
    Array.prototype.forEach.call(svg.querySelectorAll('path.flame'), function (p, i) {
      var b = p.getBBox(), t = p.getAttribute('data-t').split(',');
      var c = el('circle', { cx: f2(b.x + b.width / 2), cy: f2(b.y + b.height * .62), r: f2(b.height * 1.4), fill: 'url(#hc-dg)', 'data-t': (+t[0] + 200) + ',' + (+t[1] + 700) }, null);
      svg.insertBefore(c, defs.nextSibling);
      if (!drawn) c.style.opacity = '0';
      if (reduce || !p.animate) return;
      var d = 1300 + (i * 337) % 900, at = +t[0] + +t[1] + 600;
      anims.push(p.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(.93,1.08)' }, { transform: 'scale(1.03,.95)' }, { transform: 'scale(1,1)' }], { duration: d, delay: at, iterations: Infinity, easing: 'ease-in-out' }));
      anims.push(c.animate([{ opacity: 1 }, { opacity: .7 }, { opacity: 1 }], { duration: d * 1.7, delay: at + 400, iterations: Infinity, easing: 'ease-in-out' }));
    });
    if (!reduce) Array.prototype.forEach.call(svg.querySelectorAll('path.spk'), function (p, i) {
      if (!p.animate) return;
      anims.push(p.animate([{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }], { duration: 2200 + i * 430, delay: 4200 + i * 260, iterations: Infinity, easing: 'ease-in-out' }));
    });
  }
  function chartLife() {
    if (reduce) return;
    Array.prototype.forEach.call(svg.querySelectorAll('path.lagna'), function (p) {
      if (p.animate) anims.push(p.animate([{ opacity: 1 }, { opacity: .45 }, { opacity: 1 }], { duration: 5200, delay: 3600, iterations: Infinity, easing: 'ease-in-out' }));
    });
  }

  /* ---------- Festival canvases (hero-fest.js) ----------
     Everything but the two charts and the diya lives in hero-fest.js, loaded
     only when one of them is on (index.html preloads it before paint). Each
     one draws into the same rectangle through this small API; drawings use
     the same draw-on and fade-in timings as the charts, and their gentle
     idle loops are transform and opacity only (WAAPI, paused with the hero,
     never run for reduced motion). */
  var festPending = false, festReq = false;
  function loadFest() {
    if (festReq) return;
    festReq = true;
    var s = document.createElement('script');
    s.src = '/hero-fest.js?v=' + (window.AA_FEST_V || '1');
    s.onload = function () { build(); };
    document.head.appendChild(s);
  }
  function festApi(q, lines, W, H, phone) {
    var scale = W / Math.max(1, stage.clientWidth);
    var eyebrow = hc.querySelector('.hc-eyebrow'), stats = hc.querySelector('.hc-stat');
    return {
      L: q.tl[0], T: q.tl[1], R: q.br[0], B: q.br[1], W: W, H: H, phone: phone, reduce: reduce, svg: svg, hc: hc,
      // Mobile particles and peripheral lines stay outside the text band.
      copyTop: phone ? eyebrow.offsetTop * scale : 0,
      copyBottom: phone ? (stats.offsetTop + stats.offsetHeight) * scale : 0,
      // A stroke drawn on at t ms over dur ms ([class, d, "t,dur", parent, fade]).
      add: function (cls, d, t, dur, parent, fade) { lines.push([cls, d, Math.round(t) + ',' + Math.round(dur), parent, fade]); },
      el: function (tag, attrs, parent) { return el(tag, attrs, parent || svg); },
      // The frame (desktop only), drawn as the charts draw theirs.
      frame: function () { if (!phone) lines.push(['hl', P([q.tm, q.tr, q.br, q.bm]), '550,1800'], ['hl', P([q.tm, q.tl, q.bl, q.bm]), '550,1800']); },
      // An idle loop: starts after the entrance, runs while the hero is visible.
      loop: function (node, frames, opts) {
        if (reduce || !node.animate) return null;
        var a = node.animate(frames, opts);
        anims.push(a);
        if (hc.classList.contains('paused')) a.pause();
        return a;
      }
    };
  }

  /* Switch to another canvas in place (config arriving after paint),
     reserving the new illustration's space before rebuilding its drawing. */
  function setCanvas(id) {
    if ((window.AA_CANVASES || []).indexOf(id) < 0 || id === canvasId()) return;
    hide();
    root.setAttribute('data-canvas', id);
    if (window.AA_festGreet) window.AA_festGreet();
    fitHero();
    build();
    svg.classList.remove('swap'); void svg.getBoundingClientRect(); svg.classList.add('swap');
  }

  // The draw waits for the lines to exist (hero-c.css may land after this
  // script) and for the hero to be on screen in a visible tab.
  function draw() {
    want = true;
    if (drawn || festPending || !svg.querySelector('path')) return;
    drawn = true;
    Array.prototype.forEach.call(svg.querySelectorAll('[data-t]'), function (p) {
      var t = p.getAttribute('data-t').split(',');
      if (p.tagName !== 'path' || p.hasAttribute('data-fade')) {
        p.style.opacity = '';
        if (p.animate) anims.push(p.animate([{ opacity: 0 }, { opacity: 1 }], { delay: +t[0], duration: +t[1], easing: 'ease-out', fill: 'backwards' }));
        return;
      }
      p.style.strokeDashoffset = '0';
      var flame = p.classList.contains('flame');
      if (flame) p.style.opacity = '';
      if (p.animate) {
        if (flame) anims.push(p.animate([{ opacity: 0 }, { opacity: 1 }], { delay: +t[0], duration: +t[1] + 300, easing: 'ease-out', fill: 'backwards' }));
        anims.push(p.animate([{ strokeDashoffset: p._len }, { strokeDashoffset: 0 }],
          { delay: +t[0], duration: +t[1], easing: 'cubic-bezier(.45,0,.15,1)', fill: 'backwards' }));
        if (p.classList.contains('edge')) {
          // Bright while it arrives, then it settles to the faint resting
          // opacity set in hero-c.css.
          var rest = getComputedStyle(p).opacity;
          anims.push(p.animate([{ opacity: .8 }, { opacity: .8, offset: .6 }, { opacity: rest }],
            { duration: 2200, easing: 'ease-out', fill: 'backwards' }));
        }
      }
    });
  }
  var anims = [];

  /* ---------- Equal space above and below the chart (desktop) ----------
     The hero runs from the invocation to the bottom of the first screen, and the
     canvas sits in it with the same gap above (from the invocation's bottom) as
     below (to the screen's bottom), whatever sits between header and hero.
     The gap grows gently with the screen (24px at 670px tall, 32 at 900,
     at most 44), and the canvas takes the height that is left, so the
     whole rectangle and both gaps always fit the first screen. */
  // Clear space around the copy, in the mobile illustration's design units.
  // Most festivals have a small upper emblem and a scene below. Canvases
  // without an upper emblem keep a much smaller gap under the invocation.
  var PHONE_ART_SPACE = {
    'kundali-north': [32, 160], 'kundali-south': [32, 160],
    navratri: [32, 220], diya: [96, 170], dussehra: [180, 200],
    holi: [200, 260], 'karwa-chauth': [200, 220], chhath: [32, 340],
    sankranti: [190, 260], shivratri: [160, 210],
    'ganesh-chaturthi': [180, 200], janmashtami: [160, 250],
    'raksha-bandhan': [32, 210], onam: [110, 180],
    'ugadi-gudi-padwa': [140, 270], eid: [180, 250],
    christmas: [140, 210], 'new-year': [220, 220], purnima: [190, 240],
    'pitru-paksha': [150, 220], eclipse: [150, 220], transit: [160, 220],
    'dev-uthani': [140, 280], 'vasant-panchami': [160, 190],
    'ram-navami': [160, 200], 'hanuman-jayanti': [160, 260],
    'akshaya-tritiya': [32, 240], 'rath-yatra': [32, 200],
    teej: [210, 220], 'nag-panchami': [32, 210]
  };
  var header = document.querySelector('.hero-invocation') || document.querySelector('.site-header');
  function fitHero() {
    if (narrow.matches || !header) {
      hc.style.height = ''; stage.style.top = ''; stage.style.bottom = '';
      // Deduct the real header and invocation, including wrapped text/fonts.
      hc.style.setProperty('--hc-top', (hc.getBoundingClientRect().top + window.scrollY) + 'px');
      var space = PHONE_ART_SPACE[canvasId()] || [180, 220];
      var scale = Math.min(1, hc.clientWidth / 390);
      hc.style.setProperty('--hc-art-top', Math.round(space[0] * scale) + 'px');
      hc.style.setProperty('--hc-art-bottom', Math.round(space[1] * scale) + 'px');
      return;
    }
    hc.style.removeProperty('--hc-top');
    hc.style.removeProperty('--hc-art-top');
    hc.style.removeProperty('--hc-art-bottom');
    var y = window.scrollY || window.pageYOffset || 0;
    var hb = header.getBoundingClientRect().bottom + y, ht = hc.getBoundingClientRect().top + y;
    var vh = window.innerHeight, extra = Math.max(0, ht - hb);
    var g = Math.round(Math.min(44, Math.max(24, vh * 0.035)));
    var h = Math.max(560, vh - ht);
    // Below the minimum height the canvas still keeps equal gaps inside it.
    hc.style.height = h + 'px';
    stage.style.top = g + 'px';
    stage.style.bottom = (vh - ht >= 560 ? g + extra : g) + 'px';
  }
  fitHero();
  window.addEventListener('resize', fitHero);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

  var lastW = 0, lastH = 0;
  build();
  if ('ResizeObserver' in window) {
    new ResizeObserver(function (es) {
      var c = es[0].contentRect;
      if (Math.round(c.width) === lastW && Math.round(c.height) === lastH) return;
      lastW = Math.round(c.width); lastH = Math.round(c.height);
      build(); hide();
    }).observe(stage);
  } else {
    window.addEventListener('resize', function () { build(); hide(); });
  }

  /* ---------- One line per house ---------- */
  var active = null, pinned = null;
  function show(h) {
    h = String(h);
    var d = H[h];
    if (!d || !d[2]) { hide(); return; }
    if (active && active !== h) off(active);
    active = h;
    labels[h].classList.add('on');
    if (hits[h]) hits[h].classList.add('on');
    var x = hi();
    cap.innerHTML = '<small>' + (x ? 'भाव ' : 'House ') + h + ' · ' + (x ? d[1] : d[0]) + '</small>' + (x ? d[3] : d[2]);
    if (!narrow.matches) place(labels[h]);
    cap.classList.add('show');
  }
  function off(h) { labels[h].classList.remove('on'); if (hits[h]) hits[h].classList.remove('on'); }
  function hide() {
    if (active) off(active);
    active = null; pinned = null;
    cap.classList.remove('show');
    if (narrow.matches) cap.innerHTML = '';
  }
  // Below the label if it fits, else beside it, else above; never over the words.
  var copy = hc.querySelector('.hc-copy');
  function place(lab) {
    var box = hc.getBoundingClientRect(), r = lab.getBoundingClientRect();
    var cw = cap.offsetWidth, ch = cap.offsetHeight, g = 8;
    var mx = r.left + r.width / 2 - box.left, my = r.top + r.height / 2 - box.top;
    var tries = [
      [mx - cw / 2, r.bottom - box.top + 2],
      [r.right - box.left + g, my - ch / 2],
      [r.left - box.left - g - cw, my - ch / 2],
      [mx - cw / 2, r.top - box.top - ch - 2],
      [r.right - box.left + g, r.top - box.top],
      [r.left - box.left - g - cw, r.top - box.top]
    ];
    var sr0 = stage.getBoundingClientRect();
    var sl = sr0.left - box.left + 4, st = sr0.top - box.top + 4, sr = sr0.right - box.left - 4, sb = sr0.bottom - box.top - 4;
    function rel(q, pad) { return { l: q.left - box.left - pad, t: q.top - box.top - pad, r: q.right - box.left + pad, b: q.bottom - box.top + pad }; }
    // Keep clear of the words and of every other house label.
    var avoid = [];
    // The inked extent of each line of words, not the full-width box.
    Array.prototype.forEach.call(copy.children, function (n) {
      var rg = document.createRange(); rg.selectNodeContents(n);
      var q = rel(rg.getBoundingClientRect(), 10); q.words = true;
      avoid.push(q);
    });
    for (var k in labels) if (labels[k] !== lab) avoid.push(rel(labels[k].getBoundingClientRect(), 4));
    // First candidate that is clear wins; otherwise the one that overlaps least.
    function ov(x, y, c) { return Math.max(0, Math.min(x + cw, c.r) - Math.max(x, c.l)) * Math.max(0, Math.min(y + ch, c.b) - Math.max(y, c.t)); }
    var pick = null, best = Infinity;
    for (var i = 0; i < tries.length; i++) {
      // Slide sideways to stay inside the chart before judging a spot.
      var x = Math.max(sl, Math.min(sr - cw, tries[i][0])), y = tries[i][1];
      tries[i][0] = x;
      var out = cw * ch - ov(x, y, { l: sl, t: st, r: sr, b: sb });
      var cost = out * 2;
      // Covering the eyebrow, wordmark, badges or note is far worse than
      // covering another house's label.
      avoid.forEach(function (c) { cost += ov(x, y, c) * (c.words ? 60 : 1); });
      if (cost < best - .5) { best = cost; pick = tries[i]; }
      if (cost === 0) break;
    }
    cap.style.left = Math.round(Math.max(0, Math.min(box.width - cw, pick[0]))) + 'px';
    cap.style.top = Math.round(pick[1]) + 'px';
  }

  function houseOf(t) { var n = t.closest && t.closest('[data-h]'); return n && hc.contains(n) ? n.getAttribute('data-h') : null; }
  hc.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse' || pinned) return;
    var h = houseOf(e.target);
    if (h) show(h);
  });
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !pinned) hide(); });
  hc.addEventListener('click', function (e) {
    var h = houseOf(e.target);
    if (!h) return;
    if (pinned === h) { hide(); return; }
    show(h); pinned = active ? h : null;
  });
  hc.addEventListener('focusin', function (e) { var h = houseOf(e.target); if (h && !pinned) show(h); });
  hc.addEventListener('focusout', function (e) { if (!pinned && !(e.relatedTarget && houseOf(e.relatedTarget))) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) hide(); });
  document.addEventListener('pointerdown', function (e) { if (pinned && !houseOf(e.target)) hide(); });
  new MutationObserver(function () { setHint(); var a = active, p = pinned; if (a) { show(a); pinned = p; } })
    .observe(root, { attributes: true, attributeFilter: ['data-lang'] });

  /* ---------- Downloads under the badges ----------
     stats.json (backend site-stats, every 15 min; update-stats.py by hand):
     downloads_android / _ios = unique GA4 app users per platform since launch.
     Shown exact ("1,287 downloads · Android 1,081 · iPhone 206"); the total is
     the sum of the two, so the parts always add up (someone on an Android
     phone and an iPhone counts as two downloads). A green "Live" dot carries
     the time of the last refresh; the page re-reads the file every 3 seconds.
     Without download numbers it falls back to users_display ("300+ people use
     AstroAshva"); with neither the line stays empty. Its height is reserved
     in CSS, so filling it shifts nothing. */
  var stat = hc.querySelector('[data-hc-stat]');
  var whole = function (n) { return typeof n === 'number' && isFinite(n) && n >= 10 ? Math.floor(n) : null; };
  var ok = function (v) { return typeof v === 'string' && /^[0-9][0-9.]*k?\+$/.test(v) ? v : null; };
  var fmt = function (n) { return n.toLocaleString('en-IN'); };
  var ago = function (iso, inHi) {
    var t = Date.parse(iso); if (!isFinite(t)) return '';
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return inHi ? 'अभी अपडेट' : 'updated just now';
    if (m < 60) return inHi ? m + ' मिनट पहले अपडेट' : 'updated ' + m + ' min ago';
    var h = Math.round(m / 60);
    return inHi ? h + ' घंटे पहले अपडेट' : 'updated ' + h + ' h ago';
  };
  var live = function (iso, inHi) {
    var when = ago(iso, inHi);
    return '<span class="hc-live" title="' + when + '"><i aria-hidden="true"></i>' + (inHi ? 'लाइव' : 'Live') + '</span>';
  };
  var lastStats = null, lastLive = null;
  var render = function (st) {
    if (!st) return;
    lastStats = st;
    // Android prefers Play's exact "Total User Installs" when the backend has
    // it (PLAY_REPORTS_BUCKET set); otherwise the GA4 app-user count.
    var a = whole(st.android_installs) != null ? whole(st.android_installs) : whole(st.downloads_android);
    var i = whole(st.downloads_ios);
    if (a != null || i != null) {
      var d = (a || 0) + (i || 0);
      var en = '<b>' + fmt(d) + '</b> downloads';
      var hiTxt = '<b>' + fmt(d) + '</b> डाउनलोड';
      if (a != null && i != null) {
        en += ' · Android <b>' + fmt(a) + '</b> · iPhone <b>' + fmt(i) + '</b>';
        hiTxt += ' · एंड्रॉयड <b>' + fmt(a) + '</b> · आईफ़ोन <b>' + fmt(i) + '</b>';
      }
      var n = lastLive && lastLive.active_users > 0 ? lastLive.active_users : 0;
      if (n) {
        en = '<span class="hc-now">' + live(lastLive.at, false) + '<b>' + fmt(n) + '</b> using the app now</span>' + en;
        hiTxt = '<span class="hc-now">' + live(lastLive.at, true) + '<b>' + fmt(n) + '</b> \u0932\u094b\u0917 \u0905\u092d\u0940 \u0910\u092a \u092a\u0930</span>' + hiTxt;
      }
      stat.innerHTML = '<span lang="en">' + en + '</span><span lang="hi">' + hiTxt + '</span>';
      return;
    }
    var u = ok(st.users_display);
    if (!u) return;
    stat.innerHTML = '<span lang="en"><b>' + u + '</b> people use AstroAshva</span>' +
      '<span lang="hi"><b>' + u + '</b> लोग AstroAshva इस्तेमाल करते हैं</span>';
  };
  var load = function () {
    fetch('https://gttszlununmqivrqevwv.supabase.co/storage/v1/object/public/site/stats.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; }).then(render).catch(function () {});
  };
  // People using the app in the last 30 minutes (GA4 Realtime via the
  // site-live function, which caches it for 60 s). Hidden at zero or on error.
  var loadLive = function () {
    fetch('https://gttszlununmqivrqevwv.supabase.co/functions/v1/site-live', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (l) { if (l && typeof l.active_users === 'number') { lastLive = l; if (lastStats) render(lastStats); } })
      .catch(function () {});
  };
  if (stat && window.fetch) {
    load(); loadLive();
    setInterval(function () { if (document.visibilityState === 'visible') loadLive(); }, 10000);
    // Re-read every 3 seconds while the tab is visible (a ~1 KB file), so a
    // new count appears on open pages within seconds of the server writing it.
    setInterval(function () { if (document.visibilityState === 'visible') load(); }, 3000);
  }

  /* ---------- Scroll cue (phones): to the next section, gone once scrolling ---------- */
  var cue = hc.querySelector('[data-hc-cue]');
  if (cue) {
    var setCueLabel = function () { cue.setAttribute('aria-label', hi() ? 'और जानने के लिए नीचे स्क्रॉल करें' : 'Scroll to learn more'); };
    setCueLabel();
    new MutationObserver(setCueLabel).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
    cue.addEventListener('click', function () {
      var n = hc.nextElementSibling;
      while (n && (n.offsetParent === null || n.offsetHeight === 0)) n = n.nextElementSibling;
      if (n) n.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    var onScroll = function () { cue.classList.toggle('gone', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Phones: hero B's sky, faint, behind the words ----------
     The zodiac ring (12 rashis, 27 nakshatra ticks) and the nine grahas on
     their orbits, with hero B's glyphs, periods and start angles. Drawn once,
     only on phones; CSS turns it (paused with the hero, still for reduced
     motion). Decorative: aria-hidden, no pointer events. */
  var sky = hc.querySelector('[data-hc-sky]');
  var SKY = [ // [id, orbit share, period s, start rad, dir, glyph] from hero-b.js
    ['mo', .41, 15, 2.86, 1, '<path class="f" d="M8.2 3a9.2 9.2 0 0 1 0 18a12 12 0 0 0 0-18z"/>'],
    ['me', .5, 21, 3.07, 1, '<circle cx="12" cy="12" r="4.3"/><path d="M7.8 3a4.2 4.2 0 0 0 8.4 0M12 16.3V22M9 19.2h6"/>'],
    ['ve', .58, 26, 5.99, 1, '<circle cx="12" cy="8.6" r="5.4"/><path d="M12 14v8M8.6 18.3h6.8"/>'],
    ['su', .65, 31, 0.51, 1, '<circle cx="12" cy="12" r="8.2"/><circle class="f" cx="12" cy="12" r="2.3"/>'],
    ['ma', .71, 37, 3.41, 1, '<circle cx="10" cy="14" r="5.6"/><path d="M14 10l5.6-5.6M14.6 4.4h5v5"/>'],
    ['ju', .77, 48, 2.81, 1, '<path d="M5.4 8.2C5.4 4.4 11.2 4 11.2 8.2c0 3.4-3.6 5.6-6.2 8H19M15.6 3.6V21"/>'],
    ['ra', .83, 56, 5.98, -1, '<path d="M7.6 16.6C3.4 12.6 5 4.6 12 4.6s8.6 8 4.4 12"/><circle cx="7" cy="18.8" r="2.2"/><circle cx="17" cy="18.8" r="2.2"/>'],
    ['ke', .83, 56, 5.98 + Math.PI, -1, '<path d="M7.6 7.4C3.4 11.4 5 19.4 12 19.4s8.6-8 4.4-12"/><circle cx="7" cy="5.2" r="2.2"/><circle cx="17" cy="5.2" r="2.2"/>'],
    ['sa', .9, 66, 0.21, 1, '<path d="M6.4 5.2h6.2M9.5 2.4V19M9.5 12.6c0-3.6 6.6-4 6.6 0 0 3-3 4-3 6.5 0 2 2.1 2.6 3.9 1.2"/>']
  ];
  function drawSky() {
    if (!sky || sky.firstChild) return;
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols&display=swap&text=' + encodeURIComponent('\u2648\u2649\u264a\u264b\u264c\u264d\u264e\u264f\u2650\u2651\u2652\u2653');
    document.head.appendChild(f);
    var svg = el('svg', { viewBox: '-100 -100 200 200', focusable: 'false' }, sky);
    var ring = el('g', { 'class': 'ring' }, svg);
    el('circle', { r: 97, 'class': 'rc' }, ring);
    el('circle', { r: 88, 'class': 'rc' }, ring);
    el('circle', { r: 84.6, 'class': 'rc' }, ring);
    for (var i = 0; i < 12; i++) {
      var a = i * 30;
      el('line', { x1: 0, y1: -88, x2: 0, y2: -97, 'class': 'div', transform: 'rotate(' + a + ')' }, ring);
      el('text', { x: 0, y: -92.5, transform: 'rotate(' + (a + 15) + ')' }, ring).textContent = String.fromCharCode(0x2648 + i) + '\ufe0e';
    }
    for (var n = 0; n < 27; n++) {
      el('line', { x1: 0, y1: -84.6, x2: 0, y2: n % 9 === 0 ? -80.6 : -82.4, 'class': 'tick', transform: 'rotate(' + (n * 360 / 27) + ')' }, ring);
    }
    var R = 80;
    SKY.forEach(function (g) {
      var r = g[1] * R;
      if (g[0] !== 'ke') el('circle', { r: r, 'class': 'orb' }, svg);
      // Start where hero B starts: a negative delay of start / (2 pi) of a period.
      var spin = el('g', { 'class': 'spin' + (g[4] < 0 ? ' rev' : '') }, svg);
      var frac = g[3] / (Math.PI * 2);
      if (g[4] < 0) frac = 1 - frac;
      spin.style.setProperty('--p', g[2] + 's');
      spin.style.setProperty('--d', (-frac * g[2]).toFixed(2) + 's');
      spin.setAttribute('transform', reduce ? 'rotate(' + (g[3] * 180 / Math.PI) + ')' : '');
      var at = el('g', { transform: 'translate(' + r.toFixed(2) + ' 0)' }, spin);
      var up = el('g', { 'class': 'up', transform: reduce ? 'rotate(' + (-g[3] * 180 / Math.PI) + ')' : '' }, at);
      up.style.setProperty('--p', g[2] + 's');
      up.style.setProperty('--d', (-frac * g[2]).toFixed(2) + 's');
      var gl = el('g', { 'class': 'gl ' + g[0], transform: 'translate(-6 -6) scale(.5)' }, up);
      gl.innerHTML = g[5];
    });
  }
  var phone = window.matchMedia ? matchMedia('(max-width: 768px)') : null;
  if (sky && phone) {
    if (phone.matches) drawSky();
    var onPhone = function () { if (phone.matches) drawSky(); };
    if (phone.addEventListener) phone.addEventListener('change', onPhone); else if (phone.addListener) phone.addListener(onPhone);
  }

  /* ---------- Which canvas: the site_hero config ----------
     app_config row site_hero (public read; edited in the admin's Website
     canvas section): {"canvas":"kundali-north","presets":[{"id","name",
     "canvas","from","until"}]}. A preset active on this visitor's clock wins,
     else canvas, else kundali-north. Fetched after first paint, cached for the
     next visit (index.html reads the cache before paint), swapped in place
     only if it differs. Any failure keeps what is on screen. ?canvas=<id>
     previews a canvas and is never replaced. */
  var REST = 'https://gttszlununmqivrqevwv.supabase.co/rest/v1';
  // The anon key is public by design (landing.js uses the same one); app_config is read-only to it.
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dHN6bHVudW5tcWl2cnFldnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzEwMjQsImV4cCI6MjA4ODgwNzAyNH0.owDFA7ZPpDYoTmcIwYxxfn1w-qRUnKrM5pX17IAIzQQ';
  if (window.fetch && window.AA_pickCanvas) {
    fetch(REST + '/app_config?key=eq.site_hero&select=value', { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!Array.isArray(rows)) return;
        var v = rows[0] && rows[0].value;
        try {
          if (v && typeof v === 'object') localStorage.setItem('aa-site-hero', JSON.stringify(v));
          else localStorage.removeItem('aa-site-hero');
        } catch (e) {}
        if (window.AA_CANVAS_OVERRIDE) return;
        setCanvas(window.AA_pickCanvas(v) || 'kundali-north');
      })
      .catch(function () {});
  }

  /* ---------- Entrance and pausing ----------
     The chart draws when it is on screen: at once on desktop, on scroll on
     phones, where the words fill the first screen. The house words follow. */
  var visible = true, stageSeen = true;
  function setRunning() {
    var run = visible && !document.hidden;
    hc.classList.toggle('paused', !run);
    anims.forEach(function (a) { if (a.playState === 'running' && !run) a.pause(); else if (a.playState === 'paused' && run) a.play(); });
    if (run && stageSeen) { draw(); stage.classList.add('go'); }
  }
  if (!reduce) {
    if ('IntersectionObserver' in window) {
      stageSeen = false;
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRunning(); }).observe(hc);
      var so = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { stageSeen = true; so.disconnect(); setRunning(); }
      }, { threshold: .25 });
      so.observe(stage);
    }
    document.addEventListener('visibilitychange', setRunning);
    requestAnimationFrame(function () { requestAnimationFrame(setRunning); });
  } else {
    stage.classList.add('go');
  }
})();
