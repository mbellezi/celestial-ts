import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { celestial } from '../../wasm/tests/runtime.ts';
import {
  createChartCalculator, getTheme, THEMES, renderChartBundle, renderChartSvg,
  renderWheelSvg, renderTablesSvg, renderPositionsSvg, renderHousesSvg,
  renderAspectMatrixSvg, renderAspectsSvg,
} from '../../pkg/charts/index.js';
import type { RenderOptions, ThemeColors } from '../../pkg/charts/index.js';

const calculator=createChartCalculator(celestial);
const input={instant:'2026-10-16T00:04:57Z',timeZone:'America/Sao_Paulo',location:{latitude:-23.55052,longitude:-46.633308,label:'São Paulo'}};
const natal=calculator.natal(input);
const planetary=calculator.planetary(input);
const renderers=[renderChartSvg,renderWheelSvg,renderTablesSvg,renderPositionsSvg,renderHousesSvg,renderAspectMatrixSvg,renderAspectsSvg];

test('all standalone components select a theme by name and default to its light palette',()=>{
  for(const theme of THEMES)for(const render of renderers) {
    const implicit=render(natal,{theme:theme.id});
    assert.equal(implicit,render(natal,{theme:theme.id,colors:'light'}));
    const dark=render(natal,{theme:theme.id,colors:'dark'});
    assert.ok(dark);
    assert.notEqual(implicit,dark);
    assert.ok(dark.includes(getTheme(theme.id,'dark').colors.foreground)||dark.includes(getTheme(theme.id,'dark').colors.accent));
  }
  assert.equal(renderHousesSvg(planetary),undefined);
});

test('SVG backgrounds and wheel centers remain transparent in both modes and every component',async()=>{
  for(const theme of THEMES)for(const colors of ['light','dark'] as const)for(const render of renderers) {
    const source=render(natal,{theme:theme.id,colors})!;
    const image=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    // Bottom-right belongs to the page, including themes with an intentional tinted header.
    const last=(image.info.width*image.info.height-1)*4;
    assert.equal(image.data[last+3],0,`${theme.id}/${colors}/${render.name}: page must remain transparent`);
    assert.ok(!source.includes(getTheme(theme.id,colors).colors.background),'The suggested page background must never be painted');
    if(render===renderWheelSvg) {
      const center=(400*image.info.width+400)*4;
      assert.equal(image.data[center+3],0,'The wheel origin must not hide the host background');
    }
  }
});

test('custom palette changes only presentation and is accepted by every standalone renderer',()=>{
  const custom:ThemeColors={...getTheme('botanical','dark').colors,background:'#123456',foreground:'#abcdef',surface:'transparent',accent:'#dcbafe'};
  const before=structuredClone(custom);
  for(const theme of THEMES)for(const render of renderers) {
    const source=render(natal,{theme:theme.id,colors:custom})!;
    assert.ok(source.includes(custom.foreground)||source.includes(custom.accent));
    assert.ok(!source.includes(custom.background));
    assert.doesNotMatch(source,/fill="#(?:f1f2e9|142a24)"/);
    if(render===renderChartSvg||render===renderWheelSvg) {
      const geometry=(svg:string)=>[...svg.matchAll(/data-body-id="[^>]+/g)].map(match=>match[0]);
      assert.deepEqual(geometry(source),geometry(render(natal,{theme:theme.id,colors:'light'})!));
    }
  }
  assert.deepEqual(custom,before);
});

test('bundle exposes the same independent exports, including the full aspect list',()=>{
  const options:RenderOptions={theme:'atlas',colors:'dark',locale:'en',idPrefix:'independent'};
  for(const data of [natal,planetary]) {
    const bundle=renderChartBundle(data,options);
    assert.equal(bundle.positions,renderPositionsSvg(data,options));
    assert.equal(bundle.houses,renderHousesSvg(data,options));
    assert.equal(bundle.aspects,renderAspectMatrixSvg(data,options));
    assert.equal(bundle.aspectList,renderAspectsSvg(data,options));
    assert.notEqual(bundle.aspects,bundle.aspectList);
    assert.match(bundle.aspectList,/Applying/);
  }
});
