#!/usr/bin/env node
// node scripts/validation/export-core.mjs [/tmp/celestial-core-audit.bin] [--nodes]
// Rebuild pkg first to audit a new core; hashes identify the exact artifact and source.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as core from '../../pkg/celestial_wasm.js';
function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const args = process.argv.slice(2);
  const nodesOnly = args.includes('--nodes');
  const positional = args.filter(arg => arg !== '--nodes');
  if (positional.length > 1 || positional.some(arg => arg.startsWith('--'))) {
    throw new Error('Usage: export-core.mjs [output.bin] [--nodes]');
  }
  const output = path.resolve(positional[0] ?? '/tmp/celestial-core-audit.bin');
  const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
  const wasm = fs.readFileSync(path.join(root, 'pkg/celestial_wasm_bg.wasm'));
  core.initSync({module: wasm});
  const bodies = nodesOnly ? [10,11] : [0,1,2,3,4,5,6,7,8,9,10,11,15];
  const names = nodesOnly ? ['MeanNode','TrueNode'] : ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','MeanNode','TrueNode','Chiron'];
  const fields = ['lon','lat','dist','speedLon','speedLat','speedDist'];
  const start = core.julday(1930,1,1,0,1), end = core.julday(2041,1,1,0,1);
  const dates = [];
  for (let jd = start; jd < end; jd += 0.25) dates.push(jd);
  dates.push(end - 1/86400, core.julday(1972,5,28,4,1));
  const seed = 0x19302040;
  let state = seed;
  for (let i=0;i<10000;i++) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    dates.push(start + (state >>> 0)/4294967296*(end-start));
  }
  const recordDoubles = 2 + bodies.length*fields.length;
  fs.mkdirSync(path.dirname(output),{recursive:true});
  const fd = fs.openSync(output,'w');
  const record = Buffer.alloc(recordDoubles*8);
  for (const jd of dates) {
    const values = [jd,core.deltat(jd)];
    for (const body of bodies) {
      const pos = core.calcUt(jd,body,258);
      for (const field of fields) values.push(pos[field]);
    }
    for (let i=0;i<values.length;i++) {
      if (!Number.isFinite(values[i])) throw new Error(`Non-finite JD=${jd}, field=${i}`);
      record.writeDoubleLE(values[i],i*8);
    }
    fs.writeSync(fd,record);
  }
  fs.closeSync(fd);
  const files = ['pkg/celestial_wasm_bg.wasm','pkg/celestial_wasm.js'];
  function walk(dir) {
   for (const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    const rel=path.posix.join(dir,entry.name);
    if(entry.isDirectory()) walk(rel); else if (/\.(rs|toml)$/.test(rel) ||
      (/^core\/(data|src\/astronomy)\//.test(rel) && /\.(bin|json)$/.test(rel))) files.push(rel);
   }
  }
  walk('core');walk('wasm/src');
  const manifest = {
   schemaVersion:1,format:'headerless little-endian IEEE754 float64 records',recordDoubles,
   recordLayout:['jdUT','deltaTDays',...bodies.flatMap((id,i)=>fields.map(f=>`${names[i]}.${f}`))],
   units:{lon:'degrees',lat:'degrees',dist:'AU',speedLon:'degrees/day',speedLat:'degrees/day',speedDist:'AU/day'},
   bodies:bodies.map((id,i)=>({id,name:names[i]})),flags:258,
   sampling:{startInclusiveJD:start,endExclusiveJD:end,gridStepDays:.25,gridCount:Math.round((end-start)*4),randomCount:10000,randomGenerator:'xorshift32 unsigned / 2^32',seed,extraJD:[end-1/86400,core.julday(1972,5,28,4,1)]},
   records:dates.length,binarySha256:sha256(fs.readFileSync(output)),
   sourceHashScope:'Rust/TOML sources plus BIN/JSON ephemeris assets under core/data and core/src/astronomy; wasm package artifacts',
   hashes:Object.fromEntries(files.sort().map(f=>[f,sha256(fs.readFileSync(path.join(root,f)))])),
   nodeVersion:process.version,
  };
  fs.writeFileSync(output+'.json',JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({output,records:dates.length,bytes:fs.statSync(output).size}));
}
try { main(); } catch (error) { console.error(`Core export failed: ${error.message}`); process.exitCode = 1; }
