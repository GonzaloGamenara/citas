/**
 * Genera los íconos de la PWA (corazón blanco sobre el degradado rosa de la
 * app) sin depender de ninguna librería de imágenes: arma los PNG a mano
 * (IHDR/IDAT/IEND) usando sólo `zlib`, que ya viene con Node.
 *
 *   node scripts/generate-icons.mjs
 *
 * Genera en public/icons/:
 *   icon-192.png            (manifest, purpose "any")
 *   icon-512.png             (manifest, purpose "any")
 *   icon-512-maskable.png    (manifest, purpose "maskable" — corazón más chico
 *                             y centrado para respetar la "safe zone" que
 *                             recortan Android/iOS al aplicar la máscara)
 *   apple-touch-icon.png     (180×180, ícono al agregar a inicio en iPhone)
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Cada fila lleva un byte de filtro (0 = sin filtro) antes de sus píxeles
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/**
 * true si el punto (coordenadas normalizadas) cae adentro del corazón.
 * Fórmula clásica: (x² + y² - 1)³ - x²y³ ≤ 0 → adentro. Es un polinomio, no
 * una distancia real, así que no sirve para antialiasing por umbral — para
 * eso se usa supersampling en drawIcon() en vez de suavizar este valor.
 */
function insideHeart(nx, ny) {
  const x2 = nx * nx;
  const y2 = ny * ny;
  return Math.pow(x2 + y2 - 1, 3) - x2 * ny * y2 <= 0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * @param size lado del cuadrado en px
 * @param heartScale qué tan grande dibujar el corazón (1 = ocupa casi todo;
 *   usar más chico para maskable, que necesita margen de seguridad)
 */
function drawIcon(size, heartScale) {
  const rgba = Buffer.alloc(size * size * 4);

  // Colores del degradado 135° que usa la app (.btn-disney-primary)
  const c1 = [255, 71, 112]; // #ff4770
  const c2 = [255, 101, 136]; // #ff6588

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Degradado diagonal (135°): mezcla según la proyección sobre la diagonal
      const t = (x / size + y / size) / 2;
      const r = lerp(c1[0], c2[0], t);
      const g = lerp(c1[1], c2[1], t);
      const b = lerp(c1[2], c2[2], t);

      // Corazón blanco centrado: 4 submuestras por píxel (grilla 2×2) para
      // antialiasing por cobertura, en vez de suavizar el polinomio (que no
      // tiene escala de distancia real y da un borde deforme).
      // "unit" chico = corazón grande (los píxeles llegan antes al borde del
      // dominio válido de la fórmula, que es de orden 1 en x e y).
      const unit = size * 0.34 * heartScale;
      let coverage = 0;
      for (const sy of [0.25, 0.75]) {
        for (const sx of [0.25, 0.75]) {
          const nx = (x + sx - size * 0.5) / unit;
          const ny = -(y + sy - size * 0.46) / unit; // shift + flip: punta abajo
          if (insideHeart(nx, ny)) coverage += 0.25;
        }
      }
      const heartAlpha = coverage;

      rgba[idx] = Math.round(lerp(r, 255, heartAlpha));
      rgba[idx + 1] = Math.round(lerp(g, 255, heartAlpha));
      rgba[idx + 2] = Math.round(lerp(b, 255, heartAlpha));
      rgba[idx + 3] = 255; // opaco: iOS ignora transparencia y la pinta negra
    }
  }

  return rgba;
}

function writeIcon(filename, size, heartScale) {
  const rgba = drawIcon(size, heartScale);
  const png = encodePng(size, size, rgba);
  const outPath = path.join(OUT_DIR, filename);
  writeFileSync(outPath, png);
  console.log(`✅ ${filename}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

writeIcon('icon-192.png', 192, 1);
writeIcon('icon-512.png', 512, 1);
writeIcon('icon-512-maskable.png', 512, 0.68); // corazón más chico: safe zone para el recorte de máscara
writeIcon('apple-touch-icon.png', 180, 1);

console.log('\nÍconos listos en public/icons/');
