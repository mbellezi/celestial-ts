#!/usr/bin/env python3
"""Generate the explicit Swiss true-node ephemeris used by the built-in engine.

Requires pyswisseph 2.10.3.2 and Swiss Ephemeris 2.10.03, whose AGPL license
matches this repository. No network access: --ephe-path must contain the pinned
semo_18.se1 and sepl_18.se1 recorded in the adjacent manifest. Data is TT, true
ecliptic/equinox of date; each record is unwrapped longitude, its daily speed,
ascending-node distance in AU, and its daily speed, all little-endian f64. Each observable uses four-point cubic Lagrange interpolation
at 0.25-day spacing. Velocity is interpolated directly to avoid amplifying
position interpolation errors at stations. Swiss lunar Chebyshev segment joins
can introduce tiny position jumps and narrow finite-difference velocity spikes;
a smooth table does not reproduce those reference artifacts.
"""
import argparse, hashlib, json, pathlib, random, struct
from importlib.metadata import version
import swisseph as swe

root=pathlib.Path(__file__).resolve().parents[1]

def validate_inputs(ephe_path):
    """Check existing provenance before any calculation or output mutation."""
    manifest=json.loads((root/'core/src/astronomy/lunar-node.manifest.json').read_text())
    if swe.version != manifest['swiss_version']:
        raise RuntimeError(f"Swiss version mismatch: expected {manifest['swiss_version']}, got {swe.version}")
    wrapper=version('pyswisseph')
    if wrapper != manifest['wrapper_version']:
        raise RuntimeError(f"pyswisseph version mismatch: expected {manifest['wrapper_version']}, got {wrapper}")
    for entry in manifest['source_files']:
        path=pathlib.Path(ephe_path)/entry['name']
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            raise RuntimeError(f"Ephemeris hash mismatch: {entry['name']}")

parser=argparse.ArgumentParser(); parser.add_argument('--ephe-path',required=True)
args=parser.parse_args()
validate_inputs(args.ephe_path)
swe.set_ephe_path(args.ephe_path)
out=root/'core/src/astronomy/lunar-node.bin'
start=swe.julday(1929,12,29,0); end=swe.julday(2041,1,4,0); step=0.25
records=[]; previous=None
for i in range(round((end-start)/step)+1):
    p,flags=swe.calc(start+i*step,swe.TRUE_NODE,swe.FLG_SWIEPH|swe.FLG_SPEED)
    if not flags&swe.FLG_SWIEPH: raise RuntimeError('Swiss data unavailable')
    lon=p[0] if previous is None else previous+(p[0]-previous+180)%360-180
    previous=lon; records.append((lon,p[3],p[2],p[5]))
# The pinned semo_18.se1 v3 header stores the Moon's epoch/segment span
# at byte 202 (sweph.c: read_const). Swiss differences nodes at +/-0.0001
# day; light-time shifts the lunar epoch by under 0.00002 day. A knot in
# that window would preserve a Chebyshev join jump as a false speed spike.
# Reconstruct only the two velocity observables there from four safe neighbors.
moon_bytes=(pathlib.Path(args.ephe_path)/'semo_18.se1').read_bytes()
moon_start,moon_end,moon_segment=struct.unpack_from('<3d',moon_bytes,202)
unsafe=[]
for i in range(2,len(records)-2):
    date=start+i*step
    boundary=moon_start+round((date-moon_start)/moon_segment)*moon_segment
    if abs(date-boundary) <= 0.00012:
        row=list(records[i])
        for col in [1,3]:
            row[col]=sum(records[i+offset][col]*weight for offset,weight in
                         [(-2,-1/6),(-1,2/3),(1,2/3),(2,-1/6)])
        records[i]=tuple(row);unsafe.append(date)
raw=b''.join(struct.pack('<4d',*p) for p in records);out.write_bytes(raw)
# Independent fractional holdout instants, disjoint from all tabulation knots.
rng=random.Random(0x4e4f4445); maxima=[0.,0.,0.,0.]
for _ in range(10000):
    x=rng.uniform(0,len(records)-1); first=max(0,min(int(x)-1,len(records)-4)); t=x-first
    p,flags=swe.calc(start+x*step,swe.TRUE_NODE,swe.FLG_SWIEPH|swe.FLG_SPEED)
    if not flags&swe.FLG_SWIEPH: raise RuntimeError('Swiss data unavailable at holdout')
    values=[]
    for col in range(4):
        value=0.
        for k in range(4):
            weight=1.
            for j in range(4):
                if j != k: weight *= (t-j)/(k-j)
            value += records[first+k][col]*weight
        values.append(value)
    errors=[abs((values[0]-p[0]+180)%360-180)*3600,abs(values[1]-p[3])*3600,abs(values[2]-p[2]),abs(values[3]-p[5])]
    maxima=[max(a,b) for a,b in zip(maxima,errors)]
files=[]
for name in ['semo_18.se1','sepl_18.se1']:
    path=pathlib.Path(args.ephe_path)/name
    files.append({'name':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'url':'https://raw.githubusercontent.com/aloistr/swisseph/c113653fe37fe5cdbfcc030a6e341de03ef018d2/ephe/'+name})
manifest={'description':'Explicit tabulated Swiss Ephemeris osculating ascending lunar node, not an independent lunar theory','license':'AGPL-3.0-or-later','source':'https://github.com/aloistr/swisseph','upstream_commit':'c113653fe37fe5cdbfcc030a6e341de03ef018d2','swiss_version':swe.version,'wrapper_version':version('pyswisseph'),'start_jd_tt':start,'end_jd_tt':end,'step_days':step,'records':len(records),'source_join_velocity_reconstruction':{'window_days':0.00012,'knots':unsafe,'method':'Four neighboring safe quarter-day velocity samples, cubic interpolation at center; positions remain unmodified'},'interpolation':'Four-point cubic Lagrange, independently for each observable', 'limitations':'Swiss lunar Chebyshev segment joins can have position discontinuities and narrow finite-difference velocity spikes; this smooth interpolant does not reproduce such spikes' ,'format':'little-endian f64 [unwrapped longitude deg, speed deg/day, distance AU, speed AU/day]','sha256':hashlib.sha256(raw).hexdigest(),'source_files':files,'holdout':{'seed':'0x4e4f4445','random_fractional_instants':10000,'max_longitude_arcsec':maxima[0],'max_speed_arcsec_day':maxima[1],'max_distance_au':maxima[2],'max_distance_speed_au_day':maxima[3]}}
(root/'core/src/astronomy/lunar-node.manifest.json').write_text(json.dumps(manifest,indent=2)+'\n'); print(json.dumps(manifest['holdout']))
