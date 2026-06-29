import { Usuario } from '../models/Usuario.js';
import { Espacio } from '../models/Espacio.js';
import { EspacioUsuario } from '../models/EspacioUsuario.js';
import { validarXSS } from '../middleware/xssValidation.js';
import { EspacioRepository } from '../repositories/espacioRepository.js';

function toNullableInteger(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    if (!Number.isInteger(n)) return null;
    return n;
}

function toRequiredInteger(value, fieldName) {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        const err = new Error(`${fieldName} invalido`);
        err.status = 400;
        throw err;
    }
    return n;
}

function normalizarTipoEspacio(value) {
    if (value === undefined || value === null || value === '') return 'publico';

    const text = String(value).trim().toLowerCase();
    if (text === '0' || text === 'publico') return 'publico';
    if (text === '1' || text === 'privado') return 'privado';

    return null;
}

export class EspacioService {
    static async listarUsuarios() {
        return EspacioRepository.listarUsuarios();
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
        const result = await EspacioRepository.crearUsuario(usuario);

        return {
            success: true,
            idUsuario: result.insertId
        };
    }

    static async listarEstados() {
        return EspacioRepository.listarEstados();
    }

    static async listarEspacios() {
        return EspacioRepository.listarEspacios();
    }

    static async obtenerEspacioPorId(idEspacio) {
        const id = toRequiredInteger(idEspacio, 'idEspacio');
        return EspacioRepository.obtenerEspacioPorId(id);
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
        if (idOwner !== undefined && idOwner !== null && idOwner !== '' && owner === null) {
            const err = new Error('idOwner invalido');
            err.status = 400;
            throw err;
        }

        const { texto: denominacionLimpia } = validarXSS(String(denominacion).trim());
        const espacio = new Espacio(denominacionLimpia, owner, tipo);

        const result = await EspacioRepository.crearEspacio(espacio);

        return {
            success: true,
            idEspacio: result.insertId
        };
    }

    static async solicitarIngreso(idEspacio, idUsuario) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        const espacio = await EspacioRepository.obtenerEspacioPorId(espacioId);
        if (!espacio) {
            const err = new Error('Espacio no encontrado');
            err.status = 404;
            throw err;
        }

        const usuarioId = toRequiredInteger(idUsuario, 'idUsuario');

        const estadoInicial = String(espacio.tipoEspacio).toLowerCase() === 'publico' ? 2 : 1;
        const relacion = new EspacioUsuario(usuarioId, espacioId, estadoInicial);

        await EspacioRepository.upsertSolicitud(relacion);

        return {
            success: true,
            estado: estadoInicial
        };
    }

    static async resolverSolicitud(idEspacio, idUsuario, aprobadoPor, aprobar = true) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        const usuarioId = toRequiredInteger(idUsuario, 'idUsuario');
        const espacio = await EspacioRepository.obtenerEspacioPorId(espacioId);
        if (!espacio) {
            const err = new Error('Espacio no encontrado');
            err.status = 404;
            throw err;
        }

        const aprobador = toRequiredInteger(aprobadoPor, 'aprobadoPor');

        const estado = aprobar ? 2 : 3;
        const result = await EspacioRepository.actualizarEstadoSolicitud(
            estado,
            aprobador,
            usuarioId,
            espacioId
        );

        if (!result.affectedRows) {
            const err = new Error('Solicitud no encontrada para ese usuario y espacio');
            err.status = 404;
            throw err;
        }

        return { success: true, estado };
    }

    static async expulsarUsuario(idEspacio, idUsuario, aprobadoPor) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        const usuarioId = toRequiredInteger(idUsuario, 'idUsuario');
        const aprobador = toRequiredInteger(aprobadoPor, 'aprobadoPor');

        const result = await EspacioRepository.actualizarEstadoSolicitud(
            4,
            aprobador,
            usuarioId,
            espacioId
        );

        if (!result.affectedRows) {
            const err = new Error('Relacion usuario-espacio no encontrada');
            err.status = 404;
            throw err;
        }

        return { success: true, estado: 4 };
    }

    static async listarMiembros(idEspacio) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        return EspacioRepository.listarMiembros(espacioId);
    }
}
