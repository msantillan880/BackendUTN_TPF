/**
 * Clase Link - Representa un bookmark en la aplicación
 * 
 */
export class Link {
  constructor(categoria, nombre, comentario, direccion) {
    this.categoria = categoria;
    this.nombre = nombre;
    this.comentario = comentario;
    this.direccion = direccion;
  }

  getInfo() {
    return {
      categoria: this.categoria,
      nombre: this.nombre,
      comentario: this.comentario,
      direccion: this.direccion
    };
  }

  toArray() {
    return [this.categoria, this.nombre, this.comentario, this.direccion];
  }
}
