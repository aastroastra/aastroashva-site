"""Checks for /learn/vedic-vs-western/ (python -m unittest discover -s learn/vedic-vs-western -p 'test_*.py')."""
import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent.parent
# Present in the local workspace only (site checkout or workspace/worktrees/<name>).
CANONICAL = next((p / "docs" / "sign-difference-guide.json" for p in (SITE.parent, SITE.parent.parent)
                  if (p / "docs" / "sign-difference-guide.json").exists()), Path("/nonexistent"))
PAGE = (HERE / "index.html").read_text()
GUIDE = json.loads((HERE / "sign-difference-guide.json").read_text())


class SignGuidePage(unittest.TestCase):
    def test_page_is_built_from_the_json(self):
        r = subprocess.run([sys.executable, str(HERE / "build.py"), "--check"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_json_copy_matches_canonical_when_available(self):
        if not CANONICAL.exists():
            self.skipTest("canonical workspace/docs copy not checked out")
        self.assertEqual((HERE / "sign-difference-guide.json").read_bytes(), CANONICAL.read_bytes())

    def test_version_and_publish_state(self):
        self.assertEqual(GUIDE["version"], "guide.signs.v1")
        self.assertIn(f'content="{GUIDE["version"]}"', PAGE)
        published = "PUBLISHED = True" in (HERE / "build.py").read_text()
        listed = [("/learn/vedic-vs-western" in (SITE / f).read_text()) for f in ("sitemap.xml", "llms.txt", "llms-full.txt")]
        self.assertEqual(listed, [published] * 3)
        self.assertEqual('content="noindex' in PAGE, not published)
        self.assertEqual("draft-banner" in PAGE, not published)

    def test_renders_only_approved_copy(self):
        a = GUIDE["approved_copy"]
        for t in (a["intro"], a["takeaway"], a["technical"]["body"], a["scope"], a["explorer"]["note"]):
            for lang in ("en", "hi"):
                self.assertIn(__import__("html").escape(t[lang], quote=False), PAGE)
        for sec in GUIDE["sections"]:
            for b in sec["body"]:
                self.assertNotIn(b["en"][:60], PAGE, "unapproved draft section copy on the page")

    def test_metadata(self):
        url = "https://www.astroashva.com/learn/vedic-vs-western/"
        self.assertIn(f'<link rel="canonical" href="{url}">', PAGE)
        for tag in ("og:title", "og:description", "og:url", "og:image", "twitter:card"):
            self.assertIn(tag, PAGE)
        self.assertIn(f'hreflang="hi" href="{url}?lang=hi"', PAGE)

    def test_copy_rules(self):
        text = json.dumps(GUIDE, ensure_ascii=False)
        self.assertNotIn("—", text)
        self.assertNotIn("–", text)
        self.assertIsNone(re.search(r"\d+\s?%", text), "no percentages")
        self.assertNotIn("<form", PAGE)
        self.assertNotIn("<input", PAGE)
        self.assertNotIn("fetch(", (HERE / "guide.js").read_text())

    def test_both_languages_everywhere(self):
        self.assertEqual(PAGE.count('<span lang="en">'), PAGE.count('<span lang="hi">'))
        self.assertEqual(PAGE.count('<tspan lang="en">'), PAGE.count('<tspan lang="hi">'))
        self.assertEqual(PAGE.count('data-state="'), 6)

    def test_sources_are_the_plans_six(self):
        self.assertEqual(len(GUIDE["approved_copy"]["sources"]["items"]), 6)
        for s in GUIDE["approved_copy"]["sources"]["items"]:
            self.assertIn(f'href="{s["url"]}"', PAGE)

    def test_linked_from_discover_jyotish(self):
        self.assertIn('href="/learn/vedic-vs-western/"', (SITE / "vedic-astrology" / "index.html").read_text())


if __name__ == "__main__":
    unittest.main()
