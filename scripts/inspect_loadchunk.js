import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:3460');
  let pathname = decodeURIComponent(parsedUrl.pathname);

  let filePath = '';
  if (pathname.startsWith('/node_modules/')) {
    filePath = path.join(rootDir, pathname.replace(/^\//, '').split('/').join(path.sep));
  } else {
    const cleanPath = pathname.replace(/^\//, '').split('/').join(path.sep);
    filePath = path.join(publicDir, cleanPath || 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3460, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:3460/', { waitUntil: 'domcontentloaded' });

    const info = await page.evaluate(async () => {
      const script = document.createElement('script');
      script.src = '/libs/8thwall/xr.js';
      script.async = true;
      document.head.appendChild(script);

      await new Promise(r => {
        if (window.XR8) return r();
        window.addEventListener('xrloaded', r, { once: true });
        setTimeout(r, 4000);
      });

      return {
        loadChunkStr: window.XR8.loadChunk ? window.XR8.loadChunk.toString() : 'null'
      };
    });

    console.log('LOAD CHUNK FN:', info.loadChunkStr);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
