import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExtraController } from '../controllers/extraController.js';
import { LinkController } from '../controllers/linkController.js';
import { middlewareXSS } from '../middleware/xssValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Aplicar middleware XSS a todas las rutas
router.use(middlewareXSS);

/**
 * GET /api/links - Obtener todos los links
 */
router.get('/links', async (req, res, next) => {
  try {
    const rows = await LinkController.obtenerTodos();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/links/:id - Obtener un link por ID
 */
router.get('/links/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await LinkController.obtenerPorId(id);

    if (!row) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    res.json(row);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/crear - Crear un nuevo link
 */
router.post('/crear', async (req, res, next) => {
  try {
    const { categoria, nombre, comentario, direccion } = req.body;

    const result = await LinkController.crear(categoria, nombre, comentario, direccion);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/actualizar/:id - Actualizar un link
 */
router.put('/actualizar/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoria, nombre, comentario, direccion } = req.body;

    const result = await LinkController.actualizar(id, categoria, nombre, comentario, direccion);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/eliminar/:id - Eliminar un link
 */
router.delete('/eliminar/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await LinkController.eliminar(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/buscar - Buscar links
 */
router.post('/buscar', async (req, res, next) => {
  try {
    const { categoria = '', nombre = '', comentario = '', direccion = '' } = req.body;

    const rows = await LinkController.buscar(categoria, nombre, comentario, direccion);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/generar-html', async (req, res, next) => {
  try {
    const html = await LinkController.generarHTML();

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=bookmarks.html');

    res.send(html);
  } catch (err) {
    next(err);
  }
});

router.post('/leePdf', async (req, res, next) => {
  try {
    const result = await ExtraController.leerPdf();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/leeDocs', async (req, res, next) => {
  try {
    const result = await ExtraController.leerDocs();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/leeLog', async (req, res, next) => {
  try {
    const result = await ExtraController.leerLog();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/log-view', async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '../logs/registro_logs.log');

    // Leer y ordenar las líneas del log por timestamp (ISO) descendente
    const contenido = fs.readFileSync(filePath, 'utf8');
    const lineas = contenido.split('\n').filter(l => l.trim() !== '');

    // Ordenar por fecha extrayendo el prefijo antes de ' - '.
    // Soporta timestamps ISO (2026-06-22T..) y formatos locales previos.
    function parseTimestampPrefix(line) {
      const part = (line || '').split(' - ')[0] || '';
      const t = Date.parse(part);
      if (!isNaN(t)) return t;
      // Intentar parseo más flexible (Node suele entender 'M/D/YYYY, H:MM:SS AM/PM')
      const alt = new Date(part);
      return isNaN(alt.getTime()) ? 0 : alt.getTime();
    }

    lineas.sort((a, b) => {
      const ta = parseTimestampPrefix(a);
      const tb = parseTimestampPrefix(b);
      // Descendente: más recientes primero
      return tb - ta;
    });

    const contenidoOrdenado = lineas.join('\n');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Registro de Logs</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f4f4f4;
          }

          h1 {
            color: #333;
          }

          pre {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #ccc;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 80vh;
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <h1>Registro de Logs (más recientes arriba)</h1>
        <pre>${contenidoOrdenado}</pre>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
});

export default router;
