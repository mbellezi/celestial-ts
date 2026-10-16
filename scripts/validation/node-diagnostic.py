#!/usr/bin/env python3
"""Reproduce the Swiss true-node segment-join anomaly without excluding it.

python scripts/validation/node-diagnostic.py --ephe /path/to/pinned/ephe
This is a local diagnostic of one raw disagreement, not a full-grid audit.
"""
import argparse
import hashlib
import json
import math
import struct
from pathlib import Path
import swisseph as swe

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ephe', type=Path, required=True)
    args = parser.parse_args()
    manifest_path = ROOT/'core/src/astronomy/lunar-node.manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if swe.version != manifest['swiss_version']:
        raise ValueError('Swiss version mismatch')
    for item in manifest['source_files']:
        if hashlib.sha256((args.ephe/item['name']).read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Ephemeris hash mismatch')
    swe.set_ephe_path(str(args.ephe.resolve()))
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    def calc(tt, body, requested=flags):
        p, returned = swe.calc(tt, body, requested)
        if returned & 7 != swe.FLG_SWIEPH:
            raise ValueError('Swiss fallback')
        return {'longitudeDegrees':p[0], 'longitudeSpeedDegreesDay':p[3],
                'requestedFlags':requested, 'returnedFlags':returned}

    ut = 2462308.5
    tt = ut + swe.deltat_ex(ut, swe.FLG_SWIEPH)
    # Pinned Swiss v3 Moon header: read_const's tfstart, tfend, dseg fields.
    start, end, span = struct.unpack_from('<3d', (args.ephe/'semo_18.se1').read_bytes(), 202)
    index = round((tt-start)/span)
    boundary = start+index*span
    derivatives = []
    for h in [0.1, 0.01, 0.001, 0.0001, 0.00001]:
        plus = calc(tt+h, swe.TRUE_NODE, swe.FLG_SWIEPH)
        minus = calc(tt-h, swe.TRUE_NODE, swe.FLG_SWIEPH)
        derivatives.append({'stepDays':h, 'degreesPerDay':
            ((plus['longitudeDegrees']-minus['longitudeDegrees']+180)%360-180)/((tt+h)-(tt-h)),
            'minus':minus,'plus':plus})
    samples = []
    for offset in [-0.001,-0.0002,-0.00005,-0.00001,0.00001,0.00005,0.0002,0.001]:
        date = boundary+offset
        samples.append({'jdTT':date,'offsetFromSourceBoundaryDays':offset,
            'trueNode':calc(date,swe.TRUE_NODE),'moon':calc(date,swe.MOON)})
    data_path = ROOT/'core/src/astronomy/lunar-node.bin'
    rows = list(struct.iter_unpack('<4d', data_path.read_bytes()))
    x = (tt-manifest['start_jd_tt'])/manifest['step_days']
    first = max(0,min(int(x)-1,len(rows)-4)); t=x-first
    speed = sum(rows[first+k][1]*math.prod((t-j)/(k-j) for j in range(4) if j!=k)
                for k in range(4))
    source = 'https://github.com/aloistr/swisseph/blob/'+manifest['upstream_commit']+'/sweph.c'
    output = {
        'scope':'One raw true-node direction disagreement; retained in the full standard comparison.',
        'jdUT':ut,'jdTTSwiss':tt,'deltaTSeconds':(tt-ut)*86400,
        'swissVersion':swe.version,'reference':calc(tt,swe.TRUE_NODE),
        'coreTableAtSameTT':{'longitudeSpeedDegreesDay':speed,'retrograde':speed<0},
        'sourceSegment':{'file':'semo_18.se1','headerByteOffset':202,
            'startJDTT':start,'endJDTT':end,'spanDays':span,'boundaryIndex':index,
            'boundaryJDTT':boundary,'auditTTMinusBoundarySeconds':(tt-boundary)*86400},
        'independentPositionCentralDifferences':derivatives,'samplesAroundBoundary':samples,
        'interpretation':[
            'The source Moon file has independently encoded Chebyshev segments. Its exact segment boundary coincides with the short true-node longitude discontinuity.',
            'Swiss lunar_osc_elem computes final node Cartesian velocity by central differences across +/-NODE_CALC_INTV (0.0001 day), then converts it to polar velocity. The narrow positive speed occurs when that stencil crosses the source join.',
            'Longer position differences give negative motion; the tiny-step result depends on which side of the discontinuity is sampled. The positive reference velocity is a segment-join numerical feature, not evidence of a smooth physical station.',
            'The core smooth table remains negative. The raw Swiss speed, flags and retrograde disagreement remain reported; this diagnostic does not remove or relabel audit records.'],
        'sourceReferences':[
            {'url':source+'#L4383-L4387','purpose':'Select source segment and its exact endpoints'},
            {'url':source+'#L5463-L5468','purpose':'Final central-difference node velocity; overwrites earlier provisional velocity'},
            {'url':source+'#L4837-L4845','purpose':'Read source segment epochs and span from file header'}],
        'hashes':{'lunarNodeManifest':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
            'lunarNodeBinary':hashlib.sha256(data_path.read_bytes()).hexdigest()},
        'sourceFiles':manifest['source_files']}
    target = ROOT/'docs/validation/true-node-segment-join.json'
    target.write_text(json.dumps(output,indent=2)+'\n')
    print(target)


if __name__ == '__main__':
    main()
