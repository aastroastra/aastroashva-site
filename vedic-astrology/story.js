import { SIGNS, STARS, LORDS, skyAddress, kpAt } from './learning.mjs';

const root = document.documentElement;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const hi = () => root.dataset.lang === 'hi';
const label = pair => pair[hi() ? 1 : 0];
const number = (value, decimals = 0) => new Intl.NumberFormat(hi() ? 'hi-IN-u-nu-deva' : 'en', {maximumFractionDigits:decimals}).format(value);
let selectedSign = 'moon';

function updateMoon() {
  const input = $('#moon-position');
  if (!input) return;
  const address = skyAddress(Number(input.value));
  $('[data-moon-sign]').textContent = label(SIGNS[address.sign]);
  $('[data-moon-star]').textContent = `${label(STARS[address.star])} · ${hi() ? 'पद' : 'Pada'} ${number(address.pada)}`;
  input.setAttribute('aria-valuetext', `${number(address.angle, 1)}°, ${label(SIGNS[address.sign])}, ${label(STARS[address.star])}, ${hi() ? 'पद' : 'Pada'} ${number(address.pada)}`);
  const radians = (address.angle - 90) * Math.PI / 180;
  const x = 300 + 212 * Math.cos(radians), y = 300 + 212 * Math.sin(radians);
  $('.moon-marker').setAttribute('transform', `translate(${x - 450} ${y - 150})`);
  $('.moon-spoke').setAttribute('d', `M300 300L${x} ${y}`);
}
function updateKP() {
  const input = $('#kp-position');
  if (!input) return;
  const part = kpAt(Number(input.value));
  const text = `${label(LORDS[part.lord])} · ${hi() ? 'उप-स्वामी' : 'sub-lord'}`;
  $('#kp-readout').textContent = text;
  input.setAttribute('aria-valuetext', `${number(Number(input.value), 2)}°, ${text}`);
  $$('.kp-piece').forEach((piece, i) => piece.classList.toggle('is-active', i === part.lord));
}
function updateSigns() {
  $$('[data-sign-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.signChoice === selectedSign)));
  $$('[data-sign-explanation]').forEach(item => item.hidden = item.dataset.signExplanation !== selectedSign);
  $$('[data-sign-marker]').forEach(item => item.style.opacity = item.dataset.signMarker === selectedSign ? '1' : '.25');
}
function translate() {
  $$('svg [data-en][data-hi]').forEach(node => node.textContent = hi() ? node.dataset.hi : node.dataset.en);
  document.title = hi() ? 'आकाश, ऋषि और आप · ज्योतिष जानें · AstroAshva' : 'The Sky, the Sages, and You · Discover Jyotish · AstroAshva';
  updateMoon(); updateKP(); updateSigns(); updateMotionLabel();
}
$('#moon-position')?.addEventListener('input', updateMoon);
$('#kp-position')?.addEventListener('input', updateKP);
$$('[data-sign-choice]').forEach(button => button.addEventListener('click', () => { selectedSign = button.dataset.signChoice; updateSigns(); }));
$$('[data-quiz]').forEach(quiz => {
  quiz.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    quiz.querySelectorAll('button').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    quiz.querySelectorAll('[data-answer]').forEach(answer => answer.hidden = answer.dataset.answer !== button.dataset.correct);
  }));
});
$$('[data-interactive]').forEach(node => node.hidden = false);
$$('[data-js-static]').forEach(node => node.hidden = true);

// Native scroll remains the only navigation. This line tracks progress without
// allocating any continuous animation loop while the reader is idle.
const thread = $('.story-thread span'), progress = $('.nav-progress');
let scrollQueued = false;
let bounds = {top:0,height:1};
const anchors = ['sages','sky-address','reading'];
let positions = [];
function measure() {
  const body = $('.story-body');
  bounds = {top:body.getBoundingClientRect().top + window.scrollY, height:body.offsetHeight};
  positions = anchors.map(id => ({id, top:document.getElementById(id)?.getBoundingClientRect().top + window.scrollY || Infinity}));
  drawProgress();
}
function drawProgress() {
  scrollQueued = false;
  const value = Math.max(0, Math.min(1, (window.scrollY + innerHeight * .55 - bounds.top) / bounds.height));
  thread.style.height = `${value * 100}%`;
  const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progress.style.transform = `scaleX(${Math.max(0,Math.min(1,scrollY/total))})`;
  let current = '';
  for (const p of positions) if (scrollY + innerHeight * .45 >= p.top) current = p.id;
  $$('.chapter-nav a').forEach(a => {
    if (a.hash === `#${current}`) a.setAttribute('aria-current','true');
    else a.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(drawProgress); } }, {passive:true});

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled = !reduce.matches;
try { if (localStorage.getItem('aa-story-motion') === 'off') motionEnabled = false; } catch { /* Optional preference. */ }
let motionContext;
function updateMotionLabel() {
  const button = $('[data-motion]');
  button.hidden = !window.gsap || !window.ScrollTrigger;
  button.setAttribute('aria-pressed', String(!motionEnabled));
  button.setAttribute('aria-label', hi() ? 'एनीमेशन रोकें' : 'Pause animation');
  button.textContent = motionEnabled ? (hi() ? 'एनीमेशन चालू' : 'Motion on') : (hi() ? 'एनीमेशन बंद' : 'Motion off');
  root.dataset.motionOff = String(!motionEnabled);
}
function setupMotion() {
  motionContext?.revert();
  motionContext = undefined;
  updateMotionLabel();
  const {gsap, ScrollTrigger, MorphSVGPlugin} = window;
  if (!gsap || !ScrollTrigger || !motionEnabled) return;
  gsap.registerPlugin(ScrollTrigger);
  if (MorphSVGPlugin) gsap.registerPlugin(MorphSVGPlugin);
  motionContext = gsap.context(() => {
    $$('.chapter').forEach(chapter => {
      const art = chapter.querySelector('.art-panel');
      if (!art) return;
      const timeline = gsap.timeline({scrollTrigger:{trigger:art,start:'top 88%',end:'bottom 35%',scrub:1}});
      const paths = [...art.querySelectorAll('.draw')];
      paths.forEach(path => {
        const length = path.getTotalLength();
        timeline.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1,ease:'none'},0);
      });
      if (chapter.id === 'hope') {
        timeline.fromTo(art.querySelector('.hope-light'),{opacity:.15},{opacity:1,duration:1},0);
        timeline.fromTo(art.querySelector('.hope-person'),{x:15},{x:0,duration:1},0);
      }
      if (chapter.id === 'sages') {
        timeline.fromTo(art.querySelectorAll('.sage-star'),{opacity:.2},{opacity:1,stagger:.08,duration:.45},0);
      }
      if (chapter.id === 'kp') {
        timeline.fromTo(art.querySelector('.kp-lens'),{scale:.85,svgOrigin:'300 197'},{scale:1,duration:.8},0);
        timeline.fromTo(art.querySelectorAll('.kp-piece'),{y:20},{y:0,stagger:.04,duration:.7},0);
      }
      if (chapter.id === 'parashara' && MorphSVGPlugin) {
        const path = art.querySelector('[data-morph-to]');
        if (path) timeline.to(path,{morphSVG:path.dataset.morphTo,duration:1,ease:'none'},0);
      }
    });
    gsap.to('.hero-sky .sky-orbit',{rotation:12,svgOrigin:'300 280',ease:'none',scrollTrigger:{trigger:'.story-hero',start:'top top',end:'bottom top',scrub:1}});
  });
  ScrollTrigger.refresh();
}
$('[data-motion]').addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  try { localStorage.setItem('aa-story-motion', motionEnabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
  setupMotion();
});
reduce.addEventListener('change', () => {
  motionEnabled = !reduce.matches;
  try { if (localStorage.getItem('aa-story-motion') === 'off') motionEnabled = false; } catch { /* Optional preference. */ }
  setupMotion();
});
new MutationObserver(() => { translate(); measure(); window.ScrollTrigger?.refresh(); }).observe(root,{attributes:true,attributeFilter:['data-lang']});
new ResizeObserver(measure).observe($('.story-body'));
window.addEventListener('resize', measure, {passive:true});
document.fonts?.ready.then(() => { measure(); window.ScrollTrigger?.refresh(); });
translate(); measure();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMotion, {once:true});
else setupMotion();
