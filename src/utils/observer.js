/**
 * Patrón Observer - Implementación en Node.js
 * 
 */
class Observer {
  constructor() {
    this.observadores = [];
  }

  agregarObservador(funcion) {
    if (typeof funcion === 'function') {
      this.observadores.push(funcion);
    } else {
      throw new TypeError('El observador debe ser una función.');
    }
  }

  quitarObservador(funcion) {
    this.observadores = this.observadores.filter(obs => obs !== funcion);
  }

  notificar(evento) {
    console.log(`📢 [EVENTO]: ${evento}`);
    // Ejecutar observadores sin bloquear (fire and forget)
    Promise.all(
      this.observadores.map(obs =>
        Promise.resolve(obs(evento)).catch(err =>
          console.error('Error en observador:', err)
        )
      )
    ).catch(err => console.error('Error notificando observadores:', err));
  }
}

export default new Observer();
