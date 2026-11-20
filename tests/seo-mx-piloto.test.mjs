import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(root, f), 'utf8');
const URL_MX = 'https://pgfit.propiedadgo.com/mx/piloto';
const unesc = (s) => s.replace(/&amp;/g, '&');
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const h = read('mx/piloto.html');

test('/mx/piloto: metadatos de México', () => {
  assert.ok(h.includes('<html lang="es-MX"'));
  assert.ok(h.includes('<meta property="og:locale" content="es_MX" />'));
  assert.ok(h.includes(`<link rel="canonical" href="${URL_MX}" />`));
  assert.ok(h.includes(`<link rel="alternate" hreflang="es-MX" href="${URL_MX}" />`));
  assert.ok(h.includes(`<link rel="alternate" hreflang="x-default" href="${URL_MX}" />`));
  assert.ok(!/hreflang="es-ES"/.test(h));
  const title = unesc(h.match(/<title>([\s\S]*?)<\/title>/)[1]);
  assert.ok(title.includes('México') && title.length <= 65, `title: ${title}`);
  const desc = unesc(h.match(/<meta name="description" content="([^"]*)"/)[1]);
  assert.ok(desc.includes('México') && desc.length >= 120 && desc.length <= 170, `desc ${desc.length}`);
  assert.equal((h.match(/<h1[ >]/g) || []).length, 1);
});

test('/mx/piloto: JSON-LD Organization + FAQPage con areaServed MX, sin Product/Offer', () => {
  const blocks = ld(h);
  const org = blocks.find((b) => b['@type'] === 'Organization');
  assert.equal(org.areaServed.identifier, 'MX');
  const faq = blocks.find((b) => b['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, 3);
  assert.equal(faq.about.areaServed.identifier, 'MX');
  assert.ok(!blocks.some((b) => ['Product', 'Offer', 'SoftwareApplication'].includes(b['@type'])));
  assert.ok(!/"offers"/.test(h));
});

test('/mx/piloto: sin promesas no existentes ni palabras vetadas', () => {
  const visible = h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const w of ['Mercado Pago', 'SPEI', 'OXXO', 'SaaS', 'canonical ', '€', 'MXN', 'pesos']) assert.ok(!visible.includes(w), `no contiene ${w}`);
  assert.ok(/estamos preparando/i.test(visible) && visible.includes('CFDI'), 'CFDI sólo como en preparación');
});

test('/mx/piloto: formulario de lista de espera', () => {
  assert.ok(h.includes("survey_type: 'piloto_latam'"));
  assert.ok(h.includes("fetch('/api/public/surveys/submit'"));
  for (const n of ['nombre', 'negocio', 'tipo', 'pais', 'ciudad', 'personas', 'herramienta', 'email', 'whatsapp', 'privacidad']) assert.ok(h.includes(`name="${n}"`), n);
  assert.ok(/<option value="MX" selected>México/.test(h));
  assert.ok(/name="privacidad" required/.test(h));
  assert.ok(h.includes('href="/legal/privacidad"') && h.includes('Aviso de privacidad'));
  assert.ok(h.includes('Únete al piloto') && h.includes('Sin costo de inscripción a la lista'));
  assert.ok(h.includes('utm_source=pgfit&amp;utm_medium=web&amp;utm_campaign=lx_mx'));
  const v = JSON.parse(read('vercel.json'));
  const rw = v.rewrites.find((r) => r.source === '/api/public/surveys/submit');
  assert.equal(rw.destination, 'https://captacion.propiedadgo.com/api/public/surveys/submit');
  assert.ok(v.headers.some((x) => x.headers.some((k) => k.key === 'Content-Security-Policy' && /connect-src 'self'/.test(k.value))));
});

test('/mx/piloto: en sitemap y llms.txt', () => {
  assert.ok(read('sitemap.xml').includes(`<loc>${URL_MX}</loc>`));
  assert.ok(read('llms.txt').includes(`(${URL_MX})`));
});
