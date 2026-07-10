import db, { initDatabase } from '../db/database.js';
import { Link } from '../models/Link.js';
import { Consulta } from '../db/queries.js';
import observer from '../utils/observer.js';
import { validarXSS } from '../middleware/xssValidation.js';
import ServerError from '../Helpers/serverError.helper.js';
import apiResponse from '../Helpers/apiResponse.helper.js';
import espacioService from '../services/espacioService.js';

const DEMO_MODE = ['1', 'true', 'yes'].includes(String(process.env.DEMO_MODE || '').toLowerCase());

const mockLinks = [
  {
    link_id: 1,
    idEspacio: 1,
    espacio: 'ASTRONOMIA',
    nombre: 'NASA',
    comentario: 'Novedades del espacio',
    direccion: 'https://www.nasa.gov',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  {
    link_id: 2,
    idEspacio: 3,
    espacio: 'CIBERSEGURIDAD',
    nombre: 'OWASP',
    comentario: 'Buenas practicas de seguridad',
    direccion: 'https://owasp.org',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  {
    link_id: 3,
    idEspacio: 4,
    espacio: 'NODE.JS',
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

function shapeLinkRow(row) {
  if (!row) return null;

  const espacioNombre = String(row.espacio || row.espacioNombre || '').trim();

  return {
    link_id: Number(row.link_id),
    idEspacio: Number(row.idEspacio),
    espacio: espacioNombre,
    // Compatibilidad temporal con frontend antiguo.
    categoria: espacioNombre,
    nombre: row.nombre,
    comentario: row.comentario,
    direccion: row.direccion,
    created_at: row.created_at
  };
}

function like(text) {
  return `%${String(text || '').trim()}%`;
}

function ensurePositiveInteger(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ServerError(`${fieldName} invalido`, 400);
  }
  return n;
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

class LinkController {

  async listarLinks(request, response) {
    const idUsuario = request.user.idUsuario;
    const {
      idEspacio = '',
      categoria = '',
      nombre = '',
      comentario = '',
      direccion = ''
    } = request.query || {};

    let idEspacioFiltro = String(idEspacio || '').trim();
    const categoriaFiltro = String(categoria || '').trim();

    if (!idEspacioFiltro && categoriaFiltro) {
      const permisos = await espacioService.obtenerPermisosPorCategoria(idUsuario, categoriaFiltro);
      if (!permisos.espacioExiste || !permisos.canRead) {
        throw new ServerError('No tiene permisos para ver links de este espacio', 403);
      }
      idEspacioFiltro = String(permisos.idEspacio);
    }

    const hayFiltros = Boolean(
      idEspacioFiltro ||
      String(nombre || '').trim() ||
      String(comentario || '').trim() ||
      String(direccion || '').trim()
    );

    if (hayFiltros) {
      const rows = await this.buscar(
        idEspacioFiltro,
        nombre,
        comentario,
        direccion,
        idUsuario,
        categoriaFiltro
      );
      return apiResponse.success(response, rows, 'Busqueda realizada con exito');
    }

    const rows = await this.obtenerTodos(idUsuario);
    return apiResponse.success(response, rows, 'Links obtenidos');
  }

  async obtenerLinkPorId(request, response) {
    const row = await this.obtenerPorId(request.params.id, request.user.idUsuario, 'read');

    if (!row) {
      throw new ServerError('Link no encontrado', 404);
    }

    return apiResponse.success(response, row, 'Link obtenido');
  }

  async crearLink(request, response) {
    const { idEspacio = null, nombre, comentario, direccion } = request.body;
    const result = await this.crear(idEspacio, nombre, comentario, direccion, request.user.idUsuario);
    return apiResponse.created(response, result, 'Link creado con exito');
  }

  async actualizarLink(request, response) {
    const { idEspacio = null, nombre, comentario, direccion } = request.body;
    const result = await this.actualizar(
      request.params.id,
      idEspacio,
      nombre,
      comentario,
      direccion,
      request.user.idUsuario
    );
    return apiResponse.success(response, result, 'Link actualizado con exito');
  }

  async eliminarLink(request, response) {
    const result = await this.eliminar(request.params.id, request.user.idUsuario);
    return apiResponse.success(response, result, 'Link eliminado con exito');
  }

  async buscarLinks(request, response) {
    const { idEspacio = '', categoria = '', nombre = '', comentario = '', direccion = '' } = request.body;
    const rows = await this.buscar(idEspacio, nombre, comentario, direccion, request.user.idUsuario, categoria);
    return apiResponse.success(response, rows, 'Busqueda realizada con exito');
  }

  async validarPermisoEspacio(idUsuario, idEspacio, accion = 'read') {
    const permisos = await espacioService.obtenerPermisosPorEspacio(idUsuario, idEspacio);

    if (!permisos.espacioExiste) {
      throw new ServerError('Espacio no encontrado', 404);
    }

    if (accion === 'read' && !permisos.canRead) {
      throw new ServerError('No tiene permisos para ver links de este espacio', 403);
    }

    if (accion === 'create' && !permisos.canCreate) {
      throw new ServerError('No tiene permisos para crear links en este espacio', 403);
    }

    if (accion === 'manage' && !permisos.canManage) {
      throw new ServerError('Solo el owner del espacio puede modificar o borrar links', 403);
    }

    return permisos;
  }

  async obtenerTodos(idUsuario) {
    const idsEspacios = await espacioService.listarIdsEspaciosAccesiblesUsuario(idUsuario);
    if (!idsEspacios.length) return [];

    if (useMockStore()) {
      const permitidas = new Set(idsEspacios.map(Number));
      return [...mockLinks]
        .filter((item) => permitidas.has(Number(item.idEspacio)))
        .sort((a, b) => String(a.espacio || '').localeCompare(String(b.espacio || '')))
        .map(shapeLinkRow);
    }

    const placeholders = idsEspacios.map(() => '?').join(', ');
    const sql = `
      SELECT
        l.link_id,
        l.idEspacio,
        e.denominacion AS espacio,
        l.nombre,
        l.comentario,
        l.direccion,
        l.created_at
      FROM links l
      INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
      WHERE l.idEspacio IN (${placeholders})
      ORDER BY e.denominacion DESC, l.link_id DESC
    `;

    const rows = await queryAll(sql, idsEspacios);
    return (rows || []).map(shapeLinkRow);
  }

  async obtenerPorId(id, idUsuario, accion = 'read') {
    let row = null;

    if (useMockStore()) {
      row = getMockById(id);
    } else {
      row = await queryOne(Consulta.FIND_BY_ID, [id]);
    }

    if (!row) {
      return null;
    }

    const shaped = shapeLinkRow(row);
    await this.validarPermisoEspacio(idUsuario, shaped.idEspacio, accion);

    return shaped;
  }

  async crear(idEspacio, nombre, comentario, direccion, idUsuario) {
    const espacioId = ensurePositiveInteger(idEspacio, 'idEspacio');
    const nombreTexto = String(nombre || '').trim();
    const direccionTexto = String(direccion || '').trim();

    if (!nombreTexto || !direccionTexto) {
      throw new ServerError('Campos obligatorios incompletos', 400);
    }

    const permisos = await this.validarPermisoEspacio(idUsuario, espacioId, 'create');

    const { texto: nomLimpia } = validarXSS(nombreTexto);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccionTexto);

    const newLink = new Link(espacioId, nomLimpia, comLimpia, dirLimpia);

    if (useMockStore()) {
      const item = {
        link_id: nextMockId++,
        idEspacio: espacioId,
        espacio: permisos.categoria,
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

    observer.notificar(`[CREAR] Nombre: ${nomLimpia}, Comentario: ${comLimpia}, Direccion: ${dirLimpia}`);

    return {
      success: true,
      id: result.insertId || null
    };
  }

  async actualizar(id, idEspacio, nombre, comentario, direccion, idUsuario) {
    const existe = await this.obtenerPorId(id, idUsuario, 'manage');
    if (!existe) throw new ServerError('Link no encontrado', 404);

    const espacioId = ensurePositiveInteger(idEspacio, 'idEspacio');
    const nombreTexto = String(nombre || '').trim();
    const direccionTexto = String(direccion || '').trim();

    if (!nombreTexto || !direccionTexto) {
      throw new ServerError('Campos obligatorios incompletos', 400);
    }

    const permisos = await this.validarPermisoEspacio(idUsuario, espacioId, 'manage');

    const { texto: nomLimpia } = validarXSS(nombreTexto);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccionTexto);

    if (useMockStore()) {
      const item = getMockById(id);
      if (!item) throw new ServerError('Link no encontrado', 404);

      item.idEspacio = espacioId;
      item.espacio = permisos.categoria;
      item.nombre = nomLimpia;
      item.comentario = comLimpia;
      item.direccion = dirLimpia;
    } else {
      await queryRun(Consulta.UPDATE, [
        espacioId,
        nomLimpia,
        comLimpia,
        dirLimpia,
        id
      ]);
    }

    try {
      const antes = existe || {};
      const antesStr = `Nombre: ${antes.nombre || ''}, Comentario: ${antes.comentario || ''}, Direccion: ${antes.direccion || ''}`;
      const despuesStr = `Nombre: ${nomLimpia}, Comentario: ${comLimpia}, Direccion: ${dirLimpia}`;
      observer.notificar(`[MODIFICAR] ID: ${id}, ANTES: ${antesStr}, DESPUES: ${despuesStr}`);
    } catch (_err) {
      observer.notificar(`[MODIFICAR] ${nomLimpia}`);
    }

    return { success: true };
  }

  async eliminar(id, idUsuario) {
    const existe = await this.obtenerPorId(id, idUsuario, 'manage');
    if (!existe) throw new ServerError('Link no encontrado', 404);

    if (useMockStore()) {
      const parsed = Number(id);
      const index = mockLinks.findIndex((item) => Number(item.link_id) === parsed);
      if (index >= 0) {
        mockLinks.splice(index, 1);
      }
    } else {
      await queryRun(Consulta.DELETE, [id]);
    }

    try {
      const antes = existe || {};
      observer.notificar(`[BORRAR] ID: ${id}, Nombre: ${antes.nombre || ''}, Comentario: ${antes.comentario || ''}, Direccion: ${antes.direccion || ''}`);
    } catch (_err) {
      observer.notificar(`[BORRAR] ${id}`);
    }

    return { success: true };
  }

  async buscar(idEspacio = '', nombre = '', comentario = '', direccion = '', idUsuario, categoria = '') {
    const espacioRaw = String(idEspacio || '').trim();
    const categoriaRaw = String(categoria || '').trim();
    const nombreRaw = String(nombre || '').trim();
    const comentarioRaw = String(comentario || '').trim();
    const direccionRaw = String(direccion || '').trim();

    if (!espacioRaw && !categoriaRaw && !nombreRaw && !comentarioRaw && !direccionRaw) {
      throw new ServerError('Complete al menos un campo para buscar', 400);
    }

    let idsPermitidos = await espacioService.listarIdsEspaciosAccesiblesUsuario(idUsuario);
    if (!idsPermitidos.length) return [];

    if (espacioRaw) {
      const permisos = await this.validarPermisoEspacio(idUsuario, espacioRaw, 'read');
      idsPermitidos = [Number(permisos.idEspacio)];
    } else if (categoriaRaw) {
      const permisos = await espacioService.obtenerPermisosPorCategoria(idUsuario, categoriaRaw);
      if (!permisos.espacioExiste || !permisos.canRead) {
        throw new ServerError('No tiene permisos para ver links de este espacio', 403);
      }
      idsPermitidos = [Number(permisos.idEspacio)];
    }

    if (useMockStore()) {
      const permitidas = new Set(idsPermitidos.map(Number));
      const rows = mockLinks.filter((item) => {
        const byEspacio = permitidas.has(Number(item.idEspacio));
        const byNombre = !nombreRaw || String(item.nombre || '').toLowerCase().includes(nombreRaw.toLowerCase());
        const byComentario = !comentarioRaw || String(item.comentario || '').toLowerCase().includes(comentarioRaw.toLowerCase());
        const byDireccion = !direccionRaw || String(item.direccion || '').toLowerCase().includes(direccionRaw.toLowerCase());
        return byEspacio && byNombre && byComentario && byDireccion;
      }).sort((a, b) => String(a.espacio || '').localeCompare(String(b.espacio || '')));

      return rows.map(shapeLinkRow);
    }

    const params = [];
    const where = [];

    const placeholders = idsPermitidos.map(() => '?').join(', ');
    where.push(`l.idEspacio IN (${placeholders})`);
    params.push(...idsPermitidos);

    if (nombreRaw) {
      where.push('l.nombre LIKE ?');
      params.push(like(nombreRaw));
    }
    if (comentarioRaw) {
      where.push('l.comentario LIKE ?');
      params.push(like(comentarioRaw));
    }
    if (direccionRaw) {
      where.push('l.direccion LIKE ?');
      params.push(like(direccionRaw));
    }

    const sql = `
      SELECT
        l.link_id,
        l.idEspacio,
        e.denominacion AS espacio,
        l.nombre,
        l.comentario,
        l.direccion,
        l.created_at
      FROM links l
      INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
      WHERE ${where.join(' AND ')}
      ORDER BY e.denominacion ASC, l.nombre ASC
    `;

    const rows = await queryAll(sql, params);

    try {
      const criterios = [];
      if (idsPermitidos.length === 1) criterios.push(`idEspacio:${idsPermitidos[0]}`);
      if (nombreRaw) criterios.push(`nombre:${nombreRaw}`);
      if (comentarioRaw) criterios.push(`comentario:${comentarioRaw}`);
      if (direccionRaw) criterios.push(`direccion:${direccionRaw}`);
      observer.notificar(`[BUSCAR] ${criterios.join('|')}`);
    } catch (_err) {
      // No interrumpir flujo por logging.
    }

    return (rows || []).map(shapeLinkRow);
  }

}

const linkController = new LinkController();

export default linkController;
