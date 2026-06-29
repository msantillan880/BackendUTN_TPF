# Bookmarks - Node.js + Express

Breve descripción

Este proyecto es una aplicación de administración de marcadores (bookmarks) implementada con Node.js y Express. Incluye:

- API REST para CRUD de links
- Búsqueda con filtros por `categoria`, `nombre`, `comentario` y `direccion`
- Comunicación en tiempo real con Socket.IO (observador para logs/notificaciones)
- Persistencia en MySQL (`mysql2`) — migración en curso
- Logger centralizado con `winston`

Estructura principal

- `public/` — front-end estático (HTML/CSS/JS)
- `src/routes/` — rutas de Express
- `src/controllers/` — lógica de negocio (`LinkController`)
- `src/db/` — inicialización de DB y queries (`queries.js`)
- `src/middleware/` — middlewares (p. ej. `xssValidation.js`)
- `src/utils/` — utilidades (observer, logger, time helper)
- `src/logs/` — archivo de logs

Notas técnicas actuales

- Las queries SQL están centralizadas en `src/db/queries.js`.
- La búsqueda fue adaptada para construir queries dinámicamente usando parámetros y combinando solo los filtros provistos (AND). Esto evita sobreescribir resultados cuando se usan múltiples filtros.
- Se registran eventos (crear/modificar/borrar/buscar) mediante un observer y `winston`.
- Hay validación básica XSS en `src/middleware/xssValidation.js`.

Cómo ejecutar (desarrollo)

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar la aplicación:

```bash
npm start
```

3. Interactuar con la API o la UI en `public/`.

Endpoints relevantes

- `GET /api/links` — Obtener todos los links
- `GET /api/links/:id` — Obtener link por id
- `POST /api/links` — Crear link
- `PUT /api/links/:id` — Actualizar link
- `DELETE /api/links/:id` — Borrar link
- `POST /api/buscar` — Buscar (envía JSON con campos `categoria`, `nombre`, `comentario`, `direccion`)

Ejemplo de búsqueda (curl):

```bash
curl -s -X POST http://localhost:5000/api/buscar \
  -H "Content-Type: application/json" \
  -d '{"comentario":"noticias"}' | jq
```

Consideraciones:

- Separación en capas: la aplicación organiza rutas, controladores y consulta a la BD en archivos separados, lo cual sigue buenas prácticas básicas.
- Recomendaciones de mejora: paginación, test unitarios.

## Migración a MySQL

Se migró la persistencia de `better-sqlite3` a `mysql2` usando un pool de conexiones.
Variables de entorno (opcional, con valores por defecto):

- `MYSQL_HOST` (por defecto `127.0.0.1`)
- `MYSQL_PORT` (por defecto `3306`)
- `MYSQL_USER` (por defecto `root`)
- `MYSQL_PASSWORD` (por defecto ``)
- `MYSQL_DATABASE` (por defecto `bookmarks`)

Pasos para ejecutar con MySQL:

1. Crear la base de datos (si no existe):

```sql
CREATE DATABASE IF NOT EXISTS bookmarks CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

2. Exportar variables de entorno o crear `.env` con las mismas.
3. Instalar dependencias y ejecutar:

```bash
npm install
npm start
```

Si prefieres seguir usando SQLite temporalmente, restaura la dependencia o ejecuta la rama anterior.

Resumen de próximos pasos sugeridos

- Añadir validación de esquemas y middleware de errores uniforme.
- Implementar tests unitarios e integración para endpoints y controllers.

## Estado actual (post-demo)

- El frontend multiusuario usa datos persistidos en MySQL para usuarios, espacios, membresias y links.
- Se mantienen `usuario1` y `usuario2` como usuarios base para pruebas diarias.
- Los links se asocian al espacio por `categoria = nombreDelEspacioEnMayusculas` (puente temporal hasta agregar `idEspacio` en `links`).

## Re-seed para pruebas diarias

Para recuperar el estado base de demo persistido:

1. Ejecutar el script [src/db/003_seed_mock_multiusuario.sql](src/db/003_seed_mock_multiusuario.sql) sobre la base configurada (`bookmarks` por defecto).
2. Reiniciar la app.

Ejemplo:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p bookmarks < src/db/003_seed_mock_multiusuario.sql
npm start
```

## Estructura mínima sugerida (avance inicial)

Se agregó `src/config/db.js` para centralizar la configuración de base de datos.
`src/db/database.js` se mantiene como compatibilidad y reexporta desde `src/config/db.js`.

Siguientes pasos (en próximos commits):

- `src/repositories/`: mover acceso SQL desde controllers.
- `src/services/`: mover lógica de negocio.
- Mantener `src/controllers/` solo para `req/res`.

---

Fecha: 2026-06-22
