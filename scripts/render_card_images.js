import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1050, height: 600, deviceScaleFactor: 2 });

  const svgPath = path.resolve(rootDir, 'public/targets/business-card.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#000;">${svgContent}</body></html>`);
  await page.waitForSelector('svg');

  const jpgPath = path.resolve(rootDir, 'public/targets/business-card.jpg');
  const pngPath = path.resolve(rootDir, 'public/targets/business-card.png');

  await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 95 });
  await page.screenshot({ path: pngPath, type: 'png' });

  console.log('Rendered business-card.jpg and business-card.png');
  await browser.close();
})();
