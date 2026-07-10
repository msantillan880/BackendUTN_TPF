import espacioService from '../services/espacioService.js';
import ServerError from '../Helpers/serverError.helper.js';
import apiResponse from '../Helpers/apiResponse.helper.js';

class EspacioController {
    async listarUsuarios(request, response) {
        const rows = await espacioService.listarUsuarios();
        return apiResponse.success(response, rows, 'Usuarios obtenidos');
    }

    async crearUsuario(request, response) {
        const { nombre, email = null } = request.body;
        const result = await espacioService.crearUsuario(nombre, email);
        return apiResponse.created(response, result, 'Usuario creado con exito');
    }

    async eliminarUsuario(request, response) {
        const result = await espacioService.eliminarUsuarioConDependencias(request.params.id);
        return apiResponse.success(response, result, 'Usuario eliminado con todas sus dependencias');
    }

    async listarEstados(request, response) {
        const rows = await espacioService.listarEstados();
        return apiResponse.success(response, rows, 'Estados obtenidos');
    }

    async listarEspacios(request, response) {
        const rows = await espacioService.listarEspacios();
        return apiResponse.success(response, rows, 'Espacios obtenidos');
    }

    async obtenerEspacioPorId(request, response) {
        const row = await espacioService.obtenerEspacioPorId(request.params.id);
        if (!row) {
            throw new ServerError('Espacio no encontrado', 404);
        }
        return apiResponse.success(response, row, 'Espacio obtenido');
    }

    async crearEspacio(request, response) {
        const { denominacion, tipoEspacio = 0 } = request.body;
        const result = await espacioService.crearEspacioParaOwner(
            denominacion,
            request.user.idUsuario,
            tipoEspacio
        );
        return apiResponse.created(response, result, 'Espacio creado con exito');
    }

    async solicitarIngreso(request, response) {
        const result = await espacioService.solicitarIngresoAutenticado(
            request.params.id,
            request.user.idUsuario
        );
        return apiResponse.created(response, result, 'Solicitud creada con exito');
    }

    async aprobarSolicitud(request, response) {
        const result = await espacioService.resolverSolicitudOwner(
            request.params.id,
            request.params.idUsuario,
            request.user.idUsuario,
            true
        );
        return apiResponse.success(response, result, 'Solicitud aprobada con exito');
    }

    async rechazarSolicitud(request, response) {
        const result = await espacioService.resolverSolicitudOwner(
            request.params.id,
            request.params.idUsuario,
            request.user.idUsuario,
            false
        );
        return apiResponse.success(response, result, 'Solicitud rechazada con exito');
    }

    async expulsarUsuario(request, response) {
        const result = await espacioService.expulsarUsuarioOwner(
            request.params.id,
            request.params.idUsuario,
            request.user.idUsuario
        );
        return apiResponse.success(response, result, 'Usuario expulsado con exito');
    }

    async listarMiembros(request, response) {
        const rows = await espacioService.listarMiembrosAutorizado(
            request.params.id,
            request.user.idUsuario
        );
        return apiResponse.success(response, rows, 'Miembros obtenidos');
    }

    async obtenerMiEstado(request, response) {
        const row = await espacioService.obtenerMiEstadoEspacio(
            request.params.id,
            request.user.idUsuario
        );
        return apiResponse.success(response, row, 'Estado del usuario en espacio obtenido');
    }
}

const espacioController = new EspacioController();

export default espacioController;
