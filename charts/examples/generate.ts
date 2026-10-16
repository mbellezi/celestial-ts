import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import init, * as celestial from '../../pkg/celestial_wasm.js';
import { createChartCalculator, renderChartBundle, getTheme, THEMES } from '../../pkg/charts/index.js';

const instant='2026-10-16T00:04:57Z';
const location={label:'São Paulo',latitude:-23.55052,longitude:-46.633308};
const timeZone='America/Sao_Paulo';
const directory=fileURLToPath(new URL('./gallery/',import.meta.url));
const docsDirectory=fileURLToPath(new URL('../../docs/',import.meta.url));
await mkdir(`${directory}/previews`,{recursive:true});
await mkdir(`${docsDirectory}/images`,{recursive:true});
await mkdir(`${docsDirectory}/themes`,{recursive:true});
// Replace only this generator's named outputs, including the original single-mode examples.
for(const name of await readdir(directory)) {
  if(THEMES.some(theme=>new RegExp(`^${theme.id}-(?:(?:light|dark)-)?(?:natal|planetary)-[a-zA-Z]+\\.svg$`).test(name))) await rm(`${directory}/${name}`);
}
await init({module_or_path:await readFile(new URL('../../pkg/celestial_wasm_bg.wasm',import.meta.url))});
const calculator=createChartCalculator(celestial);
const data={natal:calculator.natal({instant,timeZone,location}),planetary:calculator.planetary({instant,timeZone})};
await writeFile(`${directory}/data.json`,JSON.stringify({instant,location,timeZone,...data},null,2)+'\n');

for(const mode of ['light','dark'] as const) {
 const tiles:{input:Buffer;left:number;top:number}[]=[];
 for(const [index,definition] of THEMES.entries()) {
  const theme=getTheme(definition.id,mode);
  for(const kind of ['natal','planetary'] as const) {
    const bundle=renderChartBundle(data[kind],{theme:theme.id,colors:mode,idPrefix:`sample-${theme.id}-${mode}-${kind}`});
    for(const [part,svg] of Object.entries(bundle)) {
      if(typeof svg!=='string')continue;
      await writeFile(`${directory}/${theme.id}-${mode}-${kind}-${part}.svg`,svg);
      const width=part==='chart'?1000:part==='wheel'?800:part==='tables'?1000:600;
      await sharp(Buffer.from(svg)).flatten({background:theme.colors.background}).resize({width}).png().toFile(`${docsDirectory}/images/${theme.id}-${mode}-${kind}-${part}.png`);
    }
    // Only inspection PNGs receive a page background; every SVG stays transparent.
    await sharp(Buffer.from(bundle.chart)).flatten({background:theme.colors.background}).resize({width:1200}).png().toFile(`${directory}/previews/${theme.id}-${mode}-${kind}.png`);
    if(kind==='natal') {
      const tile=await sharp(Buffer.from(bundle.chart)).flatten({background:theme.colors.background}).resize({width:540,height:640,fit:'contain',background:theme.colors.background}).png().toBuffer();
      const caption=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="56"><rect width="540" height="56" fill="${theme.colors.background}"/><text x="16" y="35" font-family="Arial,sans-serif" font-size="20" fill="${theme.colors.foreground}">${theme.label['pt-BR']} · ${mode}</text></svg>`);
      tiles.push({input:tile,left:24+index%3*564,top:24+Math.floor(index/3)*720});
      tiles.push({input:caption,left:24+index%3*564,top:664+Math.floor(index/3)*720});
    }
  }
 }
 await sharp({create:{width:1716,height:1464,channels:4,background:mode==='light'?'#e8ece9':'#080d14'}}).composite(tiles).png().toFile(`${directory}/previews/styles-${mode}.png`);
}
const template=await readFile(new URL('./gallery-template.html',import.meta.url),'utf8');
const buttons=THEMES.map(theme=>`<button class="style" type="button" data-theme="${theme.id}" aria-pressed="${theme.id==='editorial'}"><b>${theme.label['pt-BR']}</b><span>${theme.palettes.light.elements.map(color=>`<i style="--swatch:${color}"></i>`).join('')}</span></button>`).join('');
await writeFile(`${directory}/index.html`,template.replace('%%STYLE_BUTTONS%%',buttons).replace('%%STYLE_DATA%%',JSON.stringify(THEMES)));
const parts=[
  ['chart','Composição completa','renderChartSvg'],['wheel','Roda','renderWheelSvg'],
  ['positions','Posições','renderPositionsSvg'],['houses','Casas','renderHousesSvg'],
  ['aspects','Matriz de aspectos','renderAspectMatrixSvg'],['aspectList','Lista de aspectos','renderAspectsSvg'],
  ['tables','Conjunto de tabelas','renderTablesSvg'],
] as const;
let catalog='<!-- Gerado por npm run gallery. -->\n# Catálogo visual: temas e componentes\n\nBaseado na biblioteca original [Celestial](https://github.com/geraldo-netto/celestial), de [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por disponibilizar o motor de efemérides que fundamenta esta distribuição.\n\nPrévias reais calculadas pelo WASM para São Paulo em 15/10/2026 às 21:04:57 (16/10/2026 às 00:04:57 UTC). Os PNGs mostram cada SVG transparente sobre o fundo recomendado da paleta; a cor de página não faz parte do SVG exportado.\n\nCada tema tem light (padrão), dark e suporte a cores personalizadas. Abra o catálogo do tema para comparar **todos os componentes individualmente**, nos mapas natal e planetário: roda, posições, casas (somente natal), matriz de aspectos, lista de aspectos e conjunto de tabelas.\n\n[Guia da API e paletas](../charts/README.md) · [Galeria interativa com seleção de componente e fundo](../charts/examples/gallery/index.html)\n\n';
for(const theme of THEMES) {
  const label=theme.label['pt-BR'];
  catalog+=`## ${label}\n\n${theme.description['pt-BR']}\n\n[Ver mapa e todos os componentes de ${label}](themes/${theme.id}.md)\n\n| Light | Dark |\n| --- | --- |\n| [![${label} light](images/${theme.id}-light-natal-chart.png)](themes/${theme.id}.md) | [![${label} dark](images/${theme.id}-dark-natal-chart.png)](themes/${theme.id}.md) |\n\n`;
  let page=`<!-- Gerado por npm run gallery. -->\n# ${label}: mapas e componentes\n\nBaseado na biblioteca original [Celestial](https://github.com/geraldo-netto/celestial), de [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por disponibilizar o motor de efemérides que fundamenta esta distribuição.\n\n[Todos os temas](../themes.md) · [Guia de funções e paletas](../../charts/README.md) · [Galeria interativa](../../charts/examples/gallery/index.html)\n\nTema: \`${theme.id}\`. Cores: \`light\` (padrão), \`dark\` ou \`ThemeColors\`. Prévias geradas da biblioteca, sem reproduzir cálculos no desenho. Fundo externo composto apenas para leitura nesta documentação; os links SVG mantêm transparência.\n\n`;
  for(const [part,labelPart,method] of parts) {
    for(const kind of (part==='houses'?['natal']:['natal','planetary'])) {
      const titleKind=kind==='natal'?'natal · São Paulo · Placidus':'planetário · geocêntrico · sem casas';
      page+=`## ${labelPart} — ${titleKind}\n\n\`${method}(data, { theme: '${theme.id}', colors: 'light' })\`\n\nTroque \`colors\` por \`'dark'\` ou sua paleta.\n\n| Light | Dark |\n| --- | --- |\n`;
      const cells=['light','dark'].map(mode=>{
        const name=`${theme.id}-${mode}-${kind}-${part}`;
        return `[![${label}: ${labelPart}, ${kind}, ${mode}](../images/${name}.png)](../images/${name}.png)<br>[SVG transparente](../../charts/examples/gallery/${name}.svg)`;
      });
      page+=`| ${cells.join(' | ')} |\n\n`;
    }
  }
  await writeFile(`${docsDirectory}/themes/${theme.id}.md`,page);
}
await writeFile(`${docsDirectory}/themes.md`,catalog);
console.log(`Generated 6 themes × 2 color modes × 2 chart kinds from ${instant}: ${directory}`);
