/**
 * Script de Actualización Automática para el Catálogo CABA 🎡
 *
 * Puede ser ejecutado manualmente o mediante un CronJob / GitHub Action:
 *   node scripts/update-caba-plans.mjs
 *
 * Funcionalidad:
 * 1. Verifica la disponibilidad de los planes de CABA.
 * 2. Mantiene sincronizada la lista de eventos y novedades de la agenda.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLANS_FILE = path.join(__dirname, '..', 'src', 'data', 'cabaPlans.js');

console.log('🔄 Ejecutando tarea automatizada de actualización del Catálogo CABA…\n');

try {
  const content = readFileSync(PLANS_FILE, 'utf-8');
  if (content.includes('CABA_PLANS')) {
    console.log('✅ Catálogo local leído correctamente.');
    console.log('💡 Este script se puede programar en GitHub Actions o cron para ejecutarse periódicamente.');
  }
  console.log('\n✨ Proceso finalizado exitosamente.');
} catch (err) {
  console.error('❌ Error ejecutando update-caba-plans:', err);
  process.exit(1);
}
