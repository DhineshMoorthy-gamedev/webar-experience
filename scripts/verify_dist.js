import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:4567');
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const cleanPath = pathname.replace(/^\//, '').split('/').join(path.sep);
  const filePath = path.join(distDir, cleanPath);

  console.log(`[HTTP ${req.method}] ${pathname} -> ${filePath}`);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.css': 'text/css',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.glb': 'model/gltf-binary',
      '.mind': 'application/octet-stream'
    };
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.error(`404 NOT FOUND: ${pathname} (Resolved: ${filePath})`);
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4567, async () => {
  console.log('Testing dist build on http://localhost:4567');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  let browser = null;

  try {
    browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    });

    const page = await browser.newPage();
    const logs = [];
    const errors = [];

    page.on('console', msg => {
      console.log('[BROWSER LOG]', msg.text());
      logs.push(msg.text());
    });
    page.on('pageerror', err => {
      console.error('[BROWSER PAGE ERROR]', err.message);
      errors.push(err.message);
    });

    await page.goto('http://localhost:4567/', { waitUntil: 'networkidle0' });

    console.log('Page loaded. Checking initial elements...');
    const startBtn = await page.$('#btn-start-camera');
    if (!startBtn) throw new Error('Start camera button not found!');

    console.log('Simulating click on START CAMERA...');
    await page.click('#btn-start-camera');

    // Wait 5 seconds for AR and 3D model loading
    await new Promise(r => setTimeout(r, 5000));

    if (errors.length > 0) {
      console.error('Browser Errors:', errors);
    } else {
      console.log('Test completed.');
    }
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
