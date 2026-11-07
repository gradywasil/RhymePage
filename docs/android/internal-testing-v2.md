# Internal testing update: 0.1.1, version code 2

The signed update is `android/app/build/outputs/bundle/release/rhymepage-upload-v2.aab` for the existing `com.rhymepage.app` app. The upload key is unchanged from version 1. After the manual upload handoff, the owner reported uploading the update to Play Console, downloading it onto their phone, and successfully creating/deleting notes and exporting lyric timing as LRC and JSON. See the acceptance details below.

Release name: `0.1.1 (2) - Android UI polish`.

Release notes are in [release-notes/2.txt](release-notes/2.txt).

The update includes the compact footer, background behind the gesture navigation area, smaller mobile spacing, themed scrollbars, keyboard-responsive suggestion height, keyboard resize behavior, and system icon contrast changes. The published Firestore new-note-save fix is server-side and already applies to the previous app version as well.

Local checks include all 91 unit tests, ESLint, TypeScript/Vite Android build, Gradle release bundle/signing, bundletool validation, manifest inspection, and matching upload certificate fingerprints. The manifest identifies version `0.1.1`, code `2`, target SDK `36`, no debuggable flag, and cleartext disabled. No speech model or microphone permission is packaged. Exact build-time identities and limits are in [release-build-v2.json](release-build-v2.json). Subsequent physical-phone testing is owner-reported, as recorded below, rather than agent-observed.

Version 1 is preserved at `node_modules/.cache/android-development/artifacts/rhymepage-upload-v1.aab` with its original checksum. The unversioned `rhymepage-upload.aab` is now a copy of version 2. The old [first-build handoff](internal-testing-upload.md) describes historical version-1 evidence.

For CLI uploads, use the Google Play Developer API through an authenticated uploader. API access requires its own Google Play permissions; Firebase sign-in and the upload keystore do not provide this access. Do not use the Firebase `google-services.json` as an API credential, and do not grant production-release or account-administrator permissions just to upload an internal test.

## Owner-reported Play installation acceptance

The owner reported: "i was able to get the update uploaded to play console, downloaded on to my phone, and now i can create notes and delete successfully, as well as export lrc and json for the time sync".

This confirms owner-reported success for the manual Play update/install path, new-note creation, note deletion, and both timing export formats on their phone. The agent did not inspect the installed version screen, observe those interactions, read the exported files, or audit the deleted note's Firestore/Storage descendants. Earlier owner testing separately confirmed Google sign-in and access to existing notes. Neither report is evidence of complete account deletion or production-track approval.

Remaining physical-device checks include interrupted/offline writing recovery, audio upload/playback/seeking, broader timing interactions, and full account deletion with disposable data. These are separate from the successful note-deletion and export checks above. Manual Play Console upload is the owner's current preference; Fastlane remains locally installed but unauthenticated and unused for this release.
