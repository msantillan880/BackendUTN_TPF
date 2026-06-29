import db from '../config/db.js';
import { ConsultaEspacios } from '../db/queries.js';

function queryAll(sql, params = []) {
    return db.execute(sql, params).then(([rows]) => rows);
}

function queryOne(sql, params = []) {
    return db.execute(sql, params).then(([rows]) => (rows && rows[0]) || null);
}

function queryRun(sql, params = []) {
    return db.execute(sql, params).then(([result]) => result);
}

export class EspacioRepository {
    static async listarUsuarios() {
        return queryAll(ConsultaEspacios.LISTAR_USUARIOS);
    }

    static async crearUsuario(usuario) {
        return queryRun(ConsultaEspacios.INSERT_USUARIO, usuario.toArray());
    }

    static async listarEstados() {
        return queryAll(ConsultaEspacios.LISTAR_ESTADOS);
    }

    static async listarEspacios() {
        return queryAll(ConsultaEspacios.LISTAR_ESPACIOS);
    }

    static async obtenerEspacioPorId(idEspacio) {
        return queryOne(ConsultaEspacios.OBTENER_ESPACIO_POR_ID, [idEspacio]);
    }

    static async crearEspacio(espacio) {
        return queryRun(ConsultaEspacios.INSERT_ESPACIO, espacio.toArray());
    }

    static async upsertSolicitud(relacion) {
        return queryRun(ConsultaEspacios.UPSERT_SOLICITUD, relacion.toArray());
    }

    static async actualizarEstadoSolicitud(estado, aprobadoPor, idUsuario, idEspacio) {
        return queryRun(ConsultaEspacios.UPDATE_ESTADO_SOLICITUD, [
            estado,
            aprobadoPor,
            Number(idUsuario),
            Number(idEspacio)
        ]);
    }

    static async listarMiembros(idEspacio) {
        return queryAll(ConsultaEspacios.LISTAR_MIEMBROS_ESPACIO, [Number(idEspacio)]);
    }
}
