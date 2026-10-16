#!/usr/bin/env python3
"""Generate the embedded IANA offsets using only Python's standard library and make/cc.

Normal generation and --check are offline, using the pinned archives in locations/data.
  python3 scripts/generate-time-zones.py --check
  python3 scripts/generate-time-zones.py
To restore a missing pinned archive, add --download. To adopt an IANA release:
  python3 scripts/generate-time-zones.py --update 2026f --download
Review the resulting manifest, source hashes, NOTICE and generated data together.

The official zic from the same release is built in a temporary directory. Its -r
option expands recurring rules through the exclusive upper bound, so no host
timezone data, Intl, approximate sampling, or POSIX-rule interpretation is used.
PACKRATDATA=backzone and an empty PACKRATLIST preserve all available pre-1970
histories, including identifiers that modern tzdb otherwise merges into links.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import tarfile
import tempfile
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "locations" / "data"
OUTPUT = ROOT / "locations" / "src" / "time-zone-data.ts"
MANIFEST = DATA_DIR / "time-zones.manifest.json"
START = -1262476800  # 1929-12-30T00:00:00Z, padding for local dates from 1930.
END = 2240784000  # 2041-01-03T00:00:00Z, exclusive, padding through local 2040.
RELEASE_URL = "https://data.iana.org/time-zones/releases/"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def source_spec(version, kind):
    name = "tz{}{}.tar.gz".format(kind, version)
    return {"file": name, "url": RELEASE_URL + name}


def load_archives(version, pinned, allow_download):
    archives = {}
    specs = {}
    for kind in ("data", "code"):
        spec = source_spec(version, kind)
        path = DATA_DIR / spec["file"]
        expected = pinned.get(kind, {}).get("sha256")
        if not path.exists():
            if not allow_download:
                raise ValueError("Missing {}; use --download to restore the official archive".format(path))
            print("Downloading " + spec["url"], file=sys.stderr)
            with urllib.request.urlopen(spec["url"], timeout=60) as response:
                content = response.read()
        else:
            content = path.read_bytes()
        actual = digest(content)
        if expected is not None and actual != expected:
            raise ValueError("SHA-256 mismatch for " + str(path))
        spec["sha256"] = actual
        specs[kind] = spec
        archives[kind] = content
    return archives, specs


def extract_archive(content, destination):
    # Extract only ordinary files; reject paths that could escape the build dir.
    import io
    with tarfile.open(fileobj=io.BytesIO(content), mode="r:gz") as archive:
        for entry in archive:
            path = Path(entry.name)
            if path.is_absolute() or ".." in path.parts or not entry.isfile():
                raise ValueError("Unexpected archive member: " + entry.name)
            target = destination / path
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(entry) as source:
                target.write_bytes(source.read())


def run(command, directory):
    # Ambient flags can alter compiler behavior; this build needs no dependencies.
    environment = os.environ.copy()
    for name in ("CFLAGS", "CPPFLAGS", "LDFLAGS", "MAKEFLAGS", "MFLAGS"):
        environment.pop(name, None)
    environment["LC_ALL"] = "C"
    result = subprocess.run(command, cwd=directory, env=environment,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        raise ValueError("{} failed:\n{}{}".format(" ".join(command), result.stdout, result.stderr))


def tzif_block(content, position, width):
    if content[position:position + 4] != b"TZif":
        raise ValueError("Invalid TZif header")
    gmt_count, std_count, leap_count, time_count, type_count, char_count = struct.unpack_from(
        ">6I", content, position + 20)
    if not 1 <= type_count <= 256 or time_count > 10000 or leap_count:
        raise ValueError("Unexpected TZif counts or leap-second data")
    cursor = position + 44
    times = struct.unpack_from(
        ">" + ("q" if width == 8 else "i") * time_count, content, cursor)
    cursor += time_count * width
    indices = content[cursor:cursor + time_count]
    cursor += time_count
    offsets = []
    for _ in range(type_count):
        offset, is_dst, abbreviation = struct.unpack_from(">iBB", content, cursor)
        offsets.append(offset)
        cursor += 6
    cursor += char_count + leap_count * (width + 4) + std_count + gmt_count
    if cursor > len(content) or len(indices) != len(times):
        raise ValueError("Truncated TZif")
    return cursor, times, indices, offsets


def parse_tzif(path):
    content = path.read_bytes()
    if content[4:5] not in (b"2", b"3", b"4"):
        raise ValueError("64-bit TZif required: " + str(path))
    cursor, _, _, _ = tzif_block(content, 0, 4)
    cursor, times, indices, offsets = tzif_block(content, cursor, 8)
    # With finite -r bounds, zic expands footer rules and writes both sentinels.
    # Refuse a footer or missing bound instead of silently omitting future DST.
    if content[cursor:] != b"\n\n" or not times or times[0] != START or times[-1] != END:
        raise ValueError("zic did not materialize the full requested range: " + str(path))
    transitions = []
    selected_offsets = []
    previous_time = START - 1
    for instant, index in zip(times, indices):
        if instant <= previous_time or instant < START or instant > END:
            raise ValueError("Invalid transition order: " + str(path))
        previous_time = instant
        if instant == END:
            break
        offset = offsets[index]
        if not selected_offsets or offset != selected_offsets[-1]:
            transitions.append(instant)
            selected_offsets.append(offset)
    return transitions, selected_offsets


def compile_zones(archives, version):
    with tempfile.TemporaryDirectory(prefix="celestial-tzdb-") as temporary:
        source = Path(temporary) / "source"
        source.mkdir()
        for content in archives.values():
            extract_archive(content, source)
            if (source / "version").read_text().strip() != version:
                raise ValueError("Source archive version does not match the manifest")
        run(["make", "zic", "tzdata.zi", "PACKRATDATA=backzone", "PACKRATLIST="], source)
        zoneinfo = Path(temporary) / "zoneinfo"
        run([str(source / "zic"), "-b", "fat", "-r", "@{}/@{}".format(START, END),
             "-d", str(zoneinfo), "tzdata.zi"], source)
        names = set()
        for line in (source / "tzdata.zi").read_text().splitlines():
            fields = line.split()
            if fields and fields[0] == "Z":
                names.add(fields[1])
            elif fields and fields[0] == "L":
                names.add(fields[2])
        if len(names) < 500:
            raise ValueError("Unexpectedly incomplete IANA identifier list")
        return {name: parse_tzif(zoneinfo / name) for name in sorted(names)}


def render_typescript(zones, version):
    pool = []
    pool_indices = {}
    references = {}
    for name, (transitions, offsets) in zones.items():
        key = (tuple(transitions), tuple(offsets))
        if key not in pool_indices:
            pool_indices[key] = len(pool)
            pool.append((transitions, offsets))
        references[name] = pool_indices[key]
    lines = [
        "// Generated by scripts/generate-time-zones.py. Do not edit.",
        "// IANA tzdb {} with all backzone histories; see ../data/NOTICE.".format(version),
        "// Each UTC transition starts a period; offsets are seconds east of UTC.",
        "// Equal data is shared only after comparing the entire coverage interval.",
        "export const TZDB_VERSION = " + json.dumps(version) + ";",
        "export const TZDB_START = " + str(START) + ";",
        "export const TZDB_END = " + str(END) + ";",
        "",
        "type TimeZoneData = { transitions: number[]; offsets: number[] };",
        "const periods: TimeZoneData[] = [",
    ]
    compact = lambda value: json.dumps(value, separators=(",", ":"))
    for transitions, offsets in pool:
        lines.append("  { transitions: " + compact(transitions) + ", offsets: " + compact(offsets) + " },")
    lines.extend([
        "];", "", "export const TIME_ZONE_DATA: Record<string, TimeZoneData> = {",
    ])
    for name, index in references.items():
        lines.append("  " + json.dumps(name) + ": periods[" + str(index) + "],")
    lines.extend(["};", ""])
    return "\n".join(lines).encode(), len(pool)


def render_notice(version):
    return ("""IANA Time Zone Database (tzdb) {version}

Source: https://www.iana.org/time-zones
Release: https://www.iana.org/time-zones/releases/{version}
Archives and SHA-256 pins: time-zones.manifest.json

The embedded locations/src/time-zone-data.ts is derived from the official IANA
tzdata release with all backzone histories and backward compatibility links.
The original tzdata and tzcode archives are retained here for offline generation.
Their LICENSE files state:

    Unless specified below, all files in the tz code and data (including
    this LICENSE file) are in the public domain.

    If the files date.c, newstrftime.3, and strftime.c are present, they
    contain material derived from BSD and use the BSD 3-clause license.

The generated offset data is public domain. The listed BSD files are retained
unmodified in the upstream tzcode source archive, with their original notices;
they are not compiled into or required by the JavaScript runtime. Only zic is
built temporarily to generate the data.

Reproduce or verify offline (Python 3, make and a C compiler required):
    python3 scripts/generate-time-zones.py
    python3 scripts/generate-time-zones.py --check
Restore a missing pinned archive by adding --download. Adopt a new release with:
    python3 scripts/generate-time-zones.py --update VERSION --download

Coverage: 1929-12-30T00:00:00Z <= UTC < 2041-01-03T00:00:00Z.
Offsets retain seconds; transition instants are integer Unix seconds.
zic uses POSIX time without leap seconds and materializes recurring future rules
through the upper bound. Zone names are preserved; data is shared only when all
offset periods in the supported interval are identical. Historical observations
in tzdb can be incomplete or approximate, especially before 1970. Future rules
represent the laws known by this release and can change in a later IANA release.
""").format(version=version).encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="Verify all generated files without writing")
    parser.add_argument("--download", action="store_true", help="Download missing official archives")
    parser.add_argument("--update", metavar="VERSION", help="Adopt a release, pinning its downloaded sources")
    args = parser.parse_args()
    if args.check and (args.update or args.download):
        parser.error("--check is offline and cannot be combined with --update or --download")
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    version = args.update or previous.get("version")
    if not version or not re.fullmatch(r"[0-9]{4}[a-z]+", version):
        parser.error("A valid pinned version or --update VERSION is required")
    pinned = previous.get("sources", {}) if version == previous.get("version") else {}
    archives, specs = load_archives(version, pinned, args.download)
    zones = compile_zones(archives, version)
    output, unique_count = render_typescript(zones, version)
    manifest = {
        "version": version,
        "sources": specs,
        "coverage": {"start": "1929-12-30T00:00:00Z", "endExclusive": "2041-01-03T00:00:00Z",
                     "startEpochSeconds": START, "endEpochSeconds": END},
        "build": {"compiler": "IANA zic from the pinned tzcode archive",
                  "makeArguments": ["zic", "tzdata.zi", "PACKRATDATA=backzone", "PACKRATLIST="],
                  "zicArguments": ["-b", "fat", "-r", "@{}/@{}".format(START, END)],
                  "leapSeconds": False},
        "zoneCount": len(zones),
        "distinctPeriodSets": unique_count,
        "generatedFile": "locations/src/time-zone-data.ts",
        "generatedSha256": digest(output),
    }
    outputs = {OUTPUT: output, DATA_DIR / "NOTICE": render_notice(version),
               MANIFEST: (json.dumps(manifest, indent=2) + "\n").encode()}
    if args.check:
        changed = [str(path.relative_to(ROOT)) for path, content in outputs.items()
                   if not path.exists() or path.read_bytes() != content]
        if changed:
            raise ValueError("Generated files are out of date: " + ", ".join(changed))
        print("Verified IANA {}: {} identifiers, {} distinct period sets".format(version, len(zones), unique_count))
    else:
        for kind, content in archives.items():
            (DATA_DIR / specs[kind]["file"]).write_bytes(content)
        for path, content in outputs.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        print("Generated IANA {}: {} identifiers, {} distinct period sets".format(version, len(zones), unique_count))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, struct.error) as error:
        sys.exit(str(error))
