import { Link } from "react-router-dom";

export default function LegalPages({ page, signedIn }: { page: "privacy" | "deletion"; signedIn: boolean }) {
  const contact = import.meta.env.VITE_PUBLIC_CONTACT_EMAIL || "Help@arrangedgodly.com";
  return (
    <article className="mx-auto w-full max-w-2xl space-y-5 px-5 py-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">{page === "privacy" ? "RhymePage privacy policy" : "Delete your RhymePage account"}</h1>
      <p>Last updated: October 26, 2026.</p>
      {page === "deletion" ? <>
        <p>You can request account deletion from this website. You do not need the Android app installed.</p>
        <p>Email <a className="underline" href={`mailto:${contact}?subject=RhymePage%20account%20deletion`}>{contact}</a> with the subject "RhymePage account deletion" and identify the email address associated with your account. We may ask you to confirm ownership before processing the request. Do not send your password.</p>
        <p>You can also request deletion from RhymePage's account settings:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Sign in with the RhymePage account you want to delete.</li>
          <li>Open Settings, then Account, then Delete account.</li>
          <li>Enter the confirmation phrase and confirm your password or the same Google account.</li>
        </ol>
        <Link className="btn btn-error btn-sm" to={signedIn ? "/settings?section=account" : "/login"}>{signedIn ? "Open account deletion" : "Sign in to request deletion"}</Link>
        <p>Deletion removes your owned notes, attached audio, lyric timing, private account data, profile, email lookup entries, and follow relationships. Your access to notes owned by other people is removed. Those other people's notes and their collaborative content remain with their owners; references to your account in their timing metadata are anonymized.</p>
        <p>Confirmation starts irreversible deletion. If an in-app request reports an error, keep signed in and retry, or contact us for help completing it. Limited security and deletion-processing records may remain after content deletion.</p>
        <p>Account-scoped recovery drafts and playback positions on the device where you delete the account are cleared. Recovery copies on another browser or device remain local to that device until its app storage or site data is cleared. Exports and files you saved outside RhymePage are under your control.</p>
      </> : <>
        <p>This policy explains how RhymePage handles information when you use its website and Android app to write lyrics, save notes, attach audio, and mark lyric timing. Contact <a className="underline" href={`mailto:${contact}`}>{contact}</a> with privacy questions or requests.</p>
        <h2 className="text-lg font-semibold">Your account and notebook</h2>
        <p>Google Firebase Authentication processes email/password or Google sign-in and supplies an account ID. RhymePage stores your account name, email address, profile picture when supplied, preferences, note titles, lyrics, themes, lyric timing, sharing choices, and follow relationships in Firebase. Audio you choose to attach is uploaded to Firebase Storage. We use this information to provide sign-in, save and reopen your work, play attached audio, synchronize lyrics, and support collaboration.</p>
        <h2 className="text-lg font-semibold">Sharing and other users</h2>
        <p>Your notebook content is made available to you and the people you choose to share it with. Your public profile is visible to signed-in users. Someone who already knows your email address can look up your account to share a note. Audio download links can also provide access to the attached file to people who have the link. Files you export or share outside RhymePage are under your control.</p>
        <h2 className="text-lg font-semibold">Writing kept on your device</h2>
        <p>The editor keeps recovery copies of writing and unsaved timing in this device's app or browser storage. These copies are separate for each signed-in account. Signing out does not erase its recovery drafts; deleting the account on that device clears them. Unsigned demo drafts belong to the device. Clearing app/site storage or uninstalling the Android app removes its local copies.</p>
        <h2 className="text-lg font-semibold">Word lookups</h2>
        <p>Datamuse receives words and themes used for suggestions. Free Dictionary API receives words you choose to define. These services also receive normal network information such as your IP address. RhymePage does not send them your complete lyric note as a lookup request.</p>
        <h2 className="text-lg font-semibold">Microphone and optional voice timing</h2>
        <p>Where optional voice timing is available on the web, it records a temporary vocal guide after you request microphone access. The guide is processed locally and is not uploaded or saved to your account. Downloading and preparing its alignment model requires explicit opt-in and may use browser storage for caching. The standard Android release provides manual and waveform timing, does not request microphone permission, and does not offer automatic voice alignment.</p>
        <h2 className="text-lg font-semibold">Analytics and service operation</h2>
        <p>The main web app initializes Firebase Analytics for usage measurement. Analytics may use cookies and browser identifiers to measure visits, device/browser information, and interactions. The standard Android build does not initialize Firebase Analytics. Google/Firebase also process network and technical information needed to authenticate accounts, deliver content, operate the service, and prevent abuse. RhymePage does not sell your lyric notes or attached audio.</p>
        <h2 className="text-lg font-semibold">Service providers and data handling</h2>
        <p>RhymePage uses Google/Firebase for authentication, cloud database, file storage, website hosting, and web analytics; Datamuse for suggestions; and Free Dictionary API for definitions. These providers receive the information needed for those features and handle service data under their own policies. Connections to these services use HTTPS. Firebase Authentication and access rules help control access to stored account content. Clearing cookies or browser storage may sign you out and remove local recovery copies.</p>
        <h2 className="text-lg font-semibold">Retention and deletion</h2>
        <p>Saved notebook data is retained to provide the service until you delete the content or request account deletion. You can request account deletion in Settings or by emailing <a className="underline" href={`mailto:${contact}?subject=RhymePage%20account%20deletion`}>{contact}</a>. Account deletion removes your account and owned notebook content, attached audio and timing, private preferences, profile, and sharing/follow relationships. Collaborative content owned by someone else remains with its owner; references to your account in their timing metadata are anonymized.</p>
        <p>Limited security and deletion-processing records may remain after content deletion. Service providers may also retain operational records under their own retention policies. Recovery copies on other devices and files you exported are not remotely erased. Contact us if a deletion fails, you cannot access your account, or you have questions about retained information.</p>
        <p><Link className="underline" to="/delete-account">Request account and data deletion</Link>.</p>
        <p className="flex flex-wrap gap-4"><a className="underline" href="https://firebase.google.com/support/privacy">Firebase privacy information</a><a className="underline" href="https://www.datamuse.com/api/">Datamuse API</a><a className="underline" href="https://dictionaryapi.dev/">Free Dictionary API</a></p>
        <h2 className="text-lg font-semibold">Policy changes</h2>
        <p>We may update this policy as RhymePage changes. The date above identifies the latest revision.</p>
      </>}
      <p>Contact RhymePage: <a className="underline" href={`mailto:${contact}`}>{contact}</a></p>
    </article>
  );
}
