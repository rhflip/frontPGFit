import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(root, f), 'utf8');
const BASE = 'https://pgfit.propiedadgo.com';
const VERTICALES = [
  { slug: 'software-para-peluquerias', term: 'peluquer' },
  { slug: 'software-para-pilates', term: 'pilates' },
  { slug: 'software-para-yoga', term: 'yoga' },
  { slug: 'software-para-crossfit', term: 'crossfit' },
  { slug: 'software-para-centros-de-unas', term: 'uñas' },
  { slug: 'software-para-centros-de-masajes', term: 'masajes' },
];
const unesc = (s) => s.replace(/&amp;/g, '&');
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

for (const { slug, term } of VERTICALES) {
  test(`página ${slug}`, () => {
    const f = `${slug}.html`;
    assert.ok(existsSync(path.join(root, f)), `existe ${f}`);
    const h = read(f);
    const title = unesc(h.match(/<title>([\s\S]*?)<\/title>/)[1]);
    assert.ok(title.toLowerCase().includes(term), `title contiene ${term}: ${title}`);
    assert.ok(/software|programa/i.test(title), 'title con software/programa');
    assert.ok(title.length <= 60, `title ≤60 (${title.length})`);
    const desc = unesc(h.match(/<meta name="description" content="([^"]*)"/)[1]);
    assert.ok(desc.length >= 120 && desc.length <= 160, `description 120-160 (${desc.length})`);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, 'un solo H1');
    assert.ok(h.toLowerCase().match(/<h1[\s\S]*?<\/h1>/)[0].includes(term), 'H1 con la vertical');
    assert.ok(h.includes(`<link rel="canonical" href="${BASE}/${slug}" />`), 'canonical propio');
    assert.ok(!/saas/i.test(h), 'sin «SaaS»');
    const blocks = ld(h);
    const sa = blocks.find((b) => b['@type'] === 'SoftwareApplication');
    assert.ok(sa, 'SoftwareApplication');
    assert.ok([].concat(sa.areaServed).some((a) => a.name === 'España'), 'areaServed incluye España');
    assert.ok(Array.isArray(sa.offers) && sa.offers.length === 3, 'offers de la home');
    const faq = blocks.find((b) => b['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, 3, 'FAQ de 3 preguntas');
    assert.ok(blocks.find((b) => b['@type'] === 'BreadcrumbList'), 'BreadcrumbList');
    assert.ok(h.includes('href="/"'), 'enlace a la home');
    for (const o of VERTICALES) if (o.slug !== slug) assert.ok(h.includes(`href="/${o.slug}"`), `enlaza ${o.slug}`);
    assert.ok(h.includes('contable.propiedadgo.com/register?product=gym'), 'CTA al alta de la home');
  });
}

test('sitemap lista las 6 URLs', () => {
  const s = read('sitemap.xml');
  for (const { slug } of VERTICALES) assert.ok(s.includes(`<loc>${BASE}/${slug}</loc>`), slug);
});

test('el pie de la home enlaza las 6 en «Sectores»', () => {
  const foot = read('index.html').match(/<footer>[\s\S]*?<\/footer>/)[0];
  assert.ok(foot.includes('Sectores'));
  for (const { slug } of VERTICALES) assert.ok(foot.includes(`href="/${slug}"`), slug);
});

test('la home conserva sus H1 y H2', () => {
  const h = read('index.html');
  const t = [...h.matchAll(/<h[12][ >][\s\S]*?<\/h[12]>/g)].map((m) => m[0]).join('\n');
  assert.equal(createHash('sha256').update(t).digest('hex'), 'c87b3cc767f7a88027b806d2a94d971246904e60684aa80620dca1796489e2fc');
});

// T-1b · hubs de zona
const ZONAS = [
  { slug: 'bizkaia', area: 'Bizkaia' },
  { slug: 'bilbao', area: 'Bilbao' },
  { slug: 'pais-vasco', area: 'País Vasco' },
];
for (const { slug, area } of ZONAS) {
  test(`hub de zona ${slug}`, () => {
    const f = `${slug}.html`;
    assert.ok(existsSync(path.join(root, f)), `existe ${f}`);
    const h = read(f);
    const title = unesc(h.match(/<title>([\s\S]*?)<\/title>/)[1]);
    assert.ok(title.length <= 60, `title ≤60 (${title.length})`);
    assert.ok(/software/i.test(title) && title.includes(area), 'title con software y zona');
    const desc = unesc(h.match(/<meta name="description" content="([^"]*)"/)[1]);
    assert.ok(desc.length >= 120 && desc.length <= 160, `description 120-160 (${desc.length})`);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, 'un solo H1');
    assert.ok(h.includes(`<link rel="canonical" href="${BASE}/${slug}" />`), 'canonical propio');
    assert.ok(!/saas/i.test(h), 'sin «SaaS»');
    const blocks = ld(h);
    const sa = blocks.find((b) => b['@type'] === 'SoftwareApplication');
    assert.equal(sa.inLanguage, 'es');
    assert.ok(['City', 'AdministrativeArea'].includes(sa.areaServed['@type']), 'areaServed City/AdministrativeArea');
    assert.equal(sa.areaServed.name, area);
    assert.equal(blocks.find((b) => b['@type'] === 'FAQPage').mainEntity.length, 3);
    assert.ok(blocks.find((b) => b['@type'] === 'BreadcrumbList'));
    for (const o of VERTICALES) assert.ok(h.includes(`href="/${o.slug}"`), `enlaza ${o.slug}`);
    assert.ok(s(`<loc>${BASE}/${slug}</loc>`), 'en sitemap');
  });
}
function s(x) { return read('sitemap.xml').includes(x); }

test('los tres hubs tienen texto propio (no solo el nombre cambiado)', () => {
  const txt = ZONAS.map(({ slug }) => read(`${slug}.html`).match(/<h2>([\s\S]*?)<\/h2>\s*<p class="section-intro">([\s\S]*?)<\/p>/)[2]);
  assert.equal(new Set(txt).size, 3);
  const propio = (h) => [h.match(/<p class="subtitle">([\s\S]*?)<\/p>/)[1], h.match(/<p class="section-intro">([\s\S]*?)<\/p>/)[1], ...[...h.matchAll(/<div class="faq-block">([\s\S]*?)<\/div>/g)].map((m) => m[1])].join(' ');
  const cuerpo = ZONAS.map(({ slug }) => propio(read(`${slug}.html`)).replace(/<[^>]+>/g, ' ').split(/\s+/));
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const a = new Set(cuerpo[i]); const comunes = cuerpo[j].filter((w) => a.has(w)).length;
    assert.ok(comunes / cuerpo[j].length < 0.85, `hubs ${i}/${j} demasiado parecidos`);
  }
});

test('las verticales y la home enlazan las zonas', () => {
  for (const f of [...VERTICALES.map((v) => `${v.slug}.html`), 'index.html'])
    for (const { slug } of ZONAS) assert.ok(read(f).includes(`href="/${slug}"`), `${f} → ${slug}`);
});
