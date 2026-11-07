# Android UI refinement, 2026-10-26

This pass preserves the existing RhymePage themes and writing flows. The owner's Play-install screenshot identified a separate strip below the footer, excessive mobile spacing, and a scrollbar that did not match the app.

## Changes

- Move bottom safe-area padding into the footer on pages that show it. The footer background reaches the gesture navigation area while its links remain above it. Writing routes keep their bottom inset without displaying the footer.
- Handle window insets in `MainActivity` with Capacitor's competing inset handler disabled. The supplied emulator runs WebView 134, where Capacitor otherwise pads the native container and prevents CSS from drawing into the bottom strip. The activity supplies CSS safe-area variables, reserves native padding for the keyboard, and reapplies insets after page commit. Edge-to-edge drawing is enabled on supported Android versions.
- Choose system icon contrast from the actual theme surface colors, including the navigation area's footer or editor background. Declare `adjustResize` so Android does not pan the activity when the keyboard opens.
- Compact the footer's copyright line on phones, preserve legal links with 48 px targets, and reduce landing-page and notebook spacing at narrow widths. Give the animated phrase a stable minimum width so it does not collapse to a small blank block between phrases.
- Replace the 12 px gray scrollbar with a 6 px rounded, theme-tinted thumb and transparent track. Preserve the existing hidden horizontal suggestion rails and add a system-color fallback for forced colors.
- Limit the half-open suggestion panel to the smaller of 16 rem and 30 dynamic viewport height units, leaving more writing room when the keyboard opens. Explicit full and peek states remain available.

## Validation

TypeScript and both web and Android Vite builds passed. ESLint passed and all 91 unit tests passed across 14 files. Android debug compilation and lint passed, with zero lint errors and 29 existing warnings. Vite still reports the existing large JavaScript chunk warning. No new dependency was added for the UI changes.

Runtime checks used the owned Android 16/API 36.1 emulator, WebView 134, and local Firebase Auth/Firestore emulators in `demo-rhymepage`. Fourteen disposable notes exercised the real notebook components without touching production accounts or notes. The normal HTTPS debug APK was also installed and exercised in guest mode.

The notebook rendered without horizontal overflow at 411 px phone width, 914 px landscape width, and a resized 1067 px tablet-style width. The wider layout showed three columns. A 320 px viewport kept both legal links within the footer. The light theme was inspected with Android font scale set to 1.3, and the dark theme with the normal scale. These are emulator checks, including a resized phone emulator for the wider layout, not physical tablet or phone acceptance.

Measured on the 411 px phone layout: the footer ended at the 914.29 px viewport boundary, its legal links ended at 886.29 px, and the bottom inset was 24 px. With the keyboard open, the viewport reduced to about 578 px and the bottom CSS inset became zero. The final suggestion panel measured about 174 px and the lyrics field about 175 px, compared with about 97 px for the previous fixed-height suggestion panel.

Evidence:

- [Footer and gesture area](evidence/ui-landing-gesture-area.png).
- [Notebook and themed scrollbar](evidence/ui-notebook-forest.png).
- [Keyboard and writing area](evidence/ui-editor-keyboard.png).

The version-code-1 signed AAB already uploaded to Play is unchanged. These refinements require a subsequent signed AAB with a higher version code before Play users receive them. The debug APK is a local validation artifact, not a Play upload. See [ui-build.json](ui-build.json) for artifact and source hashes. Earlier build records remain historical evidence and do not describe this new debug APK.

## Compact footer follow-up

At the owner's request, the footer row was reduced from 48 px to 36 px and its extra 4 px top/bottom padding removed. On the tested phone, total height decreased from 80 px to 60 px, including the unchanged 24 px gesture inset. The links end exactly above that inset and the background still reaches the screen edge. The 320 px layout kept both links on the same row without overflow. The updated Android debug build passed; no application behavior changed and no new tests were added for this spacing adjustment. See [compact footer evidence](evidence/ui-footer-compact.png) and [footer-build.json](footer-build.json) for the new artifact identity. This follow-up supersedes the earlier 48 px footer-target description only; the original UI-build artifact remains preserved separately.
