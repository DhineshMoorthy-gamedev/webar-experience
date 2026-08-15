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
  const parsedUrl = new URL(req.url, 'http://localhost:3456');
  let pathname = decodeURIComponent(parsedUrl.pathname);

  let filePath = '';
  if (pathname === '/' || pathname === '/compile') {
    filePath = path.resolve(__dirname, 'compile_target.html');
  } else if (pathname.startsWith('/node_modules/')) {
    filePath = path.join(rootDir, pathname.replace(/^\//, '').split('/').join(path.sep));
  } else {
    const cleanPath = pathname.replace(/^\//, '').split('/').join(path.sep);
    filePath = path.join(publicDir, cleanPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.glb': 'model/gltf-binary'
    };
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found: ' + pathname);
  }
});

server.listen(3456, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu-sandbox', '--enable-webgl']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('[PAGE LOG]', msg.text()));
    page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

    await page.goto('http://localhost:3456/', { waitUntil: 'domcontentloaded' });

    console.log('Generating GLB model in browser...');
    const glbBytes = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');

      const root = new THREE.Group();
      root.name = 'AR_Robot_Avatar';

      // 1. Robot Body
      const bodyGeo = new THREE.SphereGeometry(0.35, 32, 24);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e88e5,
        metalness: 0.8,
        roughness: 0.2
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.name = 'Body';
      bodyMesh.position.y = 0.45;
      root.add(bodyMesh);

      // 2. Visor
      const visorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.9,
        roughness: 0.1
      });
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.name = 'Visor';
      visorMesh.rotation.z = Math.PI / 2;
      visorMesh.position.set(0, 0.47, 0.25);
      root.add(visorMesh);

      // 3. Antenna & Beacon
      const antennaPoleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8);
      const antennaPoleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });
      const antennaPole = new THREE.Mesh(antennaPoleGeo, antennaPoleMat);
      antennaPole.position.set(0, 0.88, 0);
      root.add(antennaPole);

      const beaconGeo = new THREE.SphereGeometry(0.05, 16, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xff3d71,
        emissive: 0xff0055,
        emissiveIntensity: 1.0
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.name = 'Beacon';
      beaconMesh.position.set(0, 1.0, 0);
      root.add(beaconMesh);

      // 4. Orbit Ring
      const ringGeo = new THREE.TorusGeometry(0.55, 0.03, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff7700,
        emissiveIntensity: 0.7,
        metalness: 0.7,
        roughness: 0.3
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = 'OrbitRing';
      ringMesh.rotation.x = Math.PI / 3;
      ringMesh.position.y = 0.45;
      root.add(ringMesh);

      // 5. Base Platform
      const baseRingGeo = new THREE.TorusGeometry(0.35, 0.04, 16, 32);
      const baseRingMat = new THREE.MeshStandardMaterial({
        color: 0x00e676,
        emissive: 0x00c853,
        emissiveIntensity: 0.8
      });
      const baseRingMesh = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRingMesh.name = 'BaseRing';
      baseRingMesh.rotation.x = Math.PI / 2;
      baseRingMesh.position.y = 0.05;
      root.add(baseRingMesh);

      // Keyframes
      const times = [0, 1, 2, 3, 4];
      const posValues = [
        0, 0, 0,
        0, 0.15, 0,
        0, 0, 0,
        0, -0.1, 0,
        0, 0, 0
      ];
      const posTrack = new THREE.VectorKeyframeTrack('.position', times, posValues);

      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
      const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, Math.PI * 0.5, 0.05));
      const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
      const q3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, Math.PI * 1.5, -0.05));
      const q4 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 2, 0));

      const rotValues = [
        q0.x, q0.y, q0.z, q0.w,
        q1.x, q1.y, q1.z, q1.w,
        q2.x, q2.y, q2.z, q2.w,
        q3.x, q3.y, q3.z, q3.w,
        q4.x, q4.y, q4.z, q4.w
      ];
      const rotTrack = new THREE.QuaternionKeyframeTrack('.quaternion', times, rotValues);

      const ringQ0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 3, 0, 0));
      const ringQ1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 3, Math.PI, 0));
      const ringQ2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 3, Math.PI * 2, 0));
      const ringTimes = [0, 2, 4];
      const ringRotValues = [
        ringQ0.x, ringQ0.y, ringQ0.z, ringQ0.w,
        ringQ1.x, ringQ1.y, ringQ1.z, ringQ1.w,
        ringQ2.x, ringQ2.y, ringQ2.z, ringQ2.w
      ];
      const ringRotTrack = new THREE.QuaternionKeyframeTrack('OrbitRing.quaternion', ringTimes, ringRotValues);

      const clip = new THREE.AnimationClip('IdleHover', 4, [posTrack, rotTrack, ringRotTrack]);

      const exporter = new GLTFExporter();
      const glb = await exporter.parseAsync(root, { binary: true, animations: [clip] });
      return Array.from(new Uint8Array(glb));
    });

    const outPath = path.resolve(publicDir, 'models', 'sample-animation.glb');
    fs.writeFileSync(outPath, Buffer.from(glbBytes));
    console.log(`SUCCESS! Generated ${outPath} (${glbBytes.length} bytes)`);
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
