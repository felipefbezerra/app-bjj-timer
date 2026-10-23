// Roda depois do `expo export -p web`: escreve o dist/sw.js com a lista de arquivos do build,
// para o app abrir sem internet já depois da primeira visita.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dist = path.join(__dirname, '..', 'dist');
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else files.push('/' + path.relative(dist, full).split(path.sep).join('/'));
  }
})(dist);

const assets = files.filter(f => !/\.(map)$/.test(f) && f !== '/sw.js' && f !== '/metadata.json' && f !== '/index.html');
const hash = crypto.createHash('sha1');
for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(dist, f)));
const version = hash.digest('hex').slice(0, 10);

const template = fs.readFileSync(path.join(__dirname, 'sw.template.js'), 'utf8');
fs.writeFileSync(path.join(dist, 'sw.js'), template.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(assets, null, 1)));
console.log(`sw.js: versão ${version}, ${assets.length} arquivos`);
