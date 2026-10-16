import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
async function main() {
    /** Compare sampled houses: node houses-core.mjs --reference /tmp/houses.json [--output summary.json]. */
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const args = process.argv.slice(2);
    const arg = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
    const reference = arg('--reference', '/tmp/celestial-house-reference.json');
    const output = arg('--output', path.join(root, 'docs/validation/houses-swiss-1930-2040.json'));
    const wasm = arg('--wasm', path.join(root, 'pkg/celestial_wasm_bg.wasm'));
    const modulePath = arg('--module', path.join(root, 'pkg/celestial_wasm.js'));
    const { default: init, houses, housesArmc } = await import(pathToFileURL(modulePath));
    await init({ module_or_path: fs.readFileSync(wasm) });
    const referenceData = JSON.parse(fs.readFileSync(reference));
    const rows = referenceData.rows;
    const buckets = {};
    const polarOppositionCounts = {};
    const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180) * 3600;
    function add(key, v, row, field, got, want) { const b = buckets[key] ??= { v: [], worst: null }; b.v.push(v); if (!b.worst || v > b.worst.arcsec)
        b.worst = { arcsec: v, field, got, want, case: { year: row.year, month: row.month, day: row.day, hour: row.hour, lat: row.lat, lon: row.lon, armc: row.armc, eps: row.eps } }; }
    let errors = 0, polar = 0, finiteFailures = 0, corePolarErrors = 0;
    for (const row of rows) {
        let zone = Math.abs(row.lat) > 66 ? 'polar' : 'normal';
        const attempt = fn => { try { return { value: fn() }; } catch (error) { return { error: String(error) }; } };
        const utAttempt = attempt(() => houses(row.jd, row.lat, row.lon, row.sys.charCodeAt(0)));
        const armcAttempt = attempt(() => housesArmc(row.armc, row.lat, row.eps, row.sys.charCodeAt(0)));
        const got = utAttempt.value, armc = armcAttempt.value;
        if ((utAttempt.error || armcAttempt.error) && !(row.error && row.armcError))
            throw Error(`Unexpected core house failure: ${JSON.stringify({ row, utAttempt, armcAttempt })}`);
        if ([got, armc].filter(Boolean).some(r => ![...r.cusps, ...r.ascmc].every(Number.isFinite)))
            finiteFailures++;
        if (row.error || row.armcError) {
            if (![row.error, row.armcError].every(e => e?.classification === 'expected_placidus_polar_undefined'))
                throw Error('Unexpected Swiss error');
            errors++;
            if (utAttempt.error && armcAttempt.error) corePolarErrors++;
            if (zone === 'polar')
                polar++;
            continue;
        }
        for (const [mode, r, c, a] of [['UT', got, row.c, row.a], ['sameARMCeps', armc, row.ac, row.aa]]) {
            if (zone === 'polar') {
                const key = `${row.sys}/${mode}`;
                const count = polarOppositionCounts[key] ??= { locations: 0, opposition180: 0, ascOpposition180: 0 };
                count.locations++;
                if (Math.abs(diff(r.cusps[1], c[0]) - 648000) < 3600)
                    count.opposition180++;
                if (Math.abs(diff(r.ascmc[0], a[0]) - 648000) < 3600)
                    count.ascOpposition180++;
            }
            for (let i = 0; i < 12; i++)
                add(`${zone}/${row.sys}/${mode}/cusps`, diff(r.cusps[i + 1], c[i]), row, `cusp${i + 1}`, r.cusps[i + 1], c[i]);
            for (let i = 0; i < 3; i++)
                add(`${zone}/${row.sys}/${mode}/${['ASC', 'MC', 'ARMC'][i]}`, diff(r.ascmc[i], a[i]), row, ['ASC', 'MC', 'ARMC'][i], r.ascmc[i], a[i]);
        }
    }
    const stats = {};
    for (const [key, b] of Object.entries(buckets)) {
        b.v.sort((a, b) => a - b);
        stats[key] = { n: b.v.length, p50: b.v[Math.floor(b.v.length * .5)], p95: b.v[Math.floor(b.v.length * .95)], p99: b.v[Math.floor(b.v.length * .99)], max: b.v.at(-1), over1arcsec: b.v.filter(x => x > 1).length, over60arcsec: b.v.filter(x => x > 60).length, worst: b.worst };
    }
    const out = { swissVersion: referenceData.swissVersion, wrapperVersion: referenceData.wrapperVersion, reproducibility: { nodeVersion: process.version, sha256: Object.fromEntries([['reference', reference], ['swissScript', path.join(root, 'scripts/validation/houses-swiss.py')], ['coreScript', fileURLToPath(import.meta.url)]].map(([key, file]) => [key, createHash('sha256').update(fs.readFileSync(file)).digest('hex')])) }, polarOppositionCounts, polarOppositionToleranceArcsec: 3600, wasmSha256: createHash('sha256').update(fs.readFileSync(wasm)).digest('hex'), methodology: { reference: 'pyswisseph houses UT tropical, Gregorian Julian day; houses_armc using Swiss apparent sidereal time and true obliquity calc_ut(ECL_NUT)', difference: 'shortest angular distance; arcseconds', denominators: '48 dates x 11 latitudes x 5 longitudes x 3 systems = 7920 rows; normal 1680 locations/system and polar 960 locations/system; cusp statistics contain 12 values/location; angle statistics one/location. All 960 polar Placidus rows throw in Swiss and are excluded from numeric comparison.', samplingWarning: 'Sampled grid only. Zero WholeSign disagreement does not exclude sign-boundary disagreements when ASC is within the UT angle error of a sign edge.', isolation: 'sameARMCeps passes identical Swiss ARMC and true obliquity to both engines, isolating house formulae from time/obliquity pipeline.' }, units: 'arcsec shortest circular difference', grid: { years: '1930 to 2040 decade inclusive', datesHours: ['Jan1 0.12345', 'Mar20 6.789', 'Jun21 12.3456', 'Oct16 23.98765'], latitudes: [-80, -70, -60, -45, -23.55, 0, 23.55, 45, 60, 70, 80], longitudes: [-179.9, -74, -46.6333, 0, 151.2], systems: ['P', 'E', 'W'], rowCount: rows.length }, swissErrors: errors, swissPolarErrors: polar, coreNonfinite: finiteFailures, corePolarErrors, stats };
    out.diagnostics = { nonpolar: 'Core houses UT uses apparent sidereal time and true obliquity with nutation evaluated at TT; identical ARMC/eps isolates house formulae.', polar: 'Fallible core house APIs reject undefined polar Placidus, matching pyswisseph. The infallible astronomy layer provides documented Porphyry fallback. Equal and Whole Sign retain the polar ascendant convention checked by polarOppositionCounts.' };
    out.sources = ['https://www.astro.com/swisseph/swephprg.htm'];
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(out, null, 2) + '\n');
    console.log(output);
}
await main();
