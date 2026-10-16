/** Reproduce from locally saved NASA catalog HTML. No network access is performed.
* node reports/scripts/extract-eclipse-catalog.mjs solar.html lunar.html
*/
import { readFileSync, writeFileSync } from 'node:fs';
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const rows = [];
for (const [i, category] of ['solar', 'lunar'].entries()) {
  const source = `https://eclipse.gsfc.nasa.gov/${category === 'solar' ? 'SEcat5/SE' : 'LEcat5/LE'}2001-2100.html`;
  for (const line of readFileSync(process.argv[i + 2], 'utf8').split('\n')) {
    const text = line.replace(/<[^>]*>/g, '').trim();
    const parts = text.split(/\s+/);
    if (!/^\d{5}$/.test(parts[0]) || +parts[1] < 2026 || +parts[1] > 2035)
      continue;
    const [catalog, year, month, day, clock, deltaT, , saros, type] = parts;
    const td = Date.UTC(+year, months.indexOf(month), +day, ...clock.split(':').map(Number));
    const item = {
      category,
      catalog,
      maximum: new Date(td - Number(deltaT) * 1000).toISOString(),
      type,
      saros: Number(saros),
      deltaTSeconds: Number(deltaT),
      source,
      timeScale: 'Predicted UT1, derived from catalog TD minus modeled Delta T; not precise UTC'
    };
    if (category === 'lunar') {
      for (const [name, index] of [['penumbralMinutes', 13], ['partialMinutes', 14], ['totalMinutes', 15]])
        if (parts[index] !== '-')
          item[name] = Number(parts[index]);
    }
    else {
      const duration = parts.at(-1).match(/^(\d+)m(\d+)s$/);
      if (duration)
        item.centralDurationSeconds = Number(duration[1]) * 60 + Number(duration[2]);
    }
    rows.push(item);
  }
}
if (rows.filter(r => r.category === 'solar').length !== 22 || rows.filter(r => r.category === 'lunar').length !== 23)
  throw new Error('Expected 22 solar and 23 lunar eclipses');
// Compact factual contact rows transcribed from the specific primary source pages.
// P1/P4 bound the whole global eclipse, not the duration seen at any one location.
const contacts = JSON.parse(readFileSync(new URL('../data/eclipsewise-source.json', import.meta.url), 'utf8'));
function clockMs(clock) {
  const [h, m, s] = clock.split(':').map(Number);
  return ((h * 60 + m) * 60 + s) * 1000;
}
for (const item of rows) {
  const prefix = item.category === 'solar' ? 'SE' : 'LE';
  const match = contacts.find(c => c.id.startsWith(prefix + item.maximum.slice(0, 4)) && c.id.slice(6, 9) === months[new Date(item.maximum).getUTCMonth()] && +c.id.slice(9, 11) === +item.maximum.slice(8, 10));
  if (!match)
    throw new Error(`Missing contacts for ${item.maximum}`);
  const headline = match.lines.find(l => /Greatest Eclipse.*\d{4} \w{3} \d{2} at/.test(l));
  const maximum = headline?.match(/(\d{4}) (\w{3}) (\d{2}) at ([\d:.]+) TD \(([\d:.]+) UT1\)/);
  if (!maximum)
    throw new Error(`Missing greatest eclipse ${match.id}`);
  const midnight = Date.UTC(+maximum[1], months.indexOf(maximum[2]), +maximum[3]);
  const greatest = midnight + clockMs(maximum[5]);
  const parseContact = (label, before) => {
    const row = match.lines.find(l => l.split('|').some(v => v.trim() === label));
    if (!row)
      return undefined;
    const fields = row.split('|').map(v => v.trim());
    let time = midnight + clockMs(fields[3]);
    if (before && time > greatest)
      time -= 86400000;
    if (!before && time < greatest)
      time += 86400000;
    return new Date(time).toISOString();
  };
  item.nasaSource = item.source;
  item.source = match.url;
  item.maximum = new Date(greatest).toISOString();
  item.start = parseContact('P1', true);
  item.end = parseContact('P4', false);
  if (!item.start || !item.end)
    throw new Error(`Missing P1/P4 for ${match.id}`);
  item.deltaTSeconds = Number(match.lines.find(l => l.includes('ΔT'))?.match(/\|\s*([\d.]+) s/)?.[1]);
  item.timeScale = 'Predicted UT1 from EclipseWise, represented as ISO for sorting; not precise UTC';
  item.globalDurationSeconds = (Date.parse(item.end) - Date.parse(item.start)) / 1000;
  const u1 = parseContact('U1', true), u4 = parseContact('U4', false), u2 = parseContact('U2', true), u3 = parseContact('U3', false);
  if (u1 && u4) {
    item.u1 = u1;
    item.u4 = u4;
    item.globalU1U4DurationSeconds = (Date.parse(u4) - Date.parse(u1)) / 1000;
  }
  if (u2 && u3) {
    item.u2 = u2;
    item.u3 = u3;
    item.globalU2U3DurationSeconds = (Date.parse(u3) - Date.parse(u2)) / 1000;
  }
  if (!(item.start < item.maximum && item.maximum < item.end) || item.globalDurationSeconds > 40000)
    throw new Error(`Invalid contact ordering ${match.id}`);
  if (item.category === 'lunar') {
    item.penumbralMinutes = item.globalDurationSeconds / 60;
    if (u1 && u4)
      item.partialMinutes = (Date.parse(u4) - Date.parse(u1)) / 60000;
    if (u2 && u3)
      item.totalMinutes = (Date.parse(u3) - Date.parse(u2)) / 60000;
  }
}
const output = {
  attribution: 'Eclipse Predictions by Fred Espenak, www.EclipseWise.com; secondary classification NASA/GSFC Five Millennium Catalog',
  events: rows.sort((a, b) => a.maximum.localeCompare(b.maximum)),
};
writeFileSync(new URL('../data/eclipses.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
