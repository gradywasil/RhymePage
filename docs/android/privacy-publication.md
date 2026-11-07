# Published privacy and deletion resources

The owner requested a public privacy policy for Play Console and decided against the previously considered Bubblewrap option. The Capacitor Android app remains the chosen foundation.

- Privacy policy: https://rhymepage.com/privacy
- Account deletion: https://rhymepage.com/delete-account
- Privacy/support contact: Help@arrangedgodly.com

Both pages are static HTML, readable without JavaScript, authentication, or the Android app. A small local-only script now restores the site's saved theme; it does not load Firebase or Analytics. The deletion page provides an email-request link with account-identification instructions and an alternative account-settings path. Email delivery and the owner's handling of support requests were not tested by sending messages.

The text covers account/profile information, notebook content, audio and lyric timing, sharing and download links, local recovery copies, Datamuse/dictionary requests, website Analytics versus the standard Android build, optional local web vocal guides, HTTPS/service providers, retention, deletion, and the privacy contact. Claims of active deletion-lock enforcement/automatic TTL cleanup were removed because the staged full rules/index migration is not verified live. Full historical account-data cleanup remains a separate verification task.

`scripts/build-legal-pages.mjs` renders the existing `LegalPages.tsx` component into `public/privacy/index.html` and `public/delete-account/index.html`, with self-hosted Raleway fonts under `public/legal/`. `npm run legal:build` regenerates them; `npm run build` does so before the web build. Future Android builds include the revised in-app component. The existing installed code-2 AAB was not rebuilt for this website publication.

The Hosting deployment cloned live version `7f4b07e838756f4b`, added the four legal-page/font files and two exact route rewrites, and released version `8e44f8bd1ee3aee6`. All 32 existing file hashes were preserved. No full dirty-checkout web bundle, backend rules, Functions, or user-content changes were deployed. A pre-publication check confirmed the live release had not changed during preparation.

TypeScript/Vite web build and ESLint passed. The static pages were checked for required disclosures, script-free output, and an actionable deletion-request link. Rendered review covered a 390 px dark mobile viewport and a 1280 px light desktop viewport, without horizontal overflow. After release, unauthenticated HTTP checks returned 200 and exact expected content for both pages, both font files, and the www privacy URL. The homepage's raw content hash was unchanged. [Exact release and HTTP evidence](privacy-publication.json).

These are publication and accessibility checks, not Google Play policy approval or verification of complete account cleanup. Enter the public privacy and deletion URLs in their respective Play Console fields; keep Data safety declarations consistent with the actual services in use.

## Saved-theme follow-up

The owner requested that the legal pages match the active site theme. They now use the same `localStorage.theme` choice as the main app, with all six enabled daisyUI palettes read from the app's CSS configuration at build time. The theme is applied in the document head before content renders, refreshed on `pageshow` and relevant cross-tab storage events, and never writes a different preference back to storage. Missing, invalid, or inaccessible storage falls back to the app's declared default, Pastel. JavaScript-disabled visitors can still read the complete pages in that default theme. The previous operating-system light/dark override was removed because it could disagree with the chosen site theme.

Published Hosting version `0047486e3acc8ed3` replaces only the privacy and deletion HTML. The other 34 file hashes and the Hosting configuration were preserved, and the homepage still matches its pre-release bytes. The existing Android AAB was not rebuilt.

Headless Chrome checks against both the local candidates and the published pages covered all six saved themes, mobile privacy and desktop deletion layouts without horizontal overflow, a round trip through the live main app, invalid-theme and blocked-storage fallback, cross-tab event handling, and reading with JavaScript disabled. The browser reported no uncaught exceptions. Direct image review covered Forest privacy at 390 px and Retro deletion at 1280 px. These are browser checks, not physical-device acceptance. [Theme release evidence](privacy-theme-publication.json).
