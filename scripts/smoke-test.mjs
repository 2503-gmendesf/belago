import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const CLIENT_BAR = '.tab-bar:not(#prof-tab-bar):not(#admin-tab-bar)';

// Cada perfil: tela que deve ficar ativa e tab bar que deve ficar visível.
const PROFILES = [
  { role: 'cliente', screen: 's-home', tabBar: CLIENT_BAR },
  { role: 'profissional', screen: 's-prof-panel', tabBar: '#prof-tab-bar' },
  { role: 'admin', screen: 's-admin', tabBar: '#admin-tab-bar' },
];

// Falhas de rede externa (CDN, fontes, Supabase) não são bugs do app.
const isExternalNoise = (text) =>
  /Failed to load resource|net::ERR_|supabase|fonts\.(googleapis|gstatic)/i.test(text);

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    if (!file.startsWith(ROOT)) throw new Error('fora da raiz');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const failures = [];

for (const { role, screen, tabBar } of PROFILES) {
  const page = await (await browser.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !isExternalNoise(m.text())) errors.push(`console.error: ${m.text()}`);
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((r) => quickLogin(r), role);
    // #s-home já nasce ativa; o sinal de que routeUser/goTab rodou é o display inline das barras.
    await page.waitForFunction(
      (id) => document.getElementById(id)?.classList.contains('active') && document.getElementById('prof-tab-bar').style.display !== '',
      screen,
      { timeout: 5000 }
    );

    const visibleBars = await page.evaluate(
      (bars) => bars.filter((s) => {
        const el = document.querySelector(s);
        return el && getComputedStyle(el).display !== 'none';
      }),
      [CLIENT_BAR, '#prof-tab-bar', '#admin-tab-bar']
    );
    if (visibleBars.length !== 1 || visibleBars[0] !== tabBar) {
      errors.push(`tab bars visíveis: [${visibleBars}], esperado só ${tabBar}`);
    }
  } catch (e) {
    errors.push(`não abriu #${screen}: ${e.message.split('\n')[0]}`);
  }

  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${role} -> #${screen}`);
  errors.forEach((e) => console.log(`       ${e}`));
  if (errors.length) failures.push(role);
  await page.context().close();
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\nSmoke test falhou: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nSmoke test passou.');
