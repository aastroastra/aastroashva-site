## Why is my sign different? guide, 26 October 2026 (DRAFT)

`/learn/vedic-vs-western/` is generated: `python3 learn/vedic-vs-western/build.py`
writes `index.html` from `sign-difference-guide.json`, a byte-identical copy of
the canonical `workspace/docs/sign-difference-guide.json` shared with the iOS and
Android guide (version `guide.signs.v1`). Edit the canonical JSON, copy it in,
rebuild; `test_guide.py` fails on a stale page. Both diagrams are inline SVG with
`<tspan lang>` labels; `guide.js` only drives the static label explorer (no fetch,
no input). Until Amit approves the copy: `PUBLISHED = False` in build.py (noindex
plus a draft banner), and the page stays out of `sitemap.xml`, `llms.txt` and
`llms-full.txt`. To publish: set `PUBLISHED = True`, rebuild, add the URL (with the
`?lang=hi` alternate) to `sitemap.xml` and a line to `llms.txt`, then merge.
No listen mode yet: record narration only after the copy is final.

## Search and AI answer engines, 21 October 2026

- `/` renders Hindi for a new visitor, so it is the `hi` and `x-default` URL. Every
  other language is `/?lang=<code>`; the head script makes that URL its own canonical.
  Keep `index.html` hreflang, `sitemap.xml` alternates and `i18n.js` codes in step.
- One JSON-LD graph in `index.html` (Organization, Brand, WebSite, WebPage,
  MobileApplication, FAQPage). The FAQPage text must equal the English text of the
  visible `#faq` section; change both together. No ratings or reviews unless real.
- Public pages carry Open Graph tags and WebPage + BreadcrumbList JSON-LD.
- `llms.txt` and `llms-full.txt` are the factual summary for AI crawlers. Update them
  when prices, platforms, languages or features change. `robots.txt` names the main
  search and AI crawlers explicitly; every group carries the same Disallow list.
- New FAQ strings are in `i18n/_source.json` and all eleven language files
  (machine drafts, native review pending).

## Calculation transparency, 11 October 2026

The section is an illustrated scroll journey: details → positions → our Vedic
code → sample reference comparisons → reading and correction. On desktop the
orbital SVG stays in view beside five stages; on mobile the page thread visits
five stations with smaller diagrams. `engine-section.js` draws the wires from
scroll progress and reverses them when scrolling back. It measures again after
font, language, disclosure, viewport and upstream layout changes. Reduced motion
shows the whole diagram and removes pinning; all copy and disclosures work
without JavaScript. The artwork is labelled as an illustration, not a live API call.

`thread.js` hands off at the instrument's inlet and resumes at its outlet.
The exit uses a separate SVG path because dash patterns restart at each move
command; otherwise the exit would draw before its scroll window. Keep the
mobile station centres aligned with the 18px page spine. Colours follow the
five site palettes. Public source and review details use native disclosures.

The public home section `/#our-engine` explains the staged API rollout in English
and Hindi, credits Astronomy Engine 2.1.19 (MIT), distinguishes JPL position
comparisons from astrological claims, and provides a correction email template
and review guidance. The footer links directly to it. This is an email intake,
not a ticket portal or a promise of individual review for every reading.

Its dated feature scope was checked against production routing: planetary
positions, major dasha periods, Sarvashtakavarga and horoscope text are enabled
on our engine; other features still use a provider during comparison testing.
Update the snapshot when that scope changes. The backend's existing JPL fixture
tests passed for seven bodies at twenty sample dates spanning 1900–2050.
These are sample position checks, not a certification of the app or its readings.
Keep NASA/JPL non-endorsement and the distinction between the open-source library
and AstroAshva's own API explicit. Do not publish private engine review documents.

The AshvaAI explainer also labels its example and acknowledges variable,
fallible AI explanations instead of promising identical answers.

## Hero canvas, 11 October 2026

The drawing behind the home page title is a pluggable canvas: `kundali-north`
(default), `kundali-south` and `diya` (Diwali). The head script in `index.html`
picks it before first paint (`?canvas=<id>` preview, else the cached
`site_hero` config); `hero-c.js` draws it and refreshes the config from the
public `app_config.site_hero` row after paint, swapping in place only if it
differs. Change it, or schedule a festival preset, from the admin console's
Icon palette page (Website canvas section); no deploy needed. The canvas has
equal gaps above and below (6% of the screen height, 40 to 72px).

## No public APK or IPA, 29 September 2026

Founder decision for Google Ads approval: the site does not host or link any
APK, IPA or iOS OTA install. People get the app only through Google Play
(production, open testing, internal testing) and TestFlight (public beta and
internal). `/beta/` lists those four channels and nothing else.

- The public Supabase `site` bucket no longer holds `.apk`, `.ipa`,
  `manifest.plist`, `version.json` or `version-ios.json`. It keeps `stats.json`
  (home counter, written by `update-stats.py`) and `logo-mark.png`.
- `./publish.sh` refuses by default. `./publish.sh --private [apk]` uploads to the
  PRIVATE `builds-internal` bucket and prints a 7-day signed link for the team.
- The release hub keeps installer hashes as evidence but never mirrors installers
  to GitHub Releases and never writes OTA manifests (`release-tools/`).
- The removed builds are archived locally in
  `~/Documents/AstroAstra/build-artifacts/site-bucket-archive-2026-09-29/`.

## Company document access, 24 September 2026

The document pages described historically below now use a shared server-side login. `/internal/` opens the company hub; `/legal/`, `/credits/`, `/ownapi/`, `/release/` and `/differences/` redirect to their gated counterparts at `https://aastroastra-company.vercel.app`. GitHub Pages cannot enforce authentication, so the existing Vercel team hosts the document service separately. Direct content, assets and JSON routes on that service require its secure session cookie. Plaintext new legal guidance, store setup and passwords are never stored in this public repository. Runtime source and maintenance are in `AstroAstra/company-docs/`.

Customer policies, account deletion, status and store marketing assets remain public. Historical public-safe release/parity JSON and report feeds remain available to automation and the protected hub. Installer URLs and iOS OTA manifests were removed on 29 September 2026. Existing public Git history cannot be retroactively protected. Internal entry links are removed from public navigation and sitemap; robots excludes these paths and entry pages declare noindex. The encrypted investor deck retains its previous access until its original key is available for migration.

The credits guide now documents Apple consumable IAP, Google Play consumable one-time products and RevenueCat offering `credits`, using store IDs `credits_100`, `credits_500`, `credits_1000`. iOS Google Play wording was corrected in app source; this does not publish a new iOS binary or activate store products.


## Historical implementation notes

# AstroAshva: landing site

Static marketing site with five light and dark themes. Hosted on GitHub Pages.
(Superseded 29 Sep 2026: no public APK. See the top of this file.)
`./publish.sh --private /path/to/signed.apk` shares a build with the team only.

Requires Android SDK `aapt2`, Python 3 and `SUPABASE_SERVICE_ROLE_KEY` for the
existing project, or a Supabase CLI login permitted to read its service key.
Credentials are used only for Storage requests and are never logged. Bucket
access, size and artifact-version failures stop publication before upload.

Publisher checks: `python3 -m unittest discover -s . -p 'test_publish_storage.py' -v`.

## Credit system design preview

`/credits/` serves `credits/index.html`, an interactive HTML proposal. `credits/plan.md` contains the complete product, architecture, billing-policy and migration plan, with primary sources checked on 18 September 2026. The wallet, packages, holds and pricing calculator are simulations; the page never connects to payment or account APIs. It is public and marked noindex while it remains a proposal. Reload/reset starts a new demo; this does not model granting welcome credits repeatedly to real accounts.

The static Pages build includes the entire `credits` directory. The footer links to the preview in English and Hindi. Its first-purchase, free reopen/cache restoration, changed birth data, failure release, duplicate completion, low-balance, top-up and margin-calculator flows were checked in Chrome at 320, 390, 768 and 1440 pixel widths. No billing backend or current app paywall is changed by this preview.

## Shared subpage theme

`/release/` and `/credits/` load `site-theme.css` and `site-theme.js` for the homepage's logo, typography, five palettes and `aa-theme` preference. A theme chosen on any of these pages carries across navigation. Subpage theme controls also work when browser storage is unavailable; the initial fallback follows the system light/dark preference.

`/deck/` serves the private investor presentation. Its body is committed only as an AES-256-GCM encrypted payload, and the passcode is never stored in the repository. The browser derives a key with PBKDF2-SHA-256 and keeps the exported session key only in `sessionStorage` until the viewer locks the deck or closes the tab. `deck/README.md` records the content, source and maintenance contract. Market facts are dated and sourced; revenue scenarios are explicitly labeled as management assumptions rather than traction or forecasts.

Keep the palette values and theme identifiers in these shared assets aligned with `index.html`. The homepage does not load these assets. Theme switching preserves release filters and the current simulated wallet operation. The Pages build copies both assets with the rest of the static site.

`/ownapi/` serves a private, encrypted API-replacement plan with shared themes,
endpoint pricing search and adjustable cost/token calculators. It does not
implement or enable a replacement calculation API. Plaintext source and the
password are kept outside this public repository. See `ownapi/README.md`.

## Living functionality comparison

`/differences/` compares 40 reviewed feature contracts across iOS and Android;
`/differences/data.json` is the same public-safe JSON feed. `/diffrecnes/` redirects
to the canonical page. It uses the shared five-theme design and distinguishes
source alignment, known gaps, intentional native differences and pending reviews.

Read [shared parity rules](differences/PARITY_RULES.md) and
[automation maintenance](parity-tools/README.md). Source manifests live in each
app at `.parity/features.json`. Signed GitHub push hooks record every branch push
through the existing backend; the page reads this feed every minute and marks
affected areas stale. Manual source workflows can also publish full snapshots
to `differences-data` when private Actions runners are available.
The existing scheduled site workflow also reconciles both main branches with
`RELEASE_SOURCE_TOKEN`; failed reconciliation is visible and retains old evidence.
Commit/feature summaries are public; source links require private-repository access.

## Referral invite links (`/r/<CODE>`) and app links

- `https://www.astroashva.com/r/<CODE>` has no file of its own (Pages is
  static). `/404.html` matches `/r/<CODE>` and `location.replace`s to
  `/r/?c=<CODE>` (query string and hash kept), which serves `r/index.html`.
  `r/r.js` reads the code from `?c=`, `?code=`, the `/r/<CODE>` path or the
  hash, upper-cases it and checks `^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6,8}$`.
  In the apps the same URL is caught first by App Links / Universal Links.
- The page never shows credit amounts (admin-controlled). Google Play button:
  `details?id=com.avdstudiox.android&referrer=utm_source%3Dreferral%26referral_code%3D<CODE>`
  (Install Referrer). "Open in app": Android `intent://www.aastroastra.com/r/<CODE>`
  (the old host on purpose: every build lists it) with the Play URL as fallback; iOS `aastroastra://r/<CODE>` (a Universal
  Link tapped on its own domain stays in Safari). The iOS store button copies
  the code so the app can offer to paste it. `/r/` is `noindex` and disallowed
  in `robots.txt`.
- `.well-known/` is published because `release-tools/build_site.py` allows
  that one dot directory (other dot entries stay private). It holds
  `assetlinks.json` (Play App Signing key + upload key) and the extensionless
  `apple-app-site-association` (served by Pages as `application/octet-stream`;
  Apple's CDN accepts it when it is a 200 over HTTPS without redirects). The
  apex `astroashva.com` 301s to `www`, so the apps must associate
  `www.astroashva.com` (new builds add it beside the old entries). Old builds
  only associate `www.aastroastra.com`, which no longer serves these files
  (6 Oct 2026 move), so their https links open in the browser. After deploy,
  check `https://app-site-association.cdn-apple.com/a/v1/www.astroashva.com`.
