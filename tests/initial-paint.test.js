import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('initial splash is visible before scene transition animations run', async () => {
  const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');

  assert.match(source, /function Scene\(\{[^}]*animate = true[^}]*\}\)/);
  assert.match(source, /<Scene imageKey="intro" heavy animate=\{false\}>/);
});
