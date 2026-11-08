/* Analítica del blog (PEND-EMBUDO-BLOG-A-ALTA T1): landing_view, cta_click al alta y PostHog. Sin PII. */
(function () {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  var EP = 'https://poster-backend-tktarhnw3q-ew.a.run.app/v1/events';
  var parts = window.location.pathname.replace(/\/+$/, '').split('/');
  var slug = parts[parts.length - 1] || 'blog';
  function send(name, meta) {
    try {
      fetch(EP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: name, brand: 'pgfit', product: 'pgfit', metadata: meta, page_url: window.location.href, referrer: document.referrer }),
        keepalive:true,
        credentials: 'include',
      }).catch(function () { /* fire-and-forget */ });
    } catch (e) { /* silent */ }
  }
  send('landing_view', { surface: 'pgfit_blog', slug: slug });
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="contable.propiedadgo.com/register"]') : null;
    if (!a) return;
    var medium = '';
    try { medium = new URL(a.getAttribute('href'), window.location.href).searchParams.get('utm_medium') || ''; } catch (e) { /* silent */ }
    send('cta_click', { surface: 'pgfit_blog', medium: medium });
  });
  try {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://eu-assets.i.posthog.com/static/array.js';
    s.onload = function () {
      posthog.init('phc_pBvkgMyN6BKmdqFJfqKfMsaSJqyEZ4aeFF3fAaMLbns8', { api_host: 'https://eu.i.posthog.com', persistence: 'memory', disable_session_recording: false, autocapture: true, capture_pageview: true, brand: 'fit-beauty',
        loaded: function (ph) { ph.register({ brand: 'fit-beauty' }); } });
    };
    document.head.appendChild(s);
  } catch (e) { /* silent */ }
})();
