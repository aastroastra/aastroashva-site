#!/usr/bin/env python3
"""Builds /learn/vedic-vs-western/index.html from sign-difference-guide.json.

    python3 learn/vedic-vs-western/build.py          (write index.html)
    python3 learn/vedic-vs-western/build.py --check  (fail if index.html is stale)

The JSON beside this script is a byte-identical copy of the canonical
workspace/docs/sign-difference-guide.json, shared with the iOS and Android
apps. Edit the canonical file, copy it here, then rebuild. All copy and both
diagrams are static HTML/SVG, so the page reads fully without JavaScript;
guide.js only drives the label explorer.

DRAFT: the page carries noindex and stays out of sitemap.xml and llms.txt
until Amit approves the content (PUBLISHED = False below).
"""
import html
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = "https://www.astroashva.com"
PUBLISHED = False  # flip only after Amit's review; then drop the draft banner too

G = json.loads((HERE / "sign-difference-guide.json").read_text())
W = G["web"]
SEC = {s["id"]: s for s in G["sections"]}


def esc(s):
    return html.escape(s, quote=False)


def attr(s):
    return html.escape(s, quote=True)


def L(t, tag=None, cls=None):
    """Both languages as sibling spans; CSS shows the one matching html[data-lang]."""
    inner = f'<span lang="en">{esc(t["en"])}</span><span lang="hi">{esc(t["hi"])}</span>'
    if not tag:
        return inner
    c = f' class="{cls}"' if cls else ""
    return f"<{tag}{c}>{inner}</{tag}>"


def svg_text(t, x, y, cls="", extra=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}"{c}{extra}><tspan lang="en">{esc(t["en"])}</tspan>'
            f'<tspan lang="hi">{esc(t["hi"])}</tspan></text>')


def title_split(t):
    """'Why is my sign different?' with the last word as the accent."""
    out = {}
    for k, accent in (("en", "different?"), ("hi", "अलग")):
        i = t[k].find(accent)
        out[k] = f"{esc(t[k][:i])}<em>{esc(t[k][i:i + len(accent)])}</em>{esc(t[k][i + len(accent):])}" if i >= 0 else esc(t[k])
    return f'<span lang="en">{out["en"]}</span><span lang="hi">{out["hi"]}</span>'


# ---- Diagrams --------------------------------------------------------------

def pt(cx, cy, r, lam):
    """Ecliptic longitude lam (deg) to screen; 0 deg Aries at the left (east), counter-clockwise."""
    phi = math.radians(180 + lam)
    return cx + r * math.cos(phi), cy - r * math.sin(phi)


def arc(cx, cy, r, a0, a1):
    x0, y0 = pt(cx, cy, r, a0)
    x1, y1 = pt(cx, cy, r, a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    # Increasing longitude runs counter-clockwise on screen: sweep flag 0.
    return f"M{x0:.1f} {y0:.1f}A{r} {r} 0 {large} 0 {x1:.1f} {y1:.1f}"


def wheel_svg():
    d = SEC["zodiac"]["diagram"]
    lab = d["labels"]
    off = d["offset_deg"]
    cx = cy = 300
    ro, rm, ri, rc = 282, 228, 174, 120  # outer edge, ring split, inner edge, core
    parts = [f'<svg viewBox="0 0 600 600" class="illustration wheel" role="img" aria-labelledby="wheel-title">',
             f'<title id="wheel-title">{esc(d["caption"]["en"])}</title>',
             f'<circle cx="{cx}" cy="{cy}" r="{ro}" class="ring-tropical"/>',
             f'<circle cx="{cx}" cy="{cy}" r="{rm}" class="ring-sidereal"/>',
             f'<circle cx="{cx}" cy="{cy}" r="{ri}" class="paper-fill fine"/>']
    for k in range(12):
        # Tropical boundaries on the outer ring, sidereal ones (shifted by the ayanamsha) inside.
        x0, y0 = pt(cx, cy, rm, 30 * k); x1, y1 = pt(cx, cy, ro, 30 * k)
        parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="wheel-tick"/>')
        x0, y0 = pt(cx, cy, ri, 30 * k + off); x1, y1 = pt(cx, cy, rm, 30 * k + off)
        parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="wheel-tick"/>')
    # Two example Suns: one that moves back a sign, one that keeps its sign.
    for i, lam in enumerate(d["examples_tropical_deg"]):
        x0, y0 = pt(cx, cy, rc + 26, lam); x1, y1 = pt(cx, cy, ro, lam)
        parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="example-ray ex{i}"/>')
        x, y = pt(cx, cy, rc + 26, lam)
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" class="sun-fill ex{i}"/>'
                     f'<text x="{x:.1f}" y="{y:.1f}" class="ex-num">{i + 1}</text>')
    # The equinox line and the ayanamsha arc between the two Aries starts.
    x0, y0 = pt(cx, cy, rc - 8, 0); x1, y1 = pt(cx, cy, ro + 12, 0)
    parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="equinox-line"/>')
    x0, y0 = pt(cx, cy, rc - 8, off); x1, y1 = pt(cx, cy, rm, off)
    parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="equinox-line sidereal"/>')
    parts.append(f'<path d="{arc(cx, cy, rc + 14, 0, off)}" class="ayan-arc"/>')
    for k, name in enumerate(G["signs"]):
        x, y = pt(cx, cy, (ro + rm) / 2, 30 * k + 15)
        parts.append(svg_text(name, x, y, "sign-name" + (" is-aries" if k == 0 else "")))
        x, y = pt(cx, cy, (rm + ri) / 2, 30 * k + 15 + off)
        parts.append(svg_text(name, x, y, "sign-name sidereal" + (" is-aries" if k == 0 else "")))
    # Core labels (the example lines sit under the drawing as text).
    parts.append(svg_text(lab["tropical"], cx, cy - 64, "diagram-caption"))
    parts.append(svg_text(lab["sidereal"], cx, cy - 42, "diagram-caption sidereal-text"))
    parts.append(svg_text(lab["equinox"], cx - 44, cy - 12, "diagram-small"))
    parts.append(svg_text(lab["ayanamsha"], cx - 36, cy + 40, "diagram-name accent-text"))
    parts.append("</svg>")
    # The two example lines also sit under the drawing as text, for small screens and readers.
    legend = (f'<ol class="wheel-legend"><li>{L(lab["example_shift"])}</li><li>{L(lab["example_same"])}</li></ol>')
    return "".join(parts), legend


def sky_svg():
    d = SEC["object"]["diagram"]
    lab = d["labels"]
    cx, cy, rx, ry = 300, 400, 250, 250
    p = [f'<svg viewBox="0 0 600 470" class="illustration sky" role="img" aria-labelledby="sky-title">',
         f'<title id="sky-title">{esc(d["caption"]["en"])}</title>']
    # Faint stars.
    for x, y, r in [(90, 90, 1.6), (160, 40, 1.2), (250, 70, 1.4), (350, 34, 1.2), (430, 80, 1.7), (520, 50, 1.2),
                    (560, 150, 1.4), (40, 190, 1.2), (120, 250, 1.1), (480, 230, 1.3), (300, 120, 1.0)]:
        p.append(f'<circle cx="{x}" cy="{y}" r="{r}" class="star-dot"/>')
    # Ecliptic band: the path of the Sun and Moon, with twelve sign ticks.
    p.append(f'<path d="M{cx - rx} {cy}A{rx} {ry} 0 0 1 {cx + rx} {cy}" class="band-outer"/>')
    p.append(f'<path d="M{cx - rx + 34} {cy}A{rx - 34} {ry - 34} 0 0 1 {cx + rx - 34} {cy}" class="band-inner"/>')
    for k in range(1, 6):
        a = math.radians(180 - 30 * k)
        x0, y0 = cx + (rx - 34) * math.cos(a), cy - (ry - 34) * math.sin(a)
        x1, y1 = cx + rx * math.cos(a), cy - ry * math.sin(a)
        p.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="wheel-tick"/>')
    # Horizon and the ground.
    p.append(f'<path d="M20 {cy}H580" class="horizon"/>')
    p.append(f'<path d="M20 {cy}H580V470H20Z" class="ground"/>')
    # Lagna: where the band meets the eastern horizon (left, as on a chart facing south).
    lx = cx - rx + 17
    p.append(f'<circle cx="{lx}" cy="{cy}" r="22" class="halo"/><circle cx="{lx}" cy="{cy}" r="7" class="star-fill"/>')
    p.append(f'<path d="M{lx + 2} {cy - 30}L{lx + 2} {cy - 70}M{lx - 6} {cy - 60}L{lx + 2} {cy - 72}L{lx + 10} {cy - 60}" class="accent-line rise-arrow"/>')
    p.append(svg_text(lab["lagna"], lx + 2, cy - 88, "diagram-name accent-text"))
    # Sun high in the band, Moon lower on the other side.
    a = math.radians(122); sx, sy = cx + (rx - 17) * math.cos(a), cy - (ry - 17) * math.sin(a)
    p.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="20" class="sun-fill"/>')
    for k in range(8):
        t = math.radians(45 * k)
        p.append(f'<path d="M{sx + 27 * math.cos(t):.1f} {sy + 27 * math.sin(t):.1f}L{sx + 34 * math.cos(t):.1f} {sy + 34 * math.sin(t):.1f}" class="sun-rays"/>')
    p.append(svg_text(lab["sun"], sx, sy + 52, "diagram-name"))
    a = math.radians(40); mx, my = cx + (rx - 17) * math.cos(a), cy - (ry - 17) * math.sin(a)
    p.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="17" class="moon-fill"/>'
             f'<path d="M{mx - 4:.1f} {my - 15:.1f}A15 15 0 1 0 {mx + 14:.1f} {my + 5:.1f}A12 12 0 0 1 {mx - 4:.1f} {my - 15:.1f}" class="moon-crescent"/>')
    p.append(svg_text(lab["moon"], mx - 6, my + 44, "diagram-name"))
    # Observer.
    p.append(f'<g class="ink-line"><circle cx="{cx}" cy="{cy - 46}" r="11" class="skin"/>'
             f'<path d="M{cx} {cy - 35}V{cy - 12}M{cx} {cy - 12}L{cx - 9} {cy}M{cx} {cy - 12}L{cx + 9} {cy}M{cx - 13} {cy - 28}L{cx + 13} {cy - 28}"/></g>')
    p.append(svg_text(lab["earth"], cx, cy + 22, "diagram-small"))
    p.append(svg_text(lab["east"], 52, cy + 40, "diagram-caption"))
    p.append(svg_text(lab["west"], 548, cy + 40, "diagram-caption"))
    p.append(svg_text(lab["horizon"], 440, cy + 18, "diagram-small"))
    p.append("</svg>")
    return "".join(p)


# ---- Page ------------------------------------------------------------------

def paras(sec, cls="lead"):
    return "".join(L(b, "p", cls if i == 0 else "body") for i, b in enumerate(sec["body"]))


def chapter(num, sec, art="", wide=False, extra=""):
    return (f'<section class="chapter{" chapter-wide" if wide else ""}" id="{sec["id"]}" data-section="{sec["id"]}">'
            f'<div class="chapter-pin"><span class="chapter-number">{num:02d}</span></div>'
            f'<div class="chapter-grid"><div class="chapter-copy">{L(sec["eyebrow"], "p", "eyebrow")}{L(sec["heading"], "h2")}'
            f'{paras(sec)}{extra}</div>'
            + (f'<div class="art-panel">{art}</div>' if art else "")
            + "</div></section>")


SYMBOL = {
    "sun": '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="9" class="sun-fill"/><g class="sun-rays">'
           + "".join(f'<path d="M{24 + 14 * math.cos(math.radians(a)):.1f} {24 + 14 * math.sin(math.radians(a)):.1f}L{24 + 19 * math.cos(math.radians(a)):.1f} {24 + 19 * math.sin(math.radians(a)):.1f}"/>' for a in range(0, 360, 45))
           + "</g></svg>",
    "moon": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8A17 17 0 1 0 40 32A13 13 0 0 1 28 8Z" class="moon-fill"/></svg>',
    "horizon": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 34H44" class="ink-line"/><path d="M12 34A12 12 0 0 1 36 34" class="accent-line"/><path d="M24 22V8M18 14L24 7L30 14" class="accent-line"/></svg>',
}


def concept_cards():
    out = []
    for c in G["concepts"]:
        out.append(f'<article class="concept">{SYMBOL[c["symbol"]]}{L(c["title"], "h3")}{L(c["body"], "p")}'
                   f'{L(c["needs"], "p", "needs")}</article>')
    return f'<div class="concepts">{"".join(out)}</div>'


def lanes():
    w, v = G["lanes"]["western"], G["lanes"]["vedic"]
    lane = lambda x, cls: (f'<article class="lane {cls}">{L(x["title"], "p", "lane-title")}'
                           f'{L(x["label"], "p", "lane-label")}{L(x["example"], "p", "lane-example")}</article>')
    return (f'<div class="lanes">{lane(w, "western")}<span class="lane-bridge" aria-hidden="true">↔</span>'
            f'{lane(v, "vedic")}</div>{L(G["concise"]["takeaway"], "p", "takeaway")}')


def needs_table():
    rows = "".join(f'<li>{SYMBOL[c["symbol"]]}<div>{L(c["title"], "strong")}{L(c["needs"], "span")}</div></li>' for c in G["concepts"])
    return f'<div class="needs-card">{L(W["needs_heading"], "p", "eyebrow")}<ul class="needs-list">{rows}</ul></div>'


def facts():
    rows = "".join(f'<div class="fact"><dt>{L(f["k"])}</dt><dd>{L(f["v"])}</dd></div>' for f in SEC["astroashva"]["facts"])
    return f'<dl class="facts">{rows}</dl>'


def explorer():
    ex = G["explorer"]
    objs = "".join(f'<button type="button" data-object="{k}" aria-pressed="{str(k == "sun").lower()}">{L(v)}</button>' for k, v in ex["objects"].items())
    zods = "".join(f'<button type="button" data-zodiac="{k}" aria-pressed="{str(k == "tropical").lower()}">{L(v)}</button>' for k, v in ex["zodiacs"].items())
    states = []
    for key, text in ex["states"].items():
        o, z = key.split(".")
        head = {"en": f'{ex["objects"][o]["en"]} · {ex["zodiacs"][z]["en"]}', "hi": f'{ex["objects"][o]["hi"]} · {ex["zodiacs"][z]["hi"]}'}
        states.append(f'<div class="explain" data-state="{key}">{L(head, "strong")}{L(text, "p")}</div>')
    return (f'<div class="explorer" data-explorer>'
            f'<div class="choice-row">{L(W["explorer_body"], "span", "choice-label")}<div class="choices" role="group" aria-label="Body">{objs}</div></div>'
            f'<div class="choice-row">{L(W["explorer_zodiac"], "span", "choice-label")}<div class="choices" role="group" aria-label="Zodiac">{zods}</div></div>'
            f'<div class="explain-out" aria-live="polite">{"".join(states)}</div></div>')


def faq():
    items = "".join(f'<details id="faq-{f["id"]}"><summary>{L(f["q"])}</summary>{L(f["a"], "p")}</details>' for f in G["faq"])
    gl = "".join(f'<div><dt>{L(g["term"])}</dt><dd>{L(g["def"])}</dd></div>' for g in G["glossary"])
    return f'<div class="faq">{items}</div><div class="glossary">{L(W["glossary_heading"], "h3")}<dl>{gl}</dl></div>'


def sources():
    items = "".join(f'<li><a href="{attr(s["url"])}" rel="noopener" target="_blank">{L(s["label"])}</a><small>{esc(s["url"])}</small></li>' for s in G["sources"])
    return f'<ul class="source-index">{items}</ul>'


def page():
    url = SITE + W["path"]
    title, desc = W["title"]["en"], W["description"]["en"]
    robots = "" if PUBLISHED else '<meta name="robots" content="noindex,nofollow">\n'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": title, "description": desc,
         "isPartOf": {"@id": SITE + "/#website"}, "publisher": {"@id": SITE + "/#org"}, "inLanguage": "en",
         "about": ["Sun sign", "Moon sign", "Ascendant", "Tropical zodiac", "Sidereal zodiac", "Ayanamsha"]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "AstroAshva", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Discover Jyotish", "item": SITE + "/vedic-astrology/"},
            {"@type": "ListItem", "position": 3, "name": "Why is my sign different?", "item": url}]}]}
    wheel, legend = wheel_svg()
    zsec = SEC["zodiac"]
    head = f"""<!doctype html>
<html lang="en" data-lang="en" data-theme="white-light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{attr(desc)}">
{robots}<meta name="theme-color" content="#FFFFFF"><meta name="color-scheme" content="light dark">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{url}"><link rel="alternate" hreflang="hi" href="{url}?lang=hi"><link rel="alternate" hreflang="x-default" href="{url}">
<link rel="icon" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site-theme.css?v=6"><link rel="stylesheet" href="/vedic-astrology/story.css?v=1"><link rel="stylesheet" href="./guide.css?v=1">
<script>try{{var t=localStorage.getItem('aa-theme');if(['yellow-light','white-light','mono-light','yellow-dark','mono-dark'].includes(t))document.documentElement.dataset.theme=t;var q=new URLSearchParams(location.search).get('lang');var l=q==='hi'||q==='en'?q:localStorage.getItem('aa-lang');if(l==='hi'){{document.documentElement.dataset.lang='hi';document.documentElement.lang='hi';}}}}catch(e){{}}</script>
<script src="/site-theme.js" defer></script><script src="/pages.js" defer></script><script src="./guide.js?v=1" defer></script>
<meta property="og:type" content="article">
<meta property="og:site_name" content="AstroAshva">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{attr(title)}">
<meta property="og:description" content="{attr(desc)}">
<meta property="og:image" content="{SITE}/og-astroashva-v2.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IN"><meta property="og:locale:alternate" content="hi_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{attr(title)}">
<meta name="twitter:description" content="{attr(desc)}">
<meta name="twitter:image" content="{SITE}/og-astroashva-v2.jpg">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<meta name="guide-version" content="{G["version"]}">
</head>"""
    themes = "".join(f'<button data-site-theme="{k}" aria-label="{n}" aria-pressed="false"><span class="site-chip"><i></i></span></button>'
                     for k, n in [("yellow-light", "Gold light"), ("white-light", "Orange light"), ("mono-light", "Monochrome light"),
                                  ("yellow-dark", "Gold dark"), ("mono-dark", "Monochrome dark")])
    draft = "" if PUBLISHED else (f'<div class="draft-banner" role="note">{L(G["ui"]["draft_badge"], "strong")}'
                                  f'<span lang="en">Preview only. Not on the live site yet.</span><span lang="hi">केवल प्रीव्यू। अभी लाइव साइट पर नहीं।</span></div>')
    nav = "".join(f'<a href="#{k}">{L(v)}</a>' for k, v in W["nav"].items())
    body = f"""<body>
<a class="skip-link" href="#guide">{L({"en": "Skip to the guide", "hi": "गाइड पर जाएँ"})}</a>{draft}<header class="story-header"><a href="/" class="site-brand"><span class="site-mark" aria-hidden="true"></span>AstroAshva</a><div class="header-controls"><div class="language" role="group" aria-label="Language"><button data-set-lang="en" aria-pressed="true">EN</button><button data-set-lang="hi" aria-pressed="false">हिं</button></div><div class="site-themes" role="group" aria-label="Theme">{themes}</div></div></header>
<nav class="chapter-nav" aria-label="Guide sections">{nav}</nav>
<main id="guide">
<section class="story-hero guide-hero" id="top" data-section="concise"><div class="hero-copy">{L(W["eyebrow"], "p", "eyebrow")}<h1>{title_split(G["ui"]["title"])}</h1>{L(G["concise"]["intro"], "p", "lead")}<a class="story-button" href="#intro">{L(W["cta"])} <span aria-hidden="true">↓</span></a>{L(G["ui"]["free_note"], "p", "hero-note")}</div><div class="hero-art">{L(G["concise"]["heading"], "p", "lanes-heading")}{lanes()}</div></section>
<div class="story-body">
{chapter(1, SEC["intro"], wide=True, extra=concept_cards())}
{chapter(2, SEC["object"], art=sky_svg() + L(SEC["object"]["diagram"]["caption"], "p", "diagram-note"))}
{chapter(3, zsec, art=wheel + legend + L(zsec["diagram"]["caption"], "p", "diagram-note"))}
{chapter(4, SEC["you"], art=needs_table())}
{chapter(5, SEC["astroashva"], art=facts())}
{chapter(6, SEC["explorer"], art=explorer())}
{chapter(7, SEC["faq"], wide=True, extra=faq())}
{chapter(8, SEC["sources"], wide=True, extra=sources())}
</div>
</main>
<footer class="story-footer"><a class="site-brand" href="/"><span class="site-mark" aria-hidden="true"></span>AstroAshva</a>{L(W["footer_line"], "p")}<nav><a href="/vedic-astrology/">{L(W["related"])}</a><a href="/">{L(W["back_home"])}</a><a href="#top">{L(W["back_top"])}</a><a href="/terms.html">{L(W["terms"])}</a></nav><small>{esc(G["version"])} · © 2026 AstroAshva · AVD Studiox Private Limited</small></footer>
</body></html>
"""
    return head + "\n" + body


if __name__ == "__main__":
    out = page()
    assert "—" not in out and "–" not in out, "no em or en dashes in the page"
    target = HERE / "index.html"
    if "--check" in sys.argv:
        if not target.exists() or target.read_text() != out:
            sys.exit("learn/vedic-vs-western/index.html is stale: run python3 learn/vedic-vs-western/build.py")
        print("index.html is up to date")
    else:
        target.write_text(out)
        print(f"wrote {target} ({len(out)} bytes)")
