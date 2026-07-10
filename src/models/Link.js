/**
 * Clase Link - Representa un bookmark en la aplicación
 * 
 */
export class Link {
  constructor(idEspacio, nombre, comentario, direccion) {
    this.idEspacio = idEspacio;
    this.nombre = nombre;
    this.comentario = comentario;
    this.direccion = direccion;
  }

  getInfo() {
    return {
      idEspacio: this.idEspacio,
      nombre: this.nombre,
      comentario: this.comentario,
      direccion: this.direccion
    };
  }

  toArray() {
    return [this.idEspacio, this.nombre, this.comentario, this.direccion];
  }
}
