/* Label explorer for /learn/vedic-vs-western/. Static: it only shows one of
   the six pre-written explanations already in the page. No fetch, no input. */
(() => {
  'use strict';
  const box = document.querySelector('[data-explorer]');
  if (!box) return;
  box.classList.add('is-live');
  let object = 'sun', zodiac = 'tropical';
  function render() {
    box.querySelectorAll('[data-object]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.object === object)));
    box.querySelectorAll('[data-zodiac]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.zodiac === zodiac)));
    box.querySelectorAll('[data-state]').forEach(el => { el.hidden = el.dataset.state !== object + '.' + zodiac; });
  }
  box.querySelectorAll('[data-object]').forEach(b => b.addEventListener('click', () => { object = b.dataset.object; render(); }));
  box.querySelectorAll('[data-zodiac]').forEach(b => b.addEventListener('click', () => { zodiac = b.dataset.zodiac; render(); }));
  render();
})();
