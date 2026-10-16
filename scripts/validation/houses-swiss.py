"""Generate Swiss references: python houses-swiss.py --output /tmp/houses.json.

Requires pyswisseph. Only its documented Placidus polar failure is accepted.
"""
import argparse
import importlib.metadata
import json
from pathlib import Path
import swisseph as swe


def reference_call(function, arguments, row, cusp_key, angle_key, error_key):
    """Reject unexpected failures rather than count them as polar limitations."""
    try:
        cusps, angles = function(*arguments)
        row.update({cusp_key: list(cusps), angle_key: list(angles)})
    except swe.Error as error:
        expected_message = f"swisseph.{function.__name__}: error"
        if not (row["sys"] == "P" and abs(row["lat"]) > 90 - row["eps"]
                and str(error) == expected_message):
            raise
        row[error_key] = {"type": "swisseph.Error", "message": str(error),
                          "classification": "expected_placidus_polar_undefined"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="/tmp/celestial-house-reference.json")
    args = parser.parse_args()
    rows = []
    for year in range(1930, 2041, 10):
        for month, day, hour in [(1, 1, 0.12345), (3, 20, 6.789),
                                 (6, 21, 12.3456), (10, 16, 23.98765)]:
            jd = swe.julday(year, month, day, hour)
            eps = swe.calc_ut(jd, swe.ECL_NUT)[0][0]
            for lat in [-80, -70, -60, -45, -23.55, 0, 23.55, 45, 60, 70, 80]:
                for lon in [-179.9, -74, -46.6333, 0, 151.2]:
                    armc = (swe.sidtime(jd) * 15 + lon) % 360
                    for system in ["P", "E", "W"]:
                        row = dict(year=year, month=month, day=day, hour=hour,
                                   jd=jd, lat=lat, lon=lon, sys=system, armc=armc, eps=eps)
                        reference_call(swe.houses, (jd, lat, lon, system.encode()),
                                       row, "c", "a", "error")
                        reference_call(swe.houses_armc, (armc, lat, eps, system.encode()),
                                       row, "ac", "aa", "armcError")
                        rows.append(row)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(dict(swissVersion=swe.version,
                      wrapperVersion=importlib.metadata.version("pyswisseph"), rows=rows)))


if __name__ == "__main__":
    main()
