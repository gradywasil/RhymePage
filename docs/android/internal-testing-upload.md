# Internal-testing AAB handoff, 2026-10-26

The next UI update is **0.1.1, version code 2**, documented in [internal-testing-v2.md](internal-testing-v2.md). Use its versioned `rhymepage-upload-v2.aab` file for the new upload. The original version-1 AAB is archived separately; the unversioned upload path now refers to version 2. The evidence below records the historical first build and is not the current deployment status.

The owner requested a signed Android App Bundle for starting an internal-testing upload. The bundle is built and locally validated. Nothing has been uploaded to Play Console or rolled out to testers. This handoff does not approve privacy declarations or production readiness.

## Upload file

Use `android/app/build/outputs/bundle/release/rhymepage-upload.aab`.

| Field | Value |
| --- | --- |
| Application ID | `com.rhymepage.app` |
| Version name / code | `0.1.0` / `1` |
| Minimum / target / compile SDK | 24 / 36 / 36 |
| Artwork | Owner-supplied RF09 microphone/pencil kit |
| Signing | Private upload key, RSA 3072 / SHA256withRSA |
| Debuggable / cleartext / app backup | Disabled |
| Speech model / microphone permission | Excluded |

The exact bundle size, SHA-256, public signing fingerprints, tool version, and source identities are recorded in [release-build.json](release-build.json). `current-build.json` describes the separate debug APK, not this bundle.

## Local validation

- JDK 21, web type-check/build, Capacitor sync, Gradle release bundle compilation and signing passed.
- JDK `jarsigner` verifies the final upload bundle. The raw AGP bundle placed its JAR manifest last, producing an archive-reader consistency warning in this JDK. The PowerShell helper re-signs the upload copy with the same key and manifest first. The final copy has no unsigned-entry or archive-reader inconsistency warning. Self-signed certificate, no TSA timestamp, and unsigned ZIP-attribute notices remain; certificate validity runs into 2054.
- Official bundletool 1.18.3 validated the final bundle and generated a signed universal APK set from it. Its download SHA-256 matched the GitHub release-asset digest.
- The generated APK signature matches the public upload certificate. Manifest inspection confirms the package, version, SDKs, no debugging, no cleartext, and no microphone permission.
- The bundle excludes the speech-model directories and local emulator project/configuration.
- 91 unit tests across 14 files and ESLint passed. Full `:app:lintRelease` passed with 0 errors / 29 warnings. Existing Vite large-chunk and Gradle deprecation warnings remain.
- The build-only preflight passed. The separate submission check correctly continues to require privacy review, even with valid signing inputs.
- No physical phone, release-APK runtime session, Play-generated split APK, or completed real Google sign-in was exercised in this pass. Earlier emulator runtime evidence concerns debug builds.

## Key storage and rebuilding

Private keystore: `C:\Users\arran\AppData\Local\RhymePage\signing\rhymepage-upload.p12`.

Alias: `rhymepage-upload`. The owner-supplied private password protects the PKCS12 keystore and key. It was received through the private secret card and used only in process-local build/signing inputs. No password is stored in source, JSON, or chat. The signing directory is restricted to the current Windows user and SYSTEM.

Back up the keystore securely and save its password separately in a password manager. Keep the private key out of Git and store uploads. [rhymepage-upload-certificate.pem](rhymepage-upload-certificate.pem) contains only the public certificate.

To rebuild in PowerShell:

```powershell
./scripts/build-android-bundle.ps1
```

The helper prompts securely, reuses the existing key, builds, produces the final upload copy, and restores process environment variables. It uses the local JDK 21 path unless `JAVA_HOME` is supplied. For a later version:

```powershell
$env:RHYMEPAGE_VERSION_CODE = '2'
$env:RHYMEPAGE_VERSION_NAME = '0.1.1'
./scripts/build-android-bundle.ps1
```

Each Play upload needs an unused version code. `-CreateKey` is only for deliberately creating a new upload identity. Restore a missing keystore from backup instead of casually replacing it. Upload-key recovery/reset in Play is a separate account action.

`npm run android:bundle` is the lower-level Gradle build when private signing environment variables are already supplied. `npm run android:release-check` separately requires the local privacy-review flag and signing/configuration prerequisites. The privacy flag remains unset. Building does not establish backend, device, or Console acceptance.

## Play Console upload steps

1. Open or create the RhymePage app in the owner's Play Console. The first bundle binds the app to `com.rhymepage.app`; confirm the intended app before saving the release.
2. Open **Test and release > Testing > Internal testing**, then create a release. Configure Play App Signing using Google's managed app-signing key for the first bundle. The local key is the upload key.
3. Upload `rhymepage-upload.aab`. A release name such as `0.1.0 (1) internal` is sufficient. Let Console validate the package, signature, SDK, and unused version code. Local validation does not guarantee Console acceptance.
4. Save the release as a draft while completing the service and identity checks below.
5. Open the app's **App integrity / App signing** page and obtain the **app-signing certificate** SHA-1 and SHA-256. Register those in the existing Firebase Android app and refresh local configuration for future builds. The upload certificate does not represent Play-delivered APKs.
6. Configure an internal tester email list or Google Group. When ready, review and roll out to internal testing, then share the opt-in link with approved testers. This pass did not send invitations or publish a release.

Google documents that internal tests support up to 100 testers and can start before all app setup is complete. Its internal-only Data safety exemption does not approve the current privacy wording or future closed/production declarations. [Internal testing guidance](https://support.google.com/googleplay/android-developer/answer/9845334).

Google Play signs delivered APKs with its app-signing key, distinct from the local upload key. Google sign-in needs the certificate of the delivered app. [App signing](https://developer.android.com/studio/publish/app-signing), [Google client authentication](https://developers.google.com/android/guides/client-auth).

## Before tester rollout

The prepared Firestore/Storage rules, deletion Functions, and TTL configuration have not been activated by this work. A read-only Functions listing failed in this pass, so it does not independently establish the current remote inventory. Verify and activate the coordinated backend before relying on new-note creation, account/note deletion, and current audio cleanup. See [backend-and-signing.md](backend-and-signing.md). Existing accounts/data must remain in the same Firebase project.

After registering Play's app-signing certificate, test a Play-delivered build with an existing RhymePage account. Verify UID/notebook continuity, saving, audio upload/playback, manual timing/export, and disposable-account deletion. Complete the remaining public privacy/deletion pages, policy, reviewer-access, artwork and device checks in [play-preparation.md](play-preparation.md). The historical notebook feature graphic does not match the current RF09 icon.

Automatic safety review rejected removal of T3's temporary password-delivery file and reported only "blocked by policy". The file remains in T3's private secret storage. No alternative deletion mechanism was used to bypass that rejection.
