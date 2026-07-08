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

function normalizeCategoria(value) {
  return String(value || '').trim().toUpperCase();
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

    let categoriaFiltro = String(categoria || '').trim();
    const espacioFiltro = String(idEspacio || '').trim();

    // Si llega idEspacio, prevalece como criterio canonico y se traduce a categoria interna.
    if (espacioFiltro) {
      const permisos = await this.validarPermisoEspacio(idUsuario, espacioFiltro, 'read');
      categoriaFiltro = permisos.categoria;
    }

    const hayFiltros = Boolean(
      categoriaFiltro ||
      String(nombre || '').trim() ||
      String(comentario || '').trim() ||
      String(direccion || '').trim()
    );

    if (hayFiltros) {
      const rows = await this.buscar(
        categoriaFiltro,
        nombre,
        comentario,
        direccion,
        idUsuario
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
    const { categoria = '', nombre = '', comentario = '', direccion = '' } = request.body;
    const rows = await this.buscar(categoria, nombre, comentario, direccion, request.user.idUsuario);
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

  async validarPermisoCategoria(idUsuario, categoria, accion = 'read') {
    const permisos = await espacioService.obtenerPermisosPorCategoria(idUsuario, categoria);

    if (!permisos.espacioExiste) {
      throw new ServerError('Categoria sin espacio asociado', 403);
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
  }

  async obtenerTodos(idUsuario) {
    const categoriasAccesibles = await espacioService.listarCategoriasAccesiblesUsuario(idUsuario);
    const permitidas = new Set(categoriasAccesibles.map((c) => normalizeCategoria(c)));

    if (useMockStore()) {
      return [...mockLinks]
        .filter((item) => permitidas.has(normalizeCategoria(item.categoria)))
        .sort((a, b) => String(b.categoria).localeCompare(String(a.categoria)));
    }

    const rows = await queryAll(Consulta.REFRESH);
    return (rows || []).filter((item) => permitidas.has(normalizeCategoria(item.categoria)));
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

    await this.validarPermisoCategoria(idUsuario, row.categoria, accion);

    return row;
  }

  async crear(idEspacio, nombre, comentario, direccion, idUsuario) {
    const nombreTexto = String(nombre || '').trim();
    const direccionTexto = String(direccion || '').trim();
    const espacioTexto = idEspacio === null || idEspacio === undefined ? '' : String(idEspacio).trim();

    if (!espacioTexto || !nombreTexto || !direccionTexto) {
      throw new ServerError('Campos obligatorios incompletos', 400);
    }

    const permisos = await this.validarPermisoEspacio(idUsuario, espacioTexto, 'create');
    const categoriaNormalizada = permisos.categoria;

    const { texto: catLimpia } = validarXSS(categoriaNormalizada);
    const { texto: nomLimpia } = validarXSS(nombreTexto);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccionTexto);

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

  async actualizar(id, idEspacio, nombre, comentario, direccion, idUsuario) {
    const existe = await this.obtenerPorId(id, idUsuario, 'manage');
    if (!existe) throw new ServerError('Link no encontrado', 404);

    const nombreTexto = String(nombre || '').trim();
    const direccionTexto = String(direccion || '').trim();
    const espacioTexto = idEspacio === null || idEspacio === undefined ? '' : String(idEspacio).trim();

    if (!espacioTexto || !nombreTexto || !direccionTexto) {
      throw new ServerError('Campos obligatorios incompletos', 400);
    }

    const permisos = await this.validarPermisoEspacio(idUsuario, espacioTexto, 'manage');
    const categoriaNormalizada = permisos.categoria;

    const { texto: catLimpia } = validarXSS(categoriaNormalizada);
    const { texto: nomLimpia } = validarXSS(nombreTexto);
    const { texto: comLimpia } = validarXSS(comentario || '');
    const { texto: dirLimpia } = validarXSS(direccionTexto);

    if (useMockStore()) {
      const item = getMockById(id);
      if (!item) throw new ServerError('Link no encontrado', 404);

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

    // Incluir datos del registro borrado
    try {
      const antes = existe || {};
      observer.notificar(`[BORRAR] ID: ${id}, Nombre: ${antes.nombre || ''}, Comentario: ${antes.comentario || ''}, Direccion: ${antes.direccion || ''}`);
    } catch (err) {
      observer.notificar(`[BORRAR] ${id}`);
    }

    return { success: true };
  }

  async buscar(categoria = '', nombre = '', comentario = '', direccion = '', idUsuario) {
    // Normalizar entradas
    categoria = String(categoria || '').trim();
    nombre = String(nombre || '').trim();
    comentario = String(comentario || '').trim();
    direccion = String(direccion || '').trim();

    const like = (t) => `%${t}%`;

    // Si no hay filtros, devolver error informativo (400)
    if (!categoria && !nombre && !comentario && !direccion) {
      throw new ServerError('Complete al menos un campo para buscar', 400);
    }

    const categoriasAccesibles = await espacioService.listarCategoriasAccesiblesUsuario(idUsuario);
    const permitidas = new Set(categoriasAccesibles.map((c) => normalizeCategoria(c)));

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
        const categoriaPermitida = permitidas.has(normalizeCategoria(item.categoria));
        const byCategoria = !categoria || String(item.categoria || '').toLowerCase().includes(categoria.toLowerCase());
        const byNombre = !nombre || String(item.nombre || '').toLowerCase().includes(nombre.toLowerCase());
        const byComentario = !comentario || String(item.comentario || '').toLowerCase().includes(comentario.toLowerCase());
        const byDireccion = !direccion || String(item.direccion || '').toLowerCase().includes(direccion.toLowerCase());
        return categoriaPermitida && byCategoria && byNombre && byComentario && byDireccion;
      }).sort((a, b) => String(a.categoria).localeCompare(String(b.categoria)));
    } else {
      const sql = `SELECT * FROM links WHERE ${condiciones.join(' AND ')} ORDER BY categoria ASC`;
      const found = await queryAll(sql, params);
      rows = (found || []).filter((item) => permitidas.has(normalizeCategoria(item.categoria)));
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

}

const linkController = new LinkController();

export default linkController;