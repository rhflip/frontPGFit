import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// H1 fijados con el valor previo al cambio: la regla del 27-10 prohíbe tocar textos visibles.
const PAGES = {
  'software-para-peluquerias': 'Software para peluquerías<br><span class="pgfit-brand-text">Domingos sin Excel.</span>',
  'software-para-pilates': 'Software para centros de pilates<br><span class="pgfit-brand-text">Domingos sin Excel.</span>',
  'software-para-yoga': 'Software para centros de yoga<br><span class="pgfit-brand-text">Domingos sin Excel.</span>',
  'software-para-crossfit': 'Software para boxes de CrossFit<br><span class="pgfit-brand-text">Domingos sin Excel.</span>',
  'software-para-centros-de-unas': 'Software para centros de uñas<br><span class="pgfit-brand-text">Domingos sin Excel.</span>',
  'software-para-centros-de-masajes': 'Software para centros de masajes<br><span class="pgfit-brand-text">Domingos sin Excel.</span>',
};
const unesc = (s) => s.replace(/&amp;/g, '&');
const meta = (h, attr, key) => unesc(h.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))[1]);

for (const [slug, h1] of Object.entries(PAGES)) {
  test(`zona España/Bizkaia/País Vasco en ${slug}`, () => {
    const h = readFileSync(path.join(root, `${slug}.html`), 'utf8');
    const title = unesc(h.match(/<title>([\s\S]*?)<\/title>/)[1]);
    assert.ok(title.length <= 60, `title ≤60 (${title.length})`);
    assert.ok(title.includes('Bizkaia') && !title.includes('España'), `title con zona: ${title}`);
    assert.ok(title.includes('propGO Fit&Beauty'), 'marca');
    const desc = meta(h, 'name', 'description');
    assert.ok(desc.length <= 155, `description ≤155 (${desc.length})`);
    for (const z of ['España', 'Bizkaia', 'País Vasco']) assert.ok(desc.includes(z), `description con ${z}`);
    assert.ok(!/gratis|descuento|oferta|garantizado|mejor del mercado/i.test(title + desc), 'voz');
    assert.equal(meta(h, 'property', 'og:title'), title);
    assert.equal(meta(h, 'name', 'twitter:title'), title);
    assert.equal(meta(h, 'property', 'og:description'), desc);
    assert.equal(meta(h, 'name', 'twitter:description'), desc);
    const sa = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1])).find((b) => b['@type'] === 'SoftwareApplication');
    const areas = [].concat(sa.areaServed);
    assert.ok(areas.some((a) => a['@type'] === 'Country' && a.name === 'España'), 'España conservada');
    for (const n of ['Bizkaia', 'País Vasco']) assert.ok(areas.some((a) => a['@type'] === 'AdministrativeArea' && a.name === n), `AdministrativeArea ${n}`);
    assert.equal(h.match(/<h1>([\s\S]*?)<\/h1>/)[1], h1, 'H1 intacto');
  });
}
