import { Usuario } from '../models/Usuario.js';
import { Espacio } from '../models/Espacio.js';
import { EspacioUsuario } from '../models/EspacioUsuario.js';
import { validarXSS } from '../middleware/xssValidation.js';
import espacioRepository from '../repositories/espacioRepository.js';
import ServerError from '../Helpers/serverError.helper.js';

function toNullableInteger(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    if (!Number.isInteger(n)) return null;
    return n;
}

function toRequiredInteger(value, fieldName) {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new ServerError(`${fieldName} invalido`, 400);
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

class EspacioService {
    constructor(repository = espacioRepository) {
        this.repository = repository;
    }

    async listarUsuarios() {
        return this.repository.listarUsuarios();
    }

    async crearUsuario(nombre, email = null) {
        if (!nombre || String(nombre).trim() === '') {
            throw new ServerError('El nombre de usuario es obligatorio', 400);
        }

        const { texto: nombreLimpio } = validarXSS(String(nombre).trim());
        const emailTexto = email === null || email === undefined ? null : String(email).trim();
        const { texto: emailLimpio } = validarXSS(emailTexto || '');

        const usuario = new Usuario(nombreLimpio, emailLimpio || null);
        const result = await this.repository.crearUsuario(usuario);

        return {
            success: true,
            idUsuario: result.insertId
        };
    }

    async listarEstados() {
        return this.repository.listarEstados();
    }

    async listarEspacios() {
        return this.repository.listarEspacios();
    }

    async obtenerEspacioPorId(idEspacio) {
        const id = toRequiredInteger(idEspacio, 'idEspacio');
        return this.repository.obtenerEspacioPorId(id);
    }

    async crearEspacio(denominacion, idOwner = null, tipoEspacio = 'publico') {
        if (!denominacion || String(denominacion).trim() === '') {
            throw new ServerError('La denominacion del espacio es obligatoria', 400);
        }

        const tipo = normalizarTipoEspacio(tipoEspacio);
        if (!tipo) {
            throw new ServerError('tipoEspacio debe ser publico/privado (o 0/1)', 400);
        }

        const owner = toNullableInteger(idOwner);
        if (idOwner !== undefined && idOwner !== null && idOwner !== '' && owner === null) {
            throw new ServerError('idOwner invalido', 400);
        }

        const { texto: denominacionLimpia } = validarXSS(String(denominacion).trim());
        const espacio = new Espacio(denominacionLimpia, owner, tipo);

        const result = await this.repository.crearEspacio(espacio);

        return {
            success: true,
            idEspacio: result.insertId
        };
    }

    async solicitarIngreso(idEspacio, idUsuario) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        const espacio = await this.repository.obtenerEspacioPorId(espacioId);
        if (!espacio) {
            throw new ServerError('Espacio no encontrado', 404);
        }

        const usuarioId = toRequiredInteger(idUsuario, 'idUsuario');

        const estadoInicial = String(espacio.tipoEspacio).toLowerCase() === 'publico' ? 2 : 1;
        const relacion = new EspacioUsuario(usuarioId, espacioId, estadoInicial);

        await this.repository.upsertSolicitud(relacion);

        return {
            success: true,
            estado: estadoInicial
        };
    }

    async resolverSolicitud(idEspacio, idUsuario, aprobadoPor, aprobar = true) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        const usuarioId = toRequiredInteger(idUsuario, 'idUsuario');
        const espacio = await this.repository.obtenerEspacioPorId(espacioId);
        if (!espacio) {
            throw new ServerError('Espacio no encontrado', 404);
        }

        const aprobador = toRequiredInteger(aprobadoPor, 'aprobadoPor');

        const estado = aprobar ? 2 : 3;
        const result = await this.repository.actualizarEstadoSolicitud(
            estado,
            aprobador,
            usuarioId,
            espacioId
        );

        if (!result.affectedRows) {
            throw new ServerError('Solicitud no encontrada para ese usuario y espacio', 404);
        }

        return { success: true, estado };
    }

    async expulsarUsuario(idEspacio, idUsuario, aprobadoPor) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        const usuarioId = toRequiredInteger(idUsuario, 'idUsuario');
        const aprobador = toRequiredInteger(aprobadoPor, 'aprobadoPor');

        const result = await this.repository.actualizarEstadoSolicitud(
            4,
            aprobador,
            usuarioId,
            espacioId
        );

        if (!result.affectedRows) {
            throw new ServerError('Relacion usuario-espacio no encontrada', 404);
        }

        return { success: true, estado: 4 };
    }

    async listarMiembros(idEspacio) {
        const espacioId = toRequiredInteger(idEspacio, 'idEspacio');
        return this.repository.listarMiembros(espacioId);
    }
}

const espacioService = new EspacioService();

export default espacioService;
