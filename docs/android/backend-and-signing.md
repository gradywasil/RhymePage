# Android backend and signing handoff

The owner approved Firebase Android registration on 2026-10-26. The app and debug certificate are registered, and the local configuration has been built and exercised. The owner subsequently requested an internal-testing AAB; a private upload key and signed bundle are now prepared. Rule/index deployment, Functions deployment, web publication, and Play upload remain separate, unperformed steps.

## Firebase Android setup

`com.rhymepage.app`, display name RhymePage, is registered in the existing `rhymepage-6b98b` Firebase project as `1:826172871931:android:4e1181db21bab05385cc5e`. Both SHA-1 and SHA-256 fingerprints from the current debug APK are registered. The existing web app remains registered unchanged. See [firebase-registration.md](firebase-registration.md) for read-back and runtime evidence. Add the Play app-signing certificate when available; upload signing and Play app signing are different certificates.

The retrieved `android/app/google-services.json` identifies the existing project and confirmed package and includes both the Android OAuth client and the existing web OAuth client. Gradle generated and packaged `default_web_client_id`, `google_app_id`, and `project_id` with the expected values. `RhymePagePlugin` reads that generated web-client resource. For local development only, an explicitly supplied `RHYMEPAGE_GOOGLE_WEB_CLIENT_ID` environment variable or Gradle property can supply the same project's web client ID. Never substitute an Android client ID or create another Firebase project.

Android sign-in uses Credential Manager to request a Google ID token, then `signInWithCredential` on the existing JavaScript Auth instance. Sensitive actions use `reauthenticateWithCredential` on the current Firebase user, so selecting a different Google account fails rather than changing the account under the action. Web login/reauthentication keep their popup path. Android Auth uses IndexedDB persistence when the user asks to stay signed in.

The configured APK opens Google Play services' native account-add/sign-in UI on the emulator. Android Back cancels the flow, shows the app's cancellation message, and re-enables the Google button. No account credentials were entered, no Google account was added, and no Firebase Google sign-in completed. Real account selection, UID continuity, reauthentication, and sign-out still need validation, preferably on the owner's physical device.

## Backend activation order

The Cloud Functions API is enabled; read-only function listing now succeeds and returns no functions. The owner requested a low-cost setup before deployment. Local function scaling/CPU controls have been prepared and emulator-checked; review [cost-controls.md](cost-controls.md) and configure billing guardrails before activating services. No backend deployment or remote budget change has been performed in this follow-up.

Install the pinned Functions dependencies with `npm ci --prefix functions`. The declared Cloud Functions runtime is Node 22. Local emulator tests in this pass ran with host Node 24.22.1, which Firebase CLI reported explicitly; they do not prove the deployed Node 22 runtime.

Review the three functions before deployment:

- `deleteAccount`, callable: requires authentication and `auth_time` within five minutes; ignores payload UIDs and acts only on the authenticated UID. It locks writes, removes the documented data graph, deletes Auth after content cleanup, and returns confirmation.
- `deleteNote`, callable: checks note ownership, locks the note against writes, removes note-scoped files, then recursively removes the note and sync children.
- `finishAccountDeletion`, retrying Auth deletion trigger: protects against still-cached tokens and completes private-record cleanup after an Auth deletion event.

Review and deploy these together with Firestore/Storage rules and the TTL field configuration before publishing the new web build or distributing the app. Until then, normal builds cannot rely on the new deletion callables, and create transactions require the updated missing-document read rule. The new app does not fall back to incomplete client-side deletion.

The local index manifest preserves the existing live notes index, verified read-only on 2026-10-26: `userId ASCENDING`, `lastEditedAt DESCENDING`, `__name__ DESCENDING`, collection scope. It adds only the deletion-lock TTL field configuration. Recheck remote indexes before deploying and do not force-delete unrelated indexes. Storage authorization still relies on cross-service Firestore reads; verify the service-agent IAM access in the actual project before accepting uploads/deletion.

Deployment command prepared for the approved activation step:

```powershell
firebase deploy --only "functions,firestore:rules,firestore:indexes,storage" --project rhymepage-6b98b
```

This may enable Functions/Run/Eventarc or related project services and incur normal Firebase costs. Review the resulting resource plan and permissions. No hosting publication is included in that command. Publish the policy/deletion routes and coordinated client update only after backend behavior is verified with disposable data.

## Local emulator verification

The test build uses application ID `com.rhymepage.app.emulatortest` and project `demo-rhymepage`, preserving the normal app and its account/data storage. It connects only to the host emulators via `10.0.2.2`. The test build uses an HTTP localhost app origin and cleartext transport for those local services; the normal build keeps HTTPS and disallows cleartext traffic.

```powershell
$env:JAVA_HOME = "$env:LOCALAPPDATA\RhymePage\toolchains\jdk-21.0.12.1+1"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
firebase emulators:start --only "auth,firestore,storage,functions" --project demo-rhymepage
# In another terminal:
npm run test:firebase
npm run android:emulator
```

Only use the emulator APK while those services are running. The integration script is hardwired to loopback services and the demo project and creates disposable fixtures. It never imports or deletes live-project data.

## Release signing

The upload keystore is `C:\Users\arran\AppData\Local\RhymePage\signing\rhymepage-upload.p12`, outside the checkout, with alias `rhymepage-upload`. It was generated using the password supplied through the private secret card. The key is RSA 3072 / SHA256withRSA, valid for 10,000 days. Directory access is restricted to the current Windows user and SYSTEM. Back up the keystore securely and retain its password separately in a password manager. No plaintext password is stored in project files.

Use `./scripts/build-android-bundle.ps1` from PowerShell to rebuild. It prompts securely for the same password, temporarily supplies the signing environment, and restores the process environment afterward. `-CreateKey` is only for deliberately creating a new upload identity; do not use it as a substitute for restoring a missing key. The public certificate is `docs/android/rhymepage-upload-certificate.pem`.

The underlying Gradle build uses `RHYMEPAGE_UPLOAD_KEYSTORE`, `RHYMEPAGE_UPLOAD_STORE_PASSWORD`, `RHYMEPAGE_UPLOAD_KEY_ALIAS`, and `RHYMEPAGE_UPLOAD_KEY_PASSWORD`. The public contact defaults to the owner-approved `Help@arrangedgodly.com`; `VITE_PUBLIC_CONTACT_EMAIL` can override it for an approved change. Building now checks signing and Firebase identity separately from privacy approval. Set `RHYMEPAGE_PRIVACY_REVIEWED=yes` only after reviewing the policy and disclosures, then run `npm run android:release-check` with the private signing environment available. That check does not verify backend deployment, physical-device acceptance, or Play Console requirements.

```powershell
npm run android:bundle
```

`RHYMEPAGE_VERSION_CODE` defaults to 1 and must increase for subsequent Play uploads. `RHYMEPAGE_VERSION_NAME` defaults to 0.1.0. The Gradle output is `android/app/build/outputs/bundle/release/app-release.aab`. The PowerShell helper re-signs it into `rhymepage-upload.aab` with the same upload key and places the JAR manifest first, avoiding the Java archive-reader inconsistency warning in the raw AGP output. Use that final upload file. Validation and upload instructions are in [internal-testing-upload.md](internal-testing-upload.md).

## Optional Android alignment experiment

The normal build excludes Sherpa's model/runtime and does not request microphone permissions. Manual and waveform sync remain available. For a deliberate development experiment, set `VITE_ANDROID_ALIGNMENT=experimental` before building and syncing. This opts the native manifest and web build into the same experimental feature and packages the local bundle. Clear the variable before a normal build. The release preflight refuses an experimental alignment release.

Do not enable it for distribution until a physical-device test establishes memory use, initialization/processing time, long-take behavior, cancellation, microphone denial/settings recovery, and accurate review/apply behavior. The current bundle is about 204 MB before APK compression and is not a validated 42 MB mobile download. Desktop alignment and the original public assets remain available.
