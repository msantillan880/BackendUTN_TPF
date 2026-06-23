import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/bookmarks.db');
const logsDir = path.join(__dirname, '../logs');

console.log("DB PATH:", dbPath);
console.log("__dirname:", __dirname);

// Crear carpeta logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Conectar a la base de datos
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('✅ Conectado a SQLite');

// Inicializar tabla
export async function initDatabase() {
  try {
    const CREATE_TABLE = `
      CREATE TABLE IF NOT EXISTS links (
        link_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
        categoria TEXT NOT NULL,
        nombre TEXT NOT NULL,
        comentario TEXT,
        direccion TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.exec(CREATE_TABLE);
    console.log('✅ Tabla links verificada/creada');
  } catch (err) {
    console.error('❌ Error al inicializar BD:', err.message);
    throw err;
  }
}

export default db;
