#!/usr/bin/env python3
"""Read-only Pluto diagnostic. Requires pyswisseph and a local primary coefficient source.
Example: python pluto-diagnostic.py --reference /tmp/pluto_reference.py --ephe /tmp/celestial-swiss-ephe
No downloads or implementation changes are performed.
"""
import argparse, ast, hashlib, json, math, pathlib, re
import swisseph as swe
import importlib.metadata

def arithmetic(source):
    """Evaluate coefficient literals, permitting only numbers, signs and division."""
    def walk(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float): return node.value
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
            return (-1 if isinstance(node.op, ast.USub) else 1) * walk(node.operand)
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div): return walk(node.left)/walk(node.right)
        raise ValueError("Unsupported coefficient expression")
    return walk(ast.parse(source, mode="eval").body)

def sha256(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
ROOT = pathlib.Path(__file__).resolve().parents[2]

def terms():
    source=(ROOT/'core/src/astronomy/pluto.rs').read_text().split('let coeffs:')[1].split('];')[0]
    return [tuple(map(float,re.findall(r'-?\d+(?:\.\d*)?',x))) for x in re.findall(r'\(([^()]*)\)',source) if len(re.findall(r'-?\d+(?:\.\d*)?',x))==9]

def delta_t(jd):
    source=(ROOT/'core/src/astronomy/delta_t.rs').read_text()
    year=2000+(jd-2451545)/365.25
    for piece in re.findall(r'DeltaTPiece\s*\{([^{}]+)\}',source):
        match=re.search(r'year_end:\s*([\d.]+).*?year_base:\s*([\d.]+).*?denom:\s*([\d.]+).*?coeffs:\s*&\[([^]]+)\]',piece,re.S)
        if match and year<float(match[1]):
            x=(year-float(match[2]))/float(match[3]); result=0
            for coefficient in reversed([arithmetic(c.strip()) for c in match[4].split(',') if c.strip()]): result=result*x+coefficient
            return result
    raise ValueError('Unsupported year')

def position(jd, rows, slope):
    t=(jd-2451545)/36525
    angles=[math.radians(a+b*t) for a,b in [(34.35,3034.9057),(50.08,1222.1138),(238.96,144.96)]]
    sums=[0.,0.,0.]
    for row in rows:
        arg=sum(a*b for a,b in zip(row[:3],angles)); sa,ca=math.sin(arg),math.cos(arg)
        for i in range(3): sums[i]+=row[3+2*i]*sa+row[4+2*i]*ca
    return ((238.958116+slope*t+sums[0]*1e-6)%360,-3.908239+sums[1]*1e-6,40.7241346+sums[2]*1e-7)

def earth(jd):
    source=(ROOT/'core/src/astronomy/vsop87.rs').read_text().replace('std::f64::consts::PI',str(math.pi)); tau=(jd-2451545)/365250; out=[]
    for coord in 'LBR':
        result=0
        for k,body in re.findall(r'static EARTH_'+coord+r'(\d): &\[Term\] = &\[(.*?)\];',source,re.S):
            result+=tau**int(k)*sum(float(a.replace('_',''))*math.cos(float(b.replace('_',''))+float(c.replace('_',''))*tau) for a,b,c in re.findall(r'Term\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\)',body))
        out.append(result*10)
    return (math.degrees(out[0])%360,math.degrees(out[1]),out[2])

def vector(p):
    l,b=map(math.radians,p[:2]);return (p[2]*math.cos(b)*math.cos(l),p[2]*math.cos(b)*math.sin(l),p[2]*math.sin(b))
def geo(p,e):
    d=[x-y for x,y in zip(vector(p),vector(e))]; r=math.sqrt(sum(x*x for x in d));return (math.degrees(math.atan2(d[1],d[0]))%360,math.degrees(math.asin(d[2]/r)),r)
def difference(a,b): return (a-b+180)%360-180

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--reference',required=True,type=pathlib.Path);parser.add_argument('--ephe',required=True);parser.add_argument('--output',type=pathlib.Path);args=parser.parse_args()
    historical = json.loads((ROOT / 'docs/validation/pluto-diagnostic-before.json').read_text())
    for source, expected in historical['rust_source_sha256'].items():
        if sha256(ROOT / source) != expected:
            raise SystemExit('historical diagnostic requires pre-correction source; use compare-swiss.py for the current engine (' + source + ' differs)')
    raw=args.reference.read_bytes(); arrays={}
    for node in ast.parse(raw).body:
        if isinstance(node,ast.Assign) and isinstance(node.targets[0],ast.Name) and node.targets[0].id.startswith('PLUTO_'):arrays[node.targets[0].id]=ast.literal_eval(node.value)
    ref=[tuple(a)+tuple(l)+tuple(b)+tuple(r) for a,l,b,r in zip(*(arrays[k] for k in ['PLUTO_ARGUMENT','PLUTO_LONGITUDE','PLUTO_LATITUDE','PLUTO_RADIUS_VECTOR']))]
    if len(ref) != 43:
        raise ValueError(f'Expected 43 reference terms, received {len(ref)}')
    manifest = json.loads((pathlib.Path(args.ephe)/'manifest.json').read_text())
    for entry in manifest['files']:
        actual = sha256(pathlib.Path(args.ephe)/entry['name'])
        if actual != entry['sha256']:
            raise ValueError(f"Ephemeris hash mismatch: {entry['name']}")
    swe.set_ephe_path(args.ephe);rows=[];f=swe.FLG_SWIEPH|swe.FLG_TRUEPOS|swe.FLG_NONUT; h=f|swe.FLG_HELCTR
    for date in [(1930,1,1,0),(1972,5,28,4),(2000,1,1,12),(2040,12,31,0)]:
        ut=swe.julday(*date);dt=delta_t(ut);tt=ut+dt/86400;p=position(tt,terms(),144.960455);pr=position(tt,ref,144.96);e=earth(tt)
        def calc(body, flags):
            value, returned = swe.calc(tt, body, flags)
            if returned & (swe.FLG_JPLEPH|swe.FLG_SWIEPH|swe.FLG_MOSEPH) != swe.FLG_SWIEPH:
                raise RuntimeError(f'Swiss fallback: requested {flags}, returned {returned}')
            return value, returned
        hj,hjf=calc(swe.PLUTO,h|swe.FLG_J2000);hd,hdf=calc(swe.PLUTO,h);ej,ejf=calc(swe.EARTH,h|swe.FLG_J2000);ed,edf=calc(swe.EARTH,h)
        apparent,ret=swe.calc_ut(ut,swe.PLUTO,swe.FLG_SWIEPH|swe.FLG_SPEED)
        if ret & (swe.FLG_JPLEPH|swe.FLG_SWIEPH|swe.FLG_MOSEPH) != swe.FLG_SWIEPH:
            raise RuntimeError(f'Swiss apparent fallback: returned {ret}')
        g=geo(p,e);refmixed=geo(pr,e);swmixed=geo(hj,ed);swconsistent=geo(hd,ed)
        rows.append(dict(date=date,jd_ut=ut,core_delta_t_seconds=dt,jd_tt=tt,core_heliocentric=p,meeus_reference_heliocentric=pr,swiss_true_heliocentric_j2000=hj[:3],swiss_true_heliocentric_date=hd[:3],core_geocentric=g,meeus_mixed_frame_geocentric=refmixed,swiss_mixed_frame_geocentric=swmixed,swiss_consistent_frame_geocentric=swconsistent,swiss_apparent_ut=apparent[:3],swiss_return_flags=dict(apparent=ret,helio_j2000=hjf,helio_date=hdf,earth_j2000=ejf,earth_date=edf),longitude_differences_deg=dict(core_vs_apparent=difference(g[0],apparent[0]),table_helio=difference(p[0],pr[0]),meeus_vs_swiss_j2000_helio=difference(pr[0],hj[0]),frame_isolated_swiss=difference(swmixed[0],swconsistent[0]),core_earth_vs_swiss_date=difference(e[0],ed[0]))))
    out=dict(swiss_version=swe.version,python_wrapper_version=importlib.metadata.version('pyswisseph'),python_wrapper_sha256=sha256(swe.__file__),rust_source_sha256={str(path.relative_to(ROOT)):sha256(path) for path in [ROOT/'core/src/astronomy/pluto.rs',ROOT/'core/src/astronomy/vsop87.rs',ROOT/'core/src/astronomy/delta_t.rs']},ephemeris_manifest=json.loads((pathlib.Path(args.ephe)/'manifest.json').read_text()),ephemeris_manifest_sha256=sha256(pathlib.Path(args.ephe)/'manifest.json'),reference_url='https://raw.githubusercontent.com/architest/pymeeus/master/pymeeus/Pluto.py',reference_sha256=hashlib.sha256(raw).hexdigest(),core_table_rows=len(terms()),reference_table_rows=len(ref),notes=['core_geocentric is a Python reproduction of the Rust formulas, not a direct WASM execution.','Reference URL uses master; exact downloaded bytes are identified by reference_sha256.','Swiss TRUEPOS/NONUT heliocentric J2000 and of-date positions isolate frame mismatch without approximate precession.','Core delta T polynomial is evaluated at identical UT input.','Meeus diagnostic substitutes coefficient table only; it intentionally retains the mixed-frame pipeline.','Swiss flag 258 means SWIEPH|SPEED; 264 means SPEED|HELCTR, a different coordinate origin.'],cases=rows)
    result=json.dumps(out,indent=2);print(result)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result+'\n')
if __name__=='__main__':main()
