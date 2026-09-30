const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || '';
const html = fs
  .readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .replace('__API_URL__', API_URL);

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  })
  .listen(Number(process.env.PORT || 3000));
