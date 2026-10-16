#!/usr/bin/env python3
"""Generate complete uniform Chebyshev geocentric states (not residual corrections).
Reproduce: /tmp/celestial-swiss-audit-venv/bin/python scripts/generate-precision-ephemeris.py --ephe /tmp/celestial-swiss-ephe
Requires pyswisseph==2.10.3.2; pinned input hashes are checked. Swiss Ephemeris
source/data are AGPL-3.0-or-later (https://github.com/aloistr/swisseph).
"""
import argparse, hashlib, importlib.metadata, json, math, pathlib, random, struct
import swisseph as swe
ROOT = pathlib.Path(__file__).resolve().parents[1]
DEGREE = 18
START = 2425960.5  # 1929-12-16, padding before supported 1930 start
END = 2466558.5  # beyond 2041-01-01, padding after supported 2040 end
SPECS = [(1, 'Moon', 4), (2, 'Mercury', 8), (8, 'Neptune', 32), (9, 'Pluto', 32)]
SEED = 0xCE1E571A19302040

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def evaluate(coeffs, x):
    b1 = b2 = 0.0
    for c in reversed(coeffs[1:]):
        b1, b2 = c + 2*x*b1 - b2, b1
    return coeffs[0] + x*b1 - b2

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--ephe',type=pathlib.Path,required=True);a=p.parse_args()
    assert importlib.metadata.version('pyswisseph') == '2.10.3.2'
    assert swe.version == '2.10.03'
    ephe=json.loads((a.ephe/'manifest.json').read_text())
    assert ephe['upstreamCommit']=='c113653fe37fe5cdbfcc030a6e341de03ef018d2'
    for f in ephe['files']: assert digest(a.ephe/f['name'])==f['sha256']
    swe.set_ephe_path(str(a.ephe.resolve()))
    n=DEGREE+1; theta=[math.pi*(j+.5)/n for j in range(n)]; nodes=[math.cos(t) for t in theta]
    weights=[[2/n*math.cos(k*t)*(0.5 if k==0 else 1) for t in theta] for k in range(n)]
    blob=bytearray(); bodies=[]
    for body,name,step in SPECS:
        flags=swe.FLG_SWIEPH|swe.FLG_NONUT|swe.FLG_XYZ
        if body!=1: flags|=swe.FLG_NOABERR|swe.FLG_NOGDEFL
        def state(jd):
            v,ret=swe.calc(jd,body,flags)
            assert ret & 7 == swe.FLG_SWIEPH
            return v[:3]
        count=math.ceil((END-START)/step); offset=len(blob); segments=[]
        for seg in range(count):
            mid=START+(seg+.5)*step
            values=[state(mid+step*.5*x) for x in nodes]
            coeffs=[[math.fsum(w*values[j][axis] for j,w in enumerate(weights[k])) for k in range(n)] for axis in range(3)]
            segments.append(coeffs)
            blob.extend(struct.pack('<'+str(3*n)+'d',*(c for axis in coeffs for c in axis)))
        rng=random.Random(SEED+body); max_angle=max_distance=max_speed=0.; worst=None
        # Independent holdouts plus both sides of every segment junction.
        times=[START+rng.random()*count*step for _ in range(10000)]
        times += [START+j*step+d for j in range(1,count) for d in (-1e-6,0.,1e-6)]
        def interp(jd):
            z=(jd-START)/step;seg=min(int(z),count-1);x=2*(z-seg)-1
            return [evaluate(c,x) for c in segments[seg]]
        for jd in times:
            v=interp(jd); r=state(jd); norm=math.sqrt(sum(t*t for t in r)); err=math.sqrt(sum((u-t)**2 for u,t in zip(v,r)));angle=err/norm*180/math.pi*3600
            if angle>max_angle: max_angle=angle;worst=jd
            max_distance=max(max_distance,err)
            if START+.01<jd<START+count*step-.01:
                vp,vm=interp(jd+.01),interp(jd-.01);rp,rm=state(jd+.01),state(jd-.01)
                derivative_error=math.sqrt(sum(((vp[i]-vm[i])-(rp[i]-rm[i]))**2 for i in range(3)))/.02/norm*180/math.pi*3600
                max_speed=max(max_speed,derivative_error)
        assert max_angle<(.002 if body == 1 else .001),(name,max_angle,worst)
        bodies.append(dict(id=body,name=name,stepDays=step,segments=count,byteOffset=offset,flags=flags,endInclusiveJD=START+count*step,validation=dict(randomHoldouts=10000,junctionAndAdjacentHoldouts=len(times)-10000,maxVectorErrorAU=max_distance,maxAngularVectorErrorArcsec=max_angle,worstJDTT=worst,maxCentralDerivativeDifferenceArcsecPerDay=max_speed,derivativeStepDays=.01)))
        print(name,count,max_angle,max_speed,flush=True)
    path=ROOT/'core/src/astronomy/precision-ephemeris.bin';path.write_bytes(blob)
    manifest=dict(schemaVersion=1,description='Full geocentric Cartesian states in the mean ecliptic/equinox of date, AU, time argument TT. Moon includes Swiss apparent light-time/aberration semantics except nutation. Other bodies retain light time but disable aberration and gravitational deflection. No residual fitting or case-specific adjustment.',license='AGPL-3.0-or-later',upstream='https://github.com/aloistr/swisseph',wrapperVersion=importlib.metadata.version('pyswisseph'),swissVersion=swe.version,ephemerisManifest=ephe,degree=DEGREE,startInclusiveJD=START,layout='little-endian f64, body then segment then axis XYZ then Chebyshev coefficient k=0..degree; c0 is unhalved',binaryBytes=len(blob),binarySha256=digest(path),generatorSha256=digest(pathlib.Path(__file__)),validationSeed=SEED,validationDescription='10000 pseudorandom off-grid holdouts per body with a seed distinct from the full audit; also every internal junction and +/-1e-6 day. Angular bound is Cartesian vector error / reference radius, covering longitude and latitude jointly except spherical-coordinate pole singularities.',bodies=bodies)
    path.with_name('precision-ephemeris.manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if __name__=='__main__':main()
