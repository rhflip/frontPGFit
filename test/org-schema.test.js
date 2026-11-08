const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..');
// S-SIEMBRA S-2: en todas las páginas el editor es la entidad de SU marca (F&B), con sus tres perfiles en sameAs
// y PropiedadGO sólo como parentOrganization; ninguna URL de PropiedadGO Group en sameAs.
const FB=['https://www.linkedin.com/company/146763916','https://www.facebook.com/1328754620329758','https://www.instagram.com/fit.beauty.pymes/'];
const pages=['index','bilbao','bizkaia','pais-vasco','software-para-centros-de-masajes','software-para-centros-de-unas','software-para-crossfit','software-para-peluquerias','software-para-pilates','software-para-yoga'];
for(const p of pages){
  const h=fs.readFileSync(path.join(root,p+'.html'),'utf8');
  const blocks=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const org=blocks.map(b=>b.publisher).find(o=>o&&o['@type']==='Organization');
  assert(org,p+': Organization en publisher');
  assert.strictEqual(org.name,'propGO Fit&Beauty',p+': editor F&B');
  assert.strictEqual(org.url,'https://pgfit.propiedadgo.com/',p+': url de la marca');
  assert(org.logo&&/^https:\/\/pgfit\.propiedadgo\.com\/[^ ]+$/.test(org.logo),p+': logo absoluto');
  assert(fs.existsSync(path.join(root,new URL(org.logo).pathname)),p+': el fichero del logo existe');
  assert.deepStrictEqual(org.sameAs,FB,p+': sameAs de F&B');
  assert(!/propiedadgo-group|146758394/.test(h),p+': sin perfiles de Group');
  assert.strictEqual(org.parentOrganization&&org.parentOrganization.url,'https://propiedadgo.com/',p+': parentOrganization');
}
console.log('OK');
