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
const CONTRAST = 1.35;
const GAMMA = 1.1;

const meta = await sharp(src).metadata();
const rows = Math.max(1, Math.round((meta.height / meta.width) * cols * CHAR_ASPECT));

const { data, info } = await sharp(src)
  .grayscale()
  .linear(CONTRAST, -(128 * (CONTRAST - 1)))  // contraste alrededor del medio
  .gamma(GAMMA)
  .resize(cols, rows, { fit: 'fill' })
  .raw()
  .toBuffer({ resolveWithObject: true });

const ch = info.channels; // normalmente 1 tras grayscale
const lines = [];
for (let y = 0; y < info.height; y++) {
  let line = '';
  for (let x = 0; x < info.width; x++) {
    const lum = data[(y * info.width + x) * ch]; // 0-255
    const level = Math.max(0, Math.min(RAMP.length - 1,
      Math.round((lum / 255) * (RAMP.length - 1))));
    line += RAMP[level];
  }
  lines.push(line);
}

const out = { cols: info.width, rows: info.height, ramp: RAMP, lines };
writeFileSync('ascii-face.json', JSON.stringify(out));
console.log(`ascii-face.json generado: ${info.width}x${info.height} (${lines.length} filas) desde "${src}"`);
