import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { argentinaTimestamp } from '../utils/time.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '../logs/registro_logs.log');

/**
 * Detecta y previene ataques XSS
 * 
 */
export function validarXSS(texto) {
  if (typeof texto !== 'string') {
    texto = String(texto);
  }

  const patronesPeligrosos = [
    /<\s*script[^>]*>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi
  ];

  for (let patron of patronesPeligrosos) {
    if (patron.test(texto)) {
      return { texto: '--', tieneXSS: true };
    }
  }

  return { texto: texto, tieneXSS: false };
}

/**
 * Registra XSS en el log de forma asíncrona
 */
export async function registrarLog(campo, estado, original, final) {
  return new Promise((resolve, reject) => {
    // Usar timestamp consistente en zona Argentina
    const timestamp = argentinaTimestamp();
    const logMessage = `${timestamp} - Campo: ${campo || 'general'} - ${estado} - Valor original: "${original}" - Valor final: "${final}"\n`;

    try {
      logger.info(logMessage.trim());
      resolve();
    } catch (err) {
      // Fallback al escribir con fs
      fs.appendFile(logPath, logMessage, (err2) => {
        if (err2) reject(err2);
        else resolve();
      });
    }
  });
}

/**
 * Middleware para aplicar validación XSS a los campos
 */
export async function middlewareXSS(req, res, next) {
  try {
    const campos = ['categoria', 'nombre', 'comentario', 'direccion'];

    for (const campo of campos) {
      if (req.body[campo]) {
        const original = req.body[campo];
        const { texto, tieneXSS } = validarXSS(original);
        req.body[campo] = texto;

        if (tieneXSS) {
          await registrarLog(campo, 'XSS detectado y corregido', original, texto);
        }
      }
    }

    next();
  } catch (err) {
    console.error('Error en middleware XSS:', err);
    next(err);
  }
}
