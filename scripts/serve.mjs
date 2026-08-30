import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2']
]);

function isInsideRoot(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

export async function startStaticServer({ root, host = '127.0.0.1', port = 0 }) {
  const resolvedRoot = path.resolve(root);
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://localhost');
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      let filePath = path.resolve(resolvedRoot, `.${decodedPath}`);

      if (!isInsideRoot(resolvedRoot, filePath)) {
        response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
      }

      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');

      const body = await readFile(filePath);
      const contentType = CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
      response.writeHead(200, { 'content-type': contentType });
      response.end(body);
    } catch (error) {
      const status = error instanceof URIError ? 400 : 404;
      response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(status === 400 ? 'Bad Request' : 'Not Found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Static server did not expose a TCP address');

  return {
    server,
    origin: `http://${host}:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    })
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  const app = await startStaticServer({
    root: process.cwd(),
    port: Number(process.env.PORT || 4174)
  });
  process.stdout.write(`Serving ${process.cwd()} at ${app.origin}\n`);
}
