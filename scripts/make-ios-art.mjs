// Derives the iOS app icon and launch splash from the owner-supplied RF09 kit,
// matching the Android launcher/splash treatment in make-android-art.mjs.
import sharp from 'sharp';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'assets/branding/rf09/RF09-refined-mic-pencil-icon-1024.png');
const background = '#a4dfcc';
const assets = join(root, 'ios/App/App/Assets.xcassets');

// App Store icons must be fully opaque: flatten onto the artwork's own mint.
await sharp(source).resize(1024, 1024).flatten({ background }).removeAlpha()
  .png().toFile(join(assets, 'AppIcon.appiconset/AppIcon-512@2x.png'));

// One square splash, scaled to fill by the storyboard; artwork centred at the
// same share of the short edge as the Android splash.
const artwork = await sharp(source).resize(640, 640).png().toBuffer();
const splash = await sharp({ create: { width: 2732, height: 2732, channels: 3, background } })
  .composite([{ input: artwork, gravity: 'centre' }]).png().toBuffer();
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp(splash).toFile(join(assets, 'Splash.imageset', name));
}
console.log('Updated RF09 iOS app icon and launch splash.');
