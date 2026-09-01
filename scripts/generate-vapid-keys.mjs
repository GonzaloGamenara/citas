/**
 * Genera un par de claves VAPID para las notificaciones push.
 *
 * La pública va a .env como VITE_VAPID_PUBLIC_KEY (viaja al navegador, es
 * pública a propósito). La privada va como secret en Supabase y NO se
 * versiona: por eso el archivo de salida termina en .local, que está en el
 * .gitignore.
 *
 * Uso: node scripts/generate-vapid-keys.mjs
 */
import { generateKeyPairSync } from 'crypto';
import fs from 'fs';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ format: 'jwk' });
const priv = privateKey.export({ format: 'jwk' });

const toBuf = (b64url) => Buffer.from(b64url, 'base64url');
// Punto sin comprimir: 0x04 + X (32 bytes) + Y (32 bytes) = 65 bytes.
const rawPublic = Buffer.concat([Buffer.from([4]), toBuf(pub.x), toBuf(pub.y)]);

const publicB64 = rawPublic.toString('base64url');
const privateB64 = priv.d;

fs.writeFileSync('vapid-keys.local', `VAPID_PUBLIC_KEY=${publicB64}\nVAPID_PRIVATE_KEY=${privateB64}\n`);

console.log('Clave pública (va a .env como VITE_VAPID_PUBLIC_KEY):');
console.log(publicB64);
console.log('\nEl par completo quedó en vapid-keys.local (ignorado por git).');
console.log('Cargá la privada en Supabase y después borrá ese archivo.');
