# RhymePage artwork

## Active RF09 icon and favicon kit

The owner supplied `RhymePage-RF09-refined-icon-and-favicon-kit.zip` on 2026-10-26 and requested its integration. Archive SHA-256: `7b8e157ac42bd3c90b73d4b1779ba160474b4596809e015678a426e05cec2d01`.

All eight supplied files are preserved unchanged in `rf09/`. The detailed 1024px microphone/pencil image is the source for Android launcher densities, safe-area adaptive foregrounds, legacy splash images, and the 180px Apple touch icon. The supplied 512px image is copied unchanged to `play-icon-512.png`. The supplied ICO, SVG, 16px PNG and 32px PNG favicons are copied unchanged into `public/` and referenced by the root HTML entry point. The native background uses the artwork's mint corner color, `#A4DFCC`.

`npm run android:art` reproduces these raster outputs and web copies using Sharp 0.35.5. Android's monochrome vector follows the supplied favicon's rotated microphone/pencil silhouette with grille/handle cutouts, fitted to the adaptive safe area. The source image, circular/squircle adaptive crops, and SVG favicon were directly inspected. No new image generation or change to the supplied artwork was performed in this update.

The web build and Android debug build passed after integration. All supplied favicon copies in both build outputs match their sources byte for byte, and all five launcher densities have the expected dimensions. Android lint passed with 0 errors and 29 warnings. The rebuilt APK installed and cold-launched on the Android 16 emulator; its new adaptive icon was directly inspected in [Android App info](../../docs/android/evidence/rf09-app-icon-emulator.png). APK signature verification passed. This asset-only pass did not repeat authentication, sync, or physical-device acceptance checks.

The older notebook source and feature graphic below are preserved as historical candidates. The existing notebook feature graphic needs an RF09 replacement before store publication; it is not a matching current-brand asset.

## Historical notebook candidates

Created with the built-in image-generation tool on 2026-10-26. These are release candidates, not user-approved store artwork. Original generated files are preserved in this directory. `npm run android:art` derives launcher densities, adaptive-icon foregrounds, legacy splash images, and the 512px Play icon using Sharp 0.35.5. The feature graphic is resized to 1024 x 500 without adding content.

## Launcher source prompt

Use case: logo-brand. Create a polished original square Android launcher artwork for RhymePage, a songwriter's private lyric notebook with word suggestions and manual lyric/audio timing. A tactile lavender hardcover notebook, slightly open, with a bold indigo sound wave embossed across its front page and one warm pink page ribbon. Editorial dimensional illustration, soft sculpted paper edges, confident simple silhouette, a warm creative writing tool rather than a technical microphone or music player. Existing brand colors are pale lavender, pale pink, mint accents, dark indigo ink. The complete notebook and wave must fit within the center 60 percent of the square, surrounded by generous clean warm ivory background. Front-on slight three-quarter depth, crisp polished print illustration with subtle material texture and gentle shadow. No letters, words, logos, watermark, mock phone, rounded app-icon border, grid, collage, or UI. One standalone icon artwork, square composition, high resolution.

## Feature graphic prompt

Create one polished Google Play feature graphic for RhymePage using the attached notebook artwork as the visual reference. Wide 1024 by 500 composition. Preserve the lavender hardcover notebook, indigo embossed sound-wave, warm pink ribbon and warm ivory aesthetic. Notebook on the right, large confident typographic wordmark on the left, generous editorial breathing room, soft tactile illustration and subtle shadow, high contrast dark indigo text. Exact text: 'RhymePage' as the large title and 'Write your next line.' as the smaller single-line subtitle. Keep all lettering crisp, accurately spelled and comfortably inside safe margins. A finished brand graphic for a lyric notebook, no UI screenshots, no phone mockups, no badges, no prices, no claims about AI, no extra words or watermarks.

Both generated images and the 512px derived icon were directly viewed. The feature graphic uses a serif wordmark; the app's existing Raleway typography is unchanged. Review this variation before approving a store direction.
