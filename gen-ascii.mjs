// gen-ascii.mjs — convierte una foto en un retrato ASCII en tonos de gris.
//
// Uso:
//   node gen-ascii.mjs <foto-fuente> [columnas]
//   node gen-ascii.mjs me-source.jpg 90
//
// Salida: ascii-face.json  → { cols, rows, lines: ["....","...."] }
// donde cada carácter codifica un nivel de brillo (0-9) según la rampa.
// IMPORTANTE: la foto fuente NO se commitea. Solo se publica el ASCII,
// así tu selfie nunca queda pública en el repo.

import sharp from 'sharp';
import { writeFileSync } from 'fs';

// Rampa de densidad: índice 0 = oscuro (espacio), 9 = brillante (denso).
// El front-end colorea cada glifo según su índice → retrato en grises.
const RAMP = ' .:-=+*#%@';

const src = process.argv[2] || 'me-source.jpg';
const cols = parseInt(process.argv[3] || '90', 10);

// Los caracteres monoespaciados son ~2x más altos que anchos, así que
// comprimimos las filas para conservar la proporción real de la cara.
const CHAR_ASPECT = 0.5;

// Ajustes de contraste/gamma para que la cara resalte sobre el fondo claro.
const CONTRAST = parseFloat(process.env.CONTRAST || '1.25');
const GAMMA = parseFloat(process.env.GAMMA || '1.0');
// INVERT=1 → lo oscuro (sujeto) se dibuja y lo brillante (cielo) desaparece.
// Ideal para fotos con fondo claro y sujeto oscuro.
const INVERT = process.env.INVERT === '1';
// Umbral: brillos por encima de este valor se fuerzan a "vacío" (espacio),
// para limpiar el cielo/fondo. 0 = desactivado.
const KNOCKOUT = parseInt(process.env.KNOCKOUT || '0', 10);

const meta = await sharp(src).metadata();
const rows = Math.max(1, Math.round((meta.height / meta.width) * cols * CHAR_ASPECT));

let pipe = sharp(src).grayscale();
if (process.env.NORMALIZE === '1') pipe = pipe.normalize();
if (CONTRAST !== 1) pipe = pipe.linear(CONTRAST, -(128 * (CONTRAST - 1)));
if (GAMMA !== 1) pipe = pipe.gamma(GAMMA);

const { data, info } = await pipe
  .resize(cols, rows, { fit: 'fill' })
  .raw()
  .toBuffer({ resolveWithObject: true });

// Viñeteado elíptico: oscurece los bordes (cielo/fondo) hasta volverlos
// vacíos, dejando solo la cabeza centrada. VIGNETTE=0 lo desactiva.
const VIGNETTE = parseFloat(process.env.VIGNETTE || '0'); // 0..1 (radio interno)
const VIG_IN = VIGNETTE;          // dentro de este radio: intacto
const VIG_OUT = parseFloat(process.env.VIG_OUT || '0.98'); // fuera: a negro
const cxN = parseFloat(process.env.VIG_CX || '0.5');
const cyN = parseFloat(process.env.VIG_CY || '0.5');

const ch = info.channels; // normalmente 1 tras grayscale
const lines = [];
for (let y = 0; y < info.height; y++) {
  let line = '';
  for (let x = 0; x < info.width; x++) {
    let lum = data[(y * info.width + x) * ch]; // 0-255
    if (VIGNETTE > 0) {
      const dx = (x / info.width - cxN) / 0.5;
      const dy = (y / info.height - cyN) / 0.5;
      const d = Math.sqrt(dx * dx + dy * dy); // distancia elíptica normalizada
      let f = 1;
      if (d > VIG_IN) f = Math.max(0, 1 - (d - VIG_IN) / (VIG_OUT - VIG_IN));
      lum = lum * f;
    }
    // knockout del fondo claro antes de invertir
    if (KNOCKOUT > 0 && lum >= KNOCKOUT) { line += ' '; continue; }
    if (INVERT) lum = 255 - lum;
    const level = Math.max(0, Math.min(RAMP.length - 1,
      Math.round((lum / 255) * (RAMP.length - 1))));
    line += RAMP[level];
  }
  lines.push(line);
}

const out = { cols: info.width, rows: info.height, ramp: RAMP, lines };
writeFileSync('ascii-face.json', JSON.stringify(out));
console.log(`ascii-face.json generado: ${info.width}x${info.height} (${lines.length} filas) desde "${src}"`);
