import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUGS = ['peluquerias','pilates','yoga','crossfit','centros-de-unas','centros-de-masajes'].map(s => `/software-para-${s}`);
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');

for (const f of ['llms.txt', 'llms-full.txt']) {
  test(`${f} existe y cumple`, () => {
    assert(fs.existsSync(path.join(raiz, f)), `falta ${f}`);
    const t = leer(f);
    assert(/^# propGO Fit&Beauty/.test(t), 'H1');
    assert(/^> /m.test(t), 'blockquote');
    assert(t.includes('España') && t.includes('Bizkaia'));
    assert(!/saas/i.test(t), 'prohibido SaaS');
    for (const s of SLUGS) assert(t.includes(`https://pgfit.propiedadgo.com${s})`) || t.includes(`https://pgfit.propiedadgo.com${s} `) || t.includes(`https://pgfit.propiedadgo.com${s}\n`), `falta ${s}`);
    const enlaces = [...t.matchAll(/\]\((https:\/\/pgfit\.propiedadgo\.com)(\/[^)\s]*)\)/g)].map(m => m[2]);
    for (const e of enlaces) assert(e === '/' || SLUGS.includes(e), `enlace fuera de la lista: ${e}`);
  });
}
test('llms-full nombra competidores de M-0', () => {
  const t = leer('llms-full.txt');
  for (const c of ['Booksy','AgendaPro','CitaClic','Virtuagym','Mindbody','Kydemy','CrossHero','WodBuster','Resawod','Bewe']) assert(t.includes(c), c);
});
test('robots.txt no bloquea /llms.txt', () => {
  const r = leer('robots.txt');
  assert(!/Disallow:\s*(\/|\/llms)/.test(r));
  assert(/Allow:\s*\//.test(r));
});
test('vercel.json sirve llms como text/plain', () => {
  const v = JSON.parse(leer('vercel.json'));
  const h = v.headers.find(x => x.source === '/(llms\\.txt|llms-full\\.txt)');
  assert(h && h.headers.some(k => k.key === 'Content-Type' && /^text\/plain/.test(k.value)));
});
