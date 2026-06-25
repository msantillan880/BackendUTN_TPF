import db, { initDatabase } from '../db/database.js';
import { Link } from '../models/Link.js';
import { Consulta } from '../db/queries.js';
import observer from '../utils/observer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validarXSS } from '../middleware/xssValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_MODE = ['1', 'true', 'yes'].includes(String(process.env.DEMO_MODE || '').toLowerCase());

const mockLinks = [
  {
    link_id: 1,
    categoria: 'ASTRONOMIA',
    nombre: 'NASA',
    comentario: 'Novedades del espacio',
    direccion: 'https://www.nasa.gov',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  {
    link_id: 2,
    categoria: 'CIBERSEGURIDAD',
    nombre: 'OWASP',
    comentario: 'Buenas practicas de seguridad',
    direccion: 'https://owasp.org',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  {
    link_id: 3,
    categoria: 'NODE.JS',
    nombre: 'Node.js Docs',
    comentario: 'Documentacion oficial',
    direccion: 'https://nodejs.org/en/docs',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
];

let nextMockId = mockLinks.length + 1;
let dbAvailable = false;

if (!DEMO_MODE) {
  try {
    await initDatabase();
    dbAvailable = true;
  } catch (err) {
    console.warn('⚠️ MySQL no disponible, se usara almacenamiento en memoria para demo:', err && err.message);
  }
} else {
  console.log('ℹ️ DEMO_MODE activo: usando almacenamiento en memoria (sin MySQL).');
}

const useMockStore = () => DEMO_MODE || !dbAvailable;

function getMockById(id) {
  const parsed = Number(id);
  return mockLinks.find((item) => Number(item.link_id) === parsed) || null;
}

/* =========================
   QUERIES HELPERS
========================= */

function queryAll(sql, params = []) {
  return db.execute(sql, params).then(([rows]) => rows);
}

function queryOne(sql, params = []) {
  return db.execute(sql, params).then(([rows]) => (rows && rows[0]) || null);
}

function queryRun(sql, params = []) {
  return db.execute(sql, params).then(([result]) => result);
}

/* =========================
   CONTROLLER
========================= */

export class LinkController {

  static async obtenerTodos() {
    if (useMockStore()) {
      return [...mockLinks].sort((a, b) => String(b.categoria).localeCompare(String(a.categoria)));
    }

    const rows = await queryAll(Consulta.REFRESH);
    return rows || [];
  }

  static async obtenerPorId(id) {
    if (useMockStore()) {
      return getMockById(id);
    }

    return await queryOne(Consulta.FIND_BY_ID, [id]);
  }

  static async crear(categoria, nombre, comentario, direccion) {
    if (!categoria || !nombre || !direccion) {
      throw new Error('Campos obligatorios incompletos');
    }

    const { texto: catLimpia } = validarXSS(categoria.toUpperCase());
    const { texto: nomLimpia } = validarXSS(nombre);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccion);

    const newLink = new Link(catLimpia, nomLimpia, comLimpia, dirLimpia);

    if (useMockStore()) {
      const item = {
        link_id: nextMockId++,
        categoria: newLink.categoria,
        nombre: newLink.nombre,
        comentario: newLink.comentario,
        direccion: newLink.direccion,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      mockLinks.push(item);

      observer.notificar(`[CREAR] Nombre: ${nomLimpia}, Comentario: ${comLimpia}, Direccion: ${dirLimpia}`);

      return {
        success: true,
        id: item.link_id
      };
    }

    const result = await queryRun(Consulta.INSERT_LINK, newLink.toArray());

    // Notificar con datos completos: Nombre, Comentario, Direccion (separados por comas)
    observer.notificar(`[CREAR] Nombre: ${nomLimpia}, Comentario: ${comLimpia}, Direccion: ${dirLimpia}`);

    return {
      success: true,
      id: result.insertId || null
    };
  }

  static async actualizar(id, categoria, nombre, comentario, direccion) {
    const existe = await this.obtenerPorId(id);
    if (!existe) throw new Error('Link no encontrado');

    const { texto: catLimpia } = validarXSS(categoria.toUpperCase());
    const { texto: nomLimpia } = validarXSS(nombre);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccion);

    if (useMockStore()) {
      const item = getMockById(id);
      if (!item) throw new Error('Link no encontrado');

      item.categoria = catLimpia;
      item.nombre = nomLimpia;
      item.comentario = comLimpia;
      item.direccion = dirLimpia;
    } else {
      await queryRun(Consulta.UPDATE, [
        catLimpia,
        nomLimpia,
        comLimpia,
        dirLimpia,
        id
      ]);
    }

    // Incluir valores antes y despues de la modificación
    try {
      const antes = existe || {};
      const antesStr = `Nombre: ${antes.nombre || ''}, Comentario: ${antes.comentario || ''}, Direccion: ${antes.direccion || ''}`;
      const despuesStr = `Nombre: ${nomLimpia}, Comentario: ${comLimpia}, Direccion: ${dirLimpia}`;
      observer.notificar(`[MODIFICAR] ID: ${id}, ANTES: ${antesStr}, DESPUES: ${despuesStr}`);
    } catch (err) {
      // Si algo falla, mantener el comportamiento anterior
      observer.notificar(`[MODIFICAR] ${nomLimpia}`);
    }

    return { success: true };
  }

  static async eliminar(id) {
    const existe = await this.obtenerPorId(id);
    if (!existe) throw new Error('Link no encontrado');

    if (useMockStore()) {
      const parsed = Number(id);
      const index = mockLinks.findIndex((item) => Number(item.link_id) === parsed);
      if (index >= 0) {
        mockLinks.splice(index, 1);
      }
    } else {
      await queryRun(Consulta.DELETE, [id]);
    }

    // Incluir datos del registro borrado
    try {
      const antes = existe || {};
      observer.notificar(`[BORRAR] ID: ${id}, Nombre: ${antes.nombre || ''}, Comentario: ${antes.comentario || ''}, Direccion: ${antes.direccion || ''}`);
    } catch (err) {
      observer.notificar(`[BORRAR] ${id}`);
    }

    return { success: true };
  }

  static async buscar(categoria = '', nombre = '', comentario = '', direccion = '') {
    // Normalizar entradas
    categoria = String(categoria || '').trim();
    nombre = String(nombre || '').trim();
    comentario = String(comentario || '').trim();
    direccion = String(direccion || '').trim();

    const like = (t) => `%${t}%`;

    // Si no hay filtros, devolver error informativo (400)
    if (!categoria && !nombre && !comentario && !direccion) {
      const err = new Error('Complete al menos un campo para buscar');
      err.status = 400;
      throw err;
    }

    // Construir consulta dinámica incluyendo sólo las columnas con filtro
    const condiciones = [];
    const params = [];
    if (categoria) {
      condiciones.push('categoria LIKE ?');
      params.push(like(categoria));
    }
    if (nombre) {
      condiciones.push('nombre LIKE ?');
      params.push(like(nombre));
    }
    if (comentario) {
      condiciones.push('comentario LIKE ?');
      params.push(like(comentario));
    }
    if (direccion) {
      condiciones.push('direccion LIKE ?');
      params.push(like(direccion));
    }

    let rows = [];
    if (useMockStore()) {
      rows = mockLinks.filter((item) => {
        const byCategoria = !categoria || String(item.categoria || '').toLowerCase().includes(categoria.toLowerCase());
        const byNombre = !nombre || String(item.nombre || '').toLowerCase().includes(nombre.toLowerCase());
        const byComentario = !comentario || String(item.comentario || '').toLowerCase().includes(comentario.toLowerCase());
        const byDireccion = !direccion || String(item.direccion || '').toLowerCase().includes(direccion.toLowerCase());
        return byCategoria && byNombre && byComentario && byDireccion;
      }).sort((a, b) => String(a.categoria).localeCompare(String(b.categoria)));
    } else {
      const sql = `SELECT * FROM links WHERE ${condiciones.join(' AND ')} ORDER BY categoria ASC`;
      rows = await queryAll(sql, params);
    }

    // Registrar en observer el criterio de búsqueda (sin exponer datos sensibles)
    try {
      const criterios = [];
      if (categoria) criterios.push(`categoria:${categoria}`);
      if (nombre) criterios.push(`nombre:${nombre}`);
      if (comentario) criterios.push(`comentario:${comentario}`);
      if (direccion) criterios.push(`direccion:${direccion}`);
      observer.notificar(`[BUSCAR] ${criterios.join('|')}`);
    } catch (err) {
      console.error('Error notificando observador en buscar:', err);
    }

    return rows;
  }

  /* =========================
     HTML GENERATOR (FIXED)
  ========================= */

  static async generarHTML() {
    const rows = useMockStore()
      ? [...mockLinks].sort((a, b) => String(a.categoria).localeCompare(String(b.categoria)))
      : await queryAll(Consulta.ORDER_HTML);
    // Intentar incrustar la imagen de fondo como data URI desde public/images/imagenX.jpg
    let bgImage = "imagenX.jpg"; // fallback (relative)
    try {
      const imgPath = path.join(__dirname, '..', '..', 'public', 'images', 'imagenX.jpg');
      if (fs.existsSync(imgPath)) {
        const ext = path.extname(imgPath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/svg' ? 'image/svg+xml' : 'image/jpeg';
        const data = fs.readFileSync(imgPath).toString('base64');
        bgImage = `data:${mime};base64,${data}`;
      }
    } catch (err) {
      console.warn('No se pudo leer imagen de fondo para incrustar:', err && err.message);
    }
    // Generar HTML más presentable con estilos embebidos
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bookmarks</title>
  <style>
    /* Background image (incrustada si existe en public/images) */
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background-image: url('${bgImage}'); background-size: cover; background-position: center; background-attachment: fixed; font-size: 18px; }
    .container { max-width: 1200px; margin: 0 auto; background: rgba(255,255,255,0.95); padding: 24px; border-radius: 8px; box-shadow: 0 0 14px rgba(0,0,0,0.08); }
    h2 { text-align: center; color: #222; margin: 0 0 16px 0; font-size: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 16px; }
    th, td { padding: 12px 14px; border: 1px solid #ddd; text-align: left; vertical-align: top; }
    th { background: #0033cc; color: #fff; font-weight: 700; }
    tr:nth-child(even) td { background: #f9f9f9; }
    a { color: #0033cc; text-decoration: none; word-break: break-word; }
    a:hover { text-decoration: underline; }
    .small { font-size: 0.95em; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bookmarks</h2>
    <table>
      <colgroup>
        <col style="width:10%">
        <col style="width:20%">
        <col style="width:40%">
        <col style="width:30%">
      </colgroup>
      <thead>
        <tr>
          <th>Carpeta</th>
          <th>Nombre</th>
          <th>Comentario</th>
          <th>Dirección</th>
        </tr>
      </thead>
      <tbody>`;

    for (const r of rows) {
      html += `
        <tr>
          <td class="small">${r.categoria || ''}</td>
          <td>${r.nombre || ''}</td>
          <td>${r.comentario || ''}</td>
          <td><a href="${r.direccion || '#'}" target="_blank" rel="noopener noreferrer">${r.direccion || ''}</a></td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>
</body>
</html>`;

    return html;
  }
}