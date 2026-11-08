const fs=require('fs'),assert=require('assert'),path=require('path');
const raiz=path.join(__dirname,'..');
const base='https://pgfit.propiedadgo.com/';
const paginas=['blog/index','blog/software-gestion-pilates-bilbao','blog/gestion-peluqueria-estetica-bizkaia','blog/software-gestion-yoga-bilbao','blog/gestion-box-crossfit-bizkaia','blog/gestion-centro-de-unas-bilbao','blog/gestion-centro-de-masajes-bizkaia','blog/software-gestion-gimnasio-bilbao'];
const urls={'blog/index':'blog'};
const sitemap=fs.readFileSync(path.join(raiz,'sitemap.xml'),'utf8');
const prohibidas=/gratis|gratuit|descuento|oferta|garantizad|mejor del mercado/i;
const existe=r=>{r=r.split('#')[0].split('?')[0];if(r==='/'||r==='')return true;const p=r.replace(/^\//,'');return ['.html','/index.html'].some(e=>fs.existsSync(path.join(raiz,p+e)))||fs.existsSync(path.join(raiz,p));};
for(const pg of paginas){
  const h=fs.readFileSync(path.join(raiz,pg+'.html'),'utf8');
  const slug=urls[pg]||pg;
  const bloques=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const tipos=bloques.map(b=>b['@type']);
  assert(tipos.includes('BreadcrumbList'),pg+': falta BreadcrumbList');
  const principal=bloques.find(b=>b['@type']===(pg==='blog/index'?'Blog':'BlogPosting'));
  assert(principal,pg+': falta JSON-LD principal');
  const objs=pg==='blog/index'?[principal,...principal.blogPost]:[principal];
  for(const o of objs){
    assert.strictEqual(o.publisher.name,'propGO Fit&Beauty',pg+': publisher');
    assert(o.publisher.parentOrganization&&o.publisher.sameAs.length>=3,pg+': publisher sin parent/sameAs');
    const nombres=JSON.stringify(o.areaServed);
    assert(/Bilbao/.test(nombres)&&/Bizkaia/.test(nombres),pg+': areaServed');
    if(o['@type']==='BlogPosting'){assert.strictEqual(o.inLanguage,'es-ES');assert.strictEqual(o.datePublished,'2026-11-08');assert.deepStrictEqual(o.author,o.publisher);assert(o.headline);}
  }
  assert(h.includes(`<link rel="canonical" href="${base}${slug}" />`),pg+': canonical');
  assert(h.includes(`<meta property="og:url" content="${base}${slug}" />`),pg+': og:url');
  assert(!prohibidas.test(h),pg+': palabra prohibida '+(h.match(prohibidas)||[])[0]);
  const hrefs=[...h.matchAll(/href="(\/[^"]*)"/g)].map(m=>m[1]);
  for(const r of hrefs)assert(existe(r)||r.startsWith('/legal/')||/\.(svg|png|webmanifest)/.test(r),pg+': enlace roto '+r);
  assert(sitemap.includes(`<loc>${base}${slug}</loc>`),pg+': no está en sitemap.xml');
  if(pg!=='blog/index'){
    const vm={pilates:'/software-para-pilates',yoga:'/software-para-yoga',crossfit:'/software-para-crossfit','de-unas':'/software-para-centros-de-unas','de-masajes':'/software-para-centros-de-masajes',gimnasio:'/'};
    const v=Object.keys(vm).filter(k=>pg.includes(k)).map(k=>vm[k])[0]||'/software-para-peluquerias';
    assert(h.slice(h.indexOf("<main")).includes(`href="${v}"`),pg+': sin enlace a su vertical');
    assert(/href="\/(bizkaia|bilbao)"/.test(h),pg+': sin enlace a zona');
    const palabras=h.replace(/[\s\S]*<main/,'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
    assert(palabras>=650,pg+': pocas palabras '+palabras);
  }
}
// T1 embudo: analítica del blog
console.log('blog/*.html a comprobar (analytics-blog.js): '+paginas.length);
const an=path.join(raiz,'assets/analytics-blog.js');
assert(fs.existsSync(an),'falta assets/analytics-blog.js');
const js=fs.readFileSync(an,'utf8');
for(const t of ['landing_view','cta_click','pgfit_blog','keepalive:true','.catch'])assert(js.includes(t),'analytics-blog.js sin '+t);
let con=0;
for(const pg of paginas){const h=fs.readFileSync(path.join(raiz,pg+'.html'),'utf8');assert(h.includes('<script src="/assets/analytics-blog.js" defer></script>'),pg+': sin assets/analytics-blog.js');con++;}
console.log('analytics-blog.js referenciado: '+con+'/'+paginas.length);
console.log('OK blog');
