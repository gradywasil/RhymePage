# Firebase Android registration, 2026-10-26

The owner explicitly approved registering the confirmed Android package and debug certificate in the existing Firebase project. This step is complete.

| Identity | Registered value |
| --- | --- |
| Firebase project | `rhymepage-6b98b` |
| Project number | `826172871931` |
| Android package | `com.rhymepage.app` |
| Display name | RhymePage |
| Android Firebase app ID | `1:826172871931:android:4e1181db21bab05385cc5e` |
| Debug certificate SHA-1 | `10877113d28e05e323406bd33fecc0580158a1f1` |
| Debug certificate SHA-256 | `119001e367a634ad421f1c653e1537bf0e3e039a3698c64b0f6d2ffc796c3ddd` |
| Existing web Firebase app ID | `1:826172871931:web:67460576ba5ae36885cc5e`, preserved |

The SHA fingerprints were extracted from the actual compiled APK with `apksigner verify --print-certs`, registered through the Firebase connector, then read back with `firebase apps:android:sha:list` against the explicit project. A final app listing contains both the original web app and the new active Android app.

Firebase supplied an Android OAuth client bound to this package and SHA-1, plus the project's existing web OAuth client. The SDK configuration is saved at `android/app/google-services.json`. This is application configuration, not an upload keystore, service-account credential, OAuth client secret, or new native Firebase Auth session.

`npm run android:debug` passed with the Google Services Gradle task enabled. Its generated resources identify this Android app, the existing project, and the expected web OAuth client. The APK installed and cold-launched on the owned Android 16 emulator. Debug signing still matches both registered fingerprints. Exact APK size, hash, configuration hash, and source identities are recorded in [current-build.json](current-build.json).

Tapping **Continue with Google** opened Google Play services' native account-add/sign-in screen. The emulator has no selected Google account. The screen offered Google's account discovery setup. No phone-number discovery consent was given. No credentials were entered, and no account was added. [Directly inspected screenshot](evidence/google-configured-emulator.png).

Android Back returned to RhymePage, displayed "The Google window closed before finishing.", and enabled **Continue with Google** again. This verifies configured native launch and cancellation. It does not establish completed Google authentication, an ID-token exchange, existing Firebase UID continuity, account selection, reauthentication, or physical-device behavior.

No Firestore/Storage rules, Functions, TTL/index changes, website, or Play build were deployed in this step. No production user data was changed. Release preflight now accepts the Firebase Android configuration and continues to require privacy review and private release signing inputs. No release AAB or upload key was created. Test services and the owned emulator were stopped after validation.

The next acceptance check is a completed sign-in on a physical phone using an existing RhymePage Google account, comparing its Firebase UID and existing notebook access, then checking reauthentication and sign-out. Use the registered debug key for that APK. A different machine's debug key, the eventual upload key, and Play's app-signing key have distinct fingerprints; register the relevant certificate before testing each distribution path.

## Owner-supplied configuration refresh, 2026-10-26

The downloaded `google-services.json` was compared with the existing configuration, then copied to `android/app/google-services.json`. Its SHA-256 is `4e362a657e76111ec7779d3fac088e2623f0d5b9a5d27b2113a37f25dba04567`. The project, Android app ID, package, Storage bucket, and web OAuth client remain the same. It adds an Android OAuth client for upload-key SHA-1 `81c3a5e4715e8c5394832811268b4906c0884bb9` and preserves the debug client.

A read-only Firebase app listing confirms debug and upload-key SHA-1/SHA-256 fingerprints are registered. These upload-key fingerprints match the locally generated upload certificate. No separate Google Play app-signing fingerprint has been supplied or registered in the current Firebase listing. Obtain the fingerprints specifically from Play's **App signing key certificate** section before accepting Google sign-in through a Play installation. The existing version-code-1 AAB remains unchanged; no build or device sign-in test was performed for this configuration refresh.

### Second configuration refresh

The owner supplied a second configuration after the Play-certificate instructions. This adds Android OAuth client `826172871931-9k391iuo1h5r4uartaq2328h8qkqqte2.apps.googleusercontent.com` for SHA-1 `9f1ce0af2a0e1772a38a7ade8451949aa1c1a695`, distinct from debug and upload signing. Firebase read-back confirms this SHA-1 and an additional SHA-256 `f11e5fbd04bce540dffca291b472e3edc018b7251696518263b7ebbdd0d2b358` are registered. The Play certificate page itself was not inspected, so the owner-provided configuration and Firebase registration establish the added fingerprints but do not independently establish their Play origin.

The second file is now `android/app/google-services.json`, SHA-256 `cecd3bcb014ef1e1351354f1d9f46f6c774d0e2d30ad6ccedda91e5f9da47057`. Only the OAuth client list changed; existing clients and all other configuration fields are preserved. The bridge still uses the same web OAuth client. The existing AAB checksum is unchanged, and no rebuild is required solely for adding this server-side signing registration. Completed Google sign-in and existing-note access through the Play internal-testing installation remain unverified.

## Owner-reported Play installation acceptance, 2026-10-26

The owner subsequently reported successful sign-in and recovery/access of existing notes through the installed Play build: "i was able to get signed in and recover my notes through the app install". This records user-reported acceptance of Google sign-in and existing-note access for the tested account and installation. The agent did not directly observe the device, compare Firebase UIDs, or test new-note writes, reauthentication, audio, exports, or deletion in that installation. Those checks remain separate.

A read-only `firebase functions:list --project rhymepage-6b98b --json` query after that report confirms `deleteAccount`, `deleteNote`, and `finishAccountDeletion` are now ACTIVE in `us-central1`, all on Node.js 22 with maximum one instance. The two callables use concurrency one and fractional CPU, with 512 MiB and 256 MiB respectively. This supersedes the earlier empty Functions inventory and deployment-timeout status. It confirms deployment state, not successful live deletion, rule deployment, Storage authorization, TTL activation, or artifact-retention policy. No production data mutation or deployment was performed by the agent during this check.
