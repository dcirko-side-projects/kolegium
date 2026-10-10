import { createServer } from 'node:http';
import { build } from 'esbuild';

// Reuse the installed Angular toolchain bundler; no additional dependency or cloud mutation.
const result = await build({
  entryPoints: ['scripts/owner-login.browser.ts'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'esm',
  minify: true,
});
const script = result.outputFiles[0].contents;
const page = `<!doctype html><html lang="hr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Kolegium — povezivanje računa</title>
<style>body{font:18px system-ui;margin:0;background:#DFF7FF;color:#172440}main{max-width:600px;margin:8vh auto;padding:28px;background:white;border-radius:16px}button{background:#2457FF;color:white;border:0;border-radius:8px;padding:14px 20px;font:inherit;cursor:pointer}button:disabled{opacity:.6}code{display:block;overflow-wrap:anywhere;user-select:all;font-size:20px}p{line-height:1.5}button:focus-visible{outline:3px solid #172440;outline-offset:3px}</style></head>
<body><main><h1>Poveži svoj račun</h1><p>Projekt: <strong>kolegium-c8970</strong></p>
<p>Prijavi se računom kojim želiš koristiti Kolegium. Ova stranica prikazuje samo UID računa; ne pristupa fakultetskim podacima.</p>
<button id="login">Prijava Google računom</button><p id="status" role="status" aria-live="polite"></p>
<code id="uid" aria-label="Firebase UID"></code></main><script type="module" src="/owner-login.js"></script></body></html>`;
const server = createServer((request, response) => {
  if (
    !['localhost:4402', '127.0.0.1:4402'].includes(request.headers.host ?? '') ||
    request.method !== 'GET'
  ) {
    response.writeHead(403).end();
    return;
  }
  const body = request.url === '/' ? page : request.url === '/owner-login.js' ? script : null;
  if (body === null) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    'Content-Type':
      request.url === '/' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy':
      "default-src 'none'; script-src 'self' https://apis.google.com; style-src 'unsafe-inline'; connect-src https://*.googleapis.com; frame-src https://kolegium-c8970.firebaseapp.com https://accounts.google.com; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  });
  response.end(body);
});
server.on('error', (error) => {
  console.error('Lokalnu stranicu nije moguće pokrenuti:', error.code);
  process.exitCode = 1;
});
server.listen(4402, '127.0.0.1', () => console.log('Povezivanje računa: http://localhost:4402/'));
