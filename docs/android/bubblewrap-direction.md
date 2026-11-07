# Future Android candidate: Bubblewrap

Status: the owner subsequently decided against the Bubblewrap option. This document is historical planning only. Continue the Capacitor Android app; the current request is to publish the site's privacy policy and deletion-request resources.

The owner wants a future Bubblewrap version so the Android app and website can pick up the same hosted UI and privacy/deletion pages. This records the intended next candidate, not an approved replacement of the current Capacitor release. The current signed 0.1.1/code-2 AAB and manual Play upload path remain available.

## Intended delivery model

Use the existing React/Vite app and Firebase project as the hosted product. Bubblewrap would generate a Trusted Web Activity wrapper that opens that website. UI, copy, privacy-page, and deletion-page changes would normally reach Android through web deployment and the web cache/update lifecycle. Wrapper, manifest, signing, SDK, and native changes would still need a Play binary update.

Google documents the [Trusted Web Activity model](https://developer.chrome.com/docs/android/trusted-web-activity) and [Bubblewrap setup with Digital Asset Links](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start).

## Existing foundation

The React router already implements `/privacy` and `/delete-account` through `LegalPages.tsx`. The Firebase Hosting configuration serves `dist` with an SPA rewrite, which can support those routes when the web build is published. This inspection does not establish that the current pages are publicly deployed or legally reviewed. The canonical production HTTPS origin and its ownership still need confirmation before wrapper/Digital Asset Links configuration. Do not infer domain control from the RhymePage.com copyright text.

## Candidate sequence

1. Prepare the hosted web app: verify the canonical origin, public policy/deletion routes, web manifest, icons, and a deliberate offline/cache update policy. Keep authenticated API responses and private user content out of broad service-worker caches.
2. Confirm browser-based Google sign-in and reauthentication against the existing Firebase project. Existing cloud accounts and notes should remain on that project. A browser session is distinct from the current native app's session; test continuity rather than assuming it.
3. Replace or preserve the behavior currently supplied by the Capacitor bridge: confirmed device recovery commits, Back/background behavior, Android settings access, and native LRC/JSON document export. Exercise browser file selection, audio playback/seeking, manual line/word timing, export, interrupted saves, keyboard, and offline reopening on Android hardware.
4. Audit platform detection. A TWA runs the browser path, so the current Capacitor `isAndroid()` check would be false. The website currently initializes Analytics, while the Capacitor Android build does not. Privacy copy and Play declarations must reflect the chosen behavior. Optional alignment must remain deliberately opted into, with supported-device gating; do not accidentally expose or claim Android automatic-alignment support through the browser path.
5. Generate an isolated Bubblewrap test candidate and configure `.well-known/assetlinks.json` for its actual signing certificate. A Play-delivered candidate must use Play's app-signing fingerprint, not merely the local upload fingerprint. Publishing hosting/Digital Asset Links or registering a new external identity remains a separately reviewed action.
6. Compare the candidate with the current app before deciding on migration. If replacing the existing Play app, preserve `com.rhymepage.app`, signing continuity, and increasing version codes. Define migration for any writing that exists only in native SharedPreferences/WebView storage; a TWA cannot simply inherit that storage. Confirm cloud saves or provide a recovery/export path before switching users.

## Acceptance boundary

No Bubblewrap dependency, wrapper project, manifest, service worker, hosting deployment, Digital Asset Links publication, or Play upload was performed when this direction was recorded. The future candidate needs actual browser/Android acceptance and a migration decision before it replaces the current app. Native work should not be discarded to create it.
