# Google Play preparation draft

This is a local preparation packet. Nothing here has been submitted to Play Console. The application ID and public contact are owner-confirmed. Store copy, artwork, policy wording, target audience, reviewer access, Data safety answers, and device acceptance require owner review.

## App identity and listing copy

The owner confirmed `com.rhymepage.app` as the permanent application ID on 2026-10-26. The Firebase project remains `rhymepage-6b98b`. No replacement account store or data migration is introduced.

The Android app and current debug certificate are now registered in that project. The configured debug APK opens the native Google flow and handles cancellation. A completed Google sign-in remains unverified. See [registration evidence](firebase-registration.md). Play app-signing certificates still need registration when available.

**App name:** RhymePage

**Short description:** Write lyrics, find rhymes, and sync your words to your own backing tracks.

**Full description draft:**

Write your next line with a lyric notebook that keeps words and timing together.

Finish a word to explore rhymes, sound-alikes, synonyms, related words, and more. Add themes to steer the suggestions, then choose a word to place it at your cursor.

Keep your songs in your RhymePage notebook and return to them on the website or Android app. The editor keeps a recovery copy on your device while you write. Review recovered writing before replacing a notebook version that changed elsewhere.

Attach your own backing track, listen and seek through it, then mark lyric timing by line or word. Use the waveform editor for adjustments and export LRC or JSON timing files through Android's file-saving picker.

An internet connection is needed for account services, cloud notes, word lookups, and audio uploads. Keep device recovery copies until your notebook confirms a save. Automatic voice alignment is not offered in the standard Android release.

## Candidate assets

- `assets/branding/play-icon-512.png`: owner-supplied RF09 512 x 512 opaque PNG, integrated from the refined microphone/pencil kit.
- `assets/branding/play-feature-1024x500.png`: historical 1024 x 500 notebook feature graphic. Replace it with an RF09 graphic before store publication.
- Android launcher densities, adaptive foreground, monochrome icon, and splash resources are in `android/app/src/main/res/`.
- Asset prompts and derivation steps are recorded in `assets/branding/PROVENANCE.md`.
- Phone captures from the emulator use only disposable demo-project data. Treat them as draft store screenshots until the final configured build and physical-device presentation are accepted.

## Privacy and deletion resources

The public resources are now published at [https://rhymepage.com/privacy](https://rhymepage.com/privacy) and [https://rhymepage.com/delete-account](https://rhymepage.com/delete-account). They are readable without sign-in or JavaScript and generated from the shared `LegalPages.tsx` component. A small local-only script restores the active site theme. The deletion page provides a support-email request path as well as account-settings instructions, so the Android app need not be installed. [Initial publication evidence](privacy-publication.json) verifies HTTP success, content hashes, font availability, and preservation of the existing site's 32 files. [The theme follow-up](privacy-theme-publication.json) replaces only the two legal HTML files and preserves the other 34 files.

The owner supplied `Help@arrangedgodly.com` as the public support/privacy contact. It is the policy's default; `VITE_PUBLIC_CONTACT_EMAIL` can override it for an approved contact change. The policy distinguishes cloud-uploaded backing tracks from temporary local-only vocal guides, Android from web Analytics, and device recovery drafts from notebook saves.

Deletion removes the requesting UID's owned notes and all sync children, note-scoped Storage files including replaced audio, private data/subcollections, profile, email-index entries, and reciprocal follows. Shared notes owned by somebody else remain with their owner; deleted-user metadata in their sync records is anonymized. Other devices' recovery copies and files exported outside RhymePage are not remotely erased.

A non-content security lock contains the account UID as its document ID and a two-hour expiry. The staged root rules and `firestore.indexes.json` are designed to enforce its lock and enable TTL on `accountDeletionLocks.expiresAt`, but that larger migration still needs deployment and production verification. The published narrow note-save hotfix does not add those guards. The public policy therefore discloses retained security/deletion-processing records without claiming that automatic lock enforcement or TTL cleanup is active. [Firestore TTL documentation](https://firebase.google.com/docs/firestore/ttl).

Historical audio objects whose parent notes were deleted before this cleanup implementation may lack enough ownership information to attribute automatically. Review the live Storage inventory before claiming complete historical cleanup. The emulator tests prove cleanup of the current documented data graph, not a live-project audit.

## Data safety working inventory

These are source-backed inputs for the Console form, not completed declarations. Confirm Firebase/Google service data and actual production settings against the precise SDKs used. The app uses Firebase JavaScript SDKs in a Capacitor WebView and Android Credential Manager, not a second native Firebase account session.

| Data or capability | Current behavior | Declaration review |
| --- | --- | --- |
| Email, display name, account UID | Firebase Authentication and Firestore account/profile/index records | Account management and app functionality; notebook sign-in is required, unsigned writing remains available. |
| Profile picture URL | Supplied by Google when available and stored with the profile | Optional; publicly visible to signed-in users with the profile. Review photos/profile classification. |
| Lyrics, note titles/themes, preferences | Cloud notes/preferences when saved; recovery copies remain on the device | User-generated content and app functionality. |
| Attached audio | Explicitly selected by the user and uploaded to Firebase Storage | Audio/music files, optional, for app functionality. |
| Lyric timing | Saved line/word timestamps associated with a note | User-generated content/app functionality. |
| Sharing/follows | Note access lists, public profile, reciprocal relationship documents | Other-user interactions; review Google Play UGC/report/block requirements for this collaboration model before production. |
| Lookup words/themes | Sent to Datamuse; selected definition words sent to Free Dictionary API | Third-party processing and ordinary network metadata. Do not declare that all typed content stays local. |
| Analytics | Web initializes Firebase Analytics; standard Android build does not | Avoid copying web Analytics declarations blindly into Android. Verify Google/Credential Manager service metadata separately. |
| Vocal guide | Standard Android excludes voice timing and microphone permissions. Experimental builds can request microphone access and process a temporary guide locally | Do not advertise Android automatic alignment or declare a tested mobile recognition experience. |
| Local draft/timing copies, playback position | Per-account device recovery; retained across sign-out, cleared on deletion on that device | Document local retention, other-device limits, and app/site-storage controls. |
| Temporary deletion lock | UID plus expiry, no lyric/audio/profile content; TTL cleanup | Security retention exception, disclosed in the policy. |

The app does not contain an advertising or billing integration. Pricing, audience, content rating, production access, and policy answers still belong to the owner in Play Console.

## Internal and closed testing

A signed AAB is now prepared for an internal-testing upload draft; see [internal-testing-upload.md](internal-testing-upload.md). Creating it does not complete device acceptance or approve privacy declarations. Before inviting testers, activate and verify the required backend and register the Play app-signing certificate for Google login. Accept the Play-delivered build on a physical phone, including existing-account continuity, keyboard editing, Back, rotation, background/resume, network interruption, file import, playback/seeking, waveform/manual timing, exports, and deletion using disposable data. Use an owner-controlled reviewer account; do not hardcode its password in the app or repository.

Google's current personal-account rule applies to accounts created after November 13, 2023: at least 12 testers must remain opted in continuously for 14 days before applying for production access. Internal testing does not count as that closed test. The actual owner's Console gates and account creation date remain uninspected. [Personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).

The project targets API 36, matching the current phone-app submission requirement from August 31, 2026. [Target API policy](https://support.google.com/googleplay/android-developer/answer/11926878). Account creation also requires in-app and external web deletion access. [Deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).
