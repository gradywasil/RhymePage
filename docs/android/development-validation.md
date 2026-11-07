# Android development and validation, 2026-10-26

Current Play-test acceptance is recorded in [the version-2 handoff](internal-testing-v2.md): the owner reports uploading/installing the update on their phone and successfully creating/deleting notes and exporting timing as LRC and JSON. Earlier owner-reported Google sign-in/existing-note access and the active Functions inventory are in [firebase-registration.md](firebase-registration.md). These reports are distinct from agent-observed emulator checks and build-time artifact records.

UI refinement evidence is in [ui-polish.md](ui-polish.md), including the subsequent compact-footer adjustment. [release-build-v2.json](release-build-v2.json) identifies the signed 0.1.1/code-2 AAB. The historical development results below describe the earlier debug and first-release work; they do not override subsequent acceptance reports. Full account-deletion cleanup, broader device acceptance, privacy/public-web publication, and production readiness remain separate work.

The permanent application ID is **com.rhymepage.app**. The owner supplied **Help@arrangedgodly.com** for public support/privacy contact. Both decisions are reflected in local code and release preparation.

## Checkout and artifact

Work continued in the original shared dirty checkout on `main`, HEAD `014cabe4b4a6ecedaffb26ca050f15ab479e033a`. Existing Android, alignment, application, documentation, model, and pnpm work was retained. No reset, clean, commit, push, live user-data mutation, backend deployment, or Play upload was performed. A private upload key was subsequently created for the owner's requested AAB. Android app/debug-certificate registration is recorded in [firebase-registration.md](firebase-registration.md). The existing web app and notes index remain in place.

The current configured APK is `android/app/build/outputs/apk/debug/app-debug.apk`, about **8.0 MiB**, version 0.1.0/code 1, min SDK 24, target/compile SDK 36. It uses development signing and the owner-supplied RF09 microphone/pencil artwork. See [current-build.json](current-build.json) for its exact size, SHA-256, source hashes, and separate emulator-test artifact identity. Rebuilds replace the APK; compare hashes before reusing evidence. The first-build `debug-build.json` and [release-progress.md](release-progress.md) are preserved as historical records.

The verified build toolchain is Temurin 21.0.12.1+1, Gradle 8.14.3, AGP 8.13.0, SDK 36, Node 24.22.1, and npm 11.18.0. Java defaults were not replaced. Machine-specific SDK paths remain in ignored `android/local.properties`. Use npm and `package-lock.json`; preserved pnpm files remain unvalidated for this dependency set.

```powershell
$env:JAVA_HOME = "$env:LOCALAPPDATA\RhymePage\toolchains\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run android:debug
```

## Implementation across the development priorities

| Priority | Local result | Remaining acceptance |
| --- | --- | --- |
| Android foundation | JDK 21 guard, SDK 36 build, normal and isolated emulator APK paths, install/cold launch verified | Physical phone and additional Android/API versions |
| Google accounts | Credential Manager token handed to the existing JavaScript Firebase Auth instance; current-user credential reauthentication; web popups retained; Android app/debug certificate registered, native Google UI launch/cancellation passed | Complete real existing-account sign-in and verify UID continuity, account selection, reauthentication, and sign-out |
| Writing safety and navigation | Account/note-scoped device recovery, explicit device/cloud comparison, optimistic content revision checks, serialized saves, stable create IDs, new-note route promotion, Back handling | Longer real-keyboard sessions, multi-device collaboration, low-memory and physical-device lifecycle checks |
| Audio and sync | Cancellable/progress uploads, race guards, metadata timeout/cleanup, playback error handling, background pause, manual line/word timing, waveform editor, serialized timing recovery, native LRC/JSON file saving | Long/large tracks, supported format matrix, physical audio output/Bluetooth, human timing usability, offline reload of remote audio |
| Microphone | Existing permission/settings recovery and cancellation fixes retained for the optional experiment; recording generation and cleanup races covered by tests | Complete capture and alignment on a physical phone; standard Android does not request the microphone |
| Automatic alignment | Web local-only vocal guide, explicit model opt-in, and review/apply flow preserved; native experiment gated | Mobile memory/time/accuracy, deliberate model delivery/consent/cache policy; no Android support claim |
| Release presentation | Candidate original launcher/adaptive/monochrome icon, splash, 512px icon and 1024x500 feature graphic; source/prompt provenance | Owner artwork approval and final configured physical-device screenshots; accessibility and full visual acceptance |
| Privacy and Play | Public-route policy/deletion implementation, approved contact, listing copy, Data safety inventory, signing/version controls, and first signed AAB | Policy/UGC/audience review, publish the routes, reviewer access, Console answers, Play signing certificate, internal test and applicable closed test |
| Account deletion | Authenticated recent-reauth callable, recursive note/sync/Storage cleanup, sharing/follow/profile/index cleanup, cached-token deletion locks and TTL configuration | Live IAM/runtime verification, historical orphaned Storage audit, production cleanup acceptance |
| Package management | npm path documented; targeted compatible dependency updates; audit triage recorded | Remaining upstream advisories and eventual deliberate pnpm reconciliation if needed |

## Writing durability and recovery behavior

The editor writes recovery data synchronously in the web storage interface. On Android that interface additionally serializes native SharedPreferences `commit()` operations. Startup restores the authoritative native recovery entries before mounting the app, including the last editor route. Existing WebView recovery is migrated once. Native failures block a false device-save claim and are surfaced to the writer; startup failures offer Retry before editing.

This native store fixes an observed Android WebView disk-write gap: a value could be read back from `localStorage` and still disappear when the process was killed immediately. The same immediate-kill test now preserves the latest title after the UI acknowledges the native disk commit. Input still waiting for that acknowledgment is not promised durable. Device/app storage clearing, uninstall, exported files, and copies on other devices retain their documented limits. Native app backup is disabled in the manifest.

Recovery copies are separate for guests, accounts, and notes. An unsigned draft can be imported deliberately after sign-in; it is never silently attached to an account. Recovery does not overwrite a different notebook version until the writer chooses a version. Cloud transactions compare the content revision and preserve ownership/sharing metadata. A retry of a failed new-note creation reuses its allocated ID.

Timing patches are serialized and retained until acknowledged by the notebook. Recovered timing requires review and is guarded against a different lyrics snapshot. Export and explicit discard remain available after a failed timing save. Native account deletion waits for scoped recovery removals to commit.

## Checks actually completed

| Check | Evidence and limits |
| --- | --- |
| Unit tests | **91 tests passed across 14 files**, including writing recovery/conflicts, disk acknowledgment/failure and queue ordering, timing recovery, Google credential handoff, recording cancellation, Sherpa cleanup, and existing sync/alignment behavior |
| ESLint and TypeScript | `npm run lint` and build type checks passed |
| Web build | `npm run build` passed; existing large JavaScript chunk warning remains (main chunk about 874 kB before gzip) |
| Normal native build | `npm run android:debug` passed through filtered web build, Capacitor sync, Java compilation, and APK packaging |
| Isolated test native build | `npm run android:emulator` compiled and installed `com.rhymepage.app.emulatortest`, connected only to `demo-rhymepage` local emulators |
| Android lint | `:app:lintDebug` passed, **0 errors / 29 warnings**; no baseline or blanket suppression. Warnings concern candidate icon/splash resources, unused resources, backup configuration recommendation, SDK/API and dependency notices. Credential Manager's no-account case was fixed. |
| APK metadata/signature | `aapt` confirms package/version/SDKs. Normal build has no RECORD_AUDIO or MODIFY_AUDIO_SETTINGS permission, disallows cleartext transport, and disables app backup. `apksigner verify --verbose` passes v2 debug signing. |
| Backend integration | **16 Firebase emulator checks passed**: safe transactional create, collaborator preservation/denials, email lookup claim validation, owner Storage upload/delete, callable authorization, recursive note/account graph cleanup, preservation of another account, and cached-token recreation denial |
| Release preflight | Build-only checks accept the matching Firebase Android configuration and private signing inputs. A signed AAB was subsequently produced. The separate submission check still requires privacy review. See the release handoff for current bundle verification. |
| Source hygiene | `git diff --check` passed. Original public archive, speech data/runtime and prototype assets remain present; normal Android copies exclude them. |

Vitest used process-local TEMP/TMP under `node_modules/.cache/release-check-temp`, as in the handoff. Functions declare Node 22, but local Functions emulation explicitly ran host Node 24; deployed Node 22 behavior remains unverified. Expected permission-denied logs came from negative integration assertions, not failed checks.

## Android runtime checks actually completed

Runtime checks used the owned x86_64 Android 16/API 36 emulator, WebView 134.0.6998.135, with adb and its debug WebView. No physical device was connected. Synthetic UI input and short generated audio are smoke-test fixtures; they do not establish audio quality, human pacing, accessibility, or a supported-device matrix.

- Existing keyboard regression: real Gboard Space now triggers word completion and suggestions. Keyboard resizing/Back, process-alive rotation, and Home/resume were exercised earlier in this development pass.
- Normal HTTPS-origin APK: installed and cold-launched, wrote an unsigned lyric/title, returned live Datamuse suggestions, then restored writing and note route after force-stop/relaunch. No live account was used.
- Isolated demo APK: registered/signed in a disposable email/password account, saved and reopened a notebook note, and kept guest data separate. An initial rules denial was fixed and covered by the integration suite.
- Network interruption: Wi-Fi and mobile data were disabled, lookup failure was visible, and the device draft was retained. Both settings were restored. This does not claim that a pending cloud write reached the server while offline.
- Immediate process death: after the native device-save acknowledgment, force-stop/relaunch preserved the latest pending title, presented device/cloud review, and allowed selecting the notebook version without overwriting it.
- Audio picker/upload: Android selected a generated four-second WAV, uploaded it to the local Storage emulator, and the app read its duration. Playback advanced after seeking; the waveform canvas rendered.
- Manual timing: marked and finished two lines, marked four word timings, and observed notebook save acknowledgment. Automation produced near-zero word intervals; these are functional smoke checks rather than human timing acceptance.
- Back: dismissed the word-timing dialog without leaving the note.
- Exports: the native DocumentsUI picker saved JSON and exact `.lrc` files. Pulled JSON parsed as two timed lines with four word timings; pulled LRC contained the title and both timestamped lyrics. Cancelling a picker returned to the app.
- Deletion: in-app email/password reauthentication and deletion completed for the disposable demo account; its native writing/timing/route recovery entries were removed. The emulator integration suite separately checked its documented server data graph.
- Google flow: the earlier unconfigured build displayed an actionable email/password or web fallback. After registration, the configured build opens Google Play services' native account-add/sign-in UI; Android Back returns a cancellation message and re-enables the Google button. No credentials were entered and no Google sign-in completed. [Registration evidence](firebase-registration.md).
- Microphone bridge: earlier probes exercised grant, track stop, denial, and Settings recovery with the experimental permission setup. The final standard APK intentionally omits that capability. The full optional guide/alignment experience has not been accepted on Android.

Screenshots were directly inspected. [Normal APK writing](evidence/normal-apk-writing.png), [demo writing](evidence/emulator-writing.png), and [demo sync](evidence/emulator-sync.png) are development captures with disposable content, not approved Play screenshots. The normal capture precedes only the final added no-Google-account error branch; the final APK was subsequently installed and recovery checked again.

## Model, dependency and release limits

The normal Android build excludes all speech assets and preserves manual/waveform sync. The historical first APK was 178,754,107 bytes; the current configured APK is about 8.0 MiB. This comparison is APK size, not Play's eventual delivered split download size. The active original Sherpa data/runtime remains about 204 MB before compression. `VITE_ANDROID_ALIGNMENT=experimental` deliberately packages it only for a debug experiment; release preflight rejects it. The browser alignment cursor remains ALN-04 approved / ALN-05 in progress; Android work does not approve ALN-05 or ALN-06.

Targeted dependency updates reduced the root npm audit from 14 advisory entries in the handoff to **7: 4 high and 3 moderate**, including transitive parent entries. Functions audit reports **0**. The remaining high chain is Firebase's Node Firestore dependency on `@grpc/grpc-js`; browser Firestore uses its browser entry point. The moderate chain is Capacitor CLI's iOS `xcode` dependency on `uuid`; the inspected caller uses v4, whereas the reported bounds issue concerns v3/v5/v6 with external buffers. These reachability observations do not certify the repository free of vulnerabilities. No breaking blanket fix, Capacitor downgrade, or unvalidated override was applied. See the [gRPC advisory](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j) and [uuid advisory](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq).

The reviewed implementation and exact activation/signing steps are in [backend-and-signing.md](backend-and-signing.md). The [Play preparation packet](play-preparation.md) contains listing copy, candidate artwork, privacy/Data safety inputs, and testing requirements. Android registration is complete. The next acceptance check is a completed Google sign-in on a physical phone; the coordinated backend changes still need separate review and activation. Publication and Play uploads remain separate actions.
