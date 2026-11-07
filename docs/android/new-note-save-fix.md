# New-note save failure

The owner reported this exact message in the Play-installed app: "Could not save to your notebook. Your device draft is kept; reconnect and retry."

The active Firestore rules allow reads of existing notes owned by or shared with the signed-in user. They omit permission to read a missing note document. `noteDraftRepository.save` runs a transaction that first reads a generated document ID to ensure it is unused, so the transaction fails before creating a note. Existing-note access can work while new-note saves fail.

## Reproduction and fix

A loopback-only Auth/Firestore emulator reproduced the exact message using the actual `NoteDraft` and `noteDraftRepository` modules. TypeScript transpilation changed only their initialization imports to use `demo-rhymepage`; the save implementation was not duplicated or mocked. The reproduced failure kept the local recovery record intact.

The candidate adds only this permission within `/notes/{noteId}`:

```text
allow get: if isSignedIn() && !exists(/databases/$(database)/documents/notes/$(noteId));
```

With that single permission added, the same reproduction succeeded. Six further checks passed: owner updates, the notebook owner query, existing web-style owner deletion, denial of creation for another owner, denial of unrelated-account reads of private existing notes, and denial of signed-out reads of missing IDs. Firebase's remote rules syntax validator returned no errors. No production user content was read or changed for these tests.

## Deployment boundary

[note-save-hotfix.rules](note-save-hotfix.rules) contains the inspected live rules plus the missing-document permission and its comment. It intentionally preserves the current web behavior. The pre-existing root `firestore.rules` has a larger staged deletion/security migration and remains untouched. Do not deploy that larger migration as part of this fix.

The dedicated [deployment configuration](note-save-hotfix.firebase.json) targets only Firestore rules. The owner explicitly approved publication. Deployment to `rhymepage-6b98b` completed successfully, and a subsequent read-back exactly matched the tested candidate. The existing app and AAB require no rebuild for this rules fix. No Hosting, Functions, Storage rules, indexes, or app bundle were deployed as part of this fix.

The normalized rules SHA-256 changed from `f9d79ed991fb707761f395a957f8ca580661d4618595eff51ab4b48603844ce2` to `709b51ebd5b2d3f7d4c694c87aa4c6822ab19d5efd9b7f0e2b7f5952db246eae`. Normalization removes trailing whitespace at the end of the file. A pre-deployment read-back matched the original inspected live policy, and a local comparison confirmed that the only changes were the new permission and its comment. The original live rules are retained locally at `node_modules/.cache/firebase-note-save-hotfix/firestore.before.rules` for this session's rollback evidence.

```powershell
npx -y firebase-tools@latest deploy --config docs/android/note-save-hotfix.firebase.json --only firestore:rules --project rhymepage-6b98b
```

After activation, retry Save in the existing installed app, then confirm the note appears in the notebook and survives reopening. Avoid uninstalling the app or clearing its data while a device-only draft is waiting to save. Local test success does not substitute for that owner acceptance check.
