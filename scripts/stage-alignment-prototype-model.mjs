// Development-only setup: downloads public model assets into Vite's static folder.
// Production would deploy these same assets from Rhymepage's own static host.
import { mkdir, writeFile, cp } from 'node:fs/promises';
import { join } from 'node:path';

const model = 'onnx-community/whisper-tiny.en';
const modelRoot = join('public', 'models', 'whisper-tiny.en');
const files = [
  'config.json', 'generation_config.json', 'preprocessor_config.json',
  'tokenizer.json', 'tokenizer_config.json', 'added_tokens.json',
  'special_tokens_map.json', 'merges.txt', 'normalizer.json', 'vocab.json',
  'onnx/encoder_model_fp16.onnx', 'onnx/decoder_model_merged_fp16.onnx',
];

for (const file of files) {
  const target = join(modelRoot, file);
  await mkdir(join(target, '..'), { recursive: true });
  const source = `https://huggingface.co/${model}/resolve/main/${file}`;
  process.stdout.write(`Downloading ${file}\n`);
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not download ${file}: ${response.status}`);
  await writeFile(target, new Uint8Array(await response.arrayBuffer()));
}

await mkdir(join('public', 'transformers-wasm'), { recursive: true });
await cp('node_modules/@huggingface/transformers/dist', join('public', 'transformers-wasm'), {
  recursive: true,
  filter: source => source.endsWith('.wasm') || source.endsWith('.mjs'),
});
console.log('Local model assets are staged for the prototype.');
