// tsc only emits compiled JS - it never copies the binary PDF/PNG templates
// that live alongside the source under src/templates/, so dist/templates/
// would otherwise be missing at runtime. Run as `postbuild` after `tsc`.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'templates');
const dest = path.join(__dirname, '..', 'dist', 'templates');

fs.cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
