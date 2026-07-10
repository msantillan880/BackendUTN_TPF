import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import linkRoutes from './routes/linkRoutes.js';
import espacioRoutes from './routes/espacioRoutes.js';
import extraRoutes from './routes/extraRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { configurarSockets } from './routes/socketRoutes.js';
import observer from './utils/observer.js';
import { argentinaTimestamp } from './utils/time.js';
import logger from './utils/logger.js';
import swaggerSpec from './config/swagger.js';
import { initDatabase } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  await initDatabase();
} catch (err) {
  console.error('No se pudo inicializar esquema de base de datos:', err && err.message);
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', authRoutes);
app.use('/api', espacioRoutes);
app.use('/api', linkRoutes);
app.use('/api', extraRoutes);

configurarSockets(io);

// Observador para escribir eventos en el log con timestamp ISO
try {
  const logPath = path.join(__dirname, 'logs', 'registro_logs.log');
  observer.agregarObservador((evento) => {
    try {
      const timestamp = argentinaTimestamp();
      logger.info(`${timestamp} - ${evento}`);
    } catch (err) {
      console.error('Error escribiendo en log:', err);
    }
  });
} catch (err) {
  console.error('Error registrando observador de logs:', err);
}

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) {
    console.error('Error no controlado:', err);
  }

  res.status(status).json({
    ok: false,
    status,
    message,
    error: message,
    data: null
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});