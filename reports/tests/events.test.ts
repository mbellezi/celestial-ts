import assert from 'node:assert/strict';
import { test } from 'node:test';
import { celestial as api } from '../../wasm/tests/runtime.ts';
import { detectEvents, type ReportWasmApi } from '../src/events.ts';
import { LruCache } from '../src/cache.ts';
const DAY=86400000, epoch=Date.UTC(2026,0,1), jd0=epoch/DAY+2440587.5;
const orbs={0:1,60:1,90:1,120:1,180:1} as const;
function synthetic(model:(t:number,id:number)=>{lon:number;speedLon:number}):ReportWasmApi{
 return {constants:api.constants,setDeltaTUserdef:()=>{},calcUtMany:(jd,ids)=>ids.map(id=>({status:'ok',value:{lat:0,dist:1,speedLat:0,speedDist:0,retFlags:0,...model(jd-jd0,id)}}))};
}
test('both directed conjunction crossings and grazing aspects survive without exactitude',()=>{
 const core=synthetic((t,id)=>({lon:id===1?0:id===0?((t-2)**2+0.5):id*30,speedLon:id===0?2*(t-2):0}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+4*DAY,bodies:['sun','moon'],orbs},new LruCache(256));
 const aspect=events.find(e=>e.catalogKey==='aspect:sun:moon:0');assert.ok(aspect);assert.equal(aspect.exact.length,0);assert.ok(Date.parse(aspect.end)>Date.parse(aspect.start));assert.equal(aspect.boundary.startClipped,false);
});
test('long presence intervals merge across bounded windows and retain censorship',()=>{
 const core=synthetic((_t,id)=>({lon:id*30+5,speedLon:0.01}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+90*DAY,bodies:['sun'],orbs},new LruCache(256));
 const signs=events.filter(e=>e.kind==='sign');assert.equal(signs.length,1);assert.equal(signs[0].start,new Date(epoch).toISOString());assert.equal(signs[0].end,new Date(epoch+90*DAY).toISOString());assert.deepEqual(signs[0].boundary,{startClipped:true,endClipped:true});
});
test('retrograde cusp crossing has the correct sign presence',()=>{
 const core=synthetic((t,id)=>({lon:id===2?31-t:id*30+5,speedLon:id===2?-1:0.01}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+2*DAY,bodies:['mercury'],orbs},new LruCache(256));
 const signs=events.filter(e=>e.kind==='sign');assert.deepEqual(signs.map(e=>e.details.sign),[1,0]);assert.equal(signs[0].end,new Date(epoch+DAY).toISOString());
});
test('real WASM finds known February 2026 new and full moons and Mercury stations',()=>{
 const events=detectEvents(api,{startMs:Date.UTC(2026,1,1),endMs:Date.UTC(2026,3,1),bodies:['sun','moon','mercury'],orbs},new LruCache(512));
 const full=events.find(e=>e.catalogKey.startsWith('phase:full:'));const next=events.find(e=>e.catalogKey.startsWith('phase:new:'));assert.ok(full);assert.ok(next);assert.ok(full.start.startsWith('2026-02-01'));assert.ok(next.start.startsWith('2026-02-17'));
 assert.ok(events.some(e=>e.catalogKey==='station:mercury:retrograde'&&e.start.startsWith('2026-02-26')));assert.ok(events.some(e=>e.catalogKey==='station:mercury:direct'&&e.start.startsWith('2026-03-20')));
});
test('conjunction wrap and negative sextile exact roots are retained',()=>{
 const core=synthetic((t,id)=>({lon:((id===1?350+20*t:0)%360+360)%360,speedLon:id===1?20:0}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+16*DAY,bodies:['sun','moon'],orbs},new LruCache(256));
 const conjunction=events.find(e=>e.catalogKey==='aspect:sun:moon:0');assert.ok(conjunction);assert.equal(conjunction.exact[0],new Date(epoch+0.5*DAY).toISOString());
 const sextiles=events.filter(e=>e.catalogKey==='aspect:sun:moon:60');assert.equal(sextiles.length,2);assert.ok(sextiles.every(e=>e.exact.length===1));
});
test('three exact retrograde passes share one uninterrupted orb interval',()=>{
 const core=synthetic((t,id)=>({lon:id===2?60+0.4*Math.sin(t*Math.PI):id===0?0:id*30,speedLon:id===2?0.4*Math.PI*Math.cos(t*Math.PI):0}));
 const events=detectEvents(core,{startMs:epoch+0.1*DAY,endMs:epoch+3.1*DAY,bodies:['sun','mercury'],orbs},new LruCache(256));
 const aspect=events.find(e=>e.catalogKey==='aspect:sun:mercury:60');assert.ok(aspect);assert.equal(aspect.exact.length,3);assert.deepEqual(aspect.boundary,{startClipped:true,endClipped:true});
});
test('all 45 primary-source eclipses have actual global contacts and valid rollovers',()=>{
 const core=synthetic((_t,id)=>({lon:id*30+5,speedLon:0.01}));
 const events=detectEvents(core,{startMs:epoch,endMs:Date.UTC(2036,0,1),bodies:[],orbs},new LruCache(256)).filter(e=>e.kind==='eclipse');
 assert.equal(events.length,45);assert.equal(events.filter(e=>e.details.category==='solar').length,22);assert.equal(events.filter(e=>e.details.category==='lunar').length,23);
 for(const e of events){assert.ok(e.start<e.exact[0]&&e.exact[0]<e.end);assert.equal((Date.parse(e.end)-Date.parse(e.start))/1000,e.details.globalDurationSeconds);assert.match(String(e.details.source),/^https:\/\/www.eclipsewise.com\//);assert.match(String(e.details.timeScale),/UT1/);}
 const rollover=events.find(e=>e.id==='eclipse:solar:09585');assert.ok(rollover);assert.ok(rollover.start.startsWith('2035-03-09'));assert.ok(rollover.end.startsWith('2035-03-10'));
});
test('eclipses intersect queries even when maximum lies outside; physical bounds remain known',()=>{
 const core=synthetic((_t,id)=>({lon:id*30+5,speedLon:0.01}));
 const events=detectEvents(core,{startMs:Date.UTC(2026,1,17,10),endMs:Date.UTC(2026,1,17,11),bodies:[],orbs},new LruCache(256));
 const eclipse=events.find(e=>e.kind==='eclipse');assert.ok(eclipse);assert.equal(eclipse.exact.length,0);assert.deepEqual(eclipse.boundary,{startClipped:true,endClipped:true});assert.equal(eclipse.details.fullStart,'2026-02-17T09:56:23.700Z');assert.equal(eclipse.details.fullEnd,'2026-02-17T14:27:38.700Z');
});
test('sparse sample cache extends safely when selected bodies change',()=>{
 const core=synthetic((t,id)=>({lon:((id*33+t*(id+1))%360+360)%360,speedLon:id+1}));
 const cache=new LruCache<unknown>(4096);
 const request={startMs:epoch,endMs:epoch+5*DAY,bodies:['sun'] as const,orbs};
 detectEvents(core,request,cache);
 const changed={...request,bodies:['sun','moon','mercury'] as const};
 assert.deepEqual(detectEvents(core,changed,cache),detectEvents(core,changed,new LruCache(4096)));
});
test('point events at the exclusive end do not leak into the query',()=>{
 const core=synthetic((t,id)=>({lon:id===1?170+10*t:id===2?50+(t-1)**2:0,speedLon:id===1?10:id===2?2*(t-1):0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+DAY,bodies:['mercury'],orbs},new LruCache(256));
 assert.ok(!events.some(e=>e.kind==='phase'&&e.details.phase==='full'));
 assert.ok(!events.some(e=>e.kind==='station'));
});
test('100 millisecond queries preserve exact interval endpoints for sign, retrograde and aspect',()=>{
 const core=synthetic((_t,id)=>({lon:id===0?60:id===2?60.5:id*30,speedLon:id===2?-0.1:0.1}));
 const startMs=epoch+123,endMs=startMs+100;
 const events=detectEvents(core,{startMs,endMs,bodies:['sun','mercury'],orbs},new LruCache(256));
 for(const kind of ['sign','retrograde','aspect']){
  const event=events.find(e=>e.kind===kind);assert.ok(event,kind);
  assert.equal(event.start,new Date(startMs).toISOString());assert.equal(event.end,new Date(endMs).toISOString());
  assert.deepEqual(event.boundary,{startClipped:true,endClipped:true});
 }
});
test('small supported orbs retain distinct entry and exit roots',()=>{
 const core=synthetic((t,id)=>({lon:id===1?60+(t-1)*15:0,speedLon:id===1?15:0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+2*DAY,bodies:['sun','moon'],orbs:{...orbs,60:0.001}},new LruCache(256));
 const aspect=events.find(e=>e.catalogKey==='aspect:sun:moon:60');assert.ok(aspect);assert.equal(aspect.exact.length,1);
 const duration=Date.parse(aspect.end)-Date.parse(aspect.start);assert.ok(Math.abs(duration-11520)<2,`duration ${duration}`);
});
test('physical sign ingress and exit at query boundaries are known rather than censored',()=>{
 const core=synthetic((t,id)=>({lon:id===2?30*t:id*33+5,speedLon:id===2?30:0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+DAY,bodies:['mercury'],orbs},new LruCache(256));
 const sign=events.find(e=>e.catalogKey==='sign:mercury:0');assert.ok(sign);
 assert.deepEqual(sign.boundary,{startClipped:false,endClipped:false});
 assert.equal(sign.details.fullStart,new Date(epoch).toISOString());assert.equal(sign.details.fullEnd,new Date(epoch+DAY).toISOString());
 assert.deepEqual(sign.exact,[new Date(epoch).toISOString()]);
});
test('aspect entry and exit exactly at query boundaries retain the full known interval',()=>{
 const core=synthetic((t,id)=>({lon:id===1?59+2*t:0,speedLon:id===1?2:0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+DAY,bodies:['sun','moon'],orbs},new LruCache(256));
 const aspect=events.find(e=>e.catalogKey==='aspect:sun:moon:60');assert.ok(aspect);
 assert.deepEqual(aspect.boundary,{startClipped:false,endClipped:false});
 assert.equal(aspect.details.fullStart,new Date(epoch).toISOString());assert.equal(aspect.details.fullEnd,new Date(epoch+DAY).toISOString());
});
test('retrograde station boundaries establish a complete retrograde-in-sign duration',()=>{
 const core=synthetic((t,id)=>({lon:id===2?65+Math.cos(Math.PI*t):id*33+5,speedLon:id===2?-Math.PI*Math.sin(Math.PI*t):0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+DAY,bodies:['mercury'],orbs},new LruCache(256));
 const retrograde=events.find(e=>e.kind==='retrograde');assert.ok(retrograde);
 assert.deepEqual(retrograde.boundary,{startClipped:false,endClipped:false});
 assert.equal(retrograde.details.fullStart,new Date(epoch).toISOString());assert.equal(retrograde.details.fullEnd,new Date(epoch+DAY).toISOString());
 assert.equal(events.filter(e=>e.kind==='station').length,1);assert.equal(events.find(e=>e.kind==='station')?.details.direction,'retrograde');
});
test('an aspect peak at the exclusive end is omitted while the active interval remains',()=>{
 const core=synthetic((t,id)=>({lon:id===1?59+t:0,speedLon:id===1?1:0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+DAY,bodies:['sun','moon'],orbs},new LruCache(256));
 const aspect=events.find(e=>e.catalogKey==='aspect:sun:moon:60');assert.ok(aspect);
 assert.deepEqual(aspect.exact,[]);assert.equal(aspect.end,new Date(epoch+DAY).toISOString());assert.equal(aspect.boundary.endClipped,true);
});
test('terminal retrograde station is outside exact moments but remains a known physical end',()=>{
 const core=synthetic((t,id)=>({lon:id===2?65+Math.cos(Math.PI*t):id*33+5,speedLon:id===2?-Math.PI*Math.sin(Math.PI*t):0.1}));
 const events=detectEvents(core,{startMs:epoch,endMs:epoch+DAY,bodies:['mercury'],orbs},new LruCache(256));
 const retrograde=events.find(e=>e.kind==='retrograde');assert.ok(retrograde);
 assert.deepEqual(retrograde.exact,[new Date(epoch).toISOString()]);
 assert.equal(retrograde.details.fullEnd,new Date(epoch+DAY).toISOString());assert.equal(retrograde.boundary.endClipped,false);
 assert.ok(events.every(e=>e.exact.every(t=>Date.parse(t)>=epoch&&Date.parse(t)<epoch+DAY)));
});
