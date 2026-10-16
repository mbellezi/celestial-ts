export function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) throw new RangeError('Angle must be finite');
  return ((angle % 360) + 360) % 360;
}

export function pointAt(longitude: number, rotation: number, cx: number, cy: number, radius: number): {x:number;y:number} {
  const radians = (180 - longitude + rotation) * Math.PI / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

export interface PlanetLabel { id:number; longitude:number; labelLongitude:number }

/** Move only labels. The wheel markers and aspect endpoints retain exact longitude. */
export function layoutPlanetLabels(bodies: readonly {id:number;longitude:number}[], minGap = 11): PlanetLabel[] {
  if (!Number.isFinite(minGap) || minGap <= 0 || bodies.length * minGap >= 360) throw new RangeError('Invalid label spacing');
  const sorted = bodies.map(body => ({ ...body, longitude: normalizeAngle(body.longitude) })).sort((a,b) => a.longitude-b.longitude || a.id-b.id);
  if (sorted.length < 2) return sorted.map(body => ({...body,labelLongitude:body.longitude}));
  const gaps = sorted.map((body,index) => normalizeAngle(sorted[(index+1)%sorted.length]!.longitude-body.longitude));
  const cut = (gaps.indexOf(Math.max(...gaps))+1)%sorted.length;
  const ordered = [...sorted.slice(cut),...sorted.slice(0,cut)];
  const origin = ordered[0]!.longitude;
  const values = ordered.map(body => origin + normalizeAngle(body.longitude-origin));
  const blocks: {sum:number;count:number;indices:number[]}[] = [];
  values.forEach((value,index) => {
    blocks.push({sum:value-index*minGap,count:1,indices:[index]});
    while (blocks.length > 1) {
      const right = blocks[blocks.length-1]!;
      const left = blocks[blocks.length-2]!;
      if (left.sum/left.count <= right.sum/right.count) break;
      blocks.splice(-2,2,{sum:left.sum+right.sum,count:left.count+right.count,indices:[...left.indices,...right.indices]});
    }
  });
  const placed = Array<number>(ordered.length);
  for (const block of blocks) for (const index of block.indices) placed[index] = block.sum/block.count+index*minGap;
  return ordered.map((body,index) => ({...body,labelLongitude:normalizeAngle(placed[index]!)}));
}

export function sectorPath(start: number, end: number, rotation: number, cx: number, cy: number, inner: number, outer: number): string {
  const points = [pointAt(start,rotation,cx,cy,outer),pointAt(end,rotation,cx,cy,outer),pointAt(end,rotation,cx,cy,inner),pointAt(start,rotation,cx,cy,inner)];
  const pair = (index:number) => `${points[index]!.x.toFixed(3)} ${points[index]!.y.toFixed(3)}`;
  const large = normalizeAngle(end-start) > 180 ? 1 : 0;
  return `M${pair(0)} A${outer} ${outer} 0 ${large} 0 ${pair(1)} L${pair(2)} A${inner} ${inner} 0 ${large} 1 ${pair(3)} Z`;
}
