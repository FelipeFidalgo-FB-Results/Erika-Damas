import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const IMAGE_NAMES = [
  'intro.webp',
  ...Array.from({ length: 10 }, (_, index) => `question-${index + 1}.webp`),
  ...Array.from({ length: 5 }, (_, index) => `result-${index + 1}.webp`),
  'doctor.webp',
];

test('ships every scene as a lightweight external image', async () => {
  for (const name of IMAGE_NAMES) {
    const file = path.resolve('public/assets/images', name);
    await access(file);
    const details = await stat(file);
    assert.ok(details.size < 350 * 1024, `${name} is ${details.size} bytes`);
  }
});

test('ships only the local Latin fonts required by the interface', async () => {
  for (const name of ['cormorant-normal.woff2', 'cormorant-italic.woff2', 'inter.woff2']) {
    await access(path.resolve('public/assets/fonts', name));
  }
});

