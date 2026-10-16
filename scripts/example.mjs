import { createServer } from 'node:http';
import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, mkdtemp, open, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const runtimeFiles = ['celestial_wasm.js', 'celestial_wasm_bg.wasm', 'charts/index.js', 'reports/index.js', 'locations/index.js'];
const notices = ['LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.txt', 'UPSTREAM-README.md'];
const sourceEntries = ['core', 'wasm', 'charts', 'reports', 'locations', 'scripts', 'tests', 'docs',
  'examples/app', '.cargo', 'Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml',
  'package.json', 'package-lock.json', 'README.md', ...notices];
const mimeTypes = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}));

function isPublic(parts) {
  return parts.length > 0 && parts.every(part => part && !part.startsWith('.') && part !== 'tests')
    && mimeTypes.has(extname(parts.at(-1))) && !parts.at(-1).endsWith('.d.ts');
}

async function regularFile(root, parts) {
  let path = root;
  for (let index = 0; index < parts.length; index++) {
    path = join(path, parts[index]);
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error('Not a public file');
    }
  }
  return path;
}

export async function checkExampleBuild(root = projectRoot) {
  try {
    for (const file of runtimeFiles) await regularFile(root, ['pkg', ...file.split('/')]);
  } catch {
    throw new Error('Build do exemplo ausente ou incompleto. Execute npm run build antes de iniciar ou exportar.');
  }
}

function respond(response, status, message, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...headers });
  response.end(message);
}

/** Serves only browser assets in examples/app and pkg, on IPv4 loopback. */
export async function startExample({ root = projectRoot, port = 4173 } = {}) {
  await checkExampleBuild(root);
  const server = createServer(async (request, response) => {
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(request.headers.host ?? '')) {
      return respond(response, 403, 'Host não permitido.');
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return respond(response, 405, 'Método não permitido.', { Allow: 'GET, HEAD' });
    }
    let pathname;
    try {
      pathname = decodeURIComponent(request.url.split('?')[0]);
    } catch {
      return respond(response, 400, 'URL inválida.');
    }
    if (pathname.includes('\\') || pathname.includes('\0') || !pathname.startsWith('/')) {
      return respond(response, 400, 'URL inválida.');
    }
    if (pathname === '/' || pathname === '/examples/app') {
      return respond(response, 302, '', { Location: '/examples/app/' });
    }
    if (pathname === '/examples/app/') pathname += 'index.html';
    const parts = pathname.slice(1).split('/');
    const allowedRoot = parts[0] === 'pkg' || (parts[0] === 'examples' && parts[1] === 'app');
    if (!allowedRoot || !isPublic(parts)) return respond(response, 404, 'Arquivo não encontrado.');
    let file;
    try {
      const path = await regularFile(root, parts);
      file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
      const stat = await file.stat();
      if (!stat.isFile()) throw new Error('Not a regular file');
      response.writeHead(200, { 'Content-Type': mimeTypes.get(extname(path)),
        'Content-Length': stat.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      if (request.method === 'HEAD') {
        await file.close();
        return response.end();
      }
      const stream = file.createReadStream();
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch {
      await file?.close().catch(() => {});
      if (!response.headersSent) respond(response, 404, 'Arquivo não encontrado.');
      else response.destroy();
    }
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', accept);
  });
  return server;
}

async function copyPublicTree(sourceRoot, parts, destination) {
  const source = join(sourceRoot, ...parts);
  const stat = await lstat(source);
  if (stat.isSymbolicLink()) throw new Error('A exportação não aceita links simbólicos nos assets.');
  if (stat.isDirectory()) {
    for (const name of await readdir(source)) {
      if (name.startsWith('.') || name === 'tests') continue;
      await copyPublicTree(sourceRoot, [...parts, name], join(destination, name));
    }
  } else if (stat.isFile() && isPublic(parts)) {
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

async function copySourceTree(sourceRoot, parts, destination) {
  const source = join(sourceRoot, ...parts);
  const stat = await lstat(source);
  if (stat.isSymbolicLink()) throw new Error('A exportação não aceita links simbólicos nos fontes.');
  if (stat.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const name of await readdir(source)) {
      if (name.startsWith('.') || name === 'node_modules' || name === 'target' || name === 'dist'
        || name === '__pycache__' || /\.py[co]$/.test(name)) continue;
      if (name === 'gallery' && parts.join('/') === 'charts/examples') continue;
      await copySourceTree(sourceRoot, [...parts, name], join(destination, name));
    }
  } else if (stat.isFile()) {
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

/** Exports a relocatable static tree while preserving ../../pkg module imports. */
export async function exportExample({ root = projectRoot } = {}) {
  await checkExampleBuild(root);
  await regularFile(root, ['examples', 'app', 'index.html']);
  const dist = join(root, 'dist');
  try {
    const stat = await lstat(dist);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Destino dist inválido.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dist);
  }
  const staging = await mkdtemp(join(dist, '.example-app-'));
  const destination = join(dist, 'example-app');
  try {
    await copyPublicTree(root, ['examples', 'app'], join(staging, 'examples', 'app'));
    await copyPublicTree(root, ['pkg'], join(staging, 'pkg'));
    for (const name of notices) {
      await copyFile(await regularFile(root, [name]), join(staging, name));
    }
    for (const entry of sourceEntries) {
      const parts = entry.split('/');
      await copySourceTree(root, parts, join(staging, 'source', ...parts));
    }
    await writeFile(join(staging, 'index.html'), '<!doctype html>\n<html lang="pt-BR"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=examples/app/"><title>Celestial — exemplo</title><a href="examples/app/">Abrir exemplo Celestial</a></html>\n');
    await rm(destination, { recursive: true, force: true });
    await rename(staging, destination);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return destination;
}

async function main(args) {
  if (args.includes('--help')) {
    console.log('Uso: node scripts/example.mjs [start] [--port 4173] | export | --build\nRequer npm run build. Exportação: dist/example-app.');
    return;
  }
  if (args.length === 1 && ['export', '--build'].includes(args[0])) {
    const destination = await exportExample();
    console.log(`Exemplo exportado: ${relative(projectRoot, destination).split(sep).join('/')}`);
    return;
  }
  if (args[0] === 'start') args = args.slice(1);
  let port = 4173;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1])) throw new Error('Uso: node scripts/example.mjs [start] [--port 4173] | export | --build');
    port = Number(args[1]);
    if (!Number.isSafeInteger(port) || port > 65535) throw new Error('Porta inválida (0–65535).');
  }
  const server = await startExample({ port });
  console.log(`Exemplo disponível em http://127.0.0.1:${server.address().port}/`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? 'Porta em uso. Escolha outra com --port.'
      : error.code ? `Falha ao preparar o exemplo (${error.code}). Confira o build e os arquivos de origem.` : error.message);
    process.exitCode = 1;
  }
}
