#!/usr/bin/env python3
"""Reproduce with pyswisseph 2.10.3.2 (lib 2.10.03), no repo dependencies:
node scripts/validation/export-core.mjs /tmp/celestial-core-audit.bin
/tmp/celestial-swiss-audit-venv/bin/python scripts/validation/compare-swiss.py   --ephe /tmp/celestial-swiss-ephe --input /tmp/celestial-core-audit.bin
Swiss files must have manifest.json with pinned upstream commit and SHA256.
This samples dates; it does not certify continuous accuracy between samples.
"""
import argparse, array, datetime, hashlib, json, math, pathlib, struct, time, sys, importlib.metadata
import swisseph as swe

def require(condition, message):
    if not condition:
        raise ValueError(message)

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ephe', required=True, type=pathlib.Path)
    p.add_argument('--input', default='/tmp/celestial-core-audit.bin', type=pathlib.Path)
    p.add_argument('--output', default='docs/validation/swiss-1930-2040.json', type=pathlib.Path)
    a = p.parse_args()
    started = time.monotonic()

    def digest(p):
        return hashlib.sha256(p.read_bytes()).hexdigest()
    m = json.loads(pathlib.Path(str(a.input) + '.json').read_text())
    require(digest(a.input) == m['binarySha256'], 'Core binary hash mismatch')
    ephe = json.loads((a.ephe / 'manifest.json').read_text())
    for f in ephe['files']:
        require(digest(a.ephe / f['name']) == f['sha256'], f"Ephemeris hash mismatch: {f['name']}")
    swe.set_ephe_path(str(a.ephe.resolve()))
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    metrics = {'longitude': (0, 'degrees'), 'latitude': (1, 'degrees'), 'distance': (2, 'AU'), 'speedLongitude': (3, 'degrees/day')}
    thresholds = {'1arcsec': 1 / 3600, '1arcmin': 1 / 60, '6arcmin': 0.1, '1degree': 1}

    def iso(jd):
        return (datetime.datetime(2000, 1, 1, 12, tzinfo=datetime.timezone.utc) + datetime.timedelta(milliseconds=round((jd - 2451545) * 86400000))).isoformat().replace('+00:00', '')

    def angular(v):
        return (v + 180) % 360 - 180
    stats = {mode: [{'errors': {k: array.array('d') for k in metrics}, 'worst': {}, 'signDisagreements': 0, 'retrogradeDisagreements': 0} for b in m['bodies']] for mode in ['sameUT', 'sameTT']}
    dt = array.array('d')
    dt_worst = None
    samples = []
    disagreements = []
    checked = 0
    sample_jds = [m['sampling']['startInclusiveJD'], *m['sampling']['extraJD']]
    fmt = struct.Struct('<' + 'd' * m['recordDoubles'])
    with a.input.open('rb') as src:
        while (raw := src.read(fmt.size)):
            require(len(raw) == fmt.size, 'Truncated core record')
            row = fmt.unpack(raw)
            jd, core_dt = row[:2]
            diff = (core_dt - swe.deltat_ex(jd, swe.FLG_SWIEPH)) * 86400
            dt.append(abs(diff))
            if dt_worst is None or abs(diff) > abs(dt_worst['coreMinusSwissSeconds']):
                dt_worst = {'jdUT': jd, 'utIso': iso(jd), 'coreMinusSwissSeconds': diff}
            sample = {'jdUT': jd, 'utIso': iso(jd), 'deltaTCoreSeconds': core_dt * 86400, 'deltaTSwissSeconds': core_dt * 86400 - diff, 'bodies': []} if jd in sample_jds else None
            for bi, body in enumerate(m['bodies']):
                core = row[2 + bi * 6:2 + (bi + 1) * 6]
                positions = {}
                for mode in stats:
                    reference, ret = swe.calc_ut(jd, body['id'], flags) if mode == 'sameUT' else swe.calc(jd + core_dt, body['id'], flags)
                    require(ret & (swe.FLG_JPLEPH | swe.FLG_SWIEPH | swe.FLG_MOSEPH) == swe.FLG_SWIEPH, f'Swiss fallback: {mode}, JD={jd}, body={body}, flags={ret}')
                    require(all((math.isfinite(x) for x in reference)), f'Non-finite Swiss position: JD={jd}, body={body}')
                    positions[mode] = reference
                    s = stats[mode][bi]
                    s['signDisagreements'] += int(int(core[0] % 360 // 30) != int(reference[0] % 360 // 30))
                    s['retrogradeDisagreements'] += int((core[3] < 0) != (reference[3] < 0))
                    for key, (ix, unit) in metrics.items():
                        delta = angular(core[ix] - reference[ix]) if ix == 0 else core[ix] - reference[ix]
                        error = abs(delta)
                        s['errors'][key].append(error)
                        if key not in s['worst'] or error > s['worst'][key]['absoluteError']:
                            s['worst'][key] = {'absoluteError': error, 'signedError': delta, 'jdUT': jd, 'utIso': iso(jd), 'core': core[ix], 'swiss': reference[ix]}
                mismatch_modes = [mode for mode, reference in positions.items() if int(core[0] % 360 // 30) != int(reference[0] % 360 // 30) or (core[3] < 0) != (reference[3] < 0)]
                if mismatch_modes:
                    def witness(position):
                        boundary = round(position[0] / 30) * 30
                        distance = angular(position[0] - boundary)
                        return {'coordinates': position, 'signIndex': int(position[0] % 360 // 30), 'retrograde': position[3] < 0, 'nearestSignBoundaryDegrees': boundary % 360, 'signedDistanceToBoundaryArcsec': distance * 3600, 'linearTimeToBoundarySeconds': -distance / position[3] * 86400 if position[3] else None}
                    diagnostic = {}
                    for mode in positions:
                        no_deflection, returned = swe.calc_ut(jd, body['id'], flags | swe.FLG_NOGDEFL) if mode == 'sameUT' else swe.calc(jd + core_dt, body['id'], flags | swe.FLG_NOGDEFL)
                        require(returned & (swe.FLG_JPLEPH | swe.FLG_SWIEPH | swe.FLG_MOSEPH) == swe.FLG_SWIEPH, 'Swiss diagnostic fallback')
                        central_speeds = {}
                        for step in (0.001, 0.01, 0.1):
                            def at(offset):
                                value, returned_flags = swe.calc_ut(jd + offset, body['id'], swe.FLG_SWIEPH) if mode == 'sameUT' else swe.calc(jd + core_dt + offset, body['id'], swe.FLG_SWIEPH)
                                require(returned_flags & (swe.FLG_JPLEPH | swe.FLG_SWIEPH | swe.FLG_MOSEPH) == swe.FLG_SWIEPH, 'Swiss finite-difference fallback')
                                return value[0]
                            central_speeds[str(step)] = angular(at(step) - at(-step)) / (((jd if mode == 'sameUT' else jd + core_dt) + step) - ((jd if mode == 'sameUT' else jd + core_dt) - step))
                        diagnostic[mode] = {'centralDifferenceLongitudeSpeedDegreesPerDayByStepDays': central_speeds, 'reference': witness(positions[mode]), 'withoutGravitationalDeflection': witness(no_deflection), 'noDeflectionFlagsReturned': returned, 'longitudeCoreMinusReferenceArcsec': angular(core[0] - positions[mode][0]) * 3600, 'longitudeCoreMinusNoDeflectionArcsec': angular(core[0] - no_deflection[0]) * 3600, 'speedCoreMinusReferenceDegreesPerDay': core[3] - positions[mode][3]}
                    disagreements.append({'jdUT': jd, 'utIso': iso(jd), 'body': body, 'deltaTCoreSeconds': core_dt * 86400, 'deltaTSwissSeconds': core_dt * 86400 - diff, 'core': witness(core), 'mismatchModes': mismatch_modes, 'comparisons': diagnostic})
                if sample is not None:
                    sample['bodies'].append({'id': body['id'], 'name': body['name'], 'core': core, 'swissUT': positions['sameUT'], 'swissCoreTT': positions['sameTT']})
            if sample is not None:
                samples.append(sample)
            checked += 1
            if checked % 20000 == 0:
                print(f"{checked}/{m['records']} records; {time.monotonic() - started:.1f}s", flush=True)
    require(checked == m['records'], 'Core record count mismatch')

    def summary(values):
        ordered = sorted(values)
        n = len(ordered)

        def percentile(q):
            pos = (n - 1) * q
            lo = int(pos)
            return ordered[lo] + (ordered[min(lo + 1, n - 1)] - ordered[lo]) * (pos - lo)
        return {'max': ordered[-1], 'p50': percentile(0.5), 'p95': percentile(0.95), 'p99': percentile(0.99), 'rms': math.sqrt(math.fsum((v * v for v in values)) / n)}
    result = {}
    for mode, entries in stats.items():
        result[mode] = []
        for body, s in zip(m['bodies'], entries):
            result[mode].append({**body, 'count': checked, 'signDisagreements': s['signDisagreements'], 'retrogradeDisagreements': s['retrogradeDisagreements'], 'metrics': {key: {'unit': unit, **summary(s['errors'][key]), 'worst': s['worst'][key], **({'exceedanceCounts': {name: sum((v > threshold for v in s['errors'][key])) for name, threshold in thresholds.items()}} if key in ['longitude', 'latitude'] else {})} for key, (ix, unit) in metrics.items()}})
    out = {'schemaVersion': 1, 'description': 'Apparent tropical geocentric core WASM versus Swiss Ephemeris; sameUT uses independent delta T; sameTT uses core delta T for both. Absolute-error percentiles use linear interpolation. Thresholds are descriptive, not user requirements.', 'limitation': 'Six-hour grid plus 10000 deterministic random instants and explicit samples is not continuous certification. No interpretations changed.', 'timeConvention': 'jdUT and utIso use conventional UT1 Julian days rendered as calendar ISO labels; no UT1-to-UTC or leap-second conversion. Historical and future delta T values are models, not asserted observations.', 'wrapperVersion': importlib.metadata.version('pyswisseph'), 'pythonVersion': sys.version, 'auditScriptHashes': {str(path.relative_to(pathlib.Path(__file__).resolve().parents[2])): digest(path) for path in [pathlib.Path(__file__).resolve(), pathlib.Path(__file__).with_name('export-core.mjs').resolve()]}, 'swissVersion': swe.version, 'swissFlagsRequested': flags, 'swissEphemerisFlagVerifiedEveryCall': True, 'ephemerisManifest': ephe, 'coreManifest': m, 'records': checked, 'thresholdsDegrees': thresholds, 'deltaTSeconds': {**summary(dt), 'worst': dt_worst}, 'comparisons': result, 'samples': sorted(samples, key=lambda x: x['jdUT']), 'disagreementWitnesses': disagreements}
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(out, indent=2, allow_nan=False) + '\n')
    print(f'Wrote {a.output}; elapsed {time.monotonic() - started:.1f}s')
if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, swe.Error) as error:
        raise SystemExit(f'Audit failed: {error}') from error
