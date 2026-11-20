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
  assert.ok(h.includes('wa || null') && !h.includes('+0 000000000'), 'teléfono vacío = null');
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

const MX_POSTS = ['mx-como-facturar-cfdi-salon-de-belleza', 'mx-datos-cfdi-servicios-de-belleza', 'mx-reservas-cupos-lista-de-espera-estudio'];
for (const slug of MX_POSTS) {
  test(`blog ${slug}`, () => {
    const p = read(`blog/${slug}.html`);
    const url = `https://pgfit.propiedadgo.com/blog/${slug}`;
    assert.ok(p.includes('<html lang="es-MX"') && p.includes('content="es_MX"'));
    assert.ok(p.includes(`<link rel="alternate" hreflang="es-MX" href="${url}" />`));
    assert.ok(p.includes(`<link rel="canonical" href="${url}" />`));
    assert.equal((p.match(/<h1[ >]/g) || []).length, 1);
    const blocks = ld(p);
    assert.ok(blocks.find((b) => b['@type'] === 'BlogPosting'));
    assert.equal(blocks.find((b) => b['@type'] === 'FAQPage').mainEntity.length, 3);
    assert.ok(p.includes('href="/mx/piloto?utm_source=pgfit&amp;utm_medium=web&amp;utm_campaign=lx_mx"'));
    const body = p.match(/<main[\s\S]*<\/main>/)[0].replace(/<[^>]+>/g, ' ');
    const palabras = body.split(/\s+/).filter(Boolean).length;
    assert.ok(palabras >= 650 && palabras <= 1100, `palabras ${palabras}`);
    for (const w of ['Mercado Pago', 'SPEI', 'OXXO', 'SaaS', '€', 'MXN', 'pesos']) assert.ok(!body.includes(w), w);
    if (/CFDI/.test(body)) assert.ok(/estamos preparando/i.test(body) && /no es una función disponible|todavía/i.test(body), 'CFDI sólo como en preparación');
    assert.ok(read('sitemap.xml').includes(`<loc>${url}</loc>`));
    assert.ok(read('llms.txt').includes(`(${url})`));
    assert.ok(h.includes(`href="/blog/${slug}"`), 'enlazado desde /mx/piloto');
  });
}
