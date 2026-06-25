export class Espacio {
    constructor(denominacion, idOwner = null, tipoEspacio = 'publico') {
        this.denominacion = denominacion;
        this.idOwner = idOwner;
        this.tipoEspacio = tipoEspacio;
    }

    getInfo() {
        return {
            denominacion: this.denominacion,
            idOwner: this.idOwner,
            tipoEspacio: this.tipoEspacio
        };
    }

    toArray() {
        return [this.denominacion, this.idOwner, this.tipoEspacio];
    }
}
