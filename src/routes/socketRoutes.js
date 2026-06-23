import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { argentinaTimestamp } from '../utils/time.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '../logs/registro_logs.log');

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

      // Usar logger centralizado
      logger.info(logMessage.trim());

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
