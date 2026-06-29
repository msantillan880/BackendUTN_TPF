import { EspacioService } from '../services/espacioService.js';

export class EspacioController {
    static async listarUsuarios() {
        return EspacioService.listarUsuarios();
    }

    static async crearUsuario(nombre, email = null) {
        return EspacioService.crearUsuario(nombre, email);
    }

    static async listarEstados() {
        return EspacioService.listarEstados();
    }

    static async listarEspacios() {
        return EspacioService.listarEspacios();
    }

    static async obtenerEspacioPorId(idEspacio) {
        return EspacioService.obtenerEspacioPorId(idEspacio);
    }

    static async crearEspacio(denominacion, idOwner = null, tipoEspacio = 'publico') {
        return EspacioService.crearEspacio(denominacion, idOwner, tipoEspacio);
    }

    static async solicitarIngreso(idEspacio, idUsuario) {
        return EspacioService.solicitarIngreso(idEspacio, idUsuario);
    }

    static async resolverSolicitud(idEspacio, idUsuario, aprobadoPor, aprobar = true) {
        return EspacioService.resolverSolicitud(idEspacio, idUsuario, aprobadoPor, aprobar);
    }

    static async expulsarUsuario(idEspacio, idUsuario, aprobadoPor) {
        return EspacioService.expulsarUsuario(idEspacio, idUsuario, aprobadoPor);
    }

    static async listarMiembros(idEspacio) {
        return EspacioService.listarMiembros(idEspacio);
    }
}
