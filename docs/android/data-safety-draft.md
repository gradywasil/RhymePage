# Google Play Data safety working answers

Reviewed October 26, 2026 against current source, the version-code-2 release record, and official provider guidance. This is a draft for the owner to enter in Play Console, not a submitted or approved declaration. No app or backend changes accompany this document.

## First screen

| Question | Answer supported by the current app |
| --- | --- |
| Collects or shares any listed user data? | Yes. Account information, saved content, audio uploads, and external word queries leave the device. |
| All collected user data encrypted in transit? | Yes for the inspected production endpoints, which use HTTPS. The release disallows cleartext traffic. This does not claim end-to-end encryption. |
| Account creation methods | Username/email and password; OAuth through Google. Do not select phone authentication or passkeys solely because Credential Manager supports them. |
| Account/data deletion request mechanism | Yes. In-app Settings > Account > Delete account, plus the public email-request resource. |
| Account deletion URL | https://rhymepage.com/delete-account |
| Privacy policy URL | https://rhymepage.com/privacy |
| Independent security review | No. No Google-authorized MASA assessment has been completed. |

The deletion-request answer describes an available request mechanism. It is not evidence that complete account deletion, including historical Storage objects, has been verified in production. The owner verified individual note creation/deletion on a phone, not full account cleanup.

## Data types supported by app behavior

These are recommendations from the observed data flows using Google's definitions. Media and query classifications are interpretations of the form, not provider certifications.

| Console data type | Evidence and handling |
| --- | --- |
| Personal info: Name | Firebase Auth/private user records and public profiles store the display name. Collected; app functionality and account management. Optional name field and guest writing exist. |
| Personal info: Email address | Auth, private records, and the email-to-UID lookup index. Collected; app functionality and account management. Account collection is optional at app level because guest writing is available. A known-address lookup returns the UID, not a list of email addresses. |
| Personal info: User IDs | Auth UID, note ownership, collaboration, profiles, follows, timing metadata, and deletion records. Collected; app functionality, account management, and security where used for access control/deletion. Optional at app level through guest use. |
| Photos and videos: Photos | Google profile picture URL is stored and used to display the person's picture. Recommend including Photos for this profile feature. This is not access to the phone's photo library. Optional. |
| Audio files: Music files | User-selected backing tracks uploaded to Firebase Storage. Collected; app functionality; optional. |
| Audio files: Voice or sound recordings; Other audio files | The upload accepts audio/* and does not restrict content to instrumental music. Recommend covering user-supplied voice/sound recordings and other audio too. The app does not record a microphone in this release. Collected; app functionality; optional. |
| Contacts | Follow/follower relationships and note collaborator identifiers form a social graph. Google's definition includes social graph information, even without address-book permission. Collected; app functionality; optional collaboration/follow actions. |
| App activity: Other user-generated content | Saved lyric text, titles, tags, themes, and timing. Collected; app functionality. Words/themes also leave the device for suggestions, including for guests. Do not label this entire type optional on the basis of optional cloud saves alone. |
| App activity: In-app search history | Recommend including the words/themes submitted for suggestions and words selected for definitions, although there is no history screen. App functionality; personalization for theme-directed suggestions. Automatic word lookups are part of normal writing, and guests cannot access the account-only category switches. Use Required for the current automatic lookup behavior. |

For Other user-generated content, use Required in this draft because the type includes automatic word/theme transfers during the core writing flow. An optional toggle available before lookup collection for every user would change this assessment. A request for a definition is separately optional, but that does not make all query collection optional.

Retained cloud account/content/media types are not processed ephemerally. Datamuse says it keeps query logs until the end of the following day, so query processing is not memory-only either. Do not mark all collection ephemeral because requests are short or no search-history screen exists.

## Sharing needs separate answers

- Firebase Auth, Firestore, Storage, and Functions process data on the developer's behalf. Their involvement alone is not a reason to check Shared; Google's service-provider exception can apply. Collection still must be declared.
- Recommend Shared for external word/theme query data unless a service-provider exception or qualifying disclosure/consent is established for Datamuse and Free Dictionary API. Automatic lookups cannot rely solely on the fact that the user typed a word as proof they specifically expected third-party sharing.
- Profile name, UID, and picture are published automatically on sign-in and made available to other signed-in users. Do not blanket-mark all personal data Not shared. Either declare this public-profile disclosure as sharing, or document why the actual signup/sign-in disclosure and user action satisfy Google's exception. Registration currently explains that the name is shown on the profile and to collaborators; that does not by itself establish an exception for every Google sign-in profile field.
- Explicitly chosen note collaboration, follows, and file exports may qualify for the user-initiated sharing exception. Apply it to the actual transfer and expectation, not the whole app.

## Items to resolve before final submission

1. Confirm any additional network/device identifiers, diagnostics, or inferred location processed by the precise Android Google sign-in dependencies. The app uses Credential Manager/googleid and JavaScript Firebase Auth, not native Firebase Auth/Analytics. Native Firebase disclosure tables and the iOS Google sign-in disclosure are not evidence for this exact Android integration.
2. Firebase Authentication documents IP address and user-agent processing for authentication/abuse prevention. Declare any corresponding listed data types according to actual use. An IP address is not automatically an advertising ID or proof that location is inferred. Do not certify Location, Device or other IDs, or Diagnostics as absent solely because app permissions or Analytics are absent.
3. Resolve the profile/query sharing answers above before turning this working draft into a submitted declaration.
4. Complete production account-deletion validation, including Storage cleanup, before claiming the full deletion implementation has been verified. The public email mechanism must be monitored and requests fulfilled. Do not claim that the staged deletion-lock rules/TTL migration is deployed.

The standard Android build disables Firebase Analytics and has no microphone permission or automatic speech alignment. Local recovery copies and local LRC/JSON exports alone do not establish cloud collection of Files and docs. No ads, billing, phone-number authentication, SMS, calendar, installed-app inventory, health, or financial-data feature was identified. These observations do not override a provider's additional SDK collection.

## Evidence and official references

- Source: src/firebase.ts; src/types/user.ts; src/types/note.ts; src/utils/profiles.ts; src/utils/rhymeApi.ts; src/utils/dictionaryApi.ts; src/utils/syncApi.ts; src/hooks/useDashboardLogic.tsx; src/components/Settings.tsx; src/components/Register.tsx; src/components/LegalPages.tsx; android/app/build.gradle.
- Release scope: [release-build-v2.json](release-build-v2.json). Later owner acceptance is in [internal-testing-v2.md](internal-testing-v2.md).
- [Google Play Data safety form guidance and definitions](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
- [Android data-type guidance](https://developer.android.com/privacy-and-security/declare-data-use).
- [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
- [Firebase privacy, processing, and retention](https://firebase.google.com/support/privacy).
- [Datamuse query-log privacy statement](https://www.datamuse.com/api/).
- [Free Dictionary API](https://dictionaryapi.dev/). The inspected public documentation did not establish a query-retention promise or service-provider arrangement.
- [Google Play services core SDK disclosure](https://developers.google.com/android/guides/play-data-disclosure). This covers only the listed core SDKs, not every Google sign-in dependency.
