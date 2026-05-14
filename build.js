const fs = require('fs');
const path = require('path');

const root = __dirname;
const src = path.join(root, 'dev');
const out = path.join(root, 'app');

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(out);
fs.mkdirSync(out, { recursive: true });

copyDir(path.join(src, 'lib'), path.join(out, 'lib'));
copyDir(path.join(src, 'js'), path.join(out, 'js'));
copyDir(path.join(src, 'css'), path.join(out, 'css'));
copyDir(path.join(src, 'views'), path.join(out));

console.log('Built app/');
