import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import linkRoutes from './routes/linkRoutes.js';
import espacioRoutes from './routes/espacioRoutes.js';
import { configurarSockets } from './routes/socketRoutes.js';
import observer from './utils/observer.js';
import { argentinaTimestamp } from './utils/time.js';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', linkRoutes);
app.use('/api', espacioRoutes);

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
  res.status(status).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});