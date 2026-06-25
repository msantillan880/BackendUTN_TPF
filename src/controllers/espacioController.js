import db from '../db/database.js';
import { ConsultaEspacios } from '../db/queries.js';
import { Usuario } from '../models/Usuario.js';
import { Espacio } from '../models/Espacio.js';
import { EspacioUsuario } from '../models/EspacioUsuario.js';
import { validarXSS } from '../middleware/xssValidation.js';

function queryAll(sql, params = []) {
    return db.execute(sql, params).then(([rows]) => rows);
}

function queryOne(sql, params = []) {
    return db.execute(sql, params).then(([rows]) => (rows && rows[0]) || null);
}

function queryRun(sql, params = []) {
    return db.execute(sql, params).then(([result]) => result);
}

function toNullableInteger(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    if (!Number.isInteger(n)) return null;
    return n;
}

function normalizarTipoEspacio(value) {
    if (value === undefined || value === null || value === '') return 'publico';

    const text = String(value).trim().toLowerCase();
    if (text === '0' || text === 'publico') return 'publico';
    if (text === '1' || text === 'privado') return 'privado';

    return null;
}

export class EspacioController {
    static async listarUsuarios() {
        return await queryAll(ConsultaEspacios.LISTAR_USUARIOS);
    }

    static async crearUsuario(nombre, email = null) {
        if (!nombre || String(nombre).trim() === '') {
            const err = new Error('El nombre de usuario es obligatorio');
            err.status = 400;
            throw err;
        }

        const { texto: nombreLimpio } = validarXSS(String(nombre).trim());
        const emailTexto = email === null || email === undefined ? null : String(email).trim();
        const { texto: emailLimpio } = validarXSS(emailTexto || '');

        const usuario = new Usuario(nombreLimpio, emailLimpio || null);
        const result = await queryRun(ConsultaEspacios.INSERT_USUARIO, usuario.toArray());

        return {
            success: true,
            idUsuario: result.insertId
        };
    }

    static async listarEstados() {
        return await queryAll(ConsultaEspacios.LISTAR_ESTADOS);
    }

    static async listarEspacios() {
        return await queryAll(ConsultaEspacios.LISTAR_ESPACIOS);
    }

    static async obtenerEspacioPorId(idEspacio) {
        return await queryOne(ConsultaEspacios.OBTENER_ESPACIO_POR_ID, [idEspacio]);
    }

    static async crearEspacio(denominacion, idOwner = null, tipoEspacio = 'publico') {
        if (!denominacion || String(denominacion).trim() === '') {
            const err = new Error('La denominacion del espacio es obligatoria');
            err.status = 400;
            throw err;
        }

        const tipo = normalizarTipoEspacio(tipoEspacio);
        if (!tipo) {
            const err = new Error('tipoEspacio debe ser publico/privado (o 0/1)');
            err.status = 400;
            throw err;
        }

        const owner = toNullableInteger(idOwner);

        const { texto: denominacionLimpia } = validarXSS(String(denominacion).trim());
        const espacio = new Espacio(denominacionLimpia, owner, tipo);

        const result = await queryRun(ConsultaEspacios.INSERT_ESPACIO, espacio.toArray());

        return {
            success: true,
            idEspacio: result.insertId
        };
    }

    static async solicitarIngreso(idEspacio, idUsuario) {
        const espacio = await this.obtenerEspacioPorId(idEspacio);
        if (!espacio) {
            const err = new Error('Espacio no encontrado');
            err.status = 404;
            throw err;
        }

        const usuarioId = Number(idUsuario);
        if (!Number.isInteger(usuarioId)) {
            const err = new Error('idUsuario invalido');
            err.status = 400;
            throw err;
        }

        // Si el espacio es publico se aprueba automaticamente.
        const estadoInicial = String(espacio.tipoEspacio).toLowerCase() === 'publico' ? 2 : 1;
        const relacion = new EspacioUsuario(usuarioId, Number(idEspacio), estadoInicial);

        await queryRun(ConsultaEspacios.UPSERT_SOLICITUD, relacion.toArray());

        return {
            success: true,
            estado: estadoInicial
        };
    }

    static async resolverSolicitud(idEspacio, idUsuario, aprobadoPor, aprobar = true) {
        const espacio = await this.obtenerEspacioPorId(idEspacio);
        if (!espacio) {
            const err = new Error('Espacio no encontrado');
            err.status = 404;
            throw err;
        }

        const aprobador = toNullableInteger(aprobadoPor);
        if (aprobador === null) {
            const err = new Error('aprobadoPor es obligatorio y debe ser entero');
            err.status = 400;
            throw err;
        }

        const estado = aprobar ? 2 : 3;
        const result = await queryRun(ConsultaEspacios.UPDATE_ESTADO_SOLICITUD, [
            estado,
            aprobador,
            Number(idUsuario),
            Number(idEspacio)
        ]);

        if (!result.affectedRows) {
            const err = new Error('Solicitud no encontrada para ese usuario y espacio');
            err.status = 404;
            throw err;
        }

        return { success: true, estado };
    }

    static async expulsarUsuario(idEspacio, idUsuario, aprobadoPor) {
        const aprobador = toNullableInteger(aprobadoPor);
        if (aprobador === null) {
            const err = new Error('aprobadoPor es obligatorio y debe ser entero');
            err.status = 400;
            throw err;
        }

        const result = await queryRun(ConsultaEspacios.UPDATE_ESTADO_SOLICITUD, [
            4,
            aprobador,
            Number(idUsuario),
            Number(idEspacio)
        ]);

        if (!result.affectedRows) {
            const err = new Error('Relacion usuario-espacio no encontrada');
            err.status = 404;
            throw err;
        }

        return { success: true, estado: 4 };
    }

    static async listarMiembros(idEspacio) {
        return await queryAll(ConsultaEspacios.LISTAR_MIEMBROS_ESPACIO, [Number(idEspacio)]);
    }
}
