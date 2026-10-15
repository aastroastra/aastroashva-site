import { collect, fingerprint } from './narration-core.mjs';

// Listen mode: plays the recorded narration (Sarvam Bulbul v4, built by
// narration/build.mjs), lights the sentence being read and keeps it in view.
// Highlighting uses the CSS Custom Highlight API, so the page markup is never
// rewritten; browsers without it still get the block focus and scrolling.

const root = document.documentElement;
const main = document.querySelector('main');
const hi = () => root.dataset.lang === 'hi';
const t = (en, hin) => hi() ? hin : en;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';
const SPEEDS = [1, 1.25, 1.5, 0.85];
const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  listen: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 6v12L9 12zM6.5 6h2v12h-2z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6v12L15 12zM15.5 6h2v12h-2z"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  follow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
};

const manifests = {};
async function manifest(lang) {
  manifests[lang] ??= fetch(new URL(`narration/${lang}.json`, import.meta.url)).then(r => r.ok ? r.json() : null).catch(() => null);
  return manifests[lang];
}

// ---- State ---------------------------------------------------------------
const audio = new Audio();
audio.preload = 'none';
let lang = null, data = null, blocks = [], timeline = [];
let active = false, follow = true, speed = 0, current = -1, raf = 0, scrolling = false;
const sentenceMark = canHighlight ? new Highlight() : null;
const wordMark = canHighlight ? new Highlight() : null;
if (canHighlight) { CSS.highlights.set('narration-sentence', sentenceMark); CSS.highlights.set('narration-word', wordMark); }

function prepare(nextLang, json) {
  blocks.forEach(b => b.el.classList.remove('narr-block', 'is-narrating'));
  lang = nextLang; data = json;
  blocks = collect(main, lang);
  timeline = [];
  blocks.forEach((block, bi) => {
    const entry = data.blocks[bi];
    if (!entry) return;
    // A block whose copy changed after recording still plays; it just is not lit word by word.
    const exact = entry.f === fingerprint(block.map.text);
    block.el.classList.add('narr-block');
    entry.s.forEach(([start, end, t0, t1]) => timeline.push({ bi, start, end, t0, t1, exact }));
  });
  audio.src = new URL(`narration/${data.audio}`, import.meta.url).href;
}

// ---- UI ------------------------------------------------------------------
const heroButton = document.createElement('button');
heroButton.type = 'button';
heroButton.className = 'listen-button';
heroButton.hidden = true;
document.querySelector('.story-hero .story-button')?.after(heroButton);

const glow = document.createElement('div');
glow.className = 'listen-glow';
glow.setAttribute('aria-hidden', 'true');

const dock = document.createElement('div');
dock.className = 'listen-dock';
dock.hidden = true;
dock.setAttribute('role', 'region');
dock.innerHTML = `
  <button type="button" class="listen-fab" data-act="start">${ICON.listen}<span></span></button>
  <div class="listen-player" role="group">
    <button type="button" class="lp-round lp-play" data-act="toggle"></button>
    <div class="lp-main">
      <div class="lp-top"><span class="lp-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="lp-title"></span><span class="lp-time"></span></div>
      <div class="lp-track"><input type="range" min="0" max="1000" value="0" step="1"><span class="lp-fill"></span></div>
    </div>
    <button type="button" class="lp-icon" data-act="back">${ICON.back}</button>
    <button type="button" class="lp-icon" data-act="next">${ICON.next}</button>
    <button type="button" class="lp-speed" data-act="speed"></button>
    <button type="button" class="lp-icon lp-follow" data-act="follow" hidden>${ICON.follow}</button>
    <button type="button" class="lp-icon" data-act="close">${ICON.close}</button>
  </div>`;
document.body.append(glow, dock);
const $ = s => dock.querySelector(s);
const seek = $('.lp-track input');

const num = n => new Intl.NumberFormat(hi() ? 'hi-IN-u-nu-deva' : 'en').format(n);
function minutes(seconds) { return num(Math.max(1, Math.round(seconds / 60))); }
function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${num(Math.floor(s / 60))}:${num(Math.floor(s % 60 / 10))}${num(s % 10)}`;
}
function chapterTitle(id) {
  const eyebrow = document.querySelector(`#${CSS.escape(id)} .eyebrow span[lang="${lang}"]`);
  const text = (eyebrow?.textContent || '').trim();
  return text ? text.charAt(0) + text.slice(1).toLowerCase().replace(/\bjyotish\b/g, 'Jyotish') : '';
}
function render() {
  const playing = !audio.paused;
  const duration = data?.duration || 0;
  heroButton.innerHTML = `${ICON.listen}<span>${active ? (playing ? t('Pause listening', 'सुनना रोकें') : t('Resume listening', 'सुनना जारी रखें')) : t(`Listen · ${minutes(duration)} min`, `सुनें · ${minutes(duration)} मिनट`)}</span>`;
  heroButton.setAttribute('aria-pressed', String(active && playing));
  $('.listen-fab span').textContent = t(`Listen · ${minutes(duration)} min`, `सुनें · ${minutes(duration)} मिनट`);
  $('.listen-fab').setAttribute('aria-label', t('Listen to this story', 'यह कहानी सुनें'));
  const play = $('.lp-play');
  play.innerHTML = playing ? ICON.pause : ICON.play;
  play.setAttribute('aria-label', playing ? t('Pause', 'रोकें') : t('Play', 'चलाएँ'));
  $('[data-act="back"]').setAttribute('aria-label', t('Previous sentence', 'पिछला वाक्य'));
  $('[data-act="next"]').setAttribute('aria-label', t('Next sentence', 'अगला वाक्य'));
  $('[data-act="close"]').setAttribute('aria-label', t('Close listening', 'सुनना बंद करें'));
  $('.lp-follow').setAttribute('aria-label', t('Follow the narration', 'आवाज़ के साथ चलें'));
  $('.lp-follow').hidden = follow;
  const speedButton = $('.lp-speed');
  speedButton.textContent = `${SPEEDS[speed]}×`;
  speedButton.setAttribute('aria-label', t(`Speed ${SPEEDS[speed]}×`, `गति ${SPEEDS[speed]}×`));
  seek.setAttribute('aria-label', t('Narration position', 'कथा में स्थान'));
  dock.setAttribute('aria-label', t('Listen to this page', 'यह पेज सुनें'));
  dock.dataset.playing = String(playing);
  root.dataset.listenPlaying = String(active && playing);
  progress();
}
function progress() {
  const duration = data?.duration || audio.duration || 1;
  const value = Math.min(1, audio.currentTime / duration);
  if (document.activeElement !== seek) seek.value = String(Math.round(value * 1000));
  seek.setAttribute('aria-valuetext', `${clock(audio.currentTime)} / ${clock(duration)}`);
  $('.lp-fill').style.transform = `scaleX(${value})`;
  $('.lp-time').textContent = `${clock(audio.currentTime)} / ${clock(duration)}`;
}

// ---- Highlight and follow ------------------------------------------------
function rangeFor(block, start, end) {
  const pts = block.map.points;
  let a = start, b = end - 1;
  while (a <= b && !pts[a]) a++;
  while (b >= a && !pts[b]) b--;
  if (a > b) return null;
  const range = document.createRange();
  range.setStart(pts[a][0], pts[a][1]);
  range.setEnd(pts[b][0], pts[b][1] + 1);
  return range;
}
function indexAt(time) {
  let lo = 0, hi_ = timeline.length - 1, found = -1;
  while (lo <= hi_) {
    const mid = (lo + hi_) >> 1;
    if (timeline[mid].t0 <= time) { found = mid; lo = mid + 1; } else hi_ = mid - 1;
  }
  return found;
}
function showSentence(index) {
  const item = timeline[index];
  const previous = timeline[current];
  current = index;
  if (!item) return;
  const block = blocks[item.bi];
  if (!previous || previous.bi !== item.bi) {
    if (previous) blocks[previous.bi].el.classList.remove('is-narrating');
    revealSign(block.el);
    block.el.classList.add('is-narrating');
    $('.lp-title').textContent = chapterTitle(block.chapter) || t('The sky, the sages and you', 'आकाश, ऋषि और आप');
    if (follow) bringIntoView(block.el);
  }
  sentenceMark?.clear();
  if (item.exact && sentenceMark) {
    const range = rangeFor(block, item.start, item.end);
    if (range) sentenceMark.add(range);
  }
}
function showWord(item, time) {
  if (!wordMark) return;
  wordMark.clear();
  if (!item?.exact || time > item.t1) return;
  const block = blocks[item.bi];
  const text = block.map.text;
  // Bulbul returns no word timings, so the word is placed by its share of the
  // sentence. Sentence boundaries are exact, so any drift resets every sentence.
  const share = Math.max(0, Math.min(1, (time - item.t0) / Math.max(0.01, item.t1 - item.t0)));
  const at = item.start + Math.floor(share * (item.end - item.start));
  let s = at, e = at;
  while (s > item.start && !/\s/.test(text[s - 1])) s--;
  while (e < item.end && !/\s/.test(text[e])) e++;
  const range = e > s && rangeFor(block, s, e);
  if (range) wordMark.add(range);
}
function revealSign(el) {
  const key = el.dataset.signExplanation;
  if (key && el.hidden) document.querySelector(`[data-sign-choice="${CSS.escape(key)}"]`)?.click();
}
function bringIntoView(el) {
  const box = el.getBoundingClientRect();
  const band = innerHeight;
  if (box.top > band * 0.18 && box.bottom < band * 0.68) return;
  const top = window.scrollY + box.top - band * 0.34 + Math.min(0, (band * 0.4 - box.height) / 2);
  scrolling = true;
  window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  clearTimeout(bringIntoView.timer);
  bringIntoView.timer = setTimeout(() => { scrolling = false; }, 900);
}
function tick() {
  raf = 0;
  const time = audio.currentTime;
  const index = indexAt(time);
  if (index !== current && index >= 0) showSentence(index);
  showWord(timeline[index], time);
  progress();
  if (!audio.paused) raf = requestAnimationFrame(tick);
}

// ---- Control -------------------------------------------------------------
async function ensure() {
  const wanted = hi() ? 'hi' : 'en';
  if (lang === wanted && data) return true;
  const json = await manifest(wanted);
  if (!json) return false;
  prepare(wanted, json);
  return true;
}
async function start(fromIndex) {
  if (!(await ensure())) return;
  if (!active) {
    active = true;
    root.dataset.listen = 'on';
    dock.dataset.mode = 'player';
    glow.classList.remove('is-on'); void glow.offsetWidth; glow.classList.add('is-on');
  }
  if (Number.isInteger(fromIndex) && timeline[fromIndex]) audio.currentTime = Math.max(0, timeline[fromIndex].t0 - 0.05);
  audio.playbackRate = SPEEDS[speed];
  try { await audio.play(); } catch { /* The play button stays available. */ }
  mediaSession();
}
function pause() { audio.pause(); }
function stop() {
  audio.pause();
  active = false;
  current = -1;
  sentenceMark?.clear(); wordMark?.clear();
  blocks.forEach(b => b.el.classList.remove('is-narrating'));
  delete root.dataset.listen;
  dock.dataset.mode = 'fab';
  glow.classList.remove('is-on');
  render();
}
function step(delta) {
  if (!timeline.length) return;
  const index = Math.max(0, Math.min(timeline.length - 1, (current < 0 ? indexAt(audio.currentTime) : current) + delta));
  audio.currentTime = timeline[index].t0;
  follow = true;
  showSentence(index);
  tick();
  render();
}
function mediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: t('The sky, the sages and you', 'आकाश, ऋषि और आप'),
    artist: 'AstroAshva',
    album: t('Discover Jyotish', 'ज्योतिष जानें'),
    artwork: [{ src: '/logo-mark.png', sizes: '512x512', type: 'image/png' }],
  });
  navigator.mediaSession.setActionHandler('play', () => start());
  navigator.mediaSession.setActionHandler('pause', pause);
  navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
  navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
}

heroButton.addEventListener('click', () => (active && !audio.paused ? pause() : start()));
dock.addEventListener('click', event => {
  const act = event.target.closest('[data-act]')?.dataset.act;
  if (act === 'start' || (act === 'toggle' && audio.paused)) start();
  else if (act === 'toggle') pause();
  else if (act === 'back') step(-1);
  else if (act === 'next') step(1);
  else if (act === 'close') stop();
  else if (act === 'speed') { speed = (speed + 1) % SPEEDS.length; audio.playbackRate = SPEEDS[speed]; render(); }
  else if (act === 'follow') { follow = true; if (current >= 0) bringIntoView(blocks[timeline[current].bi].el); render(); }
});
seek.addEventListener('input', () => {
  const duration = data?.duration || audio.duration || 0;
  audio.currentTime = (Number(seek.value) / 1000) * duration;
  follow = true;
  tick();
});
['play', 'pause', 'ended', 'ratechange'].forEach(name => audio.addEventListener(name, () => {
  if (name === 'play' && !raf) raf = requestAnimationFrame(tick);
  if (name === 'ended') { audio.currentTime = 0; sentenceMark?.clear(); wordMark?.clear(); }
  render();
}));

// The reader takes over scrolling; offer a way back instead of fighting them.
const takeOver = () => { if (active && !scrolling && follow) { follow = false; render(); } };
addEventListener('wheel', takeOver, { passive: true });
addEventListener('touchmove', takeOver, { passive: true });
addEventListener('keydown', event => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key) && event.target === document.body) takeOver(); });

// While listening, tapping a passage continues from there.
main.addEventListener('click', event => {
  if (!active || event.target.closest('a,button,input,summary,label')) return;
  if (String(getSelection?.() || '').length) return;
  const el = event.target.closest('.narr-block');
  const bi = blocks.findIndex(b => b.el === el);
  if (bi < 0) return;
  const index = timeline.findIndex(item => item.bi === bi);
  if (index >= 0) { follow = true; start(index); }
});

// Language switch mid-story: carry on from the same passage in the other voice.
new MutationObserver(async () => {
  const wanted = hi() ? 'hi' : 'en';
  const json = await manifest(wanted);
  if (!json) { stop(); heroButton.hidden = true; return; }
  if (!data || lang === wanted) { render(); return; }
  const wasPlaying = active && !audio.paused;
  const bi = current >= 0 ? timeline[current].bi : -1;
  audio.pause();
  sentenceMark?.clear(); wordMark?.clear();
  current = -1;
  prepare(wanted, json);
  if (!active) { render(); return; }
  const index = bi >= 0 ? timeline.findIndex(item => item.bi === bi) : 0;
  audio.currentTime = timeline[Math.max(0, index)]?.t0 || 0;
  if (wasPlaying) start(); else { showSentence(Math.max(0, index)); render(); }
}).observe(root, { attributes: true, attributeFilter: ['data-lang'] });

// The floating button appears once the hero's own button has scrolled away.
new IntersectionObserver(([entry]) => { dock.dataset.heroVisible = String(entry.isIntersecting); })
  .observe(document.querySelector('.story-hero') || main);

manifest(hi() ? 'hi' : 'en').then(json => {
  if (!json) return;
  data ??= json;
  heroButton.hidden = false;
  dock.hidden = false;
  dock.dataset.mode = 'fab';
  render();
});
