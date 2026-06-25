export class EstadoSolicitud {
    constructor(idEstado, descripcion) {
        this.idEstado = idEstado;
        this.descripcion = descripcion;
    }

    getInfo() {
        return {
            idEstado: this.idEstado,
            descripcion: this.descripcion
        };
    }
}
