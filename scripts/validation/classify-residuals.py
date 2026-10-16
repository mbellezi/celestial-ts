#!/usr/bin/env python3
"""Attach evidence to raw audit disagreements without changing their counts.

Run after compare-swiss.py and the Pluto/node diagnostics. Unexplained cases
remain explicit, including any new body, date, sign or direction mismatch.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'docs/validation'
names = ['swiss-1930-2040.json', 'swiss-pluto-speed-diagnostic.json', 'true-node-segment-join.json']
audit, pluto, node = [json.loads((DIRECTORY / name).read_text()) for name in names]
assert audit['swissVersion'] == pluto['swissVersion'] == node['swissVersion']
pluto_cases = {case['jdUT']: case for case in pluto['cases']}
cases = []
totals = {}
for mode in ['sameUT', 'sameTT']:
    counts = {'rawSignDisagreements': 0, 'rawRetrogradeDisagreements': 0,
              'referenceFrameConvention': 0, 'referenceSegmentJoin': 0,
              'unexplainedSignDisagreements': 0, 'unexplainedRetrogradeDisagreements': 0}
    for witness in audit['disagreementWitnesses']:
        reference = witness['comparisons'][mode]['reference']
        core = witness['core']
        sign_mismatch = core['signIndex'] != reference['signIndex']
        retro_mismatch = core['retrograde'] != reference['retrograde']
        if not (sign_mismatch or retro_mismatch):
            continue
        counts['rawSignDisagreements'] += sign_mismatch
        counts['rawRetrogradeDisagreements'] += retro_mismatch
        counts['unexplainedSignDisagreements'] += sign_mismatch
        category = 'unexplained'
        evidence = None
        if retro_mismatch and witness['body']['id'] == 9 and witness['jdUT'] in pluto_cases:
            isolated = pluto_cases[witness['jdUT']]['variants']['apparent']
            if core['retrograde'] == isolated['centralRetrograde'] == isolated['correctedSpeedRetrograde']:
                category = 'referenceFrameConvention'
                evidence = 'swiss-pluto-speed-diagnostic.json'
        elif retro_mismatch and witness['body']['id'] == 11 and witness['jdUT'] == node['jdUT']:
            differences = node['independentPositionCentralDifferences']
            # Wide differences and a narrow stencil wholly inside one segment
            # agree with the interpolant. The Swiss short stencil straddles the join.
            selected = [d for d in differences if d['stepDays'] in [0.1, 0.00001]]
            if len(selected) == 2 and all((d['degreesPerDay'] < 0) == core['retrograde'] for d in selected):
                category = 'referenceSegmentJoin'
                evidence = 'true-node-segment-join.json'
        if retro_mismatch:
            counts['unexplainedRetrogradeDisagreements' if category == 'unexplained' else category] += 1
        cases.append({'mode': mode, 'jdUT': witness['jdUT'], 'utIso': witness['utIso'],
                      'body': witness['body'], 'signDisagreement': sign_mismatch,
                      'retrogradeDisagreement': retro_mismatch, 'category': category,
                      'evidence': evidence, 'coreSpeedDegreesDay': core['coordinates'][3],
                      'swissSpeedDegreesDay': reference['coordinates'][3]})
    assert counts['rawSignDisagreements'] == sum(b['signDisagreements'] for b in audit['comparisons'][mode])
    assert counts['rawRetrogradeDisagreements'] == sum(b['retrogradeDisagreements'] for b in audit['comparisons'][mode])
    totals[mode] = counts
result = {'description': 'Evidence classification of every raw disagreement. No samples or original counts are removed or relabelled.',
          'limitation': 'Classification covers these sampled witnesses only. It does not establish continuous accuracy or equivalence of velocity conventions.',
          'wasmSha256': audit['coreManifest']['hashes']['pkg/celestial_wasm_bg.wasm'],
          'sourceSha256': {name: hashlib.sha256((DIRECTORY/name).read_bytes()).hexdigest() for name in names},
          'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'totals': totals, 'cases': cases}
(DIRECTORY / 'residual-classification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(totals, indent=2))
