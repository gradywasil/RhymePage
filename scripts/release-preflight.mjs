import { readFile, access } from 'node:fs/promises';

const failures = [];
const buildOnly = process.argv.includes('--build-only');
if (process.env.VITE_ANDROID_ALIGNMENT === 'experimental') failures.push('Experimental Android alignment has not been accepted for release.');
if (process.env.RHYMEPAGE_EMULATOR === 'true') failures.push('The emulator build cannot be released.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.VITE_PUBLIC_CONTACT_EMAIL ?? 'Help@arrangedgodly.com')) failures.push('VITE_PUBLIC_CONTACT_EMAIL must be a valid public support/privacy email.');
if (!buildOnly && process.env.RHYMEPAGE_PRIVACY_REVIEWED !== 'yes') failures.push('Review the privacy policy and data declarations, then set RHYMEPAGE_PRIVACY_REVIEWED=yes.');
try {
  const config = JSON.parse(await readFile(new URL('../android/app/google-services.json', import.meta.url), 'utf8'));
  if (config.project_info?.project_id !== 'rhymepage-6b98b' || !config.client?.some(client => client.client_info?.android_client_info?.package_name === 'com.rhymepage.app' && client.oauth_client?.some(oauth => oauth.client_type === 3))) failures.push('Firebase Android configuration must match com.rhymepage.app in the existing project and include the Google web OAuth client.');
} catch { failures.push('Register/configure the confirmed Android app in the existing Firebase project and provide android/app/google-services.json.'); }
for (const name of ['RHYMEPAGE_UPLOAD_KEYSTORE', 'RHYMEPAGE_UPLOAD_STORE_PASSWORD', 'RHYMEPAGE_UPLOAD_KEY_ALIAS', 'RHYMEPAGE_UPLOAD_KEY_PASSWORD']) {
  if (!process.env[name]) failures.push(`Supply ${name} through your private signing environment.`);
}
if (process.env.RHYMEPAGE_UPLOAD_KEYSTORE) {
  try { await access(process.env.RHYMEPAGE_UPLOAD_KEYSTORE); }
  catch { failures.push('The upload keystore file does not exist.'); }
}
if (failures.length) { console.error('Release preparation is incomplete:\n' + failures.map(failure => `- ${failure}`).join('\n')); process.exit(1); }
console.log(buildOnly
  ? 'Bundle build configuration is present. Building does not approve privacy, backend, device, or Play Console readiness.'
  : 'Local release configuration is present. Device acceptance and Play Console checks are still separate.');
