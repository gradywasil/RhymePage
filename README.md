# RhymePage

**Write lyrics with word suggestions that follow the line, then keep your drafts in a shared notebook.**

[Open the writing demo](https://rhymepage.com/notes/new) | [Browse the source](https://github.com/Arrangedgodly/rhymebook-vite)

## Write with word tools

Finish a word in the lyric editor to get suggestions for its sound and meaning. RhymePage groups results into rhymes, sound-alikes, synonyms, antonyms, adjectives, nouns, related words, and frequent followers. Choose a word to insert it at the cursor. Inspect a word with a long press on touch screens or a right-click on desktop to look up its definition.

Add themes to steer suggestions. Settings let you choose which categories are active and how many results to request.

## Keep notes together

Save lyrics to your notebook, then edit, tag, pin, or share notes with other RhymePage users. The notebook also lists notes shared with you. Saving and managing notes requires sign-in and Firebase access.

## Try it locally

Requires Node.js and npm.

```sh
git clone https://github.com/Arrangedgodly/rhymebook-vite.git
cd rhymebook-vite
npm install
npm run dev
```

Vite prints the local URL. `npm run build` creates a production build in `dist`; `npm run preview` serves that build locally.

## Design system

The interface is built on in-house tokens and components, not a UI kit. `src/styles/tokens.css` defines six themes (Coral, Lemon, Sky, Mint, Grape, Night) plus fixed suggestion-category colours as semantic roles; `src/styles/components.css` holds the `rp-*` component classes; `src/theme/` holds the theme registry and provider. Settings > Appearance switches themes, and Auto follows the device. The design direction lives in `PRODUCT.md` and `.impeccable/surfaces/src-app-tsx.md`.

## Services and work in progress

### iOS development

The Capacitor iOS project is in `ios/` (bundle ID `com.rhymepage.app`, Swift Package Manager, iOS 15+). It ships the same mobile web build as Android.

```sh
npm install
npm run ios:sync   # build the mobile web bundle and copy it into ios/
npm run ios:open   # open the project in Xcode (macOS only)
```

Building and signing need a Mac with Xcode and an Apple Developer team selected under Signing & Capabilities. `npm run ios:art` regenerates the app icon and launch splash from the RF09 kit. On iOS, Google sign-in shows a "not available yet" message and email/password works; a native iOS Google credential bridge, LRC/JSON export through the share sheet, and recovery storage backed by native disk are still to do (the Android `RhymePage` plugin covers these on Android).

### Android development

For signed internal-testing updates, see [the version-2 AAB handoff](docs/android/internal-testing-v2.md). [CLI uploads with Fastlane](docs/android/cli-uploads.md) documents the `play:setup`, `play:check`, and `play:upload` commands and the one-time Google Play API permissions.

The public [privacy policy](https://rhymepage.com/privacy) and [account-deletion request page](https://rhymepage.com/delete-account) are available for Play Console. They are generated from the same legal-page component with `npm run legal:build`, which also runs before web builds. The owner decided against the previously considered Bubblewrap migration; continue the Capacitor app.

The Capacitor 8 Android project is in `android/`. The owner confirmed `com.rhymepage.app` as its permanent application ID. It uses the existing Firebase project and accounts.

```sh
npm install
npm run android:sync
npm run android:debug
npm run android:open
```

`android:sync` builds the web app into `dist-android/` and copies it into the native project. The standard Android build excludes the speech model, Sherpa runtime, and old Whisper prototype assets. It offers manual and waveform timing without microphone permissions. Original files in `public/` and the web alignment feature remain available. Re-run sync after web changes. The existing web build still uses `npm run build`.

Native compilation uses JDK 21, Android SDK 36, Gradle 8.14.3, and Android Gradle Plugin 8.13.0. Set `JAVA_HOME` to your JDK 21 installation and `ANDROID_HOME` to your SDK before running `android:debug`. This command builds and syncs the web app, checks Java, and compiles `android/app/build/outputs/apk/debug/app-debug.apk`. Android Studio's bundled Java may be a different version; select JDK 21 for its Gradle JVM too. Machine-specific SDK settings belong in the ignored `android/local.properties`. Signing keys must stay out of Git.

Use npm and `package-lock.json` for the current build path, matching CI. The pre-existing pnpm files are preserved, but their lockfile lacks Capacitor and is not validated for Android installs. Do not alternate package managers against the same `node_modules`.

The debug APK has compiled and run on an Android 16 emulator. Disposable Firebase emulator accounts exercised saved notes, audio upload/playback, waveform/manual timing, native LRC/JSON exports, and account deletion. Writing and pending timing have account-scoped recovery copies; Android confirms native disk commits before reporting a device save. Cloud edits use revision checks and explicit recovery choices. Android Google sign-in uses Credential Manager and the existing JavaScript Firebase Auth session. Its Firebase registration and debug certificates are configured; native Google UI launch/cancellation passed, while a completed sign-in and real UID continuity remain unverified. Candidate launcher/splash and Play artwork are included.

Backend Functions, rules, and TTL configuration must be reviewed and deployed together before distributing this client: its safe note-creation transactions and complete deletion calls require that backend update. A signed internal-testing AAB is prepared; nothing has been deployed or uploaded to Play. Physical-device acceptance, real Google sign-in, Play app-signing configuration, privacy review, and Console setup remain required. See the [current development evidence](docs/android/development-validation.md), [backend/signing handoff](docs/android/backend-and-signing.md), and [Play preparation packet](docs/android/play-preparation.md).

The local `/privacy` and `/delete-account` pages use the owner-approved public contact `Help@arrangedgodly.com`. They become public only when the coordinated website update is published.

To rebuild the signed internal-testing bundle in PowerShell, run `./scripts/build-android-bundle.ps1`. It prompts privately for the upload-keystore password and writes `android/app/build/outputs/bundle/release/rhymepage-upload.aab`. The private key stays outside the checkout. `npm run android:bundle` is the underlying Gradle bundle build; `npm run android:release-check` separately checks local privacy/configuration/signing prerequisites. Creating a bundle does not approve submission or activate the backend. See the [internal-testing upload handoff](docs/android/internal-testing-upload.md).

Word suggestions use the [Datamuse API](https://www.datamuse.com/api/). Definitions use the [Free Dictionary API](https://dictionaryapi.dev/). Both features need network access. Datamuse has announced that API keys will be required starting February 1, 2027; this checkout currently makes unauthenticated requests.

Lyric-to-audio syncing remains under active integration.

## Project commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the app |
| `npm run android:debug` | Build, sync, and compile the Android debug APK with JDK 21 |
| `npm run android:bundle` | Build a signed AAB using private signing environment variables |
| `npm run android:release-check` | Check local privacy/configuration/signing prerequisites separately from building |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint `src` with ESLint |
| `npm test` | Run the Vitest test suite |

## Links

- [Live app](https://rhymepage.com/)
- [Source repository](https://github.com/Arrangedgodly/rhymebook-vite)
