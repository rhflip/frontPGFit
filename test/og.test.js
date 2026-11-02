const fs=require('fs'),assert=require('assert'),path=require('path');
const raiz=path.join(__dirname,'..');
const h=fs.readFileSync(path.join(raiz,'index.html'),'utf8');
assert(fs.existsSync(path.join(raiz,'og-fit-beauty.png')),'falta og-fit-beauty.png');
assert(/<meta property="og:image" content="https:\/\/pgfit\.propiedadgo\.com\/og-fit-beauty\.png"/.test(h),'og:image no referencia og-fit-beauty.png');
assert.strictEqual((h.match(/property="og:image"/g)||[]).length,1);
console.log('OK');
