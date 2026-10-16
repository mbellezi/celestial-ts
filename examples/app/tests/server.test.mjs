import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkExampleBuild, exportExample, startExample } from '../../../scripts/example.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'celestial-example-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = {
    'examples/app/index.html': '<!doctype html><script type="module" src="app.js"></script>',
    'examples/app/app.js': "import '../../pkg/charts/index.js';",
    'examples/app/tests/private.js': 'private test',
    'examples/app/README.md': 'private docs',
    'pkg/celestial_wasm.js': 'export default () => {};',
    'pkg/celestial_wasm_bg.wasm': Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]),
    'pkg/charts/index.js': 'export const chart = true;',
    'pkg/reports/index.js': 'export const reports = true;',
    'pkg/reports/data/catalog.json': '{"catalog":true}',
    'pkg/locations/index.js': 'export const locations = true;',
    'pkg/charts/index.d.ts': 'export declare const chart: boolean;',
    'pkg/charts/index.js.map': '{"sources":["private"]}',
    '.git/config': 'private repository settings',
    '.cargo/config.toml': '[build]',
    'docs/api-reference.md': 'generated API documentation',
    'scripts/__pycache__/private.pyc': 'cached local paths',
  };
  for (const name of ['LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.txt', 'UPSTREAM-README.md',
    'Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml', 'package.json', 'package-lock.json', 'README.md']) {
    files[name] = `fixture ${name}`;
  }
  for (const [name, contents] of Object.entries(files)) {
    await mkdir(join(root, name, '..'), { recursive: true });
    await writeFile(join(root, name), contents);
  }
  for (const name of ['core', 'wasm', 'charts', 'reports', 'locations', 'scripts', 'tests']) {
    await mkdir(join(root, name), { recursive: true });
  }
  return root;
}

function http(server, path, options = {}) {
  return new Promise((accept, reject) => {
    const req = request({ host: '127.0.0.1', port: server.address().port, path, ...options }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => accept({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('loopback server serves modules, JSON and streaming WASM with correct routes and MIME', async t => {
  const root = await fixture(t);
  const server = await startExample({ root, port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(server.address().address, '127.0.0.1');
  const redirect = await http(server, '/');
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.location, '/examples/app/');
  assert.equal((await http(server, '/examples/app')).headers.location, '/examples/app/');
  const index = await http(server, '/examples/app/');
  assert.equal(index.status, 200);
  assert.match(index.headers['content-type'], /^text\/html/);
  const module = await http(server, '/examples/app/app.js?v=1');
  assert.equal(module.status, 200);
  assert.match(module.headers['content-type'], /^text\/javascript/);
  assert.match(module.body.toString(), /\.\.\/\.\.\/pkg/);
  const wasm = await http(server, '/pkg/celestial_wasm_bg.wasm');
  assert.equal(wasm.headers['content-type'], 'application/wasm');
  assert.equal(Number(wasm.headers['content-length']), wasm.body.length);
  assert.ok(await WebAssembly.compile(wasm.body));
  const catalog = await http(server, '/pkg/reports/data/catalog.json');
  assert.match(catalog.headers['content-type'], /^application\/json/);
  assert.deepEqual(JSON.parse(catalog.body), { catalog: true });
  const head = await http(server, '/pkg/celestial_wasm_bg.wasm', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers['content-length'], wasm.headers['content-length']);
  assert.equal(head.body.length, 0);
});

test('server denies traversal, hidden files, symlinks, non-assets, DNS rebinding and writes', async t => {
  const root = await fixture(t);
  await symlink(join(root, '.git', 'config'), join(root, 'examples', 'app', 'secret.js'));
  await symlink(join(root, '.git'), join(root, 'pkg', 'linked'));
  const server = await startExample({ root, port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  for (const path of ['/pkg/../.git/config', '/pkg/%2e%2e/.git/config', '/pkg/%2E%2E%2F.git/config',
    '/examples/app/../../package.json', '/examples/app/%2e%2e/%2e%2e/package.json', '/.git/config',
    '/pkg/.git/config', '/pkg/linked/config', '/examples/app/secret.js', '/examples/app/tests/private.js',
    '/examples/app/README.md', '/pkg/charts/index.d.ts', '/pkg/charts/index.js.map', '/pkg/', '/pkg//celestial_wasm.js']) {
    const response = await http(server, path);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(response.body.toString(), /private|fixture|celestial-example-test/);
  }
  for (const path of ['/pkg/%00.js', '/pkg/%5c..%5c.js', '/pkg/%zz']) {
    assert.equal((await http(server, path)).status, 400, path);
  }
  assert.equal((await http(server, '/pkg/celestial_wasm.js', { headers: { Host: 'attacker.example' } })).status, 403);
  const post = await http(server, '/examples/app/app.js', { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('missing build instructs npm run build without exposing local paths', async t => {
  const root = await fixture(t);
  await rm(join(root, 'pkg', 'celestial_wasm_bg.wasm'));
  await assert.rejects(checkExampleBuild(root), error => {
    assert.match(error.message, /npm run build/);
    assert.ok(!error.message.includes(root));
    return true;
  });
});

test('static export is relocatable, includes source and notices, excludes non-runtime files', async t => {
  const root = await fixture(t);
  const destination = await exportExample({ root });
  assert.match(await readFile(join(destination, 'index.html'), 'utf8'), /url=examples\/app\//);
  assert.equal(await readFile(join(destination, 'examples', 'app', 'app.js'), 'utf8'), "import '../../pkg/charts/index.js';");
  assert.equal((await readFile(join(destination, 'pkg', 'celestial_wasm_bg.wasm'))).length, 8);
  assert.equal(await readFile(join(destination, 'source', '.cargo', 'config.toml'), 'utf8'), '[build]');
  assert.match(await readFile(join(destination, 'source', 'examples', 'app', 'README.md'), 'utf8'), /private docs/);
  assert.equal(await readFile(join(destination, 'source', 'docs', 'api-reference.md'), 'utf8'), 'generated API documentation');
  for (const name of ['LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.txt']) {
    assert.equal(await readFile(join(destination, name), 'utf8'), `fixture ${name}`);
  }
  for (const path of ['.git/config', 'source/.git/config', 'source/scripts/__pycache__/private.pyc', 'examples/app/tests/private.js', 'pkg/charts/index.d.ts', 'pkg/charts/index.js.map']) {
    await assert.rejects(readFile(join(destination, path)), { code: 'ENOENT' });
  }
  await writeFile(join(destination, 'stale.txt'), 'stale');
  await exportExample({ root });
  await assert.rejects(readFile(join(destination, 'stale.txt')), { code: 'ENOENT' });
});

test('export rejects symlink assets and preserves previous output on preparation failure', async t => {
  const root = await fixture(t);
  const destination = await exportExample({ root });
  await writeFile(join(destination, 'retained.txt'), 'retained');
  await symlink(join(root, '.git', 'config'), join(root, 'examples', 'app', 'secret.js'));
  await assert.rejects(exportExample({ root }), /links simbólicos/);
  assert.equal(await readFile(join(destination, 'retained.txt'), 'utf8'), 'retained');
});

test('export and build checks reject symlink directory roots', async t => {
  const root = await fixture(t);
  const protectedDirectory = join(root, 'protected');
  await mkdir(protectedDirectory);
  await writeFile(join(protectedDirectory, 'retained.txt'), 'retained');
  await symlink(protectedDirectory, join(root, 'dist'));
  await assert.rejects(exportExample({ root }), /Destino dist inválido/);
  assert.equal(await readFile(join(protectedDirectory, 'retained.txt'), 'utf8'), 'retained');

  await rename(join(root, 'pkg'), join(root, 'actual-pkg'));
  await symlink(join(root, 'actual-pkg'), join(root, 'pkg'));
  await assert.rejects(checkExampleBuild(root), /npm run build/);
});
