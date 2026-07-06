/**
 * pgfit-sw-cleanup.js — SW self-destruct para pgfit.propiedadgo.com
 *
 * PROBLEMA histórico: pgfit.propiedadgo.com sirvió temporalmente el React SPA
 * shell de captación (before pgfit.html rewrite). Users que visitaron entonces
 * tienen un SW registered en pgfit.propiedadgo.com origin que cachea el shell
 * de captación y lo sirve on next visits, aunque Vercel sirva pgfit.html.
 *
 * SOLUCIÓN permanente: este SW toma el reemplazo del old SW (via update),
 * unregister self + clear all caches + navigate clients al pgfit.html real.
 * Efecto: users cached se limpian automáticamente en 24h max (SW update poll)
 * o al primer refresh.
 *
 * Servido vía Vercel rewrite host-based en pgfit.propiedadgo.com/sw.js
 * (ver frontPropiedadGO/vercel.json).
 *
 * NO tiene fetch handler intencionadamente — al no interceptar, los fetches
 * post-activate van directo al server (que sirve el pgfit.html correcto).
 */

self.addEventListener('install', (event) => {
  // Skip waiting: toma control inmediatamente sin esperar a que se cierren
  // las tabs abiertas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // 1. Borra TODAS las caches previas (incluye workbox precache de captación)
      if (self.caches && caches.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) { /* noop */ }

    try {
      // 2. Toma control de todos los clients (tabs abiertas)
      await self.clients.claim();
      // 3. Fuerza reload de cada client — proxima navegación es real fetch
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) => {
        try { c.navigate(c.url); } catch (e) { /* noop */ }
      });
    } catch (e) { /* noop */ }

    try {
      // 4. Unregister este SW — no queremos que persista tras el cleanup
      await self.registration.unregister();
    } catch (e) { /* noop */ }
  })());
});

// Sin fetch handler: todos los fetches post-activate van al server directo.
