# Android release progress

> Historical first-build record. The development pass continued after this milestone. See [development-validation.md](development-validation.md) for current implementation, APK identity, verification, and remaining gates. The APK size, test counts, authentication state, permissions, and model packaging below describe the initial build, not the current candidate. Preserve `debug-build.json` as that first build's evidence.

## Build milestone, 2026-10-26

RhymePage's debug APK compiles, installs, and opens on an Android 16 emulator. This is a development build. Signed-in workflows, physical-device behavior, and Play readiness remain unverified.

The shared checkout started on `main` at `014cabe4b4a6ecedaffb26ca050f15ab479e033a`, with the Android foundation and alignment changes already uncommitted. No reset, clean, commit, push, Firebase registration, or Play upload was performed. The browser-alignment plan and its approval cursor remain separate from this Android work.

## Reproduce the build

Use npm and the existing `package-lock.json`, as the hosting CI does. The pnpm lockfile is preserved but lacks the Capacitor dependencies. It is not an Android installation source until deliberately reconciled.

The verified toolchain is Temurin JDK 21.0.12.1+1, Gradle 8.14.3, Android Gradle Plugin 8.13.0, and Android SDK platform 36. SDK build tools 35.0.0 and 36.1.0 are installed; AGP selects the build tools it needs. The generated sources require Java 21. The machine's default Java remains 17 and Android Studio's bundled Java remains 25.

For this machine, run from the project directory in PowerShell:

```powershell
$env:JAVA_HOME = "$env:LOCALAPPDATA\RhymePage\toolchains\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run android:debug
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices -l
```

The JDK was downloaded from the Adoptium API and its archive SHA-256 verified before extraction. These paths are machine-specific. Other machines need their own JDK 21 and SDK installations. Select the same JDK as the Gradle JVM in Android Studio. Keep `android/local.properties` ignored; Windows drive colons in property values must be escaped, for example `sdk.dir=C\:/Users/arran/AppData/Local/Android/Sdk`.

The APK is `android/app/build/outputs/apk/debug/app-debug.apk`. Install it using the serial reported by adb:

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 shell am start -W -n com.rhymepage.app/.MainActivity
```

This uses development signing. It does not create a Play-ready release bundle or configure an upload key.

## Changes in this pass

- Added `npm run android:debug` and a native-build helper that requires JDK 21. Existing web build and sync commands remain available.
- Changed lyric completion from Space/Enter keydown handling to committed input and composition-end handling. Gboard emits an unidentified key for Space, so the previous handler never started suggestions. Caret-based completion also covers text insertion and paste without requesting suggestions for an unfinished word.
- Added regression cases for completed Android input, newlines, earlier-line editing, and incomplete input. Removed an unused argument from the existing Sherpa loader test mock so ESLint passes.
- Declared `MODIFY_AUDIO_SETTINGS` alongside `RECORD_AUDIO`. Capacitor's installed WebChromeClient requests both for web microphone capture. Before the fix, granting microphone access still returned `NotAllowedError`; after the fix, capture returns an audio track.
- Added the ignored local SDK configuration and documented the npm/JDK build path. Existing dependency versions, Firebase configuration, original public assets, and alignment approval state were preserved.

## Verification

| Check | Result and limits |
| --- | --- |
| `npm test` | 61 tests passed across 10 files. Uses the process-local TEMP/TMP workaround from the handoff. |
| `npm run lint` | Passed after fixing the unused test mock argument. |
| `npm run build` | Passed. The existing large JavaScript chunk warning remains. |
| `npm run android:debug` | Passed through web build, asset filtering, Capacitor sync, and native `:app:assembleDebug`. |
| `:app:lintDebug` | Passed with 0 errors and 15 warnings, principally generated resources/art and newer dependency notices. No lint baseline or suppression was added. |
| APK metadata and signing | `aapt dump badging` confirms application ID `com.rhymepage.app`, version 0.1.0/code 1, min SDK 24, target SDK 36. `apksigner verify --verbose` passes using APK Signature Scheme v2. |
| Emulator install and cold launch | Passed on `Medium_Phone_API_36.1`, x86_64, Android 16/API 36. Installed WebView is 134.0.6998.135. No physical phone was connected. |
| Android text input | Reproduced the old failure with `night ` and no Datamuse requests. After the fix, a real tap on Gboard Space triggers eight enabled API categories and returns 25 rhymes. |
| Keyboard and Back | The viewport shrinks with Gboard open; Back dismisses the keyboard and the lyrics remain. This is not a complete system Back-navigation test. |
| Background/resume and rotation | The test lyric survives Home/resume and portrait-to-landscape rotation while the process remains alive. This does not establish process-death recovery or offline saving. |
| Microphone bridge | A direct `getUserMedia` probe succeeds after permission is granted. The probe stops its returned track and verifies `readyState === 'ended'`. This does not test the complete vocal-guide capture/alignment flow or its audio quality. |
| Permission denial | Denial returns `NotAllowedError`. Repeated denial can set Android's `USER_FIXED` flag and block another prompt. An in-app recovery path to Android Settings is still needed and must be tested. |
| Account/data services | No real account was used or modified. Google popup authentication, saved-note reads/writes, upload, playback, sync persistence/export, and account-deletion cleanup are not accepted Android workflows yet. |

The development probes ran against the debug WebView through adb. Screenshots were viewed directly. They establish emulator behavior at the tested viewport, not physical-device, accessibility, or overall visual acceptance.

The APK identity and selected source hashes are recorded in [debug-build.json](debug-build.json). Rebuilds replace the APK, so compare its SHA-256 before reusing this evidence.

## Model and package size

The APK is about 170.5 MiB. The active Sherpa `.data` file alone is 190,951,044 bytes, plus a 13,148,431-byte WASM runtime before APK compression. This measured bundle is substantially larger than the roughly 42 MB estimate in the original research notes. Do not use that estimate for Android download messaging or release planning.

The Android filter excludes generated copies of `models/`, `transformers-wasm/`, and `sherpa-alignment-prototype/bundle.tar.bz2`. The original public files remain present. The active Sherpa bundle stays packaged for development, and no alignment request was made during the smoke test. Mobile recognition, memory use, processing time, cancellation, and download/cache behavior remain unestablished. Manual sync must remain available.

## Next work before internal testing

1. Add recovery for unsaved writing across editor navigation, process death, and interrupted cloud saves. Current editor state and delayed autosave do not establish that guarantee. Keep recovered drafts scoped to the correct account and avoid overwriting newer cloud notes.
2. Confirm the permanent Android application ID with the owner before registering it in the existing Firebase project or Play Console. The current local value is `com.rhymepage.app`.
3. Implement Android Google authentication and reauthentication. Keep the existing Firebase project and UIDs. Obtain a Google ID token through an Android-compatible flow, then use the existing web Firebase session through `signInWithCredential` or `reauthenticateWithCredential`. Evaluate Credential Manager or a maintained Capacitor integration before selecting the implementation. Web popup behavior must remain intact.
4. Test existing-account continuity, email/password login, sign-out, sensitive account actions, and complete deletion of notes, sync/audio records, Storage objects, and relevant local caches using disposable test data.
5. Exercise file selection/upload, playback/seeking, waveform and manual line/word timing, export/sharing, recording cancellation, denial/settings recovery, background/resume, rotation, keyboard editing, and offline transitions on a physical phone.
6. Decide whether the initial Android release can offer automatic alignment. Measure the current model on a real phone before choosing bundled versus explicitly downloaded delivery. Preserve local-only processing, explicit consent, and review/apply behavior.
7. Replace placeholder icons/splash, create store assets, prepare privacy and Data safety disclosures, provide external account-deletion access, arrange reviewer access, configure release/upload signing, and build an AAB for internal testing.
8. Confirm the account-specific Play Console requirements, then run the required closed test and apply for production access when eligible.

## Official release guidance checked on 2026-10-26

- [Capacitor 8 migration guide](https://capacitorjs.com/docs/updating/8-0) specifies SDK 36, AGP 8.13.0, and Gradle 8.14.3. The local build retains those versions.
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878) currently require new phone apps and updates to target API 36 from August 31, 2026. This build targets 36.
- [Personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465) apply the minimum 12 testers opted in continuously for 14 days to personal accounts created after November 13, 2023. This enables an application for production access, not automatic approval. The owner's actual account creation date and Console gates have not been inspected.
- [Account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111) require an in-app deletion path and an external web resource for account/data deletion when the app offers account creation. Existing code has not been certified against complete stored-data cleanup.
- [Firebase Android Google authentication](https://firebase.google.com/docs/auth/android/google-signin) documents Credential Manager and Google-token exchange. Native app identity, SHA configuration, and actual existing-account continuity remain pending.
