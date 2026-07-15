import { argentinaTimestamp } from '../utils/time.js';

/**
 * Configura los handlers de Socket.IO
 */
export function configurarSockets(io) {
  io.on('connection', (socket) => {
    console.log(`👤 Cliente conectado: ${socket.id}`);

    /**
     * Evento: registrar_link
     * Equivalente al manejador en app.py
     */
    socket.on('registrar_link', (data) => {
      const sessionId = socket.id;
      const userAgent = data.user_agent || 'Desconocido';
      const timestamp = argentinaTimestamp();
      const logMessage = `${timestamp} - SID: ${sessionId}, Navegador: ${userAgent}\n`;

      // Se conserva en consola para debug de sesion, sin contaminar log funcional.
      console.log(`📝 Sesion registrada: ${logMessage.trim()}`);

      socket.emit('respuesta_registro', {
        uuid: sessionId,
        mensaje: 'Log registrado correctamente'
      });

      console.log(`📝 Log registrado para sesión: ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`👤 Cliente desconectado: ${socket.id}`);
    });

    socket.on('error', (err) => {
      console.error(`❌ Error en socket ${socket.id}:`, err);
    });
  });
}
