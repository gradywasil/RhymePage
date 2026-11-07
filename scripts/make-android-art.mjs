import sharp from 'sharp';
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const kit = join(root, 'assets/branding/rf09');
const source = join(kit, 'RF09-refined-mic-pencil-icon-1024.png');
const resources = join(root, 'android/app/src/main/res');
const background = '#a4dfcc';
for (const [density, scale] of [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]]) {
  const directory = join(resources, `mipmap-${density}`);
  await mkdir(directory, { recursive: true });
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
    await sharp(source).resize(Math.round(48 * scale), Math.round(48 * scale)).png().toFile(join(directory, name));
  }
  const icon = await sharp(source).resize(Math.round(78 * scale), Math.round(78 * scale)).png().toBuffer();
  await sharp({ create: { width: Math.round(108 * scale), height: Math.round(108 * scale), channels: 4, background } })
    .composite([{ input: icon, gravity: 'centre' }]).png().toFile(join(directory, 'ic_launcher_foreground.png'));
}
for (const entry of await readdir(resources, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('drawable')) continue;
  const directory = join(resources, entry.name);
  if (!(await readdir(directory)).includes('splash.png')) continue;
  const path = join(directory, 'splash.png');
  const { width, height } = await sharp(path).metadata();
  const artwork = await sharp(source).resize(Math.round(Math.min(width, height) * 0.42)).png().toBuffer();
  const result = await sharp({ create: { width, height, channels: 4, background } }).composite([{ input: artwork, gravity: 'centre' }]).png().toBuffer();
  await sharp(result).toFile(path);
}
await copyFile(join(kit, 'RF09-refined-mic-pencil-icon-512.png'), join(root, 'assets/branding/play-icon-512.png'));
for (const name of ['favicon.ico', 'favicon.svg', 'favicon-16.png', 'favicon-32.png']) {
  await copyFile(join(kit, `RF09-refined-mic-pencil-${name}`), join(root, 'public', name));
}
await sharp(source).resize(180, 180).png().toFile(join(root, 'public/apple-touch-icon.png'));
console.log('Updated RF09 Android launcher/splash, Play icon, and web favicons.');
