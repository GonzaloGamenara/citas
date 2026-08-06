/**
 * Verificador de enlaces del catálogo de planes.
 *
 *   npm run check:links
 *
 * Marca como ROTO un plan cuando:
 *  - el link no responde HTTP 200,
 *  - redirige a /gcaba_historico/ (archivo muerto del portal del GCBA),
 *  - apunta a instagram.com (devuelve 200 aunque la cuenta no exista, así que
 *    no se puede verificar y no sirve como fuente),
 *  - le falta `mapsQuery`, que es la red de seguridad de cada plan.
 *
 * Sale con código 1 si encuentra algún problema, para poder usarlo en CI.
 */
import { CABA_PLANS } from '../src/data/cabaPlans.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const TIMEOUT_MS = 20000;

async function check(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }
    });
    return { status: res.status, finalUrl: res.url };
  } catch (err) {
    return { status: 0, finalUrl: url, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

const problems = [];

// mapsQuery es obligatorio en todos los planes
for (const plan of CABA_PLANS) {
  if (!plan.mapsQuery || !plan.mapsQuery.trim()) {
    problems.push(`${plan.id}: falta mapsQuery`);
  }
  if (plan.link && plan.link.includes('instagram.com')) {
    problems.push(`${plan.id}: usa Instagram como fuente (no verificable)`);
  }
}

const conLink = CABA_PLANS.filter((p) => p.link);
console.log(`Verificando ${conLink.length} enlaces de ${CABA_PLANS.length} planes…\n`);

const results = await Promise.all(
  conLink.map(async (plan) => ({ plan, ...(await check(plan.link)) }))
);

for (const { plan, status, finalUrl, error } of results) {
  const archivado = finalUrl.includes('gcaba_historico');
  const ok = status === 200 && !archivado;

  if (ok) {
    console.log(`✅ ${status}  ${plan.id}`);
  } else {
    const motivo = error ? error : archivado ? 'redirige al archivo histórico del GCBA' : `HTTP ${status}`;
    console.log(`❌ ${status}  ${plan.id}  →  ${plan.link}  (${motivo})`);
    problems.push(`${plan.id}: ${motivo}`);
  }
}

console.log('\n' + '-'.repeat(50));
if (problems.length === 0) {
  console.log(`Todo en orden: ${conLink.length} enlaces vivos, ${CABA_PLANS.length} planes con mapsQuery.`);
  process.exit(0);
} else {
  console.log(`${problems.length} problema(s):`);
  problems.forEach((p) => console.log(`  · ${p}`));
  process.exit(1);
}
