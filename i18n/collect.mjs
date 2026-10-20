// Crawl the home page in collect mode and write every English key it meets
// (with its Hindi pair) in first-seen order. Serve the site root first, e.g.
// python3 -m http.server 8791, then: node i18n/collect.mjs /tmp/keys.json
// and merge new keys into i18n/_source.json (it runs as ?lang=es; every key
// is recorded whether or not es.json has it). Analytics requests are blocked.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
// PLAYWRIGHT_DIR: a node_modules folder that has playwright installed.
const require = createRequire((process.env.PLAYWRIGHT_DIR || process.cwd() + '/node_modules') + '/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8791/';
const OUT = process.argv[2];
const LANG = process.env.CLANG || 'es';
const all = {};
const order = [];
function merge(m) { for (const [k, v] of Object.entries(m || {})) { if (!(k in all)) { order.push(k); all[k] = v; } else if (!all[k] && v) all[k] = v; } }

const browser = await chromium.launch();
async function visit(query, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, userAgent: opts.ua, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
  await ctx.addInitScript(() => { window.AA_I18N_COLLECT = true; try { localStorage.setItem('aa-site-hero', 'null'); localStorage.setItem('aa-first-visit-done', '1'); } catch (e) {} });
  await ctx.route(/googletagmanager|google-analytics|analytics\.google|download_events/, r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('pageerror', query, e.message));
  await page.goto(BASE + '?stay&lang=' + LANG + (query ? '&' + query : ''), { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  if (opts.full) {
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(60); }
    await page.evaluate(() => window.scrollTo(0, 0));
    // Houses: each caption.
    await page.evaluate(() => document.querySelectorAll('.hc-h').forEach(b => { b.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); }));
    for (const b of await page.$$('.hc-h')) { await b.focus(); await page.waitForTimeout(30); }
    // Multi-match types.
    for (const c of await page.$$('[data-mm-type]')) { await c.evaluate(e => e.click()); await page.waitForTimeout(150); }
    // A feature dialog.
    const f = await page.$('.feat.opens'); if (f) { await f.evaluate(e => e.click()); await page.waitForTimeout(200); await page.keyboard.press('Escape'); }
    await page.waitForTimeout(3500);
  }
  if (opts.grahas) {
    for (const g of await page.$$('[data-hb-grahas] > *')) { await g.evaluate(e => { e.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' })); e.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); e.click && e.click(); }); await page.waitForTimeout(80); }
  }
  if (opts.wait) await page.waitForTimeout(opts.wait);
  merge(await page.evaluate(() => window.AA_i18n && window.AA_i18n.collected()));
  await ctx.close();
}
await visit('', { full: true });
await visit('', { viewport: { width: 390, height: 844 }, mobile: true, full: true, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
await visit('', { viewport: { width: 390, height: 844 }, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
await visit('hero=a', { full: true });
await visit('hero=b', { grahas: true, wait: 1500 });
const CV = await (async () => { const ctx = await browser.newContext(); const p = await ctx.newPage(); await p.goto(BASE + '?lang=' + LANG); const v = await p.evaluate(() => window.AA_CANVASES); await ctx.close(); return v; })();
for (const c of CV) await visit('canvas=' + c, { wait: 6000 });
for (const o of ['sharad', 'kartik', 'buddha', 'guru']) await visit('canvas=purnima&occasion=' + o, { wait: 500 });
for (const ev of ['2027-02-21', '2027-08-02']) await visit('canvas=eclipse&ev=' + ev, { wait: 500 });
for (const ev of ['2026-10-31', '2026-12-05', '2027-01-25', '2027-06-03', '2027-06-26', '2027-10-20', '2027-11-26']) await visit('canvas=transit&ev=' + ev, { wait: 4000 });
await browser.close();
const out = {}; for (const k of order) out[k] = all[k];
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('keys', order.length);
