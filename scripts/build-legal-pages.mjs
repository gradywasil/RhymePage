import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';

// Reuse the in-app policy text, but publish readable HTML without loading the app or Firebase.
const vite = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: LegalPages } = await vite.ssrLoadModule('/src/components/LegalPages.tsx');
  const { THEMES } = await vite.ssrLoadModule('/src/theme/themes.ts');

  /*
   * The static pages carry the app's own theme values and kit classes (rp-title,
   * rp-link, rp-btn...) as plain CSS. The Tailwind @theme block is dropped; the
   * few layout utilities the markup relies on are restated below.
   */
  const stripTheme = css => css.replace(/@theme\s+inline\s*\{[\s\S]*?\n\}/, '');
  const tokensCss = stripTheme(await readFile('src/styles/tokens.css', 'utf8'));
  const kitCss = await readFile('src/styles/components.css', 'utf8');
  if (!tokensCss.includes('[data-theme="harbor"]') || !kitCss.includes('.rp-title')) {
    throw new Error('Could not read the design tokens or component kit.');
  }

  // Mirrors readThemeChoice/resolveTheme in src/theme/themes.ts, including the
  // daisyUI theme names saved by earlier versions.
  const ids = THEMES.map(theme => theme.id);
  const legacy = { pastel: 'lilac', winter: 'harbor', retro: 'newsprint', corporate: 'newsprint', business: 'night', forest: 'forest' };
  const themeScript = `(()=>{const ids=${JSON.stringify(ids)},legacy=${JSON.stringify(legacy)},dark=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{let choice='auto';try{const saved=localStorage.getItem('theme');if(saved)choice=saved==='auto'||ids.includes(saved)?saved:(legacy[saved]||'auto');}catch{}document.documentElement.dataset.theme=choice==='auto'?(dark.matches?'night':'harbor'):choice;};apply();addEventListener('pageshow',apply);addEventListener('storage',event=>{if(event.key==='theme'||event.key===null)apply();});dark.addEventListener?.('change',apply);})();`;

  const css = `
@font-face{font-family:"Archivo Variable";src:url('/legal/archivo.woff2') format('woff2-variations');font-weight:100 900;font-display:swap}
${tokensCss}
:root{--font-sans:"Archivo Variable",Archivo,system-ui,sans-serif}
${kitCss}
*,::before,::after{box-sizing:border-box}
body{margin:0}
h1,h2,p,ol{margin:0}
header,footer{max-width:calc(68ch + 5rem);margin:auto;padding:1rem 2.5rem}
header{border-bottom:1.5px solid var(--ink)}
header>a{font-size:22px;font-weight:800;letter-spacing:-.02em;color:inherit;text-decoration:none}
.legal{max-width:calc(68ch + 5rem);margin:auto;padding:2.5rem 2.5rem 3rem;font-size:16px;line-height:1.625;overflow-wrap:anywhere}
.legal>*+*{margin-top:1rem}
.legal h1{font-size:44px;padding-bottom:.5rem}
.legal h2{font-size:20px;line-height:1.75rem;margin-top:2.5rem}
.legal>p:nth-of-type(1){color:var(--ink-2);font-size:14px}
.legal ol{list-style:decimal;padding-left:1.5rem}
.legal li+li{margin-top:.5rem}
.legal .flex{display:flex;flex-wrap:wrap;column-gap:1.5rem;row-gap:.5rem}
.legal .rp-btn{text-decoration:none}
footer{border-top:1px solid var(--rule);display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;padding-bottom:max(1.25rem,env(safe-area-inset-bottom));font-size:15px}
footer a{color:inherit;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px}
footer a:hover{color:var(--accent)}
@media(max-width:640px){header,footer{padding-left:1rem;padding-right:1rem}.legal{padding:1.25rem 1rem 3rem}.legal h1{font-size:34px}}
`;
  await mkdir('public/legal', { recursive: true });
  await copyFile('node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2', 'public/legal/archivo.woff2');
  for (const [route, page, title] of [['privacy', 'privacy', 'RhymePage privacy policy'], ['delete-account', 'deletion', 'Delete your RhymePage account']]) {
    const body = renderToStaticMarkup(createElement(StaticRouter, { location: `/${route}` }, createElement(LegalPages, { page, signedIn: false })));
    const html = `<!doctype html><html lang="en" data-theme="harbor"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><link rel="canonical" href="https://rhymepage.com/${route}"><script>${themeScript}</script><style>${css}</style></head><body><header><a href="/">RhymePage</a></header><main>${body}</main><footer><a href="/privacy">Privacy policy</a><a href="/delete-account">Delete account</a><a href="/">Open RhymePage</a></footer></body></html>`;
    await mkdir(`public/${route}`, { recursive: true });
    await writeFile(`public/${route}/index.html`, html);
  }
  console.log('Built public privacy and account-deletion HTML from LegalPages.tsx.');
} finally {
  await vite.close();
}
