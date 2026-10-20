#!/usr/bin/env python3
"""Check the home page strings files against i18n/_source.json.

For each i18n/<code>.json: every source key present (missing keys show in
English on the site), no unknown keys, the same HTML tags in the same counts,
every {n} kept, brand names kept in Latin script, no em dashes.
Usage: python3 i18n/check.py [code ...]   (exit 1 on any problem)
"""
import json, re, sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
CODES = ['mr', 'gu', 'ta', 'bn', 'pa', 'kn', 'te', 'ml', 'or', 'es', 'zh']
BRANDS = ['AstroAshva', 'AshvaAI', 'Google Play', 'TestFlight']

def tags(s):
    return Counter(re.findall(r'</?([a-zA-Z][a-zA-Z0-9]*)', s))

def main(codes):
    src = json.loads((HERE / '_source.json').read_text())
    keys = [k for k in src if not k.startswith('_')]
    bad = 0
    for code in codes:
        p = HERE / (code + '.json')
        if not p.exists():
            print(f'{code}: missing file'); bad += 1; continue
        d = json.loads(p.read_text())
        probs = []
        if not str(d.get('_review', '')).startswith('machine draft'):
            probs.append('no _review note')
        for k in keys:
            v = d.get(k)
            if not isinstance(v, str) or not v.strip():
                probs.append(f'missing: {k[:60]}'); continue
            if tags(k) != tags(v):
                probs.append(f'tags differ: {k[:60]}')
            if k.count('{n}') != v.count('{n}'):
                probs.append(f'{{n}} lost: {k[:60]}')
            for b in BRANDS:
                if b in k and b not in v:
                    probs.append(f'{b} not kept: {k[:60]}')
            if '—' in v:
                probs.append(f'em dash: {k[:60]}')
        for k in d:
            if not k.startswith('_') and k not in src:
                probs.append(f'unknown key: {k[:60]}')
        print(f'{code}: {len(keys) - sum(1 for x in probs if x.startswith("missing"))}/{len(keys)} strings, {len(probs)} problems')
        for x in probs[:40]:
            print('   ', x)
        bad += bool(probs)
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:] or CODES))
