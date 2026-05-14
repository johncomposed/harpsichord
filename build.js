const fs = require('fs');
const path = require('path');
const os = require('os');
const harp = require('harp');

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

function movePath(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  rmrf(to);
  fs.renameSync(from, to);
}

rmrf(out);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harpsichord-build-'));

harp.compile(src, tmp, (errors) => {
  if (errors) {
    console.error('Build failed:', errors);
    rmrf(tmp);
    process.exit(1);
  }

  // Match the layout the original Grunt build produced.
  fs.mkdirSync(out, { recursive: true });

  // Compiled views: dev/views/index.jade -> app/index.html
  movePath(path.join(tmp, 'views', 'index.html'), path.join(out, 'index.html'));

  // Compiled stylus: dev/styl/app.styl -> app/css/app.css
  movePath(path.join(tmp, 'styl', 'app.css'), path.join(out, 'css', 'app.css'));

  // JS passes through
  movePath(path.join(tmp, 'js'), path.join(out, 'js'));

  // For lib/, copy the source dev/lib/ as-is so jade starter templates remain
  // as runtime templates for harp to serve.
  copyDir(path.join(src, 'lib'), path.join(out, 'lib'));

  rmrf(tmp);
  console.log('Built app/');
});
