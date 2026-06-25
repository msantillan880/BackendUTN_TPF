import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');

// Crear carpeta logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración desde variables de entorno (usar .env si es necesario)
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'bookmarks';
const MYSQL_PORT = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
const DEMO_MODE = ['1', 'true', 'yes'].includes(String(process.env.DEMO_MODE || '').toLowerCase());

// Crear pool de conexiones
const pool = mysql.createPool({
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false
});

if (!DEMO_MODE) {
  console.log(`✅ Conectando a MySQL ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`);
} else {
  console.log('ℹ️ DEMO_MODE activo: se omite conexion efectiva a MySQL.');
}

// Inicializar tabla
export async function initDatabase() {
  try {
    const CREATE_TABLE = `
      CREATE TABLE IF NOT EXISTS links (
        link_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
        categoria VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        comentario TEXT,
        direccion VARCHAR(2048) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `;

    await pool.execute(CREATE_TABLE);
    console.log('✅ Tabla links verificada/creada (MySQL)');
  } catch (err) {
    console.error('❌ Error al inicializar BD MySQL:', err && err.message);
    throw err;
  }
}

export default pool;
