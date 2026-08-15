# WebAR Image-Triggered Animation — Prototype

A high-performance, open-source **WebAR prototype** built with **TypeScript**, **Vite**, **MindAR**, and **Three.js**.

---

## 🚀 Features

* **Zero App Installation**: Runs directly in modern mobile web browsers (Chrome on Android, Safari on iOS).
* **Robust Image Tracking**: Real-time feature recognition compiled into `.mind` format.
* **3D Animated Avatar**: Three.js GLTF animation mixer with automatic play/pause synchronization on target detection.
* **State-Driven HUD**: Responsive mobile interface with viewfinder reticle, status badges, and sample poster modal.
* **Production Ready**: Built with relative paths (`./`) for static hosting on GitHub Pages, Vercel, or Netlify.

---

## 📁 Project Structure

```text
webar-prototype/
├── public/
│   ├── targets/
│   │   ├── sample-poster.jpg      # High-contrast poster graphic
│   │   └── sample-poster.mind     # Compiled MindAR image target
│   ├── models/
│   │   └── sample-animation.glb   # 3D animated robot model
│   └── libs/
│       └── mindar-image-three.prod.js # MindAR Three.js runtime
├── src/
│   ├── ar/
│   │   ├── ARExperience.ts        # Orchestrates tracking & rendering
│   │   ├── TargetTracker.ts       # MindAR engine & event wrapper
│   │   └── AnimationController.ts # Three.js scene & animation mixer
│   ├── ui/
│   │   └── UIController.ts        # State-machine driven UI overlays
│   ├── config/
│   │   └── experience.ts          # Extensible experience configuration
│   ├── main.ts                    # Main TypeScript entry point
│   └── style.css                  # Modern mobile-first glassmorphism styling
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

The server will display a local URL (e.g., `http://localhost:5173`) and a Network URL (e.g., `http://192.168.x.x:5173`).

---

## 📱 Testing on Mobile

WebAR requires camera permissions. Mobile browsers (especially iOS Safari and Chrome) enforce camera access only over **HTTPS** or `localhost`.

### Option A: Local WiFi with HTTPS (Recommended)
You can use `mkcert` or Vite's basic SSL plugin (`@vitejs/plugin-basic-ssl`) or Ngrok:

```bash
npx ngrok http 5173
```

Open the generated `https://xxxx.ngrok-free.app` on your smartphone browser.

### Option B: On Desktop with Webcam
1. Open `http://localhost:5173` in Chrome or Edge.
2. Click **START CAMERA** and allow webcam permission.
3. Open `public/targets/sample-poster.jpg` on your smartphone or print it out.
4. Hold the poster image in front of the webcam.
5. The 3D robot avatar will appear and animate directly above the poster!

---

## 📦 Production Build & Deployment

```bash
npm run build
```

The compiled static assets will be output to the `dist/` directory.

### Deploy to GitHub Pages:
1. Push this repository to GitHub.
2. In your repository settings, navigate to **Pages**.
3. Under **Source**, select **GitHub Actions** (or deploy the `dist` folder on branch `gh-pages`).
4. Because the Vite configuration uses `base: './'`, it works at any subpath without configuration changes.
