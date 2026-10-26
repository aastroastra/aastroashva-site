#!/usr/bin/env python3
"""Builds /learn/vedic-vs-western/index.html from sign-difference-guide.json.

    python3 learn/vedic-vs-western/build.py          (write index.html)
    python3 learn/vedic-vs-western/build.py --check  (fail if index.html is stale)

The JSON beside this script is a byte-identical copy of the canonical
workspace/docs/sign-difference-guide.json, shared with the iOS and Android
apps. Edit the canonical file, copy it here, then rebuild. All copy and both
diagrams are static HTML/SVG, so the page reads fully without JavaScript;
guide.js only drives the label explorer.

Copy: only the approved_copy block (Amit approved the Hub plan and prototype
copy, 26 Oct 2026), rendered verbatim. Lines added for the web page are listed
in approved_copy.web_added_lines. PUBLISHED = True: indexable, in sitemap.xml
and llms.txt.
"""
import html
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = "https://www.astroashva.com"
PUBLISHED = True  # Amit approved the copy 26 Oct 2026; False restores noindex and the draft banner

G = json.loads((HERE / "sign-difference-guide.json").read_text())
A = G["approved_copy"]  # Amit-approved EN/HI copy (Hub plan + prototype), rendered verbatim
W = G["web"]            # page chrome only: path and footer links
SEC = {s["id"]: s for s in G["sections"]}


def T(en, hi):
    return {"en": en, "hi": hi}


# Diagram labels: names only, no numbers or worked examples (see approved_copy.web_added_lines).
SKY = {"sun": A["explorer"]["names"]["sun"], "moon": A["explorer"]["names"]["moon"], "lagna": T("Lagna", "लग्न"),
       "east": T("East", "पूर्व"), "west": T("West", "पश्चिम"), "horizon": T("Horizon", "क्षितिज"), "earth": T("You", "आप")}
WHEEL = {"tropical": A["explorer"]["names"]["tropical"], "sidereal": A["explorer"]["names"]["sidereal"],
         "equinox": T("March equinox", "मार्च विषुव"), "ayanamsha": T("Ayanamsha", "अयनांश")}


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
    lab = WHEEL
    off = SEC["zodiac"]["diagram"]["offset_deg"]  # drawing only; no number is printed
    cx = cy = 300
    ro, rm, ri, rc = 282, 228, 174, 120  # outer edge, ring split, inner edge, core
    parts = [f'<svg viewBox="0 0 600 600" class="illustration wheel" role="img" aria-labelledby="wheel-title">',
             f'<title id="wheel-title">{esc(A["technical"]["body"]["en"])}</title>',
             f'<circle cx="{cx}" cy="{cy}" r="{ro}" class="ring-tropical"/>',
             f'<circle cx="{cx}" cy="{cy}" r="{rm}" class="ring-sidereal"/>',
             f'<circle cx="{cx}" cy="{cy}" r="{ri}" class="paper-fill fine"/>']
    for k in range(12):
        # Tropical boundaries on the outer ring, sidereal ones (shifted by the ayanamsha) inside.
        x0, y0 = pt(cx, cy, rm, 30 * k); x1, y1 = pt(cx, cy, ro, 30 * k)
        parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="wheel-tick"/>')
        x0, y0 = pt(cx, cy, ri, 30 * k + off); x1, y1 = pt(cx, cy, rm, 30 * k + off)
        parts.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" class="wheel-tick"/>')
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
    # Core labels.
    parts.append(svg_text(lab["tropical"], cx, cy - 64, "diagram-caption"))
    parts.append(svg_text(lab["sidereal"], cx, cy - 42, "diagram-caption sidereal-text"))
    parts.append(svg_text(lab["equinox"], cx - 44, cy - 12, "diagram-small"))
    parts.append(svg_text(lab["ayanamsha"], cx - 30, cy + 40, "diagram-name accent-text"))
    parts.append("</svg>")
    return "".join(parts)


def sky_svg():
    lab = SKY
    cx, cy, rx, ry = 300, 400, 250, 250
    p = [f'<svg viewBox="0 0 600 470" class="illustration sky" role="img" aria-labelledby="sky-title">',
         f'<title id="sky-title">{esc(" ".join(c["body"]["en"] for c in A["concepts"]))}</title>']
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

def section(num, sid, heading, inner, art="", wide=False):
    return (f'<section class="chapter{" chapter-wide" if wide else ""}" id="{sid}">'
            f'<div class="chapter-pin"><span class="chapter-number">{num:02d}</span></div>'
            f'<div class="chapter-grid"><div class="chapter-copy">{L(heading, "h2")}{inner}</div>'
            + (f'<div class="art-panel">{art}</div>' if art else "") + "</div></section>")


SYMBOL = {
    "sun": '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="9" class="sun-fill"/><g class="sun-rays">'
           + "".join(f'<path d="M{24 + 14 * math.cos(math.radians(a)):.1f} {24 + 14 * math.sin(math.radians(a)):.1f}L{24 + 19 * math.cos(math.radians(a)):.1f} {24 + 19 * math.sin(math.radians(a)):.1f}"/>' for a in range(0, 360, 45))
           + "</g></svg>",
    "moon": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8A17 17 0 1 0 40 32A13 13 0 0 1 28 8Z" class="moon-fill"/></svg>',
    "lagna": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 34H44" class="ink-line"/><path d="M12 34A12 12 0 0 1 36 34" class="accent-line"/><path d="M24 22V8M18 14L24 7L30 14" class="accent-line"/></svg>',
}


def concept_cards():
    return '<div class="concepts">' + "".join(
        f'<article class="concept">{SYMBOL[c["id"]]}{L(c["title"], "h3")}{L(c["body"], "p")}</article>'
        for c in A["concepts"]) + "</div>"


def lanes():
    lane = lambda x, cls: (f'<article class="lane {cls}">{L(x["title"], "p", "lane-title")}'
                           f'{L(x["label"], "p", "lane-label")}{L(x["example"], "p", "lane-example")}</article>')
    return (f'<div class="lanes">{lane(A["lanes"]["western"], "western")}<span class="lane-bridge" aria-hidden="true">↔</span>'
            f'{lane(A["lanes"]["vedic"], "vedic")}</div>{L(A["takeaway"], "p", "takeaway")}')


def explorer():
    ex = A["explorer"]
    n = ex["names"]
    objs = "".join(f'<button type="button" data-object="{k}" aria-pressed="{str(k == "sun").lower()}">{L(n[k])}</button>' for k in ("sun", "moon", "rising"))
    zods = "".join(f'<button type="button" data-zodiac="{k}" aria-pressed="{str(k == "tropical").lower()}">{L(n[k])}</button>' for k in ("tropical", "sidereal"))
    states = []
    # The prototype's rule: the Sun has a text per zodiac; the Moon and Lagna have one each.
    for o in ("sun", "moon", "rising"):
        for z in ("tropical", "sidereal"):
            text = ex["explanations"][f"{o}.{z}" if o == "sun" else o]
            head = {k: f'{n[o][k]} · {n[z][k]}' for k in ("en", "hi")}
            states.append(f'<div class="explain" data-state="{o}.{z}">{L(head, "strong")}{L(text, "p")}</div>')
    return (f'<div class="explorer" data-explorer>'
            f'<div class="choice-row"><div class="choices" role="group" aria-label="Object">{objs}</div></div>'
            f'<div class="choice-row"><div class="choices" role="group" aria-label="Zodiac">{zods}</div></div>'
            f'<div class="explain-out" aria-live="polite">{"".join(states)}</div></div>')


def faq():
    return '<div class="faq">' + "".join(f'<details><summary>{L(f["q"])}</summary>{L(f["a"], "p")}</details>' for f in A["faq"]["items"]) + "</div>"


def sources():
    items = "".join(f'<li><a href="{attr(s["url"])}" rel="noopener" target="_blank">{L(s["label"])}</a><small>{L(s["supports"])}</small></li>' for s in A["sources"]["items"])
    return f'<ul class="source-index">{items}</ul>{L(A["sources"]["limit"], "p", "body")}{L(A["scope"], "p", "body")}'


def page():
    url = SITE + W["path"]
    title = A["title"]["en"] + " Western and Vedic signs · AstroAshva"
    desc = A["intro"]["en"]
    robots = "" if PUBLISHED else '<meta name="robots" content="noindex,nofollow">\n'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": title, "description": desc,
         "isPartOf": {"@id": SITE + "/#website"}, "publisher": {"@id": SITE + "/#org"}, "inLanguage": "en",
         "about": ["Sun sign", "Moon sign", "Ascendant", "Tropical zodiac", "Sidereal zodiac", "Ayanamsha"]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "AstroAshva", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Discover Jyotish", "item": SITE + "/vedic-astrology/"},
            {"@type": "ListItem", "position": 3, "name": A["title"]["en"], "item": url}]}]}
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
<link rel="stylesheet" href="/site-theme.css?v=6"><link rel="stylesheet" href="/vedic-astrology/story.css?v=1"><link rel="stylesheet" href="./guide.css?v=2">
<script>try{{var t=localStorage.getItem('aa-theme');if(['yellow-light','white-light','mono-light','yellow-dark','mono-dark'].includes(t))document.documentElement.dataset.theme=t;var q=new URLSearchParams(location.search).get('lang');var l=q==='hi'||q==='en'?q:localStorage.getItem('aa-lang');if(l==='hi'){{document.documentElement.dataset.lang='hi';document.documentElement.lang='hi';}}}}catch(e){{}}</script>
<script src="/site-theme.js" defer></script><script src="/pages.js" defer></script><script src="./guide.js?v=2" defer></script>
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
    body = f"""<body>
<a class="skip-link" href="#guide">{L({"en": "Skip to the guide", "hi": "गाइड पर जाएँ"})}</a>{draft}<header class="story-header"><a href="/" class="site-brand"><span class="site-mark" aria-hidden="true"></span>AstroAshva</a><div class="header-controls"><div class="language" role="group" aria-label="Language"><button data-set-lang="en" aria-pressed="true">EN</button><button data-set-lang="hi" aria-pressed="false">हिं</button></div><div class="site-themes" role="group" aria-label="Theme">{themes}</div></div></header>
<main id="guide">
<section class="story-hero guide-hero" id="top"><div class="hero-copy"><h1>{title_split(A["title"])}</h1>{L(A["intro"], "p", "lead")}<a class="story-button" href="#labels">{L(A["read_full"])} <span aria-hidden="true">↓</span></a></div><div class="hero-art">{lanes()}</div></section>
<div class="story-body">
{section(1, "labels", A["heading"], concept_cards(), art=sky_svg())}
{section(2, "zodiac", A["technical"]["title"], L(A["technical"]["body"], "p", "lead"), art=wheel_svg())}
{section(3, "explore", A["explorer"]["title"], L(A["explorer"]["note"], "p", "lead"), art=explorer())}
{section(4, "faq", A["faq"]["title"], faq(), wide=True)}
{section(5, "sources", A["sources"]["title"], sources(), wide=True)}
</div>
</main>
<footer class="story-footer"><a class="site-brand" href="/"><span class="site-mark" aria-hidden="true"></span>AstroAshva</a><nav><a href="/vedic-astrology/">{L(W["related"])}</a><a href="/">{L(W["back_home"])}</a><a href="#top">{L(W["back_top"])}</a><a href="/terms.html">{L(W["terms"])}</a></nav><small>{esc(G["version"])} · © 2026 AstroAshva · AVD Studiox Private Limited</small></footer>
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
