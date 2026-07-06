# frontPGFit

Landing standalone de **PGFit** — sistema operativo financiero para gimnasios, centros de pilates y academias.

## Deployment

- **Repo**: [rhflip/frontPGFit](https://github.com/rhflip/frontPGFit)
- **Vercel project**: `frontPGFit`
- **Custom domains**:
  - `pgfit.propiedadgo.com` (canonical)
  - `www.pgfit.propiedadgo.com` (308 → canonical)
- **DNS**: Cloudflare (`propiedadgo.com` zone) · orange-cloud en `pgfit.propiedadgo.com`, grey-cloud en `www.pgfit.propiedadgo.com` (SSL Free 2-level limit)

## Estructura

```
├── index.html                    ← Landing única, sirve directo en /
├── favicon.svg                   ← Isotipo casa gradient magenta
├── icon-192x192.png              ← PWA icon
├── icon-512x512.png              ← PWA icon
├── manifest.webmanifest          ← PWA manifest específico PGFit
├── pgfit-studio-wellness.jpg     ← Hero image wellness studio
├── pgfit-studio-wellness.webp    ← Hero image WebP variant
├── sitemap.xml                   ← Sitemap PGFit
├── sw-cleanup.js                 ← SW self-cleanup (ghost pgfit legacy)
└── vercel.json                   ← Redirects + rewrites + security headers
```

## SEO

- Canonical: `https://pgfit.propiedadgo.com/`
- hreflang: es-ES / es / x-default → apex
- Schema.org: SoftwareApplication + FAQPage (5 FAQs)
- Open Graph + Twitter Card
- robots: `index,follow`

## Rationale (separación de `frontPropiedadGO`)

Este repo/proyecto Vercel dedicado permite servir la landing PGFit **directamente en `/`** sin depender de redirects 308 host-based (que exponen `/pgfit.html` en la URL bar). Antes de la separación, `frontPropiedadGO` compartía `dist/index.html` para captación + pgfit, y los rewrites host-based Vercel NO ganan sobre static files → obligado a usar redirects 308.

Beneficios:
- URL bar limpia: `pgfit.propiedadgo.com/` sirve HTML directamente (canonical == URL real)
- SEO óptimo: no redirect chain, mejor CTR + Lighthouse
- Analytics 1-hop (sin double-count 308)
- Aislamiento total: cambios PGFit no afectan captación/admin
- Ahorro build time: PGFit no re-compila con cada cambio de captación

## Versiones internas

Las versiones antiguas `pgfit-v2.html`, `pgfit-v3.html`, `pgfit-v4.html` permanecen en `frontPropiedadGO/public/` con `robots noindex,follow` (archivo interno, evita canibalización SEO). URL formal LIVE = `pgfit.propiedadgo.com/`.
