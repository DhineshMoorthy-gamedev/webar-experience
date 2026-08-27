import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const width = 1050;
const height = 600;

// High contrast SVG business card
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00e5ff"/>
      <stop offset="50%" stop-color="#7c4dff"/>
      <stop offset="100%" stop-color="#ff007f"/>
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffd600"/>
      <stop offset="100%" stop-color="#ff6d00"/>
    </linearGradient>

    <!-- High contrast tracking anchor patterns for 8th Wall -->
    <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 229, 255, 0.12)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#gridPattern)"/>

  <!-- High-Contrast Geometric AR Target Frame Anchors -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="20" fill="none" stroke="url(#accentGrad)" stroke-width="5"/>
  <rect x="35" y="35" width="${width - 70}" height="${height - 70}" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

  <!-- Corner Optical Crosshairs for Instant AR Lock -->
  <!-- Top Left -->
  <path d="M 25 75 L 75 75 L 75 25" fill="none" stroke="#00e5ff" stroke-width="6"/>
  <circle cx="75" cy="75" r="8" fill="#00e5ff"/>
  <circle cx="75" cy="75" r="16" fill="none" stroke="#00e5ff" stroke-width="2"/>

  <!-- Top Right -->
  <path d="M ${width - 75} 25 L ${width - 75} 75 L ${width - 25} 75" fill="none" stroke="#ff007f" stroke-width="6"/>
  <circle cx="${width - 75}" cy="75" r="8" fill="#ff007f"/>
  <circle cx="${width - 75}" cy="75" r="16" fill="none" stroke="#ff007f" stroke-width="2"/>

  <!-- Bottom Left -->
  <path d="M 25 ${height - 75} L 75 ${height - 75} L 75 ${height - 25}" fill="none" stroke="#7c4dff" stroke-width="6"/>
  <circle cx="75" cy="${height - 75}" r="8" fill="#7c4dff"/>
  <circle cx="75" cy="${height - 75}" r="16" fill="none" stroke="#7c4dff" stroke-width="2"/>

  <!-- Bottom Right -->
  <path d="M ${width - 75} ${height - 25} L ${width - 75} ${height - 75} L ${width - 25} ${height - 75}" fill="none" stroke="#00e5ff" stroke-width="6"/>
  <circle cx="${width - 75}" cy="${height - 75}" r="8" fill="#00e5ff"/>
  <circle cx="${width - 75}" cy="${height - 75}" r="16" fill="none" stroke="#00e5ff" stroke-width="2"/>

  <!-- Center Holographic Target Emblem (Geometric Anchor) -->
  <g transform="translate(${width - 240}, ${height / 2})">
    <!-- Concentric Target Circles -->
    <circle cx="0" cy="0" r="110" fill="none" stroke="rgba(0, 229, 255, 0.2)" stroke-width="2"/>
    <circle cx="0" cy="0" r="90" fill="none" stroke="#00e5ff" stroke-width="3" stroke-dasharray="10 6"/>
    <circle cx="0" cy="0" r="70" fill="rgba(15, 23, 42, 0.8)" stroke="#ff007f" stroke-width="3"/>
    
    <!-- Central AR Hologram Icon -->
    <polygon points="0,-45 40,-20 40,30 0,55 -40,30 -40,-20" fill="none" stroke="#ffd600" stroke-width="3"/>
    <polygon points="0,-35 30,-15 30,22 0,42 -30,22 -30,-15" fill="rgba(255, 214, 0, 0.15)" stroke="#00e5ff" stroke-width="2"/>
    <text x="0" y="8" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">AR</text>
    <text x="0" y="24" font-family="'Segoe UI', Arial, sans-serif" font-size="10" font-weight="800" fill="#00e5ff" text-anchor="middle" letter-spacing="2">TARGET</text>
  </g>

  <!-- Developer Identity & Branding -->
  <g transform="translate(90, 110)">
    <!-- Studio Tag / Status Badge -->
    <rect x="0" y="0" width="260" height="34" rx="17" fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" stroke-width="1.5"/>
    <circle cx="18" cy="17" r="6" fill="#00e676"/>
    <text x="34" y="22" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="800" fill="#00e5ff" letter-spacing="1.5">OLAI DIGITAL STUDIOS</text>

    <!-- Name -->
    <text x="0" y="90" font-family="'Segoe UI', Arial, sans-serif" font-size="46" font-weight="900" fill="#ffffff" letter-spacing="2">
      DHINESH MOORTHY
    </text>

    <!-- Title / Subtitle -->
    <text x="0" y="130" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="700" fill="url(#accentGrad)" letter-spacing="2">
      GAME DEVELOPER &amp; XR CREATOR
    </text>

    <!-- Flagship & Career Highlights Line -->
    <line x1="0" y1="155" x2="520" y2="155" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1.5"/>

    <!-- Key Milestone Chips -->
    <g transform="translate(0, 180)">
      <!-- Chip 1: Zen Fourier -->
      <rect x="0" y="0" width="165" height="32" rx="8" fill="rgba(255, 0, 127, 0.15)" stroke="#ff007f" stroke-width="1.5"/>
      <text x="12" y="20" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="800" fill="#ff007f">🎮 ZEN FOURIER</text>

      <!-- Chip 2: IIT Madras Haptics -->
      <rect x="180" y="0" width="185" height="32" rx="8" fill="rgba(124, 77, 255, 0.15)" stroke="#7c4dff" stroke-width="1.5"/>
      <text x="192" y="20" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="800" fill="#b388ff">🥽 IITM HAPTICS XR</text>

      <!-- Chip 3: Senior Unity -->
      <rect x="380" y="0" width="170" height="32" rx="8" fill="rgba(255, 214, 0, 0.15)" stroke="#ffd600" stroke-width="1.5"/>
      <text x="392" y="20" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="800" fill="#ffd600">⚡ SENIOR UNITY</text>
    </g>

    <!-- Tech Stack Summary -->
    <text x="0" y="260" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="600" fill="rgba(255, 255, 255, 0.7)" letter-spacing="1">
      CORE TECH: UNITY (C#) • XR SIMULATION • SHADERS • GAMEPLAY LOOPS • WEBXR
    </text>

    <!-- Scan Instruction CTA -->
    <g transform="translate(0, 310)">
      <rect x="0" y="0" width="460" height="42" rx="10" fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" stroke-width="1.5"/>
      <text x="20" y="26" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="800" fill="#ffffff">
        📱 AIM MOBILE CAMERA TO LAUNCH 3D AR PORTFOLIO
      </text>
    </g>
  </g>
</svg>`;

const targetsDir = path.resolve(rootDir, 'public/targets');
if (!fs.existsSync(targetsDir)) {
  fs.mkdirSync(targetsDir, { recursive: true });
}

fs.writeFileSync(path.join(targetsDir, 'business-card.svg'), svgContent);
console.log('Created business-card.svg');
