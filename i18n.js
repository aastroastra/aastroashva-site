/* AstroAshva home page languages: the app's thirteen, in the app's picker order.

   English and Hindi live in the HTML as pairs (<span lang="en">..</span>
   <span lang="hi">..</span>) and CSS shows one by html[data-lang]. Every
   other language is a strings file, i18n/<code>.json, keyed by the English
   text (the en element's innerHTML, whitespace collapsed), loaded on demand.
   For those languages each translated en element gets a sibling clone in the
   chosen language (class i18n-gen) and is itself hidden (i18n-off); an en
   element with no translation simply stays visible, so a missing string
   falls back to English and never to a blank. A MutationObserver covers the
   pairs that scripts write later (captions, stats, multi-match rows).

   Scripts use AA_i18n.t(en, hi) for text outside the pairs (attributes,
   captions) and listen for the 'aa:lang' event on document.
   i18n/_source.json lists every English key with its Hindi; a new key needs
   adding there and in each language file (scripts: i18n/README in the repo). */
(function () {
  'use strict';
  var root = document.documentElement;
  // Same order and native names as the app's language picker (iOS
  // AstrologyAPILocale.shipped + LanguagePicker.nativeScript). The app calls
  // Marathi "ma"; the site uses the standard "mr" and accepts "ma" as an alias.
  var LANGS = [
    ['en', 'English', 'English'], ['hi', 'हिन्दी', 'Hindi'], ['mr', 'मराठी', 'Marathi'],
    ['gu', 'ગુજરાતી', 'Gujarati'], ['ta', 'தமிழ்', 'Tamil'], ['bn', 'বাংলা', 'Bengali'],
    ['pa', 'ਪੰਜਾਬੀ', 'Punjabi'], ['kn', 'ಕನ್ನಡ', 'Kannada'], ['te', 'తెలుగు', 'Telugu'],
    ['ml', 'മലയാളം', 'Malayalam'], ['or', 'ଓଡ଼ିଆ', 'Odia'], ['es', 'Español', 'Spanish'],
    ['zh', '中文', 'Chinese']
  ];
  // Languages with their own captures in shots/landing/<code>, <code>-and,
  // <code>-ios. Add a code here once its captures are uploaded; the rest
  // show the English screens.
  var SHOTS = ['en', 'hi'];
  var codes = LANGS.map(function (l) { return l[0]; });
  var cache = {};
  var lang = norm(root.getAttribute('data-lang'));
  var dict = {};
  var token = 0;
  var collect = window.AA_I18N_COLLECT ? {} : null;

  function norm(c) {
    c = String(c || '').toLowerCase();
    if (c === 'ma') c = 'mr';
    return codes.indexOf(c) >= 0 ? c : 'hi';
  }
  function key(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function isPair(c) { return c === 'en' || c === 'hi'; }
  function t(en, hi) {
    if (lang === 'en') return en;
    if (lang === 'hi' && hi != null) return hi;
    var k = key(en);
    if (collect && !(k in collect)) collect[k] = hi == null ? '' : key(hi);
    return Object.prototype.hasOwnProperty.call(dict, k) && dict[k] ? dict[k] : en;
  }

  function load(c) {
    if (isPair(c)) return Promise.resolve({});
    if (cache[c]) return cache[c];
    var early = window.AA_I18N_FETCH && window.AA_I18N_FETCH.lang === c ? window.AA_I18N_FETCH.p : null;
    cache[c] = (early || fetch('/i18n/' + c + '.json?v=' + (window.AA_I18N_V || '1')).then(function (r) { return r.ok ? r.json() : {}; }))
      .catch(function () { return {}; })
      .then(function (d) { return d && typeof d === 'object' ? d : {}; });
    return cache[c];
  }
  // Each script's fonts come from Google Fonts on demand (one stylesheet per
  // language); the font stacks already name every family.
  var FONTS = { bn: 'Bengali', pa: 'Gurmukhi', gu: 'Gujarati', or: 'Oriya', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam' };
  function fonts(c) {
    var f = FONTS[c];
    if (!f || document.getElementById('aa-font-' + c)) return;
    var l = document.createElement('link');
    l.id = 'aa-font-' + c; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+' + f + ':wght@400;500;600;700&family=Noto+Serif+' + f + ':wght@600;700&display=swap';
    document.head.appendChild(l);
  }

  /* ---------- The DOM: one clone per translated English element ---------- */
  function clear() {
    document.querySelectorAll('.i18n-gen').forEach(function (n) { n.parentNode.removeChild(n); });
    document.querySelectorAll('.i18n-off').forEach(function (n) { n.classList.remove('i18n-off'); n.__aaKey = null; n.__aaTr = null; });
  }
  function translateEl(el) {
    if (el.closest('select, [data-i18n-skip]')) return; // the pickers; the app bar translates itself
    if (el.parentElement && el.parentElement.closest('[lang="en"]')) return; // the outermost pair only
    var k = key(el.innerHTML);
    var old = el.__aaTr;
    if (el.__aaKey === k && old && old.parentNode && old.getAttribute('lang') === lang) return;
    if (old && old.parentNode) old.parentNode.removeChild(old);
    el.__aaTr = null; el.__aaKey = k;
    if (!k) { el.classList.remove('i18n-off'); return; }
    var hiEl = el.nextElementSibling && el.nextElementSibling.getAttribute('lang') === 'hi' ? el.nextElementSibling : null;
    if (collect && !(k in collect)) collect[k] = hiEl ? key(hiEl.innerHTML) : '';
    var tr = Object.prototype.hasOwnProperty.call(dict, k) ? dict[k] : '';
    if (!tr) { el.classList.remove('i18n-off'); return; }
    // A stale clone copied along with this element (a dialog caption copies a heading).
    var after = (hiEl || el).nextElementSibling;
    if (after && after.classList.contains('i18n-gen')) after.parentNode.removeChild(after);
    var c = el.cloneNode(false);
    c.removeAttribute('id');
    c.classList.remove('i18n-off');
    c.classList.add('i18n-gen');
    c.setAttribute('lang', lang);
    if (el instanceof SVGElement && tr.indexOf('<') < 0) c.textContent = tr; else c.innerHTML = tr;
    (hiEl || el).insertAdjacentElement('afterend', c);
    el.classList.add('i18n-off');
    el.__aaTr = c;
  }
  function translate(scope) {
    if (isPair(lang) || !scope) return;
    if (scope.nodeType !== 1) return;
    if (scope.getAttribute('lang') === 'en') translateEl(scope);
    scope.querySelectorAll('[lang="en"]').forEach(translateEl);
  }
  var mo = null;
  function watch() {
    if (mo || !window.MutationObserver || !document.body) return;
    mo = new MutationObserver(function (records) {
      if (isPair(lang)) return;
      var seen = [];
      records.forEach(function (r) {
        var tg = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (!tg || tg.closest('.i18n-gen')) return;
        var en = tg.closest('[lang="en"]');
        if (en) { if (seen.indexOf(en) < 0) seen.push(en); return; }
        r.addedNodes.forEach(function (n) {
          if (n.nodeType === 1 && !n.classList.contains('i18n-gen') && seen.indexOf(n) < 0) seen.push(n);
        });
      });
      seen.forEach(translate);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ---------- The pickers ---------- */
  function syncPickers() {
    document.querySelectorAll('[data-lang-select]').forEach(function (s) { if (s.value !== lang) s.value = lang; });
    var name = LANGS[codes.indexOf(lang)][1];
    document.querySelectorAll('[data-lang-name]').forEach(function (n) { n.textContent = name; n.setAttribute('lang', lang); });
  }
  function fillPickers() {
    document.querySelectorAll('[data-lang-select]').forEach(function (s) {
      if (!s.options.length) {
        LANGS.forEach(function (l) {
          var o = document.createElement('option');
          o.value = l[0]; o.lang = l[0];
          o.textContent = l[0] === 'en' ? l[1] : l[1] + ' · ' + l[2];
          s.appendChild(o);
        });
      }
      if (!s.__aaBound) {
        s.__aaBound = true;
        s.addEventListener('change', function () { set(s.value, true); });
      }
    });
    syncPickers();
  }

  /* ---------- Switching ---------- */
  function apply(c, d, persist) {
    lang = c; dict = d || {};
    clear();
    root.setAttribute('data-lang', c);
    root.lang = c === 'zh' ? 'zh-Hans' : c;
    if (isPair(c)) root.removeAttribute('data-tr'); else root.setAttribute('data-tr', '');
    if (c === 'en' || c === 'es' || c === 'zh') root.removeAttribute('data-indic'); else root.setAttribute('data-indic', '');
    root.classList.remove('i18n-wait');
    if (!isPair(c)) { translate(document.body); watch(); }
    if (persist) {
      try { localStorage.setItem('aa-lang', c); } catch (e) {}
      try {
        var u = new URL(location.href);
        if (u.searchParams.has('lang')) {
          if (c === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', c);
          history.replaceState(null, '', u);
        }
      } catch (e) {}
    }
    syncPickers();
    try { document.dispatchEvent(new CustomEvent('aa:lang', { detail: { lang: c } })); } catch (e) {}
  }
  function set(value, persist) {
    var c = norm(value), my = ++token;
    fonts(c);
    return load(c).then(function (d) { if (my === token) apply(c, d, persist); });
  }

  window.AA_i18n = {
    langs: LANGS,
    get lang() { return lang; },
    t: t,
    set: set,
    // The capture folder for this language: its own once uploaded, else English.
    shotLang: function () { return SHOTS.indexOf(lang) >= 0 ? lang : 'en'; },
    translate: translate,
    collected: function () { return collect; }
  };
  // Shorthand for scripts: AA_tr('Close', 'बंद करें').
  window.AA_tr = t;

  fillPickers();
  document.addEventListener('DOMContentLoaded', fillPickers);
  if (isPair(lang)) { root.classList.remove('i18n-wait'); }
  else {
    // The page's other scripts run right after this one; they read
    // AA_i18n.lang now and re-render on 'aa:lang' once the strings arrive.
    fonts(lang);
    set(lang, false);
  }
  window.addEventListener('storage', function (e) {
    if (e.key === 'aa-lang' && e.newValue && norm(e.newValue) !== lang) set(e.newValue, false);
  });
})();
