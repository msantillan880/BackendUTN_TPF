export class EspacioUsuario {
    constructor(idUsuario, idEspacio, estado = 1) {
        this.idUsuario = idUsuario;
        this.idEspacio = idEspacio;
        this.estado = estado;
    }

    getInfo() {
        return {
            idUsuario: this.idUsuario,
            idEspacio: this.idEspacio,
            estado: this.estado
        };
    }

    toArray() {
        return [this.idUsuario, this.idEspacio, this.estado];
    }
}
