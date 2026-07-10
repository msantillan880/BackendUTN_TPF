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

    async obtenerUsuarioPorId(idUsuario) {
        return queryOne(ConsultaEspacios.OBTENER_USUARIO_POR_ID, [Number(idUsuario)]);
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

    async isOwner(idEspacio, idUsuario) {
        const row = await queryOne(ConsultaEspacios.IS_OWNER_ESPACIO, [
            Number(idEspacio),
            Number(idUsuario)
        ]);
        return Boolean(row);
    }

    async obtenerRelacionUsuarioEspacio(idUsuario, idEspacio) {
        return queryOne(ConsultaEspacios.OBTENER_RELACION_USUARIO_ESPACIO, [
            Number(idUsuario),
            Number(idEspacio)
        ]);
    }

    async listarCategoriasAccesiblesUsuario(idUsuario) {
        return queryAll(ConsultaEspacios.LISTAR_CATEGORIAS_ACCESIBLES_USUARIO, [
            Number(idUsuario),
            Number(idUsuario)
        ]);
    }

    async obtenerEspacioPorCategoriaNormalizada(categoria) {
        return queryOne(ConsultaEspacios.OBTENER_ESPACIO_POR_CATEGORIA_NORMALIZADA, [
            String(categoria || '').trim()
        ]);
    }

    async eliminarUsuarioConDependencias(idUsuario) {
        const id = Number(idUsuario);
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [userRows] = await connection.execute(ConsultaEspacios.OBTENER_USUARIO_POR_ID, [id]);
            const user = userRows && userRows[0] ? userRows[0] : null;

            if (!user) {
                await connection.rollback();
                return null;
            }

            const [ownedRows] = await connection.execute(ConsultaEspacios.COUNT_ESPACIOS_OWNER, [id]);
            const espaciosOwner = Number((ownedRows && ownedRows[0] && ownedRows[0].total) || 0);

            const [deleteLinksResult] = await connection.execute(
                ConsultaEspacios.DELETE_LINKS_DE_ESPACIOS_OWNER,
                [id]
            );

            const [deleteSpacesResult] = await connection.execute(
                ConsultaEspacios.DELETE_ESPACIOS_BY_OWNER,
                [id]
            );

            const [deleteUserResult] = await connection.execute(
                ConsultaEspacios.DELETE_USUARIO_BY_ID,
                [id]
            );

            await connection.commit();

            return {
                idUsuario: id,
                usuarioEliminado: Number(deleteUserResult?.affectedRows || 0) > 0,
                espaciosEliminados: Number(deleteSpacesResult?.affectedRows || 0),
                linksEliminados: Number(deleteLinksResult?.affectedRows || 0),
                espaciosOwnerDetectados: espaciosOwner
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

const espacioRepository = new EspacioRepository();

export default espacioRepository;
