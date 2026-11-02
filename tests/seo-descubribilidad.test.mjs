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
    assert.equal(sa.areaServed.name, 'España');
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
