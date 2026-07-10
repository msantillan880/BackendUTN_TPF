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

// Configuracion desde variables de entorno (usar .env si es necesario)
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
    console.log(`Conectando a MySQL ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`);
} else {
    console.log('DEMO_MODE activo: se omite conexion efectiva a MySQL.');
}

async function ensureColumn(tableName, columnName, columnDefinition) {
    const CHECK_COLUMN_SQL = `
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
    `;

    const [rows] = await pool.execute(CHECK_COLUMN_SQL, [MYSQL_DATABASE, tableName, columnName]);
    if (!rows || rows.length === 0) {
        await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
    }
}

async function hasColumn(tableName, columnName) {
    const CHECK_COLUMN_SQL = `
                SELECT 1
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = ?
                    AND TABLE_NAME = ?
                    AND COLUMN_NAME = ?
                LIMIT 1
        `;

    const [rows] = await pool.execute(CHECK_COLUMN_SQL, [MYSQL_DATABASE, tableName, columnName]);
    return Boolean(rows && rows.length > 0);
}

async function hasForeignKey(tableName, constraintName) {
    const CHECK_FK_SQL = `
                SELECT 1
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = ?
                    AND TABLE_NAME = ?
                    AND CONSTRAINT_NAME = ?
                    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                LIMIT 1
        `;

    const [rows] = await pool.execute(CHECK_FK_SQL, [MYSQL_DATABASE, tableName, constraintName]);
    return Boolean(rows && rows.length > 0);
}

// Inicializar tabla
export async function initDatabase() {
    try {
        const CREATE_LINKS_TABLE = `
            CREATE TABLE IF NOT EXISTS links (
                link_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
                idEspacio INT NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                comentario TEXT,
                direccion VARCHAR(2048) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_links_idEspacio (idEspacio),
                CONSTRAINT fk_links_espacio
                    FOREIGN KEY (idEspacio) REFERENCES Espacios(idEspacio)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;

        const CREATE_USUARIOS_TABLE = `
            CREATE TABLE IF NOT EXISTS Usuarios (
                idUsuario INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(120) NOT NULL,
                email VARCHAR(190) NULL,
                passwordHash VARCHAR(255) NULL,
                emailVerificado TINYINT(1) NOT NULL DEFAULT 0,
                emailVerificationTokenHash VARCHAR(255) NULL,
                emailVerificationExpiresAt DATETIME NULL,
                resetPasswordTokenHash VARCHAR(255) NULL,
                resetPasswordExpiresAt DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_usuarios_email (email)
            ) ENGINE=InnoDB;
        `;

        const CREATE_ESTADOS_TABLE = `
            CREATE TABLE IF NOT EXISTS EstadosSolicitudes (
                idEstado INT PRIMARY KEY,
                descripcion VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB;
        `;

        const CREATE_ESPACIOS_TABLE = `
            CREATE TABLE IF NOT EXISTS Espacios (
                idEspacio INT PRIMARY KEY AUTO_INCREMENT,
                denominacion VARCHAR(150) NOT NULL,
                idOwner INT NULL,
                tipoEspacio ENUM('publico','privado') NOT NULL DEFAULT 'publico',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_espacios_owner
                    FOREIGN KEY (idOwner) REFERENCES Usuarios(idUsuario)
                    ON DELETE SET NULL
            ) ENGINE=InnoDB;
        `;

        const CREATE_ESPACIO_USUARIOS_TABLE = `
            CREATE TABLE IF NOT EXISTS Espacio_Usuarios (
                idUsuario INT NOT NULL,
                idEspacio INT NOT NULL,
                estado INT NOT NULL,
                f_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                f_aprobacion DATETIME NULL,
                aprobadoPor INT NULL,
                PRIMARY KEY (idUsuario, idEspacio),
                CONSTRAINT fk_eu_usuario
                    FOREIGN KEY (idUsuario) REFERENCES Usuarios(idUsuario)
                    ON DELETE CASCADE,
                CONSTRAINT fk_eu_espacio
                    FOREIGN KEY (idEspacio) REFERENCES Espacios(idEspacio)
                    ON DELETE CASCADE,
                CONSTRAINT fk_eu_estado
                    FOREIGN KEY (estado) REFERENCES EstadosSolicitudes(idEstado),
                CONSTRAINT fk_eu_aprobador
                    FOREIGN KEY (aprobadoPor) REFERENCES Usuarios(idUsuario)
                    ON DELETE SET NULL
            ) ENGINE=InnoDB;
        `;

        const SEED_ESTADOS = `
            INSERT INTO EstadosSolicitudes (idEstado, descripcion)
            VALUES
                (1, 'pendiente'),
                (2, 'aprobado'),
                (3, 'rechazado'),
                (4, 'expulsado')
            ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
        `;

        await pool.execute(CREATE_USUARIOS_TABLE);
        await ensureColumn('Usuarios', 'passwordHash', 'passwordHash VARCHAR(255) NULL');
        await ensureColumn('Usuarios', 'emailVerificado', 'emailVerificado TINYINT(1) NOT NULL DEFAULT 0');
        await ensureColumn('Usuarios', 'emailVerificationTokenHash', 'emailVerificationTokenHash VARCHAR(255) NULL');
        await ensureColumn('Usuarios', 'emailVerificationExpiresAt', 'emailVerificationExpiresAt DATETIME NULL');
        await ensureColumn('Usuarios', 'resetPasswordTokenHash', 'resetPasswordTokenHash VARCHAR(255) NULL');
        await ensureColumn('Usuarios', 'resetPasswordExpiresAt', 'resetPasswordExpiresAt DATETIME NULL');
        await ensureColumn('Usuarios', 'created_at', 'created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        await ensureColumn('Usuarios', 'updated_at', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        await pool.execute(CREATE_ESTADOS_TABLE);
        await pool.execute(SEED_ESTADOS);
        await pool.execute(CREATE_ESPACIOS_TABLE);
        await pool.execute(CREATE_ESPACIO_USUARIOS_TABLE);
        await pool.execute(CREATE_LINKS_TABLE);

        // Migracion links.categoria -> links.idEspacio
        const linksTieneCategoria = await hasColumn('links', 'categoria');
        await ensureColumn('links', 'idEspacio', 'idEspacio INT NULL');

        if (linksTieneCategoria) {
            await pool.execute(`
                UPDATE links l
                INNER JOIN Espacios e
                    ON UPPER(TRIM(e.denominacion)) = UPPER(TRIM(l.categoria))
                SET l.idEspacio = e.idEspacio
                WHERE l.idEspacio IS NULL
            `);
        }

        // Si quedan links sin idEspacio, se eliminan para mantener integridad referencial.
        await pool.execute('DELETE FROM links WHERE idEspacio IS NULL');

        await pool.execute('ALTER TABLE links MODIFY COLUMN idEspacio INT NOT NULL');

        const linksTieneFkEspacio = await hasForeignKey('links', 'fk_links_espacio');
        if (!linksTieneFkEspacio) {
            await pool.execute(`
                ALTER TABLE links
                ADD CONSTRAINT fk_links_espacio
                FOREIGN KEY (idEspacio) REFERENCES Espacios(idEspacio)
                ON DELETE CASCADE
            `);
        }

        if (linksTieneCategoria) {
            await pool.execute('ALTER TABLE links DROP COLUMN categoria');
        }

        console.log('Esquema base verificado/creado (MySQL)');
    } catch (err) {
        console.error('Error al inicializar BD MySQL:', err && err.message);
        throw err;
    }
}

export default pool;
