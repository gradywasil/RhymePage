import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const windows = process.platform === 'win32';
const emulator = process.argv.includes('--emulator');
const bundle = process.argv.includes('--bundle');
const java = process.env.JAVA_HOME
  ? join(process.env.JAVA_HOME, 'bin', windows ? 'java.exe' : 'java')
  : 'java';
const version = spawnSync(java, ['-version'], { encoding: 'utf8' });
if (version.error || version.status !== 0 || !/version "21[.\"]/.test(version.stderr)) {
  console.error('Android builds require JDK 21. Set JAVA_HOME to your JDK 21 installation.');
  process.exit(1);
}

if (emulator) {
  const sync = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/@capacitor/cli/bin/capacitor', import.meta.url)), 'sync', 'android'], {
    stdio: 'inherit', env: { ...process.env, RHYMEPAGE_EMULATOR: 'true' },
  });
  if (sync.status !== 0) process.exit(sync.status ?? 1);
}
const build = spawnSync(windows ? '.\\gradlew.bat' : './gradlew', [
  bundle ? ':app:bundleRelease' : ':app:assembleDebug', '--console=plain', '--no-daemon',
  ...(emulator ? ['-PRHYMEPAGE_EMULATOR=true'] : []),
], {
  cwd: fileURLToPath(new URL('../android/', import.meta.url)),
  stdio: 'inherit',
  shell: windows,
});
if (build.error) console.error(build.error.message);
process.exit(build.status ?? 1);
