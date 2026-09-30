const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const ExcelJS = require('exceljs');

const app = express();
app.set('trust proxy', 1);

const WEB_URL = process.env.WEB_URL;
const MODO = process.env.COOKIE_MODE === 'none' ? 'none' : 'lax';
const sesiones = new Set();

if (!WEB_URL) console.warn('Falta WEB_URL: el navegador va a rechazar el CORS con credenciales');

app.use(cors({ origin: WEB_URL, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function idSesion(req) {
  const m = /(?:^|; )sid=([^;]+)/.exec(req.headers.cookie || '');
  return m && m[1];
}

app.post('/login', (req, res) => {
  const { usuario, clave } = req.body || {};
  if (usuario !== 'prueba' || clave !== 'prueba') return res.status(401).json({ ok: false });
  const id = crypto.randomBytes(16).toString('hex');
  sesiones.add(id);
  res.cookie('sid', id, { httpOnly: true, secure: true, sameSite: MODO });
  res.json({ ok: true, modo: MODO });
});

app.get('/yo', (req, res) => {
  res.json({ sesion: sesiones.has(idSesion(req)), modo: MODO });
});

app.get('/descarga.xlsx', async (req, res) => {
  if (!sesiones.has(idSesion(req))) return res.status(401).json({ error: 'sin sesion' });
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Prueba');
  hoja.addRow(['Item', 'Monto']);
  hoja.addRow(['Ingenieria', 1000]);
  hoja.addRow(['Montaje', 2500]);
  const buffer = await libro.xlsx.writeBuffer();
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="prueba.xlsx"',
  });
  res.send(Buffer.from(buffer));
});

function ejecutarBot(entrada) {
  return new Promise((resolve, reject) => {
    const hijo = spawn(process.env.BOT_PYTHON_EXECUTABLE || 'python3', [path.join(__dirname, 'bot.py')]);
    const salida = [];
    const errores = [];
    hijo.stdout.on('data', (d) => salida.push(d));
    hijo.stderr.on('data', (d) => errores.push(d));
    hijo.on('error', reject);
    hijo.on('close', (codigo) => {
      if (codigo !== 0) return reject(new Error(Buffer.concat(errores).toString() || 'codigo ' + codigo));
      try {
        resolve(JSON.parse(Buffer.concat(salida).toString('utf8')));
      } catch (e) {
        reject(e);
      }
    });
    hijo.stdin.end(JSON.stringify(entrada));
  });
}

app.get('/bot/version', async (req, res) => {
  if (!sesiones.has(idSesion(req))) return res.status(401).json({ error: 'sin sesion' });
  try {
    res.json(await ejecutarBot({ operacion: 'version' }));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/bot/descarga.xlsx', async (req, res) => {
  if (!sesiones.has(idSesion(req))) return res.status(401).json({ error: 'sin sesion' });
  try {
    const r = await ejecutarBot({ operacion: 'generar', titulo: 'Prueba Railway' });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="' + r.nombre + '"',
    });
    res.send(Buffer.from(r.xlsx, 'base64'));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(Number(process.env.PORT || 3000), () => console.log('api en modo', MODO));
