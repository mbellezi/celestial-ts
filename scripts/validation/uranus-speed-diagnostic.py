#!/usr/bin/env python3
"""Reproduce the worst Uranus solar-disc velocity diagnostic, without a grid run.

CARGO_HOME=/tmp/celestial-cargo RUSTUP_HOME=/tmp/celestial-rustup PATH=/tmp/celestial-cargo/bin:$PATH /tmp/celestial-swiss-audit-venv/bin/python scripts/validation/uranus-speed-diagnostic.py --ephe /tmp/celestial-swiss-ephe
Requires pyswisseph 2.10.3.2, Swiss 2.10.03, Node and rustc. The existing
WASM must match the selected audit. Rust source is compiled in a temporary
directory directly against checked-in modules; production sources are untouched.
"""
import argparse, hashlib, importlib.metadata, json, math, pathlib, subprocess, tempfile
import swisseph as s
ROOT = pathlib.Path(__file__).resolve().parents[2]

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

RUST_SOURCE = '#![allow(dead_code)]\nmod astronomy {\n#[path="{root}/core/src/astronomy/constants.rs"] pub mod constants;\n#[path="{root}/core/src/astronomy/vsop87.rs"] pub mod vsop87;\n#[path="{root}/core/src/astronomy/deflection.rs"] pub mod deflection;\n}\nuse astronomy::vsop87::{heliocentric,Planet};\nfn rect(p:astronomy::vsop87::HeliocentricPos)->[f64;3]{[p.rad*p.lat.cos()*p.lon.cos(),p.rad*p.lat.cos()*p.lon.sin(),p.rad*p.lat.sin()]}\nfn norm(p:[f64;3])->f64 {p[0].hypot(p[1]).hypot(p[2])}\nfn main(){ let t={tt};for h in [0.,0.0001,-0.0001,0.001,-0.001,0.01,-0.01]{\n let jd=t+h;let e=rect(heliocentric(Planet::Earth,jd));let mut tau=0.;let mut g=[0.;3];for _ in 0..3{let p=rect(heliocentric(Planet::Uranus,jd-tau));g=std::array::from_fn(|i|p[i]-e[i]);tau=norm(g)/astronomy::constants::LIGHT_SPEED_AU_DAY;}\n let u=g.map(|z|z/norm(g));let ev=e.map(|z|z/norm(e));let cross=[u[1]*ev[2]-u[2]*ev[1],u[2]*ev[0]-u[0]*ev[2],u[0]*ev[1]-u[1]*ev[0]];let radius=norm(cross)*norm(e)/(959.63_f64/3600.).to_radians();let d=astronomy::deflection::solar_deflection(g,e);println!("{{\\"h\\":{h},\\"radius\\":{radius},\\"g\\":{g:?},\\"earth\\":{e:?},\\"deflected\\":{d:?}}}");}}\n'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ephe',required=True,type=pathlib.Path)
    parser.add_argument('--audit',type=pathlib.Path,default=ROOT/'docs/validation/swiss-1930-2040.json')
    parser.add_argument('--output',type=pathlib.Path,default=ROOT/'docs/validation/uranus-speed-knot-diagnostic.json')
    parser.add_argument('--node',default='node')
    parser.add_argument('--rustc',default='rustc')
    args=parser.parse_args()
    audit=json.loads(args.audit.read_text()); hashes=audit['coreManifest']['hashes']
    inputs=['pkg/celestial_wasm.js','pkg/celestial_wasm_bg.wasm','core/src/astronomy/deflection.rs','core/src/astronomy/vsop87.rs','core/src/astronomy/vsop87_data.rs','core/src/astronomy/constants.rs']
    for rel in inputs:
        if sha(ROOT/rel)!=hashes[rel]:raise ValueError('Current source/WASM differs from selected audit: '+rel)
    if importlib.metadata.version('pyswisseph')!='2.10.3.2' or s.version!='2.10.03':raise ValueError('Swiss version mismatch')
    for item in audit['ephemerisManifest']['files']:
        if sha(args.ephe/item['name'])!=item['sha256']:raise ValueError('Ephemeris hash mismatch: '+item['name'])
    s.set_ephe_path(str(args.ephe.resolve()))
    def calc(tt, body, flags):
        values, returned = s.calc(tt, body, flags)
        if returned & 7 != s.FLG_SWIEPH:
            raise ValueError('Swiss fallback in diagnostic')
        return values, returned
    jd=next(b for b in audit['comparisons']['sameUT'] if b['id']==7)['metrics']['speedLongitude']['worst']['jdUT']
    node_source = "import fs from 'node:fs'; import * as c from "+json.dumps((ROOT/'pkg/celestial_wasm.js').as_uri())+"; c.initSync({module:fs.readFileSync("+json.dumps(str(ROOT/'pkg/celestial_wasm_bg.wasm'))+")}); const u="+repr(jd)+",t=u+c.deltat(u),rows=[]; for(const h of [0,.1,-.1,.01,-.01,.001,-.001,.0001,-.0001]) rows.push({h,tt:t+h,p:c.calc(t+h,7,258),uranusHelio:c.calc(t+h,7,8)}); process.stdout.write(JSON.stringify({u,t,rows}));"
    probe=json.loads(subprocess.check_output([args.node,'--input-type=module','-e',node_source],text=True))
    t=probe['t']
    with tempfile.TemporaryDirectory(prefix='celestial-uranus-') as temp:
        source=pathlib.Path(temp)/'probe.rs'; binary=pathlib.Path(temp)/'probe'
        source.write_text(RUST_SOURCE.replace('{root}',str(ROOT)).replace('{tt}',repr(t)))
        subprocess.run([args.rustc,'--edition=2021','-O',str(source),'-o',str(binary)],check=True)
        core=[json.loads(line) for line in subprocess.check_output([str(binary)],text=True).splitlines()]
    out={'jdUT':probe['u'],'jdTT':t,'auditSha256':sha(args.audit),'generatorSha256':sha(pathlib.Path(__file__)),'auditedInputHashes':{rel:hashes[rel] for rel in inputs},'swissVersion':s.version,'wrapperVersion':importlib.metadata.version('pyswisseph'),'ephemerisManifest':audit['ephemerisManifest'],'flags':{'coreApparent':258,'coreHeliocentric':8,'swissUranusPreDeflectionXYZ':5698,'swissEarthGeometricReceptionXYZ':5722,'swissApparentWithSpeed':258,'swissNoDeflectionWithSpeed':770},'description':'Read-only Uranus worst-speed diagnostic. Core geometry reconstructed by compiling audited VSOP87 and deflection modules without production edits; apparent positions use the audited WASM. Swiss observer Earth is geometric heliocentric at reception time (TRUEPOS); Uranus retains light time.','corePositions':probe['rows'],'geometry':[],'swissDerivatives':[]}
    for c in core:
        h=c['h'];g=calc(t+h,7,5698)[0][:3];e=calc(t+h,14,5698|8|16)[0][:3];n=lambda v:math.hypot(*v);u=[z/n(g) for z in g];v=[z/n(e) for z in e];cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];r=n(cross)*n(e)/math.radians(959.63/3600)
        out['geometry'].append({'offsetDays':h,'core':c,'swiss':{'geocentricPreDeflectionXYZ':g,'earthReceptionXYZ':e,'solarFractionalRadius':r,'effectiveMassTableIndex':math.floor(100*r)}})
    for h in (.01,.001,.0001,.00001):
        a,b=t-h,t+h;row={'stepDays':h,'actualIntervalDays':b-a}
        for label,flags in [('standard',258),('noDeflection',770)]:
            m,c,p=[calc(jd,7,flags)[0] for jd in (a,t,b)]
            row[label]={'reportedSpeedDegreesPerDay':c[3],'centralDerivativeDegreesPerDay':(p[0]-m[0])/(b-a),'leftDerivativeDegreesPerDay':(c[0]-m[0])/(t-a),'rightDerivativeDegreesPerDay':(p[0]-c[0])/(b-t)}
        out['swissDerivatives'].append(row)
    rows={r['offsetDays']:r['core'] for r in out['geometry']};a,b=rows[-.0001],rows[.0001];angle=lambda v:math.degrees(math.atan2(v[1],v[0]));interval=(t+.0001)-(t-.0001);raw=(angle(b['g'])-angle(a['g']))/interval;d=(angle(b['deflected'])-angle(a['deflected']))/interval
    out['corePreAberrationDerivative']={'stepDays':.0001,'rawDegreesPerDay':raw,'deflectedDegreesPerDay':d,'deflectionContributionArcsecPerDay':(d-raw)*3600}
    out['finding']='Core and Swiss pre-deflection positions differ slightly through their distinct underlying theories. At this instant that shift puts the solar ray in adjacent linear effective-mass table intervals, with a different local slope. The standard 0.0001-day symmetric velocity step also straddles a Swiss interval boundary but remains in one core interval. Reported Swiss SPEED converges to the local derivative with a smaller step that does not cross the boundary. This is a sensitive solar-disc/knot sample, not evidence of a general VSOP velocity failure.'
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n')
    print('Wrote',args.output)

if __name__=='__main__':main()
