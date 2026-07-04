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

class EspacioRepository {
    async listarUsuarios() {
        return queryAll(ConsultaEspacios.LISTAR_USUARIOS);
    }

    async crearUsuario(usuario) {
        return queryRun(ConsultaEspacios.INSERT_USUARIO, usuario.toArray());
    }

    async listarEstados() {
        return queryAll(ConsultaEspacios.LISTAR_ESTADOS);
    }

    async listarEspacios() {
        return queryAll(ConsultaEspacios.LISTAR_ESPACIOS);
    }

    async obtenerEspacioPorId(idEspacio) {
        return queryOne(ConsultaEspacios.OBTENER_ESPACIO_POR_ID, [idEspacio]);
    }

    async crearEspacio(espacio) {
        return queryRun(ConsultaEspacios.INSERT_ESPACIO, espacio.toArray());
    }

    async upsertSolicitud(relacion) {
        return queryRun(ConsultaEspacios.UPSERT_SOLICITUD, relacion.toArray());
    }

    async actualizarEstadoSolicitud(estado, aprobadoPor, idUsuario, idEspacio) {
        return queryRun(ConsultaEspacios.UPDATE_ESTADO_SOLICITUD, [
            estado,
            aprobadoPor,
            Number(idUsuario),
            Number(idEspacio)
        ]);
    }

    async listarMiembros(idEspacio) {
        return queryAll(ConsultaEspacios.LISTAR_MIEMBROS_ESPACIO, [Number(idEspacio)]);
    }
}

const espacioRepository = new EspacioRepository();

export default espacioRepository;
