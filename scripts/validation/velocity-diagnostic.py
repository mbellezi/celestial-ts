#!/usr/bin/env python3
"""Explain residual velocity differences at the full audit's worst samples.

python scripts/validation/velocity-diagnostic.py --ephe /path/to/pinned/ephe
This does not change the standard Swiss comparison or the engine. It separates
solar gravitational deflection, frame-derivative conventions and interpolation errors.
Run only after rebuilding and regenerating the full audit for the intended model.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import swisseph as swe

ROOT = Path(__file__).resolve().parents[2]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ephe', type=Path, required=True)
    args = parser.parse_args()
    source = ROOT / 'docs/validation/swiss-1930-2040.json'
    audit = json.loads(source.read_text())
    for item in audit['ephemerisManifest']['files']:
        if hashlib.sha256((args.ephe/item['name']).read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Ephemeris hash mismatch')
    swe.set_ephe_path(str(args.ephe.resolve()))
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    def calc(tt, body, requested):
        values, returned = swe.calc(tt, body, requested)
        if returned & 7 != swe.FLG_SWIEPH:
            raise ValueError('Swiss fallback')
        return values
    audited_hashes = audit['coreManifest']['hashes']
    model_paths = ['core/src/astronomy/engine.rs',
                   'core/src/astronomy/planetary.rs',
                   'core/src/astronomy/pluto.rs',
                   'core/src/astronomy/chiron.rs',
                   'core/src/astronomy/delta_t.rs',
                   'core/src/astronomy/nodes.rs',
                   'core/src/astronomy/deflection.rs',
                   'core/src/astronomy/precision_ephemeris.rs',
                   'core/src/astronomy/precision-ephemeris.bin',
                   'core/src/astronomy/precision-ephemeris.manifest.json',
                   'core/src/astronomy/lunar-node.manifest.json',
                   'core/data/delta-t.json',
                   'core/src/astronomy/lunar-node.bin', 'core/data/delta-t.bin']
    provenance = []
    for rel in model_paths:
        local = ROOT/rel
        current = hashlib.sha256(local.read_bytes()).hexdigest() if local.exists() else None
        provenance.append({'path':rel,'auditedSha256':audited_hashes.get(rel),
            'currentSha256':current,'matchesCurrent':current is not None and audited_hashes.get(rel)==current})
    # Do not attach the present model's explanation to an older binary audit.
    if not all(item['matchesCurrent'] for item in provenance):
        raise ValueError('Audit provenance differs from the current deflection/table model; regenerate the full audit first')
    results = []
    for body in audit['comparisons']['sameUT']:
        worst = body['metrics']['speedLongitude']['worst']
        tt = worst['jdUT'] + swe.deltat_ex(worst['jdUT'], swe.FLG_SWIEPH)
        standard = calc(tt, body['id'], flags)
        no_deflection = calc(tt, body['id'], flags | swe.FLG_NOGDEFL)
        derivatives = []
        for h in [0.1, 0.01, 0.001, 0.0001]:
            plus = calc(tt+h, body['id'], swe.FLG_SWIEPH)
            minus = calc(tt-h, body['id'], swe.FLG_SWIEPH)
            interval = (tt+h)-(tt-h)
            rate = ((plus[0]-minus[0]+180)%360-180)/interval
            # swe.ECL_NUT returns true obliquity at index 0. This auxiliary
            # quantity has no ephemeris backend flag; do not assert SWIEPH on it.
            eps_plus = swe.calc(tt+h, swe.ECL_NUT, 0)[0][0]
            eps_minus = swe.calc(tt-h, swe.ECL_NUT, 0)[0][0]
            eps_rate = (eps_plus-eps_minus)/interval
            frame_term = math.cos(math.radians(standard[0]))*math.tan(math.radians(standard[1]))*eps_rate
            derivatives.append({'requestedStepDays':h,'representedIntervalDays':interval,
                'degreesPerDay':rate,'trueObliquityRateDegreesDay':eps_rate,
                'obliquityFrameTermDegreesDay':frame_term,
                'swissReportedPlusFrameTermDegreesDay':standard[3]+frame_term,
                'coreMinusSwissReportedPlusFrameTermDegreesDay':worst['core']-standard[3]-frame_term,
                'finiteDifferenceMinusSwissReportedPlusFrameTermDegreesDay':rate-standard[3]-frame_term})
        results.append({'id':body['id'],'body':body['name'],'jdUT':worst['jdUT'],
            'coreSpeedDegreesDay':worst['core'],'swissStandardSpeedDegreesDay':standard[3],
            'swissNoDeflectionSpeedDegreesDay':no_deflection[3],
            'coreMinusSwissStandardDegreesDay':worst['core']-standard[3],
            'coreMinusSwissNoDeflectionDegreesDay':worst['core']-no_deflection[3],
            'standardFlagsRequested':flags,'noDeflectionFlagsRequested':flags | swe.FLG_NOGDEFL,
            'swissPositionFiniteDifferences':derivatives,
            'longitudeDeflectionArcsec':((standard[0]-no_deflection[0]+180)%360-180)*3600})
    output = {'sourceAuditSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'swissVersion':swe.version,'ephemerisManifest':audit['ephemerisManifest'],
        'currentModelProvenance':provenance,
        'frameDerivativeEquation':'d(longitude)/dt = longitude rate from rotated velocity + cos(longitude)*tan(latitude)*d(true obliquity)/dt; mean obliquity replaces true obliquity under NONUT',
        'referenceCaseEvidence':['docs/validation/swiss-pluto-speed-diagnostic.json','docs/validation/true-node-segment-join.json'],
        'scope':'Worst velocity samples from the full standard comparison, not a separate full-grid audit.',
        'notes':[
            'The audited model includes solar gravitational deflection with a finite-source-distance correction and an effective solar mass profile inside the solar disk; NOGDEFL is a diagnostic comparison, not the engine model.',
            'The model uses explicit full-state Chebyshev tables for Moon, Mercury, Neptune and Pluto in the supported interval, and an independent-observable quarter-day cubic table for the true node. Table provenance is recorded in the main audit hashes.',
            'A longitude derivative includes the changing obliquity rotation. Swiss SPEED omits that final ecliptic frame term for the documented Pluto reference cases. The reported correction isolates that term; it is not a blanket explanation of every residual.',
            'At a lunar source Chebyshev join, short Swiss position differences can cross a discontinuity and produce a narrow speed spike. The separate true-node evidence retains the raw disagreement and identifies the exact source boundary.',
            'Standard-comparison errors and sign/retrograde disagreement counts are retained in the main audit; no samples are excluded.'],
        'cases':results}
    target = ROOT/'docs/validation/velocity-residuals.json'
    target.write_text(json.dumps(output,indent=2)+'\n')
    print(target)

if __name__ == '__main__':
    main()
