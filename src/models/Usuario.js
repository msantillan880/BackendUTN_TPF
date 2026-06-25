export class Usuario {
    constructor(nombre, email = null) {
        this.nombre = nombre;
        this.email = email;
    }

    getInfo() {
        return {
            nombre: this.nombre,
            email: this.email
        };
    }

    toArray() {
        return [this.nombre, this.email];
    }
}
