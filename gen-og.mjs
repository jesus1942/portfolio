// Genera las imágenes Open Graph (1200×630) para compartir en redes.
//   node gen-og.mjs   →   og-portfolio.png  +  og-servicios.png
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 1200, H = 630;

// ---- Portfolio dev: dark / glass / cyan ----
const portfolioSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="18%" cy="22%" r="60%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#030508" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="92%" cy="88%" r="55%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#030508" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.5" fill="#ffffff" opacity="0.045"/>
    </pattern>
    <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#030508"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect x="20" y="20" width="${W-40}" height="${H-40}" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.07"/>

  <text x="90" y="150" font-family="monospace" font-size="26" fill="#67e8f9" letter-spacing="4">jesus.olguin</text>

  <text x="86" y="320" font-family="sans-serif" font-weight="800" font-size="118" fill="#ffffff">Jesús Olguín</text>
  <text x="90" y="400" font-family="sans-serif" font-weight="700" font-size="50" fill="url(#cyan)">Full-Stack Developer &amp; IoT Solutions</text>

  <g transform="translate(90,470)">
    <path d="M14 36 Q4 24 4 16 Q4 4 14 2 Q26 0 32 6 Q38 12 38 18 Q38 26 14 44 Z" fill="none" stroke="#67e8f9" stroke-opacity="0.7" stroke-width="2.5"/>
    <circle cx="20" cy="17" r="5" fill="none" stroke="#67e8f9" stroke-opacity="0.7" stroke-width="2.5"/>
    <text x="58" y="34" font-family="sans-serif" font-size="34" fill="#a1a1aa">Puerto Madryn · Patagonia Argentina</text>
  </g>

  <rect x="90" y="540" width="220" height="6" rx="3" fill="url(#cyan)"/>
</svg>`;

// ---- Servicios: brutalista naranja / navy ----
const naranja = '#f97316', navy = '#0f172a', cream = '#fff7ed';
const serviciosSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${cream}"/>
  <!-- tape diagonal -->
  <rect x="0" y="0" width="${W}" height="38" fill="${naranja}"/>
  <g>
    ${Array.from({length: 40}).map((_,i)=>`<rect x="${i*40}" y="0" width="20" height="38" fill="${navy}"/>`).join('')}
  </g>
  <rect x="40" y="78" width="${W-80}" height="${H-118}" fill="#ffffff" stroke="${navy}" stroke-width="8"/>
  <rect x="58" y="96" width="${W-116}" height="${H-154}" fill="none" stroke="${navy}" stroke-width="2" stroke-dasharray="2 8" opacity="0.4"/>

  <rect x="90" y="140" width="320" height="54" fill="${cream}" stroke="${naranja}" stroke-width="5"/>
  <text x="108" y="178" font-family="monospace" font-weight="700" font-size="26" fill="${naranja}" letter-spacing="2">PUERTO MADRYN · CHUBUT</text>

  <text x="86" y="320" font-family="sans-serif" font-weight="900" font-size="104" fill="${navy}">SERVICIOS</text>
  <text x="86" y="420" font-family="sans-serif" font-weight="900" font-size="104" fill="${naranja}">TÉCNICOS</text>

  <text x="92" y="495" font-family="sans-serif" font-weight="700" font-size="30" fill="#475569">Calefacción · Piscinas · Electricidad industrial · Tableros</text>

  <rect x="90" y="528" width="260" height="8" fill="${navy}"/>
</svg>`;

async function render(svg, out) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, out));
  console.log('✓', out);
}

await render(portfolioSVG, 'og-portfolio.png');
await render(serviciosSVG, 'og-servicios.png');
