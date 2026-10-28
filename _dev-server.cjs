// Servidor estático mínimo solo para probar la PWA en un navegador de verdad durante el desarrollo.
// No forma parte de la app ni se publica en GitHub Pages.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5173;
const TYPES = {'.html': 'text/html', '.js': 'application/javascript', '.json': 'application/manifest+json',
  '.png': 'image/png', '.css': 'text/css'};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(PORT, () => console.log('Dev server en http://localhost:' + PORT));
