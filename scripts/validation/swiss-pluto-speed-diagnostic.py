#!/usr/bin/env python3
"""Diagnose Swiss SPEED versus derivatives of its own Pluto longitude.

Run with the same pyswisseph and ephemeris files used for compare-swiss.py.
This diagnostic deliberately makes no changes to the core or its fixtures.
"""
import argparse
import hashlib
import json
import math
import platform
from pathlib import Path
import swisseph as swe

HISTORICAL_DATES_UT = [2437646.0, 2441477.75, 2445366.75, 2446102.5]
STEPS = [0.001, 0.01, 0.1]
VARIANTS = {
    "apparent": 0,
    "NONUT": swe.FLG_NONUT,
    "NOABERR": swe.FLG_NOABERR,
    "NOGDEFL": swe.FLG_NOGDEFL,
    "NOABERR_NOGDEFL": swe.FLG_NOABERR | swe.FLG_NOGDEFL,
    "TRUEPOS": swe.FLG_TRUEPOS,
    "TRUEPOS_NONUT": swe.FLG_TRUEPOS | swe.FLG_NONUT,
    "TRUEPOS_J2000": swe.FLG_TRUEPOS | swe.FLG_J2000,
    "TRUEPOS_EQUATORIAL": swe.FLG_TRUEPOS | swe.FLG_EQUATORIAL,
}


def calculate(tt, body, flags):
    result, returned = swe.calc(tt, body, flags)
    if not returned & swe.FLG_SWIEPH:
        raise RuntimeError(f"Swiss ephemeris fallback at TT {tt}, flags {flags}: {returned}")
    return result, returned


def longitude_derivative(tt, flags, h):
    before, _ = calculate(tt-h, swe.PLUTO, flags)
    after, _ = calculate(tt+h, swe.PLUTO, flags)
    return ((after[0]-before[0]+180.0) % 360.0-180.0)/((tt+h)-(tt-h))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ephe-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--audit", default=str(Path(__file__).resolve().parents[2] / "docs/validation/swiss-1930-2040.json"),
                        help="Current main audit; include every Pluto disagreement witness")
    args = parser.parse_args()
    audit_path = Path(args.audit)
    audit = json.loads(audit_path.read_text())
    audit_dates = {w["jdUT"] for w in audit["disagreementWitnesses"]
                   if w["body"]["name"] == "Pluto"}
    dates_ut = sorted(set(HISTORICAL_DATES_UT) | audit_dates)
    ephe = Path(args.ephe_dir)
    manifest = json.loads((ephe / 'manifest.json').read_text())
    if swe.version != '2.10.03':
        raise ValueError('Swiss version mismatch')
    for item in manifest['files']:
        if hashlib.sha256((ephe / item['name']).read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Ephemeris hash mismatch')
    swe.set_ephe_path(args.ephe_dir)
    cases = []
    for ut in dates_ut:
        tt = ut+swe.deltat(ut)
        variants = {}
        for name, extra in VARIANTS.items():
            flags = swe.FLG_SWIEPH | swe.FLG_SPEED | extra
            coordinates, returned = calculate(tt, swe.PLUTO, flags)
            central = {str(h): longitude_derivative(tt, flags, h) for h in STEPS}
            data = {
                "requestedFlags": flags,
                "returnedFlags": returned,
                "coordinates": list(coordinates),
                "centralLongitudeDegreesPerDayByStepDays": central,
                "speedMinusCentralArcsecPerDay": (coordinates[3]-central["0.01"])*3600,
            }
            if not extra & (swe.FLG_J2000 | swe.FLG_EQUATORIAL):
                # ECL_NUT[0] is true obliquity, [1] mean obliquity.
                ep, _ = swe.calc(tt+0.01, swe.ECL_NUT, swe.FLG_SWIEPH)
                em, _ = swe.calc(tt-0.01, swe.ECL_NUT, swe.FLG_SWIEPH)
                index = 1 if extra & swe.FLG_NONUT else 0
                obliquity_rate = (ep[index]-em[index])/((tt+0.01)-(tt-0.01))
                # R_x(-eps(t)) requires R v + R' x. Swiss rotates only v.
                omitted = math.cos(math.radians(coordinates[0])) * math.tan(math.radians(coordinates[1])) * obliquity_rate
                corrected = coordinates[3]+omitted
                data.update({
                    "obliquityRateArcsecPerDay": obliquity_rate*3600,
                    "predictedSpeedMinusCentralFromOmittedRotationArcsecPerDay": -omitted*3600,
                    "speedWithObliquityRotationDerivativeDegreesPerDay": corrected,
                    "correctedSpeedMinusCentralArcsecPerDay": (corrected-central["0.01"])*3600,
                    "speedRetrograde": coordinates[3] < 0,
                    "centralRetrograde": central["0.01"] < 0,
                    "correctedSpeedRetrograde": corrected < 0,
                })
            variants[name] = data
        cases.append({"jdUT": ut, "presentInCurrentAudit": ut in audit_dates, "historicalWitness": ut in HISTORICAL_DATES_UT, "jdTT": tt, "deltaTSeconds": (tt-ut)*86400, "variants": variants})
    ephe = Path(args.ephe_dir)
    apparent = [case["variants"]["apparent"] for case in cases]
    summary = {
        "cases": len(cases),
        "currentAuditWitnesses": len(audit_dates),
        "speedVersusCentralDirectionDisagreements": sum(p["speedRetrograde"] != p["centralRetrograde"] for p in apparent),
        "correctedSpeedVersusCentralDirectionDisagreements": sum(p["correctedSpeedRetrograde"] != p["centralRetrograde"] for p in apparent),
    }
    result = {
        "schemaVersion": 2,
        "auditInput": {"path": str(audit_path), "sha256": hashlib.sha256(audit_path.read_bytes()).hexdigest()},
        "summary": summary,
        "description": "Swiss Pluto SPEED versus central derivatives of Swiss positions; flags isolate the missing obliquity rotation derivative in ecliptic speed conversion.",
        "pythonVersion": platform.python_version(),
        "wrapperVersion": swe.__version__,
        "swissVersion": swe.version,
        "scriptSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "ephemerisFiles": [{"name": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(ephe.glob("*.se1"))],
        "source": {
            "commit": "c113653fe37fe5cdbfcc030a6e341de03ef018d2",
            "url": "https://github.com/aloistr/swisseph/blob/c113653fe37fe5cdbfcc030a6e341de03ef018d2/sweph.c",
            "equatorialToEclipticLines": [2797, 2806],
            "nutationSpeedLines": [3592, 3641],
            "finding": "app_pos_rest rotates both position and velocity with instantaneous mean obliquity and nutation in obliquity, but does not add the derivative of either rotation to velocity. The position derivative contains this term. swi_nutate does include a temporal nutation correction earlier in equatorial coordinates.",
        },
        "equation": "central longitude rate = rotated velocity longitude rate + cos(longitude)*tan(latitude)*d(true obliquity)/dt; use mean obliquity under NONUT",
        "conclusion": "The summary counts direction disagreements before and after adding the omitted obliquity rotation derivative. Dates include every Pluto witness in the current main audit plus the four historical witnesses. TRUEPOS isolates the rotation discrepancy and TRUEPOS_J2000 agrees within numerical differentiation error. Remaining small residuals are retained, not attributed to this term.",
        "coreChanges": False,
        "cases": cases,
    }
    Path(args.output).write_text(json.dumps(result, indent=2)+"\n")


if __name__ == "__main__":
    main()
