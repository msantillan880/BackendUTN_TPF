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
        const { denominacion, idOwner = null, tipoEspacio = 0 } = request.body;
        const result = await espacioService.crearEspacio(denominacion, idOwner, tipoEspacio);
        return apiResponse.created(response, result, 'Espacio creado con exito');
    }

    async solicitarIngreso(request, response) {
        const { idUsuario } = request.body;
        const result = await espacioService.solicitarIngreso(request.params.id, idUsuario);
        return apiResponse.created(response, result, 'Solicitud creada con exito');
    }

    async aprobarSolicitud(request, response) {
        const { aprobadoPor } = request.body;
        const result = await espacioService.resolverSolicitud(
            request.params.id,
            request.params.idUsuario,
            aprobadoPor,
            true
        );
        return apiResponse.success(response, result, 'Solicitud aprobada con exito');
    }

    async rechazarSolicitud(request, response) {
        const { aprobadoPor } = request.body;
        const result = await espacioService.resolverSolicitud(
            request.params.id,
            request.params.idUsuario,
            aprobadoPor,
            false
        );
        return apiResponse.success(response, result, 'Solicitud rechazada con exito');
    }

    async expulsarUsuario(request, response) {
        const { aprobadoPor } = request.body;
        const result = await espacioService.expulsarUsuario(
            request.params.id,
            request.params.idUsuario,
            aprobadoPor
        );
        return apiResponse.success(response, result, 'Usuario expulsado con exito');
    }

    async listarMiembros(request, response) {
        const rows = await espacioService.listarMiembros(request.params.id);
        return apiResponse.success(response, rows, 'Miembros obtenidos');
    }
}

const espacioController = new EspacioController();

export default espacioController;
