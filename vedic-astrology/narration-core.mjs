// Shared by the page player and the audio build (narration/build.mjs), so the
// sentence list the audio was recorded from is exactly the one the page
// highlights. Change a rule here and the audio must be rebuilt.

export const NARRATION_VERSION = 1;

// A narrated block is one of these elements holding the visible text directly
// in a <span lang="…">.
const BLOCKS = 'h1,h2,h3,p,li,.guide-note,.question,.timeline-date';
// Navigation, notes, disclaimers, controls and folded detail stay silent.
const SILENT = 'details,svg,a,button,label,.hero-note,.diagram-note,.sources-intro,.source-index,.quiz,.lineage,.planet-type,.reading-tile,.address-readout,[data-js-static],.lesson-control,.kp-controls';

/** Text of a language span with <br> read as a line break, and where each character lives. */
export function textMap(span) {
  let text = '';
  const points = [];
  const walk = node => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        for (let i = 0; i < child.data.length; i++) { points.push([child, i]); text += child.data[i]; }
      } else if (child.nodeName === 'BR') {
        points.push(null); text += '\n';
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(span);
  return { text, points };
}

/** Sentence ranges [start, end) in a block's text. A line break inside a heading stays one phrase. */
export function sentences(text) {
  const out = [];
  let start = 0;
  const push = end => {
    const raw = text.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body) out.push({ start: start + lead, end: start + lead + body.length });
    start = end;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (!'.!?।'.includes(c)) continue;
    let j = i + 1;
    while (j < text.length && '.!?।"”’)'.includes(text[j])) j++;
    if (j < text.length && !/\s/.test(text[j])) continue;
    // An initial ("K. S.", "के. एस.") is not a sentence end.
    if (c === '.' && /(^|\s)([A-Z]|[\u0900-\u097F]{1,2})$/.test(text.slice(Math.max(0, i - 3), i))) continue;
    push(j);
    i = j - 1;
  }
  push(text.length);
  return out;
}

/** Every narrated block for a language, in reading order. */
export function collect(root, lang) {
  const blocks = [];
  for (const el of root.querySelectorAll(BLOCKS)) {
    if (el.closest(SILENT)) continue;
    const span = [...el.children].find(c => c.tagName === 'SPAN' && c.getAttribute('lang') === lang);
    if (!span) continue;
    const map = textMap(span);
    const list = sentences(map.text);
    if (!list.length) continue;
    const chapter = el.closest('section[id]')?.id || '';
    blocks.push({ el, span, map, chapter, sentences: list.map(s => ({ ...s, text: map.text.slice(s.start, s.end) })) });
  }
  return blocks;
}

/** Small stable hash so the page can tell when its copy no longer matches the audio. */
export function fingerprint(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
