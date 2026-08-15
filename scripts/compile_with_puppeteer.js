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

    console.log('1. Compiling new macro-feature poster into sample-poster.mind...');
    const mindBytes = await page.evaluate(async () => {
      const { Compiler } = await import('/libs/mindar-image.prod.js');
      const img = new Image();
      img.src = '/targets/sample-poster.jpg?' + Date.now();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error('Failed to load poster image'));
      });
      const compiler = new Compiler();
      await compiler.compileImageTargets([img], (p) => {
        console.log('MindAR Compile Progress: ' + p.toFixed(1) + '%');
      });
      const buffer = await compiler.exportData();
      return Array.from(new Uint8Array(buffer));
    });

    const mindOutPath = path.resolve(publicDir, 'targets', 'sample-poster.mind');
    fs.writeFileSync(mindOutPath, Buffer.from(mindBytes));
    console.log(`SUCCESS: Compiled ${mindOutPath} (${mindBytes.length} bytes)`);

    console.log('2. Generating stabilized GLB model in browser...');
    const glbBytes = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');

      const root = new THREE.Group();
      root.name = 'AR_Robot_Avatar';

      // 1. Solid Hexagonal Base Platform
      const baseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.06, 6);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.85,
        roughness: 0.2
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.name = 'BasePlatform';
      baseMesh.position.y = 0.03;
      root.add(baseMesh);

      // 2. Glowing Base Neon Ring
      const baseNeonGeo = new THREE.TorusGeometry(0.48, 0.02, 16, 32);
      const baseNeonMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 1.0
      });
      const baseNeon = new THREE.Mesh(baseNeonGeo, baseNeonMat);
      baseNeon.rotation.x = Math.PI / 2;
      baseNeon.position.y = 0.06;
      root.add(baseNeon);

      // 3. Central Robot Body / Sphere
      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'BodyGroup';
      bodyGroup.position.y = 0.45;
      root.add(bodyGroup);

      const bodyGeo = new THREE.SphereGeometry(0.32, 32, 24);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e88e5,
        metalness: 0.85,
        roughness: 0.15
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.name = 'Body';
      bodyGroup.add(bodyMesh);

      // 4. Glowing Cyber Visor
      const visorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.26, 16);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00e5ff,
        emissiveIntensity: 1.3,
        roughness: 0.1
      });
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.name = 'Visor';
      visorMesh.rotation.z = Math.PI / 2;
      visorMesh.position.set(0, 0.02, 0.24);
      bodyGroup.add(visorMesh);

      // 5. Antenna & Beacon
      const antennaPoleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8);
      const antennaPoleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
      const antennaPole = new THREE.Mesh(antennaPoleGeo, antennaPoleMat);
      antennaPole.position.set(0, 0.38, 0);
      bodyGroup.add(antennaPole);

      const beaconGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xff3d71,
        emissive: 0xff0055,
        emissiveIntensity: 1.3
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.name = 'Beacon';
      beaconMesh.position.set(0, 0.48, 0);
      bodyGroup.add(beaconMesh);

      // 6. Rotating Orbit Ring 1 (Tilted 45 deg)
      const ring1Geo = new THREE.TorusGeometry(0.52, 0.022, 16, 48);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff7700,
        emissiveIntensity: 0.9,
        metalness: 0.7,
        roughness: 0.2
      });
      const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1Mesh.name = 'OrbitRing1';
      ring1Mesh.rotation.x = Math.PI / 4;
      bodyGroup.add(ring1Mesh);

      // 7. Rotating Orbit Ring 2 (Opposite tilt)
      const ring2Geo = new THREE.TorusGeometry(0.62, 0.018, 16, 48);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: 0x00e676,
        emissive: 0x00c853,
        emissiveIntensity: 0.8,
        metalness: 0.7,
        roughness: 0.2
      });
      const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2Mesh.name = 'OrbitRing2';
      ring2Mesh.rotation.x = -Math.PI / 4;
      bodyGroup.add(ring2Mesh);

      // Keyframes: Smooth 360 degree rotations ONLY
      const times = [0, 2, 4];

      const bq0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      const bq1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      const bq2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2);
      const bodyRotTrack = new THREE.QuaternionKeyframeTrack('BodyGroup.quaternion', times, [
        bq0.x, bq0.y, bq0.z, bq0.w,
        bq1.x, bq1.y, bq1.z, bq1.w,
        bq2.x, bq2.y, bq2.z, bq2.w
      ]);

      const r1q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0));
      const r1q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, Math.PI, 0));
      const r1q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, Math.PI * 2, 0));
      const ring1Track = new THREE.QuaternionKeyframeTrack('BodyGroup/OrbitRing1.quaternion', times, [
        r1q0.x, r1q0.y, r1q0.z, r1q0.w,
        r1q1.x, r1q1.y, r1q1.z, r1q1.w,
        r1q2.x, r1q2.y, r1q2.z, r1q2.w
      ]);

      const r2q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 4, 0, 0));
      const r2q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 4, -Math.PI, 0));
      const r2q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 4, -Math.PI * 2, 0));
      const ring2Track = new THREE.QuaternionKeyframeTrack('BodyGroup/OrbitRing2.quaternion', times, [
        r2q0.x, r2q0.y, r2q0.z, r2q0.w,
        r2q1.x, r2q1.y, r2q1.z, r2q1.w,
        r2q2.x, r2q2.y, r2q2.z, r2q2.w
      ]);

      const clip = new THREE.AnimationClip('SpinStationary', 4, [bodyRotTrack, ring1Track, ring2Track]);

      const exporter = new GLTFExporter();
      const glb = await exporter.parseAsync(root, { binary: true, animations: [clip] });
      return Array.from(new Uint8Array(glb));
    });

    const outPath = path.resolve(publicDir, 'models', 'sample-animation.glb');
    fs.writeFileSync(outPath, Buffer.from(glbBytes));
    console.log(`SUCCESS: Generated GLB model: ${outPath} (${glbBytes.length} bytes)`);
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
