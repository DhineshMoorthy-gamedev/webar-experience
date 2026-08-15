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
  const parsedUrl = new URL(req.url, 'http://localhost:3459');
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

server.listen(3459, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('[PAGE LOG]', msg.text()));
    page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

    await page.goto('http://localhost:3459/', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      window.THREE = THREE;

      const script = document.createElement('script');
      script.src = '/libs/8thwall/xr.js';
      script.async = true;
      document.head.appendChild(script);

      await new Promise(r => {
        if (window.XR8) return r();
        window.addEventListener('xrloaded', r, { once: true });
        setTimeout(r, 4000);
      });

      await window.XR8.loadChunk('slam');

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      document.body.appendChild(canvas);

      const anyDevice = window.XR8.XrConfig.device().ANY;

      const glModule = window.XR8.GlTextureRenderer.pipelineModule();
      const threeModule = window.XR8.Threejs.pipelineModule();
      const xrModule = window.XR8.XrController.pipelineModule();

      window.XR8.addCameraPipelineModules([glModule, threeModule, xrModule]);

      window.XR8.Threejs.configure({
        allowedDevices: anyDevice
      });

      window.XR8.XrController.configure({
        allowedDevices: anyDevice,
        disableWorldTracking: true,
        imageTargets: ['sample-poster']
      });

      try {
        window.XR8.run({ canvas, allowedDevices: anyDevice, verbose: true });
        return { success: true, running: true };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    });

    console.log('XR8 RUN RESULT:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
