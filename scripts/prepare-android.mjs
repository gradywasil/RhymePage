import { cp } from 'node:fs/promises';
import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist-android/', import.meta.url);
const source = fileURLToPath(new URL('../public/', import.meta.url));
const experimental = process.env.VITE_ANDROID_ALIGNMENT === 'experimental';
// Never copy the public index over Vite's compiled entry point.
await cp(source, fileURLToPath(output), { recursive: true, filter: path => {
  const local = relative(source, path).split(sep).join('/');
  return !['index.html', 'models', 'transformers-wasm'].includes(local)
    && (experimental || local !== 'sherpa-alignment-prototype')
    && local !== 'sherpa-alignment-prototype/bundle.tar.bz2';
} });
