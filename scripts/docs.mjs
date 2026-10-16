#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'docs/api-reference.md');
const modules = [
  { id: 'core', title: 'Core WASM', entry: 'pkg/celestial_wasm.d.ts', scope: 'pkg/celestial_wasm.d.ts', specifier: 'celestial-wasm' },
  { id: 'charts', title: 'Gráficos SVG', entry: 'pkg/charts/index.d.ts', scope: 'pkg/charts/', specifier: 'celestial-wasm/charts' },
];
const kinds = new Map([
  [ts.SyntaxKind.FunctionDeclaration, 'Funções'],
  [ts.SyntaxKind.ClassDeclaration, 'Classes'],
  [ts.SyntaxKind.InterfaceDeclaration, 'Interfaces'],
  [ts.SyntaxKind.TypeAliasDeclaration, 'Aliases de tipos'],
  [ts.SyntaxKind.VariableDeclaration, 'Constantes e variáveis'],
  [ts.SyntaxKind.EnumDeclaration, 'Enumerações'],
]);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function canonical(checker, symbol) {
  return symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function declarations(symbol) {
  return (symbol?.declarations ?? []).filter(node => kinds.has(node.kind));
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function within(module, node) {
  const file = relative(node.getSourceFile().fileName);
  return module.scope.endsWith('/') ? file.startsWith(module.scope) : file === module.scope;
}

function entry(checker, symbol, name = symbol.getName()) {
  const target = canonical(checker, symbol);
  const nodes = declarations(target);
  if (!nodes.length) throw new Error(`Declaração pública não suportada: ${name}`);
  return { name, symbol: target, nodes, kind: nodes[0].kind };
}

function publicEntries(program, checker, module) {
  const source = program.getSourceFile(path.join(root, module.entry));
  const symbol = checker.getSymbolAtLocation(source);
  return checker.getExportsOfModule(symbol).map(exported => entry(checker, exported));
}

function referencedTypes(checker, module, node) {
  const result = new Set();
  function visit(child) {
    if (child.parent && ts.isClassDeclaration(child.parent) && !isPublicMember(child)) return;
    if (ts.isIdentifier(child)) {
      const symbol = canonical(checker, checker.getSymbolAtLocation(child));
      const types = declarations(symbol).filter(declaration => !ts.isFunctionDeclaration(declaration) && !ts.isVariableDeclaration(declaration));
      if (types.some(declaration => within(module, declaration))) result.add(symbol);
    }
    ts.forEachChild(child, visit);
  }
  visit(node);
  return result;
}

function supportingEntries(checker, module, entries) {
  const known = new Set(entries.map(item => item.symbol));
  const queue = [...entries];
  const support = [];
  for (const item of queue) {
    for (const node of item.nodes) {
      for (const symbol of referencedTypes(checker, module, node)) {
        if (known.has(symbol)) continue;
        known.add(symbol);
        const found = entry(checker, symbol);
        support.push(found);
        queue.push(found);
      }
    }
  }
  return support;
}

function isPublicMember(member) {
  const modifiers = ts.getModifiers(member) ?? [];
  return !modifiers.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword)
    && !ts.isPrivateIdentifier(member.name ?? member);
}

function signature(node) {
  if (ts.isVariableDeclaration(node)) return printer.printNode(ts.EmitHint.Unspecified, node.parent.parent, node.getSourceFile()).trim();
  let declaration = node;
  if (ts.isClassDeclaration(node)) {
    declaration = ts.factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters,
      node.heritageClauses, node.members.filter(isPublicMember));
  }
  return printer.printNode(ts.EmitHint.Unspecified, declaration, node.getSourceFile()).trim();
}

function anchor(module, item) {
  return `${module.id}-${item.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function renderEntry(module, item) {
  const sources = [...new Set(item.nodes.map(node => relative(node.getSourceFile().fileName)))];
  const links = sources.map(file => `[${file}](../${file})`).join(', ');
  return `<a id="${anchor(module, item)}"></a>\n\n#### \`${item.name}\`\n\nDeclaração: ${links}.\n\n\`\`\`typescript\n${item.nodes.map(signature).join('\n\n')}\n\`\`\`\n`;
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => left.name < right.name ? -1 : Number(left.name > right.name));
}

function renderCategory(module, title, entries) {
  if (!entries.length) return '';
  const sorted = sortEntries(entries);
  const index = sorted.map(item => `[\`${item.name}\`](#${anchor(module, item)})`).join(' · ');
  return `### ${title} (${sorted.length})\n\n${index}\n\n${sorted.map(item => renderEntry(module, item)).join('\n')}`;
}

function renderModule(program, checker, module) {
  const entries = publicEntries(program, checker, module);
  const support = supportingEntries(checker, module, entries);
  const counts = [...kinds].map(([kind, title]) => `| ${title} | ${entries.filter(item => item.kind === kind).length} |`).join('\n');
  const sections = [...kinds].map(([kind, title]) => renderCategory(module, title, entries.filter(item => item.kind === kind)));
  const supportSection = support.length ? `### Tipos de apoio (${support.length})\n\nTipos referenciados nas assinaturas públicas, sem reexport direto pelo subpath.\n\n${sortEntries(support).map(item => renderEntry(module, item)).join('\n')}` : '';
  return { count: entries.length, support: support.length, text: `## ${module.title}\n\nImportação: \`${module.specifier}\`. **${entries.length} exports públicos**.\n\n| Categoria | Exports |\n| --- | ---: |\n${counts}\n\n${sections.join('\n')}${supportSection}` };
}

async function generate() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.some(value => value !== '--check')) throw new Error('Uso: node scripts/docs.mjs [--check]');
  await Promise.all(modules.map(module => readFile(path.join(root, module.entry))));
  const program = ts.createProgram(modules.map(module => path.join(root, module.entry)), {
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ESNext, noEmit: true,
  });
  const checker = program.getTypeChecker();
  const sections = modules.map(module => renderModule(program, checker, module));
  const markdown = `<!-- Gerado por scripts/docs.mjs. Não editar manualmente. -->\n# Referência da API TypeScript\n\nBaseado na biblioteca original [Celestial](https://github.com/geraldo-netto/celestial), de [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por disponibilizar o motor de efemérides que fundamenta esta distribuição.\n\nGerada das declarações emitidas pelo build com a AST do TypeScript. Inclui todos os\nexports dos dois entrypoints do pacote, suas assinaturas completas, campos e JSDoc\ndisponível. Os blocos preservam os tipos emitidos; não substituem a documentação\nmatemática do core Rust. Membros privados/protegidos das classes ficam fora da API.\n\nConsulte [uso, unidades e erros](../wasm/README.md) antes de calcular.\n\nPara atualizar: \`npm run build\` e \`npm run docs\`. Para verificar: \`npm run docs:check\`.\nA geração não executa cálculos nem modifica o pacote compilado.\n\n- [Core WASM](#core-wasm): ${sections[0].count} exports.\n- [Gráficos SVG](#gráficos-svg): ${sections[1].count} exports e ${sections[1].support} tipos de apoio.\n\n\`InitOutput\` descreve o ABI bruto retornado pela inicialização; os cálculos de\naplicação usam as funções/classes tipadas do módulo, e não esses ponteiros internos.\n\n${sections.map(section => section.text).join('\n')}\n`;
  if (arguments_.includes('--check')) {
    const current = await readFile(destination, 'utf8');
    if (current !== markdown) throw new Error('Referência desatualizada. Execute npm run docs depois do build.');
  } else {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, markdown);
  }
  console.log(`${arguments_.includes('--check') ? 'Verificada' : 'Gerada'} docs/api-reference.md: ${sections.map((section, index) => `${modules[index].id} ${section.count} exports + ${section.support} tipos de apoio`).join('; ')}.`);
}

generate().catch(error => {
  const message = error.code === 'ENOENT' ? 'Declarações ou referência ausentes. Execute npm run build e npm run docs.' : error.message;
  console.error(message);
  process.exitCode = 1;
});
