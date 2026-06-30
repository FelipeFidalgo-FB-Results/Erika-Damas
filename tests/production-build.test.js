import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const DIST = path.resolve('dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

test('production build excludes runtime compilation and embedded images', async () => {
  const html = await readFile(path.join(DIST, 'index.html'), 'utf8');
  assert.equal(html.includes('text/babel'), false);
  assert.equal(html.includes('__bundler/manifest'), false);
  assert.equal(/data:image\//.test(html), false);
  assert.ok(Buffer.byteLength(html) < 100 * 1024);

  const files = await walk(DIST);
  const textAssets = files.filter((file) => /\.(html|css|js)$/i.test(file));
  for (const file of textAssets) {
    const contents = await readFile(file, 'utf8');
    assert.equal(/data:image\//.test(contents), false, `${file} contains an embedded image`);
  }
});

test('production assets stay inside performance budgets', async () => {
  const files = await walk(DIST);
  const sized = await Promise.all(files.map(async (file) => ({
    file,
    size: (await stat(file)).size,
  })));

  const oversizedImage = sized.find(({ file, size }) => /\.(avif|webp|png|jpe?g)$/i.test(file) && size > 350 * 1024);
  assert.equal(oversizedImage, undefined);

  const scriptsAndStyles = sized
    .filter(({ file }) => /\.(js|css)$/i.test(file))
    .reduce((sum, { size }) => sum + size, 0);
  assert.ok(scriptsAndStyles < 500 * 1024, `JS/CSS total is ${scriptsAndStyles} bytes`);
});
