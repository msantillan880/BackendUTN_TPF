import db, { initDatabase } from '../db/database.js';
import { Link } from '../models/Link.js';
import { Consulta } from '../db/queries.js';
import observer from '../utils/observer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validarXSS } from '../middleware/xssValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await initDatabase();

/* =========================
   QUERIES HELPERS
========================= */

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      resolve(stmt.all(...params));
    } catch (err) {
      reject(err);
    }
  });
}

function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      resolve(stmt.get(...params) || null);
    } catch (err) {
      reject(err);
    }
  });
}

function queryRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      resolve(stmt.run(...params));
    } catch (err) {
      reject(err);
    }
  });
}

/* =========================
   CONTROLLER
========================= */

export class LinkController {

  static async obtenerTodos() {
    const rows = await queryAll(Consulta.REFRESH);
    return rows || [];
  }

  static async obtenerPorId(id) {
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

    const result = await queryRun(Consulta.INSERT_LINK, newLink.toArray());

    // Notificar con datos completos: Nombre, Comentario, Direccion (separados por comas)
    observer.notificar(`[CREAR] Nombre: ${nomLimpia}, Comentario: ${comLimpia}, Direccion: ${dirLimpia}`);

    return {
      success: true,
      id: result.lastInsertRowid
    };
  }

  static async actualizar(id, categoria, nombre, comentario, direccion) {
    const existe = await this.obtenerPorId(id);
    if (!existe) throw new Error('Link no encontrado');

    const { texto: catLimpia } = validarXSS(categoria.toUpperCase());
    const { texto: nomLimpia } = validarXSS(nombre);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccion);

    await queryRun(Consulta.UPDATE, [
      catLimpia,
      nomLimpia,
      comLimpia,
      dirLimpia,
      id
    ]);

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


    await queryRun(Consulta.DELETE, [id]);

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

    const sql = `SELECT * FROM links WHERE ${condiciones.join(' AND ')} ORDER BY categoria ASC`;
    const rows = await queryAll(sql, params);

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
    const rows = await queryAll(Consulta.ORDER_HTML);
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