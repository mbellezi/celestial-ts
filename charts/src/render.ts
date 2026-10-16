import type { ChartData, ChartLocale, ElementKey } from './types.js';
import { getMessages } from './locales.js';
import { getTheme, type ChartTheme, type ThemeId, type ThemeColorSelection } from './themes.js';
import { renderWheelGroup } from './wheel.js';
import { renderGlyph } from './glyphs.js';
import { renderPositionsTable, renderHousesTable, renderAspectMatrix, renderAspectsTable, type TableFragment } from './tables.js';
import { escapeXml, svgCircle, svgDocument, svgLine, svgRect, svgText } from './svg.js';

export interface RenderOptions { theme?:ThemeId; colors?:ThemeColorSelection; locale?:ChartLocale; title?:string; idPrefix?:string }
export interface ChartSvgBundle { chart:string; wheel:string; tables:string; positions:string; houses?:string; aspects:string; aspectList:string }
interface Context {data:ChartData;theme:ChartTheme;locale:ChartLocale;title:string;prefix:string}

const copy = {
  'pt-BR': { atlas:'ATLAS ASTROLÓGICO', tropical:'Tropical · geocêntrico', noHouses:'Sem casas · referência zodiacal', ascendant:'Ascendente', retrograde:'Retrógrados', instant:'CÉU DO INSTANTE', study:'ESTUDO CELESTE', tableTitle:'Dados do mapa', degree:'Longitude eclíptica', engine:'Cálculos Celestial · arte vetorial', planets:'astros', orbs:'Aspectos principais · orbes do motor', utc:'UTC' },
  en: { atlas:'ASTROLOGICAL ATLAS', tropical:'Tropical · geocentric', noHouses:'No houses · zodiac reference', ascendant:'Ascendant', retrograde:'Retrograde', instant:'SKY OF THE MOMENT', study:'CELESTIAL STUDY', tableTitle:'Chart data', degree:'Ecliptic longitude', engine:'Celestial calculations · vector artwork', planets:'bodies', orbs:'Major aspects · engine orbs', utc:'UTC' },
};

function validate(data: ChartData): void {
  if (!data || !['natal','planetary'].includes(data.kind) || !Number.isFinite(Date.parse(data.instant)) || !Number.isFinite(data.julianDay)) throw new RangeError('Invalid chart data');
  if (!Array.isArray(data.bodies) || !data.bodies.length || data.bodies.length>12 || new Set(data.bodies.map(body=>body.id)).size!==data.bodies.length) throw new RangeError('Invalid chart bodies');
  for (const body of data.bodies) {
    if (![body.longitude,body.latitude,body.distance,body.speedLongitude,body.degreeInSign].every(Number.isFinite) || body.longitude<0 || body.longitude>=360 || body.sign!==Math.floor(body.longitude/30)) throw new RangeError('Invalid body position');
  }
  if (data.kind==='natal' && !data.houses) throw new RangeError('Natal chart requires houses');
  if (data.kind==='planetary' && data.houses) throw new RangeError('Planetary chart must not contain houses');
  if (data.houses && (data.houses.cusps.length!==13 || ![...data.houses.cusps,data.houses.ascendant,data.houses.midheaven].every(Number.isFinite))) throw new RangeError('Invalid houses');
  for (const aspect of data.aspects) if (!Number.isFinite(aspect.orb) || aspect.orb<0 || ![0,60,90,120,180].includes(aspect.angle) || !data.bodies.some(body=>body.id===aspect.body1) || !data.bodies.some(body=>body.id===aspect.body2)) throw new RangeError('Invalid aspect');
  if (!Object.values(data.elements).every(value=>Number.isInteger(value)&&value>=0)) throw new RangeError('Invalid element counts');
}

function context(data:ChartData,options:RenderOptions):Context {
  validate(data);
  const locale=options.locale??'pt-BR';
  const theme=getTheme(options.theme,options.colors);
  return {data,locale,theme,title:options.title??getMessages(locale).labels[data.kind],prefix:options.idPrefix??`celestial-${theme.id}-${data.kind}`};
}

function text(ctx:Context,x:number,y:number,value:unknown,size=14,fill=ctx.theme.colors.foreground,anchor:'start'|'middle'|'end'='start'):string {
  return svgText(x,y,value,{size,fill,anchor});
}

function stamp(ctx:Context):string {
  return new Intl.DateTimeFormat(ctx.locale,{timeZone:ctx.data.timeZone,dateStyle:'long',timeStyle:'medium'}).format(new Date(ctx.data.instant));
}

function subline(ctx:Context):string {
  const houses=ctx.data.houses?({P:'Placidus',W:ctx.locale==='en'?'Whole sign':'Signos inteiros',E:ctx.locale==='en'?'Equal houses':'Casas iguais'}[ctx.data.houses.system]):copy[ctx.locale].noHouses;
  return `${copy[ctx.locale].tropical} · ${houses}`;
}

function heading(ctx:Context,width:number,center=false):string {
  const x=center?width/2:60;
  const anchor=center?'middle':'start';
  const label=ctx.theme.id==='atlas'?copy[ctx.locale].study:copy[ctx.locale].atlas;
  return svgText(x,47,`CELESTIAL / ${label}`,{size:11,fill:ctx.theme.colors.accent,spacing:2,anchor})
    +`<g data-chart-heading="true">${svgText(x,105,ctx.title,{size:ctx.theme.id==='minimal'?46:43,fill:ctx.theme.colors.foreground,font:ctx.theme.headingFont,anchor})}</g>`
    +text(ctx,x,136,`${ctx.data.location?.label??getMessages(ctx.locale).labels.planetary} · ${stamp(ctx)}`,12,ctx.theme.colors.muted,anchor)
    +text(ctx,x,158,subline(ctx),11,ctx.theme.colors.muted,anchor);
}

function footer(ctx:Context,width:number,height:number):string {
  const coordinates=ctx.data.kind==='natal'&&ctx.data.location?`${ctx.data.location.latitude.toFixed(5)}° / ${ctx.data.location.longitude.toFixed(5)}° · `:'';
  return svgLine(60,height-62,width-60,height-62,ctx.theme.colors.line,.8)
    +text(ctx,60,height-38,`${coordinates}${ctx.data.timeZone}`,10,ctx.theme.colors.muted)
    +text(ctx,width-60,height-38,copy[ctx.locale].engine,10,ctx.theme.colors.muted,'end');
}

function signPosition(longitude:number):{sign:number;label:string} {
  const normalized=((longitude%360)+360)%360;
  const degree=normalized%30;
  return {sign:Math.floor(normalized/30),label:`${String(Math.floor(degree)).padStart(2,'0')}°${String(Math.floor(degree%1*60)).padStart(2,'0')}′`};
}

function keynotes(ctx:Context,x:number,y:number,width:number):string {
  const sun=ctx.data.bodies.find(body=>body.key==='sun');
  const moon=ctx.data.bodies.find(body=>body.key==='moon');
  const messages=getMessages(ctx.locale);
  const entries=[{name:messages.bodies.sun,longitude:sun?.longitude},{name:messages.bodies.moon,longitude:moon?.longitude},ctx.data.houses?{name:copy[ctx.locale].ascendant,longitude:ctx.data.houses.ascendant}:{name:copy[ctx.locale].retrograde,longitude:undefined}];
  return entries.map((entry,index)=>{
    const left=x+index*width/3;
    const p=entry.longitude===undefined?undefined:signPosition(entry.longitude);
    return (index?svgLine(left-15,y-8,left-15,y+48,ctx.theme.colors.line,.7):'')
      +text(ctx,left,y,entry.name.toLocaleUpperCase(ctx.locale),10,ctx.theme.colors.muted)
      +(p?renderGlyph('sign',p.sign,left+12,y+29,21,ctx.theme.colors.elements[p.sign%4]!)+text(ctx,left+30,y+31,messages.signs[p.sign],15)+text(ctx,left+30,y+49,p.label,10,ctx.theme.colors.muted):text(ctx,left,y+36,ctx.data.bodies.filter(body=>body.retrograde).length,28));
  }).join('');
}

function elements(ctx:Context,x:number,y:number,width:number):string {
  const keys:ElementKey[]=['fire','earth','air','water'];
  const messages=getMessages(ctx.locale);
  const total=ctx.data.bodies.length;
  let result=svgText(x,y,messages.labels.elements.toLocaleUpperCase(ctx.locale),{size:10,fill:ctx.theme.colors.muted,spacing:1.5});
  keys.forEach((key,index)=>{
    const left=x+index*width/4;
    const barWidth=width/4-22;
    const value=ctx.data.elements[key];
    result+=text(ctx,left,y+28,messages.elements[key],12)+text(ctx,left+barWidth,y+28,value,14,ctx.theme.colors.foreground,'end')
      +svgRect(left,y+41,barWidth,5,ctx.theme.colors.line,2.5)+svgRect(left,y+41,barWidth*value/total,5,ctx.theme.colors.elements[index]!,2.5);
  });
  return result;
}

function zodiacRuler(ctx:Context,x:number,y:number,width:number):string {
  let result=svgText(x,y-18,copy[ctx.locale].degree.toLocaleUpperCase(ctx.locale),{size:10,fill:ctx.theme.colors.muted,spacing:1});
  for(let sign=0;sign<12;sign++) {
    const left=x+sign*width/12;
    const color=ctx.theme.colors.elements[sign%4]!;
    result+=svgRect(left,y,width/12-2,5,color)+renderGlyph('sign',sign,left+width/24,y+24,16,color)
      +text(ctx,left,y+52,`${sign*30}°`,9,ctx.theme.colors.muted);
  }
  for(const body of ctx.data.bodies) {
    const px=x+body.longitude/360*width;
    result+=`<g><title>${escapeXml(getMessages(ctx.locale).bodies[body.key])}</title>${svgLine(px,y-10,px,y,ctx.theme.colors.foreground,1.3)}${svgCircle(px,y-13,2,ctx.theme.colors.foreground,ctx.theme.colors.foreground,0)}</g>`;
  }
  return result;
}

function document(ctx:Context,body:string,width:number,height:number,suffix:string):string {
  return svgDocument(body,width,height,{title:ctx.title,description:`${ctx.title}. ${stamp(ctx)}. ${subline(ctx)}. ${ctx.data.bodies.length} ${copy[ctx.locale].planets}.`,font:ctx.theme.font,idPrefix:`${ctx.prefix}-${suffix}`,metadata:{source:'celestial-core WASM',kind:ctx.data.kind,instant:ctx.data.instant,timeZone:ctx.data.timeZone,location:ctx.data.kind==='natal'?ctx.data.location:undefined,julianDay:ctx.data.julianDay,houseSystem:ctx.data.houses?.system,positions:ctx.data.bodies,aspects:ctx.data.aspects}});
}

function wheel(ctx:Context,cx:number,cy:number,radius:number,exteriorLabels=false):string {
  return renderWheelGroup(ctx.data,{theme:ctx.theme,locale:ctx.locale,cx,cy,radius,exteriorLabels});
}

function table(ctx:Context,type:'positions'|'matrix',x:number,y:number,width:number):string {
  return (type==='positions'?renderPositionsTable:renderAspectMatrix)(ctx.data,{theme:ctx.theme,locale:ctx.locale,x,y,width}).svg;
}

/** A complete vector composition. All styles share identical astronomical data. */
export function renderChartSvg(data:ChartData,options:RenderOptions={}):string {
  const ctx=context(data,options);
  const portrait=ctx.theme.id==='botanical'||ctx.theme.id==='minimal';
  const width=portrait?1000:1200;
  const positionsHeight=renderPositionsTable(data,{theme:ctx.theme,locale:ctx.locale,width:380}).height;
  const height=(portrait?1500:ctx.theme.id==='prism'?1300:1150)+Math.max(0,positionsHeight-354);
  let body=heading(ctx,width,portrait);
  switch(ctx.theme.id) {
    case 'editorial':
      body+=wheel(ctx,365,455,280)+table(ctx,'positions',760,210,380)+table(ctx,'matrix',760,246+positionsHeight,380)+keynotes(ctx,95,825,600)+elements(ctx,95,945,580);
      break;
    case 'midnight':
      body+=svgLine(450,210,450,1030,ctx.theme.colors.line,.7)+wheel(ctx,815,470,275)+table(ctx,'positions',60,230,350)+table(ctx,'matrix',60,266+positionsHeight,350)+keynotes(ctx,540,850,600)+elements(ctx,540,965,580);
      break;
    case 'botanical':
      body+=wheel(ctx,500,470,282)+elements(ctx,160,830,700)+table(ctx,'positions',50,940,430)+table(ctx,'matrix',520,900,430);
      break;
    case 'prism':
      body=svgRect(0,0,width,180,ctx.theme.colors.surface)+body+keynotes(ctx,640,230,500)+wheel(ctx,330,480,248)+table(ctx,'positions',650,345,490)+table(ctx,'matrix',65,780,355)+elements(ctx,540,865,600)+zodiacRuler(ctx,540,1000,600);
      break;
    case 'atlas':
      body+=svgLine(60,190,1140,190,ctx.theme.colors.line)+zodiacRuler(ctx,70,230,1060)+wheel(ctx,375,610,277)+table(ctx,'positions',760,345,380)+keynotes(ctx,760,760,380)+elements(ctx,760,900,380);
      break;
    case 'minimal':
      body+=wheel(ctx,500,490,244,true)+keynotes(ctx,140,845,720)+table(ctx,'positions',50,975,430)+table(ctx,'matrix',520,900,430);
      break;
  }
  return document(ctx,body+footer(ctx,width,height),width,height,'chart');
}

export function renderWheelSvg(data:ChartData,options:RenderOptions={}):string {
  const ctx=context(data,options);
  return document(ctx,wheel(ctx,400,400,302,ctx.theme.id==='minimal'),800,800,'wheel');
}

function wrapTable(ctx:Context,fragment:TableFragment,label:string,suffix:string):string {
  return svgDocument(`<g transform="translate(24 24)">${fragment.svg}</g>`,fragment.width+48,fragment.height+48,{title:label,description:`${label}. ${stamp(ctx)}.`,font:ctx.theme.font,idPrefix:`${ctx.prefix}-${suffix}`});
}

export function renderTablesSvg(data:ChartData,options:RenderOptions={}):string {
  const ctx=context(data,options);
  const common={theme:ctx.theme,locale:ctx.locale,width:420};
  const positions=renderPositionsTable(data,common);
  const houses=renderHousesTable(data,common);
  const matrix=renderAspectMatrix(data,common);
  const aspects=renderAspectsTable(data,common);
  const row2=205+Math.max(positions.height,houses.height);
  const height=row2+Math.max(matrix.height,aspects.height)+110;
  const group=(fragment:TableFragment,x:number,y:number)=>`<g transform="translate(${x} ${y})">${fragment.svg}</g>`;
  let body=heading({...ctx,title:copy[ctx.locale].tableTitle},1000)+group(positions,60,190)+group(houses,520,190)+group(matrix,60,row2)+group(aspects,520,row2);
  if (!data.houses) body+=keynotes(ctx,540,235,380)+elements(ctx,540,365,380);
  return document(ctx,body+footer(ctx,1000,height),1000,height,'tables');
}

export function renderPositionsSvg(data:ChartData,options:RenderOptions={}):string {
  const ctx=context(data,options);
  return wrapTable(ctx,renderPositionsTable(data,{theme:ctx.theme,locale:ctx.locale,width:430}),getMessages(ctx.locale).labels.positions,'positions');
}

export function renderHousesSvg(data:ChartData,options:RenderOptions={}):string|undefined {
  const ctx=context(data,options);
  return data.houses?wrapTable(ctx,renderHousesTable(data,{theme:ctx.theme,locale:ctx.locale,width:430}),getMessages(ctx.locale).labels.houses,'houses'):undefined;
}

export function renderAspectMatrixSvg(data:ChartData,options:RenderOptions={}):string {
  const ctx=context(data,options);
  return wrapTable(ctx,renderAspectMatrix(data,{theme:ctx.theme,locale:ctx.locale,width:430}),getMessages(ctx.locale).labels.aspectMatrix,'aspects');
}

export function renderAspectsSvg(data:ChartData,options:RenderOptions={}):string {
  const ctx=context(data,options);
  return wrapTable(ctx,renderAspectsTable(data,{theme:ctx.theme,locale:ctx.locale,width:430}),getMessages(ctx.locale).labels.aspectsTable,'aspect-list');
}

export function renderChartBundle(data:ChartData,options:RenderOptions={}):ChartSvgBundle {
  const ctx=context(data,options);
  const common={theme:ctx.theme,locale:ctx.locale,width:430};
  const messages=getMessages(ctx.locale);
  return {
    chart:renderChartSvg(data,options),wheel:renderWheelSvg(data,options),tables:renderTablesSvg(data,options),
    positions:wrapTable(ctx,renderPositionsTable(data,common),messages.labels.positions,'positions'),
    houses:data.houses?wrapTable(ctx,renderHousesTable(data,common),messages.labels.houses,'houses'):undefined,
    aspects:wrapTable(ctx,renderAspectMatrix(data,common),messages.labels.aspectMatrix,'aspects'),
    aspectList:wrapTable(ctx,renderAspectsTable(data,common),messages.labels.aspectsTable,'aspect-list'),
  };
}
