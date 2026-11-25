const fs=require('fs'),assert=require('assert'),path=require('path');
const raiz=path.join(__dirname,'..');
const etiqueta='<script src="/assets/analytics-blog.js" defer></script>';
const seo=['bilbao','bizkaia','pais-vasco','software-para-pilates','software-para-yoga','software-para-crossfit','software-para-peluquerias','software-para-centros-de-unas','software-para-centros-de-masajes'];
let n=0;
for(const p of seo){
  const h=fs.readFileSync(path.join(raiz,p+'.html'),'utf8');
  assert(h.includes(etiqueta),p+': sin assets/analytics-blog.js');
  assert(h.indexOf(etiqueta)<h.indexOf('</body>'),p+': etiqueta tras </body>');
  n++;
}
const js=fs.readFileSync(path.join(raiz,'assets/analytics-blog.js'),'utf8');
assert(js.includes('pgfit_seo'),'analytics-blog.js sin pgfit_seo');
assert(js.includes('pgfit_blog'),'analytics-blog.js sin pgfit_blog');
assert(/\/blog\//.test(js),'analytics-blog.js no deriva surface de /blog/');
for(const f of fs.readdirSync(path.join(raiz,'blog')).filter(f=>f.endsWith('.html'))){
  assert(fs.readFileSync(path.join(raiz,'blog',f),'utf8').includes('analytics-blog.js'),'blog/'+f+': perdió la baliza');
}
console.log('seo-baliza OK '+n+'/'+seo.length);
