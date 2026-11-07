# CLI uploads with Fastlane

Fastlane's `supply` action handles Google Play uploads. This project pins Fastlane in `Gemfile` and uses the standard Google Play API. The Node entry point only locates Ruby and runs Bundler/Fastlane; it contains no custom publishing API implementation.

## One-time Play account setup

Local setup is complete: Ruby 3.4.12, Bundler 2.6.9, Fastlane 2.241.2, and the Windows native compiler dependencies are installed. The Gemfile is locked, both lanes load successfully, and the Ruby/Node syntax checks pass. [Setup identities and verification](cli-upload-setup.json) distinguish these local checks from the pending Google authentication and upload test.

1. Enable the [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com?project=rhymepage-6b98b) in the existing `rhymepage-6b98b` Cloud project. This is separate from the Cloud Functions API enabled earlier. No new Firebase project is needed.
2. Create a service account named `android-release-uploader` under [Service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=rhymepage-6b98b). The uploader needs no project Owner/Editor role. Copy its email address.
3. In Play Console's **Users and permissions**, invite that service-account email. Grant app access to RhymePage with **View app information (read-only)** and **Release apps to testing tracks**. Account administrator, production release, financial access, and tester-list management are unnecessary for these commands. Other apps can be granted their own app-level access later.
4. In the service account's **Keys** tab, create/download a JSON key and store it outside the checkout at `C:\Users\arran\AppData\Local\AndroidReleaseTools\credentials\play-uploader.json`. The credentials directory has been created with access restricted to the current Windows user and SYSTEM. The key is private. Firebase's public `google-services.json` is a different file and cannot authenticate this uploader.

Google documents [service-account setup](https://developers.google.com/android-publisher/getting_started) and the [per-app permissions](https://developers.google.com/android-publisher/api-ref/rest/v3/grants). Fastlane also supports federated credentials for future CI use; a CI rollout is outside this local setup.

## Commands

Set the private credential path in the terminal used for uploads:

```powershell
$env:PLAY_JSON_KEY = "$env:LOCALAPPDATA\AndroidReleaseTools\credentials\play-uploader.json"
npm run play:check
```

The check validates authentication, then reads version codes on RhymePage's internal track. This has not yet been run against Play because the service account credential and Play grant have not been supplied. No Play upload or rollout has occurred during local setup.

Upload the signed UI update as a draft:

```powershell
npm run play:upload -- aab:android/app/build/outputs/bundle/release/rhymepage-upload-v2.aab
```

To upload and deliver a new build directly to the existing internal tester group, add `publish:true` to that upload command. The track is fixed to `internal` in the lane, and draft is the default status. Store metadata, images, and screenshots are skipped; release notes come from `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`. See [Fastlane's supply options](https://docs.fastlane.tools/actions/upload_to_play_store/).

An AAB version code must be unused. After a successful draft upload, roll out that draft in Play Console; uploading the same AAB again with `publish:true` is not a draft-promotion command. Avoid editing the same app in Console while a CLI upload is in progress because Play edits can invalidate one another.

## Reuse in another project

Copy `Gemfile`, `Gemfile.lock`, `fastlane/Appfile`, `fastlane/Fastfile`, and `scripts/play.mjs`, plus the three `play:*` npm scripts. Change the package name in `fastlane/Appfile`, supply that project's signed AAB, and add its version-code release notes. Grant the uploader app-level access to that app. Keep its signing key and Firebase configuration specific to that project.

Run `npm run play:setup` in a newly copied project to install its locked gems. On this PC, the commands reuse portable Ruby 3.4.12 and its MSYS2/compiler installation under `%LOCALAPPDATA%\AndroidReleaseTools\ruby-3.4.12`. No system PATH was changed. On another computer, install Ruby/Bundler normally or set `PLAY_RUBY_HOME` to an existing Ruby installation.

The first app creation, initial Play Console upload, and legal declarations still require Console setup. This automation is for subsequent builds of an existing app.
