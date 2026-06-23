# Bookmarks - Node.js + Express

Breve descripción

Este proyecto es una aplicación de administración de marcadores (bookmarks) implementada con Node.js y Express. Incluye:

- API REST para CRUD de links
- Búsqueda con filtros por `categoria`, `nombre`, `comentario` y `direccion`
- Comunicación en tiempo real con Socket.IO (observador para logs/notificaciones)
- Persistencia en SQLite (`better-sqlite3`)
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

Resumen de próximos pasos sugeridos

- Añadir validación de esquemas y middleware de errores uniforme.
- Implementar tests unitarios e integración para endpoints y controllers.

---

Fecha: 2026-06-22
