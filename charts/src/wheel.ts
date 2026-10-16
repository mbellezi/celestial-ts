import type { BodyPosition, ChartData, ChartLocale } from './types.js';
import type { ChartTheme } from './themes.js';
import { getMessages } from './locales.js';
import { renderGlyph } from './glyphs.js';
import { layoutPlanetLabels, normalizeAngle, pointAt, sectorPath } from './geometry.js';
import { escapeAttribute, escapeXml, n, svgCircle, svgLine, svgText } from './svg.js';

export interface WheelOptions { theme:ChartTheme; locale?:ChartLocale; cx:number;cy:number;radius:number; exteriorLabels?:boolean }

function placedLabels(data:ChartData,options:WheelOptions) {
  const labelRadius=options.radius*(options.exteriorLabels?1.17:.705);
  // Reserve the complete glyph, retrograde marker and degree label, including diagonal neighbours.
  const gap=2*Math.asin(Math.hypot(46,36)/(2*labelRadius))*180/Math.PI;
  return layoutPlanetLabels(data.bodies,Math.max(11,gap));
}

function zodiac(data: ChartData, options: WheelOptions): string {
  const {cx,cy,radius:r,theme} = options;
  const rotation = data.houses?.ascendant ?? 0;
  let result = '';
  for (let sign=0;sign<12;sign++) {
    const color = theme.colors.elements[sign%4]!;
    const fill = theme.ring === 'sectors' ? color : theme.colors.surface;
    const opacity = theme.ring === 'sectors' ? 0.16 : 0.75;
    result += `<path d="${sectorPath(sign*30,(sign+1)*30,rotation,cx,cy,r*.865,r)}" fill="${fill}" opacity="${opacity}"/>`;
    const from = pointAt(sign*30,rotation,cx,cy,r*.865);
    const to = pointAt(sign*30,rotation,cx,cy,r);
    result += svgLine(from.x,from.y,to.x,to.y,theme.colors.line,.8);
    const center = pointAt(sign*30+15,rotation,cx,cy,r*.931);
    result += `<g><title>${escapeXml(getMessages(options.locale).signs[sign])}</title>${renderGlyph('sign',sign,center.x,center.y,r*.069,color)}</g>`;
  }
  result += svgCircle(cx,cy,r,theme.colors.line,'none',1.1)+svgCircle(cx,cy,r*.865,theme.colors.line,'none',.9);
  for(let degree=0;degree<360;degree++) {
    if (theme.id === 'minimal' && degree%5 !== 0) continue;
    const length = degree%30 === 0 ? .035 : degree%5 === 0 ? .021 : .009;
    const a = pointAt(degree,rotation,cx,cy,r*.856);
    const b = pointAt(degree,rotation,cx,cy,r*(.856-length));
    result += svgLine(a.x,a.y,b.x,b.y,degree%5 === 0 ? theme.colors.muted : theme.colors.line,degree%30 === 0 ? 1.2 : .6);
  }
  return result;
}

function houses(data: ChartData, options: WheelOptions): string {
  if (!data.houses) return '';
  const {cx,cy,radius:r,theme} = options;
  const rotation = data.houses.ascendant;
  let result = '';
  for(let house=1;house<=12;house++) {
    const start = data.houses.cusps[house]!;
    const end = data.houses.cusps[house === 12 ? 1 : house+1]!;
    const a = pointAt(start,rotation,cx,cy,r*.51);
    const b = pointAt(start,rotation,cx,cy,r*.82);
    result += svgLine(a.x,a.y,b.x,b.y,theme.colors.line,house%3 === 1 ? 1 : .6);
    const mid = pointAt(start+normalizeAngle(end-start)/2,rotation,cx,cy,r*.55);
    result += svgText(mid.x,mid.y+3,house,{size:10,fill:theme.colors.muted,anchor:'middle'});
  }
  result += svgCircle(cx,cy,r*.51,theme.colors.line,'none',.6);
  for (const [name,longitude] of [['ASC',rotation],['MC',data.houses.midheaven],['DSC',rotation+180],['IC',data.houses.midheaven+180]] as const) {
    const a = pointAt(longitude,rotation,cx,cy,r*1.015);
    const b = pointAt(longitude,rotation,cx,cy,r*1.055);
    let label = pointAt(longitude,rotation,cx,cy,r*1.09);
    if(options.exteriorLabels) {
      const planets=placedLabels(data,options).map(body=>pointAt(body.labelLongitude,rotation,cx,cy,r*1.17));
      // Keep the angular tick exact; only displace its name if it meets a planet label.
      for(const offset of [0,6,-6,12,-12,18,-18]) {
        const candidate=pointAt(longitude+offset,rotation,cx,cy,r*1.09);
        label=candidate;
        if(planets.every(planet=>Math.abs(planet.x-candidate.x)>40||Math.abs(planet.y-candidate.y)>30))break;
      }
    }
    result += svgLine(a.x,a.y,b.x,b.y,theme.colors.accent,1.3);
    result += `<g data-axis="${name}" data-longitude="${normalizeAngle(longitude)}">${svgText(label.x,label.y+3,name,{size:10,fill:theme.colors.accent,anchor:'middle',spacing:.8})}</g>`;
  }
  return result;
}

function aspectLines(data: ChartData, options: WheelOptions): string {
  const {cx,cy,radius:r,theme} = options;
  const rotation = data.houses?.ascendant ?? 0;
  const bodies = new Map(data.bodies.map(body => [body.id,body]));
  return data.aspects.map(aspect => {
    const a = bodies.get(aspect.body1);
    const b = bodies.get(aspect.body2);
    if (!a || !b) return '';
    const p1 = pointAt(a.longitude,rotation,cx,cy,r*.49);
    const p2 = pointAt(b.longitude,rotation,cx,cy,r*.49);
    const color = theme.colors.aspects[aspect.angle];
    const opacity = theme.id === 'minimal' ? .68 : .64;
    const label = `${getMessages(options.locale).aspects[aspect.angle]} ${aspect.orb.toFixed(2)}°`;
    return `<g data-aspect="${aspect.angle}" data-body1="${a.id}" data-body2="${b.id}" opacity="${opacity}"><title>${escapeXml(label)}</title>${svgLine(p1.x,p1.y,p2.x,p2.y,color,aspect.orb < 2 ? 1.3 : .85,aspect.angle === 60 ? 'stroke-dasharray="3 3"' : '')}</g>`;
  }).join('');
}

function degreeLabel(body: BodyPosition): string {
  const degrees = Math.floor(body.degreeInSign);
  const minutes = Math.floor((body.degreeInSign-degrees)*60);
  return `${String(degrees).padStart(2,'0')}°${String(minutes).padStart(2,'0')}′`;
}

function planetMarks(data: ChartData, options: WheelOptions): string {
  const {cx,cy,radius:r,theme} = options;
  const rotation = data.houses?.ascendant ?? 0;
  const labels = new Map(placedLabels(data,options).map(label => [label.id,label.labelLongitude]));
  return data.bodies.map(body => {
    const exact = pointAt(body.longitude,rotation,cx,cy,r*.812);
    const inward = pointAt(body.longitude,rotation,cx,cy,r*.783);
    const labelLongitude = labels.get(body.id)!;
    const p = pointAt(labelLongitude,rotation,cx,cy,r*(options.exteriorLabels ? 1.17 : .705));
    const end = pointAt(labelLongitude,rotation,cx,cy,r*(options.exteriorLabels ? 1.11 : .755));
    const leader = options.exteriorLabels ? pointAt(body.longitude,rotation,cx,cy,r*1.015) : inward;
    const color = theme.colors.elements[body.sign%4]!;
    const description = `${getMessages(options.locale).bodies[body.key]} · ${getMessages(options.locale).signs[body.sign]} ${degreeLabel(body)}${body.retrograde ? ' · R' : ''}`;
    return `<g data-body="${body.id}" data-body-id="${body.id}" data-longitude="${body.longitude}" data-label-longitude="${labelLongitude}" data-anchor-x="${n(exact.x)}" data-anchor-y="${n(exact.y)}"><title>${escapeXml(description)}</title>`
      +svgLine(exact.x,exact.y,inward.x,inward.y,color,1.5)
      +`<path d="M${n(leader.x)} ${n(leader.y)} L${n(end.x)} ${n(end.y)}" fill="none" stroke="${theme.colors.line}" stroke-width=".8"/>`
      +renderGlyph('body',body.id,p.x,p.y-5,r*.071,theme.colors.foreground)
      +svgText(p.x,p.y+r*.062,degreeLabel(body),{size:10,fill:theme.colors.muted,anchor:'middle'})
      +(body.retrograde ? svgText(p.x+r*.046,p.y-r*.027,'R',{size:8,fill:theme.colors.secondary,anchor:'middle'}) : '')
      +'</g>';
  }).join('');
}

export function renderWheelGroup(data: ChartData, options: WheelOptions): string {
  const {cx,cy,radius:r,theme} = options;
  if (![cx,cy,r].every(Number.isFinite) || r<100) throw new RangeError('Invalid wheel geometry');
  return `<g data-chart-kind="${escapeAttribute(data.kind)}">`
    +zodiac(data,options)+houses(data,options)+aspectLines(data,options)+planetMarks(data,options)
    +svgCircle(cx,cy,3,theme.colors.accent,'none',1)
    +'</g>';
}
