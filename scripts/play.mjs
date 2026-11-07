import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { delimiter, isAbsolute, join, relative, resolve, sep } from 'node:path';

const [action, ...options] = process.argv.slice(2);
if (!['install', 'check', 'internal'].includes(action)) throw new Error('Use install, check, or internal.');
const env = { ...process.env, FASTLANE_SKIP_UPDATE_CHECK: '1', FASTLANE_OPT_OUT_USAGE: '1', FASTLANE_SKIP_DOCS: '1' };
const portableRuby = process.platform === 'win32' && env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'AndroidReleaseTools', 'ruby-3.4.12') : null;
const rubyHome = env.PLAY_RUBY_HOME ?? (portableRuby && existsSync(join(portableRuby, 'bin', 'ruby.exe')) ? portableRuby : null);
const ruby = rubyHome ? join(rubyHome, 'bin', process.platform === 'win32' ? 'ruby.exe' : 'ruby') : 'ruby';
if (rubyHome) env.PATH = join(rubyHome, 'bin') + delimiter + env.PATH;
if (action !== 'install') {
  if (!env.PLAY_JSON_KEY || !existsSync(env.PLAY_JSON_KEY)) throw new Error('Set PLAY_JSON_KEY to your private Play service-account JSON file outside this checkout.');
  const keyPath = relative(process.cwd(), resolve(env.PLAY_JSON_KEY));
  if (!keyPath.startsWith(`..${sep}`) && keyPath !== '..' && !isAbsolute(keyPath)) throw new Error('Keep the private Play credential outside this checkout.');
}
const args = action === 'install' ? ['install'] : ['exec', 'fastlane', 'android', action, ...options];
const result = spawnSync(ruby, ['-S', 'bundle', ...args], { env, stdio: 'inherit' });
if (result.error) console.error('Could not start Ruby/Bundler. Install Ruby or set PLAY_RUBY_HOME.', result.error.message);
process.exit(result.status ?? 1);
