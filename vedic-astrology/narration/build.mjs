// Builds the spoken version of /vedic-astrology/ with Sarvam Bulbul v4.
//
//   node vedic-astrology/narration/build.mjs            (both languages)
//   node vedic-astrology/narration/build.mjs hi         (one language)
//
// Needs: ffmpeg, a local Playwright, and a running static server for the site
// root (NARRATION_PAGE, default http://127.0.0.1:8765/vedic-astrology/). The
// Sarvam key never leaves Supabase: clips come from our `sarvam-tts` edge
// function, called as a throwaway anonymous user that is deleted afterwards
// (needs SUPABASE_ACCESS_TOKEN, or the "Supabase CLI" keychain item).
//
// Output: narration/<lang>.mp3 plus narration/<lang>.json, the sentence timing
// map the page uses to highlight and scroll. Clips are cached in
// .narration-cache/ at the site root, so a copy edit only re-records the
// sentences that changed.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '../..');
const CACHE = join(SITE, '.narration-cache');
const WORK = join(CACHE, 'work');
const PAGE = process.env.NARRATION_PAGE || 'http://127.0.0.1:8765/vedic-astrology/';
const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE
  || resolve(SITE, '../screenshots/store-generator/node_modules/playwright/index.mjs');
const BASE = 'https://gttszlununmqivrqevwv.supabase.co';
const PROJECT = 'gttszlununmqivrqevwv';
const ANON = readFileSync(join(SITE, 'landing.js'), 'utf8').match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/)[0];
const RATE = 24000;

// Pauses, in seconds, chosen to sound like someone reading aloud.
const GAP = { sentence: 0.28, block: 0.5, heading: 0.75, chapter: 1.2 };

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'hi'];
mkdirSync(WORK, { recursive: true });

// ---- 1. Text, exactly as the page selects it -----------------------------
const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(PAGE);
const extracted = await page.evaluate(async list => {
  const core = await import(new URL('narration-core.mjs', location.href).href);
  const main = document.querySelector('main');
  return Object.fromEntries(list.map(lang => [lang, {
    version: core.NARRATION_VERSION,
    blocks: core.collect(main, lang).map(b => ({
      tag: b.el.tagName.toLowerCase(),
      kind: b.el.classList.contains('eyebrow') ? 'eyebrow' : /^H[1-3]$/.test(b.el.tagName) ? 'heading' : 'text',
      chapter: b.chapter,
      fingerprint: core.fingerprint(b.map.text),
      sentences: b.sentences,
    })),
  }]));
}, langs);
await browser.close();

// ---- 2. What the voice should say for each sentence ----------------------
const DEVA = '०१२३४५६७८९';
function spoken(text, lang, kind) {
  let s = text.replace(/\s+/g, ' ').trim();
  s = s.replace(/[०-९]/g, d => String(DEVA.indexOf(d)));
  if (lang === 'en') {
    if (kind === 'eyebrow') s = s.toLowerCase().replace(/^./, c => c.toUpperCase()).replace(/\bact 0?(\d)/, 'Act $1').replace(/jyotish|mahabharata|parashari/g, w => w[0].toUpperCase() + w.slice(1));
    s = s.replace(/(\d+)°(\d+)′/g, '$1 degrees $2 minutes').replace(/(\d+)°/g, '$1 degrees')
      .replace(/\b(\d+) CE\b/g, '$1 C.E.').replace(/century CE/g, 'century C.E.').replace(/\bKP\b/g, 'K.P.');
  } else {
    s = s.replace(/(\d+)°(\d+)′/g, '$1 डिग्री $2 मिनट').replace(/(\d+)°/g, '$1 डिग्री').replace(/भाग 0?(\d)/, 'भाग $1');
  }
  s = s.replace(/\s·\s/g, kind === 'text' ? ', ' : '. ');
  if (!/[.!?।"”’]$/.test(s)) s += lang === 'hi' ? '।' : '.';
  return s;
}

// ---- 3. Clips from our edge function (cached) ----------------------------
let session;
async function token() {
  if (session) return session.access_token;
  const res = await fetch(`${BASE}/auth/v1/signup`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { purpose: 'site-narration-build' } }),
  });
  session = await res.json();
  if (!session.access_token) throw new Error(`anonymous sign-in failed: ${res.status}`);
  return session.access_token;
}
async function clip(text, lang) {
  const key = createHash('sha256').update(`bulbul-v4\0${lang}\0${text}`).digest('hex').slice(0, 24);
  const file = join(CACHE, `${lang}-${key}.mp3`);
  if (existsSync(file)) return file;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${BASE}/functions/v1/sarvam-tts`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: lang }),
    });
    const body = await res.json().catch(() => ({}));
    const audios = body?.data?.audios;
    if (res.ok && audios?.length) {
      writeFileSync(file, Buffer.concat(audios.map(a => Buffer.from(a, 'base64'))));
      return file;
    }
    if (attempt >= 4) throw new Error(`sarvam-tts ${res.status} for "${text.slice(0, 40)}": ${JSON.stringify(body?.error)}`);
    await new Promise(r => setTimeout(r, 1500 * attempt));
  }
}
async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

// Decode to 24 kHz mono PCM with the leading and trailing silence trimmed, so
// each sentence's timing starts on its first sound.
function pcm(file) {
  return execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-af',
    'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse',
    '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
}
const silence = seconds => Buffer.alloc(Math.round(seconds * RATE) * 2);

async function deleteUser() {
  if (!session?.user?.id) return;
  let pat = process.env.SUPABASE_ACCESS_TOKEN;
  if (!pat) {
    try {
      const raw = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w']).toString().trim();
      pat = raw.startsWith('go-keyring-base64:') ? Buffer.from(raw.slice(18), 'base64').toString() : raw;
    } catch { /* reported below */ }
  }
  const res = pat && await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `delete from auth.users where id = '${session.user.id}' and is_anonymous` }),
  });
  console.log(res?.ok ? 'Removed the temporary build user.' : `Remove temporary user ${session.user.id} by hand.`);
}

try {
  for (const lang of langs) {
    const { version, blocks } = extracted[lang];
    const jobs = blocks.flatMap((b, bi) => b.sentences.map((s, si) => ({ bi, si, say: spoken(s.text, lang, b.kind) })));
    console.log(`${lang}: ${blocks.length} blocks, ${jobs.length} sentences`);
    const files = await pool(jobs, 4, async job => clip(job.say, lang));

    const parts = [silence(0.35)];
    let t = 0.35;
    const map = blocks.map(b => ({ c: b.chapter, f: b.fingerprint, s: [] }));
    jobs.forEach((job, i) => {
      const audio = pcm(files[i]);
      const dur = audio.length / 2 / RATE;
      const s = blocks[job.bi].sentences[job.si];
      map[job.bi].s.push([s.start, s.end, +t.toFixed(3), +(t + dur).toFixed(3)]);
      parts.push(audio);
      t += dur;
      const nextJob = jobs[i + 1];
      const gap = !nextJob ? 1.0
        : nextJob.bi === job.bi ? GAP.sentence
        : blocks[nextJob.bi].chapter !== blocks[job.bi].chapter ? GAP.chapter
        : blocks[job.bi].kind !== 'text' ? GAP.heading : GAP.block;
      parts.push(silence(gap));
      t += gap;
    });

    const raw = join(WORK, `${lang}.pcm`);
    writeFileSync(raw, Buffer.concat(parts));
    const mp3 = join(HERE, `${lang}.mp3`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', raw,
      '-af', 'loudnorm=I=-17:TP=-1.5:LRA=9', '-ar', String(RATE), '-c:a', 'libmp3lame', '-b:a', '56k', mp3]);
    rmSync(raw);
    const manifest = {
      version, lang, model: 'bulbul:v4-flash', engine: 'Sarvam Bulbul v4',
      duration: +t.toFixed(2), audio: `${lang}.mp3`, blocks: map,
    };
    writeFileSync(join(HERE, `${lang}.json`), JSON.stringify(manifest));
    console.log(`${lang}: ${Math.floor(t / 60)}m ${Math.round(t % 60)}s → narration/${lang}.mp3`);
  }
} finally {
  await deleteUser();
}
