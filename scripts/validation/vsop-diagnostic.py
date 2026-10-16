#!/usr/bin/env python3
"""Compare checked-in VSOP coefficients with original IMCCE VSOP87D files.
python3 scripts/validation/vsop-diagnostic.py --tables /tmp
Requires predownloaded VSOP87D.{mer,ven,ear,mar,jup,sat,ura,nep}; no network.
"""
import argparse, datetime, hashlib, json, math, pathlib, re, sys
PLANETS = dict(MERCURY='mer', VENUS='ven', EARTH='ear', MARS='mar', JUPITER='jup', SATURN='sat', URANUS='ura', NEPTUNE='nep')
ROOT = pathlib.Path(__file__).resolve().parents[2]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def local_tables(path):
    out = {}
    for name, terms in re.findall('static (\\w+\\d): &\\[Term\\] = &(\\[.*?\\]);', path.read_text(), re.S):
        terms = re.sub('//[^\\n]*', '', terms)
        out[name] = [[float(x.replace('_', '').replace('std::f64::consts::PI', str(math.pi))) for x in row.split(',')] for row in re.findall('Term\\(([^)]+)\\)', terms)]
    return out

def official_tables(directory):
    out = {}
    sources = []
    for planet, short in PLANETS.items():
        name = 'VSOP87D.' + short
        path = directory / name
        key = None
        sources.append({'file': name, 'sha256': sha(path), 'bytes': path.stat().st_size, 'url': 'https://ftp.imcce.fr/pub/ephem/planets/vsop87/' + name})
        for row in path.read_text().splitlines():
            if 'VARIABLE' in row:
                match = re.search('VARIABLE\\s+(\\d).*?\\*T\\*\\*(\\d)', row)
                if match is None:
                    raise ValueError(f'Unrecognized header in {name}: {row}')
                key = planet + '_' + 'LBR'[int(match[1]) - 1] + match[2]
                out[key] = []
            elif row.strip():
                if key is None:
                    raise ValueError(f'Missing series header in {name}')
                out[key].append(list(map(float, row.split()[-3:])))
    return (out, sources)

def evaluate(data, planet, variable, tau, scale):
    return scale * sum((sum((a * math.cos(b + c * tau) for a, b, c in terms)) * tau ** int(key[-1]) for key, terms in data.items() if key.startswith(planet + '_' + variable)))

def helio(data, planet, tau, scale):
    return [evaluate(data, planet, v, tau, scale) for v in 'LBR']

def rect(pos):
    lon, lat, radius = pos
    return [radius * math.cos(lat) * math.cos(lon), radius * math.cos(lat) * math.sin(lon), radius * math.sin(lat)]

def geocentric(data, tau, scale, earth):
    corrected = tau
    for _ in range(3):
        planet = rect(helio(data, 'JUPITER', corrected, scale))
        delta = [x - y for x, y in zip(planet, earth)]
        distance = math.sqrt(sum((x * x for x in delta)))
        corrected = tau - distance / 173.14463267424 / 365250
    return {'longitudeDegrees': math.degrees(math.atan2(delta[1], delta[0])) % 360, 'distanceAU': distance}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tables', type=pathlib.Path, required=True)
    parser.add_argument('--output', type=pathlib.Path, default=ROOT / 'docs/validation/vsop-diagnostic.json')
    args = parser.parse_args()
    source = ROOT / 'core/src/astronomy/vsop87.rs'
    historical = json.loads((ROOT / 'docs/validation/vsop-diagnostic-before.json').read_text())
    if sha(source) != historical['sourceRust']['sha256']:
        raise SystemExit('historical diagnostic requires pre-correction source; use compare-swiss.py for the current engine (vsop87.rs differs)')
    local = local_tables(source)
    official, sources = official_tables(args.tables)
    jd = 2441465.6666666665
    tau = (jd - 2451545) / 365250
    delta1972 = {}
    annual = []
    for planet in PLANETS:
        delta1972[planet] = {v: (evaluate(local, planet, v, tau, 10) - evaluate(official, planet, v, tau, 1)) * (180 / math.pi if v != 'R' else 1) for v in 'LBR'}
        values = []
        for year in range(1930, 2041):
            t = (datetime.datetime(year, 1, 1) - datetime.datetime(2000, 1, 1, 12)).total_seconds() / 86400 / 365250
            delta = (evaluate(local, planet, 'L', t, 10) - evaluate(official, planet, 'L', t, 1)) * 180 / math.pi
            values.append((abs(delta), year, delta))
        maximum = max(values)
        annual.append({'planet': planet, 'maxAbsLongitudeDegrees': maximum[0], 'year': maximum[1], 'signedDifferenceDegrees': maximum[2]})
    earth = rect(helio(local, 'EARTH', tau, 10))
    geo = {label: geocentric(data, tau, scale, earth) for label, data, scale in [('local', local, 10), ('officialJupiterSameLocalEarth', official, 1)]}
    out = {'schemaVersion': 1, 'methodology': 'Independent Python evaluation of Rust literal terms (amplitudes multiplied by 10 exactly as eval_vsop) and final three fields of original IMCCE VSOP87D rows. Difference is local minus official. Annual scope uses 111 Jan 1 UT dates 1930 through 2040. Example uses JD directly as dynamical date for diagnostic isolation, without delta T; full apparent place is separately tested by compare-swiss.py. Geocentric experiment fixes local Earth and iterates light time three times, replacing only Jupiter series. No FK5, nutation or aberration applied. VSOP87D uses heliocentric ecliptic and equinox of date, not J2000.', 'limitation': 'Sampled coefficient diagnostic, not a continuous accuracy certificate. Official VSOP87D and Swiss are distinct reference theories.', 'sourceRust': {'path': str(source.relative_to(ROOT)), 'sha256': sha(source)}, 'auditScriptSha256': sha(pathlib.Path(__file__)), 'officialSources': sources, 'example': {'jd': jd, 'utCalendarLabel': '1972-05-28T04:00:00', 'deltaLocalMinusOfficial': delta1972, 'units': {'L': 'degrees', 'B': 'degrees', 'R': 'AU'}, 'geocentricJupiter': geo, 'changeDegrees': geo['officialJupiterSameLocalEarth']['longitudeDegrees'] - geo['local']['longitudeDegrees']}, 'annualHeliocentricLongitude': annual, 'identifiedJupiterErrors': [{'rustLine': 873, 'issue': 'Dominant official 7.113547 term absent although local comment says it exists later.', 'officialTerm': [0.00573610145, 1.44406205976, 7.1135470008]}, {'rustLine': 879, 'issue': 'Wrong amplitude and phase for frequency 1059.382.', 'localTermAfterScaling': [0.00728898, 1.1421, 1059.382], 'officialTerm': [0.0030638918, 5.41734729976, 1059.3819301892]}]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, indent=2, allow_nan=False) + '\n')
    print(args.output)
if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        raise SystemExit(f'VSOP diagnostic failed: {error}') from error
