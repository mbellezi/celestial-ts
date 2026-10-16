#!/usr/bin/env python3
"""Pin the Swiss 2.10.03 TT-UT1 model for 1930–2040 (with padding).

AGPL-3.0-or-later, as the upstream Swiss Ephemeris and this repository.
This reproduces a versioned model; future Earth rotation remains uncertain.
No network access. Supply the same pinned ephemerides used by the audit.
"""
import argparse
import hashlib
import json
import pathlib
import random
import struct
from importlib.metadata import version

import swisseph as swe

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--ephe-path', required=True)
args = parser.parse_args()
assert swe.version == '2.10.03'
assert version('pyswisseph') == '2.10.3.2'
source = json.loads((ROOT / 'core/src/astronomy/precision-ephemeris.manifest.json').read_text())['ephemerisManifest']
for entry in source['files']:
    path = pathlib.Path(args.ephe_path) / entry['name']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256'], path
swe.set_ephe_path(args.ephe_path)
start = swe.julday(1929, 1, 1, 0)
end = swe.julday(2042, 1, 1, 0)
values = [swe.deltat_ex(start + i, swe.FLG_SWIEPH) * 86400 for i in range(int(end - start) + 1)]
raw = struct.pack('<' + 'd' * len(values), *values)
out = ROOT / 'core/data/delta-t.bin'
out.write_bytes(raw)
rng = random.Random(0x44454c54)
maximum = 0.0
worst = None
for _ in range(100000):
    x = rng.uniform(0, len(values) - 1)
    i = min(int(x), len(values) - 2)
    interp = values[i] + (x - i) * (values[i + 1] - values[i])
    error = abs(interp - swe.deltat_ex(start + x, swe.FLG_SWIEPH) * 86400)
    if error > maximum:
        maximum, worst = error, start + x
assert maximum < 0.0011, maximum
manifest = {
    'description': 'Versioned Swiss TT-UT1 model; predictions are not measured future Earth rotation',
    'license': 'AGPL-3.0-or-later',
    'upstream': 'https://github.com/aloistr/swisseph',
    'swissVersion': swe.version,
    'wrapperVersion': version('pyswisseph'),
    'ephemerisManifest': source,
    'startJDUT': start, 'endJDUT': end, 'stepDays': 1, 'records': len(values),
    'format': 'little-endian f64 seconds TT-UT1, daily linear interpolation',
    'sha256': hashlib.sha256(raw).hexdigest(),
    'generatorSha256': hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
    'holdout': {'seed': '0x44454c54', 'randomInstants': 100000, 'maxErrorSeconds': maximum, 'worstJDUT': worst},
}
(ROOT / 'core/data/delta-t.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest['holdout']))
