import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';

// Reuse the in-app policy text, but publish readable HTML without loading the app or Firebase.
const vite = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: LegalPages } = await vite.ssrLoadModule('/src/components/LegalPages.tsx');
  // Use the same enabled daisyUI palettes and default as the app, without its bundle.
  const appCss = await readFile('src/index.css', 'utf8');
  const themeEntries = appCss.match(/@plugin "daisyui"\s*\{\s*themes:\s*([^;]+);/)?.[1].split(',').map(entry => entry.trim());
  if (!themeEntries) throw new Error('Could not read the app theme configuration.');
  const themes = themeEntries.map(entry => entry.split(/\s+/)[0]);
  const defaultTheme = themeEntries.find(entry => entry.includes('--default'))?.split(/\s+/)[0];
  if (!defaultTheme) throw new Error('The app must declare a default theme.');
  const themeCss = (await Promise.all(themes.map(theme => readFile(`node_modules/daisyui/theme/${theme}.css`, 'utf8')))).join('\n');
  const themeScript = `(()=>{const apply=()=>{let theme=${JSON.stringify(defaultTheme)};try{const saved=localStorage.getItem('theme');if(${JSON.stringify(themes)}.includes(saved))theme=saved;}catch{}document.documentElement.dataset.theme=theme;};apply();addEventListener('pageshow',apply);addEventListener('storage',event=>{if(event.key==='theme'||event.key===null)apply();});})();`;
  const css = `
${themeCss}
@font-face{font-family:Raleway;src:url('/legal/raleway-500.woff2') format('woff2');font-weight:500;font-display:swap}
@font-face{font-family:Raleway;src:url('/legal/raleway-800.woff2') format('woff2');font-weight:800;font-display:swap}
:root{--paper:var(--color-base-100);--ink:var(--color-base-content);--muted:color-mix(in srgb,var(--ink) 75%,var(--paper));--rule:var(--color-base-300);--link:var(--ink)}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:500 16px/1.7 Raleway,sans-serif}
header,main,footer{max-width:48rem;margin:auto;padding:1.25rem 1.5rem}header{border-bottom:1px solid var(--rule)}
header>a{font-size:1.25rem;font-weight:800;text-decoration:none}article{overflow-wrap:anywhere}h1,h2{font-weight:800;line-height:1.25;text-wrap:balance}
h1{font-size:clamp(1.75rem,5vw,2.25rem);margin:.5rem 0 1rem}h2{font-size:1.15rem;margin:2rem 0 .75rem}p{margin:.9rem 0}ol{padding-left:1.5rem}li+li{margin-top:.5rem}
a{color:var(--link);text-underline-offset:.2em}a:focus-visible{outline:2px solid currentColor;outline-offset:4px}article>p:nth-child(2){color:var(--muted);font-size:.875rem}article .flex{display:flex;flex-wrap:wrap;gap:1rem}
footer{border-top:1px solid var(--rule);display:flex;flex-wrap:wrap;gap:1rem;padding-bottom:max(1.25rem,env(safe-area-inset-bottom));font-size:.875rem}
*{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--color-primary) 40%,var(--ink)) transparent}
@media(forced-colors:active){*{scrollbar-color:auto}}
@media(max-width:420px){header,main,footer{padding-left:1rem;padding-right:1rem}}
`;
  await mkdir('public/legal', { recursive: true });
  await copyFile('src/fonts/raleway-v28-latin-500.woff2', 'public/legal/raleway-500.woff2');
  await copyFile('src/fonts/raleway-v28-latin-800.woff2', 'public/legal/raleway-800.woff2');
  for (const [route, page, title] of [['privacy', 'privacy', 'RhymePage privacy policy'], ['delete-account', 'deletion', 'Delete your RhymePage account']]) {
    const body = renderToStaticMarkup(createElement(StaticRouter, { location: `/${route}` }, createElement(LegalPages, { page, signedIn: false })));
    const html = `<!doctype html><html lang="en" data-theme="${defaultTheme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><link rel="canonical" href="https://rhymepage.com/${route}"><script>${themeScript}</script><style>${css}</style></head><body><header><a href="/">RhymePage</a></header><main>${body}</main><footer><a href="/privacy">Privacy policy</a><a href="/delete-account">Delete account</a><a href="/">Open RhymePage</a></footer></body></html>`;
    await mkdir(`public/${route}`, { recursive: true });
    await writeFile(`public/${route}/index.html`, html);
  }
  console.log('Built public privacy and account-deletion HTML from LegalPages.tsx.');
} finally {
  await vite.close();
}
