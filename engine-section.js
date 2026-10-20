/* One scroll-driven illustration, with the same stages in the mobile spine.
   Geometry is measured on resize/content changes, never on each scroll frame.
   No live calculations, user data, network calls or time-driven animation. */
(function () {
  'use strict';
  var section = document.getElementById('our-engine');
  if (!section) return;
  var root = document.documentElement;
  var journey = section.querySelector('[data-engine-journey]');
  var steps = Array.from(section.querySelectorAll('[data-engine-step]'));
  var wires = Array.from(section.querySelectorAll('[data-wire]'));
  var parts = Array.from(section.querySelectorAll('[data-part]'));
  var tip = section.querySelector('[data-engine-tip]');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var ranges = [], lengths = [], queued = false, measuring = false;
  var mini = steps.map(function (step) {
    return Array.from(step.querySelectorAll('.engine-mini .wire')).map(function (wire) {
      wire.setAttribute('pathLength', '1');
      return wire;
    });
  });
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function frame() {
    queued = false;
    if (!ranges.length) return;
    // Match the page thread's 62% eye point so its exit follows our final wire.
    var eye = scrollY + innerHeight * 0.62;
    var all = reduced.matches;
    var active = 0;
    ranges.forEach(function (range, i) { if (eye >= range.top) active = i; });
    section.dataset.engineStage = all ? 'complete' : String(active);
    var overall = all ? 1 : clamp((eye - ranges[0].top) / (ranges[ranges.length - 1].bottom - ranges[0].top));
    journey.style.setProperty('--engine-progress', overall.toFixed(4));
    steps.forEach(function (step, i) {
      var progress = all ? 1 : clamp((eye - ranges[i].top) / (ranges[i].bottom - ranges[i].top));
      var offset = (1 - progress).toFixed(4);
      step.style.setProperty('--mini-progress', progress.toFixed(4));
      wires[i].style.setProperty('--wire-offset', offset);
      mini[i].forEach(function (wire) { wire.style.setProperty('--wire-offset', offset); });
      parts[i].classList.toggle('on', progress > 0.08);
      step.classList.toggle('active', !all && active === i);
      step.classList.toggle('complete', progress >= 1);
      if (i === steps.length - 1) section.querySelector('.engine-instrument').classList.toggle('finished', progress >= 1);
      if (!all && active === i) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
      if (tip && i === active) {
        tip.style.opacity = !all && progress > 0 && progress < 1 ? '1' : '0';
        if (!all && progress > 0 && progress < 1) {
          var point = wires[i].getPointAtLength(progress * lengths[i]);
          tip.setAttribute('cx', point.x.toFixed(2));
          tip.setAttribute('cy', point.y.toFixed(2));
        }
      }
    });
  }
  function scrollFrame() {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }
  function measure() {
    measuring = false;
    ranges = steps.map(function (step) {
      var box = step.getBoundingClientRect();
      return { top: box.top + scrollY, bottom: box.bottom + scrollY };
    });
    lengths = wires.map(function (wire) { return wire.getTotalLength(); });
    frame();
  }
  function remeasure() {
    if (!measuring) { measuring = true; requestAnimationFrame(measure); }
  }
  function motion() {
    root.classList.toggle('engine-motion', !reduced.matches);
    measure();
    // The main thread also needs to rebuild when the compact static layout changes.
    document.dispatchEvent(new CustomEvent('aa:engine-layout'));
  }
  section.querySelectorAll('details').forEach(function (detail) {
    detail.addEventListener('toggle', remeasure);
  });
  section.querySelector('.engine-review-link').addEventListener('click', function () {
    section.querySelector('#engine-review').open = true;
  });
  motion();
  addEventListener('scroll', scrollFrame, { passive: true });
  addEventListener('resize', remeasure);
  addEventListener('load', remeasure);
  reduced.addEventListener('change', motion);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(remeasure);
    observer.observe(journey);
    // Scenes above us can change height after images, fonts or language settle.
    observer.observe(document.querySelector('main'));
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (button) {
    button.addEventListener('click', remeasure);
  });
  document.addEventListener('aa:lang', remeasure);
})();
