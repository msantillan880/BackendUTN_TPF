# Bookmarks - Node.js + Express

Breve descripción

Este proyecto es una aplicación de administración de marcadores (bookmarks) implementada con Node.js y Express. Incluye:

- API REST para CRUD de links
- Búsqueda con filtros por `categoria`, `nombre`, `comentario` y `direccion`
- Comunicación en tiempo real con Socket.IO (observador para logs/notificaciones)
- Persistencia en MySQL (`mysql2`) — migración en curso
- Logger centralizado con `winston`

Estructura principal

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

3. Probar la API con Swagger o Postman.

Documentacion Swagger (para entrega)

- UI interactiva: `GET /api-docs`
- JSON OpenAPI: `GET /api-docs.json`

Endpoints relevantes

- Auth
  - `POST /api/auth/register` — Registro con `nombre`, `email`, `password`
  - `GET /api/auth/verify-email?token=...` — Verificacion de email
  - `POST /api/auth/login` — Login con `email`, `password` (retorna Bearer token)
  - `POST /api/auth/forgot-password` — Solicitar recuperacion de contrasena
  - `POST /api/auth/reset-password` — Confirmar nueva contrasena con token
  - `GET /api/auth/me` — Datos del usuario autenticado (requiere Bearer token)
- Links
  - `GET /api/links` — Obtener todos los links
  - `GET /api/links/:id` — Obtener link por id
  - `POST /api/crear` — Crear link
  - `PUT /api/actualizar/:id` — Actualizar link
  - `DELETE /api/eliminar/:id` — Borrar link
  - `POST /api/buscar` — Buscar por filtros (`categoria`, `nombre`, `comentario`, `direccion`)
- Multiusuario (protegido con JWT)
  - `GET /api/usuarios` — Listar usuarios
  - `DELETE /api/usuarios/:id` — Borrar usuario con dependencias (usuario, espacios owner, relaciones y links de esos espacios)
  - `GET /api/estados-solicitudes` — Listar estados
  - `GET /api/espacios` — Listar espacios
  - `GET /api/espacios/:id` — Obtener espacio por id
  - `POST /api/espacios` — Crear espacio
  - `GET /api/espacios/:id/miembros` — Listar miembros del espacio
  - `POST /api/espacios/:id/solicitudes` — Solicitar ingreso
  - `PUT /api/espacios/:id/solicitudes/:idUsuario/aprobar` — Aprobar solicitud
  - `PUT /api/espacios/:id/solicitudes/:idUsuario/rechazar` — Rechazar solicitud
  - `PUT /api/espacios/:id/usuarios/:idUsuario/expulsar` — Expulsar usuario
- Extras
  - `POST /api/espacios/:id/generar-html` — Descargar bookmarks del espacio seleccionado
  - `GET /api/log-view`
  - `POST /api/leePdf`
  - `POST /api/leeLog`

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

Variables nuevas para autenticacion/email:

- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES` (por defecto `15m`)
- `BCRYPT_SALT_ROUNDS` (por defecto `10`)
- `EMAIL_VERIFY_TTL_HOURS` (por defecto `24`)
- `RESET_PASSWORD_TTL_MINUTES` (por defecto `30`)
- `APP_BASE_URL` (por defecto `http://localhost:5000`)
- `MAIL_PROVIDER` (`auto`, `smtp`, `resend`, `brevo`)
- `RESEND_API_KEY`, `RESEND_FROM`
- `SMTP_SERVICE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Nota: si no se configura SMTP, el sistema usa un transporte JSON de desarrollo para poder probar el flujo de verificacion sin envio real.

### Prueba con Resend (recomendado en Render)

Configurar en `.env` o variables del servicio:

```bash
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM="BookmarksUTN <onboarding@resend.dev>"
```

Para produccion, se recomienda verificar dominio propio en Resend y usar un remitente de ese dominio.

### Prueba con Gmail (sugerido para profesores)

Para usar dos cuentas de prueba (por ejemplo `usuario1` y `usuario2`) con Gmail:

1. Crear dos cuentas Gmail dedicadas al TP.
2. Activar verificacion en 2 pasos en cada cuenta.
3. Generar una App Password por cuenta (Google no recomienda usar password normal de la cuenta).
4. Configurar en `.env`:

```bash
SMTP_SERVICE=gmail
SMTP_USER=tu_cuenta_gmail@gmail.com
SMTP_PASS=app_password_de_google
SMTP_FROM="BookmarksUTN <tu_cuenta_gmail@gmail.com>"
```

Si queres alternar entre cuentas para demo, cambia `SMTP_USER` y `SMTP_PASS` y reinicia el servidor.

## Reglas de autorizacion implementadas

- Owner del espacio:
  - Puede aprobar/rechazar/expulsar miembros.
  - Puede modificar y borrar links del espacio.
  - Puede ver listado de miembros del espacio.
- Visitante aprobado:
  - Puede crear links y realizar busquedas/listados en espacios aprobados.
  - No puede modificar ni borrar links.
- Usuario no autorizado:
  - No puede crear links ni ver links de espacios no aprobados.

## Flujo rapido de prueba (Auth)

1. Registrar usuario:

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"test","email":"test@mail.com","password":"12345678"}'
```

2. Tomar `verifyUrlDev` de la respuesta y abrirla (o llamar por curl) para verificar email.

3. Loguear:

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.com","password":"12345678"}'
```

4. Usar el `accessToken` en `Authorization: Bearer ...` para endpoints protegidos.

## Frontend desacoplado

La catedra requiere repositorios separados.

- Backend (este repositorio): API + DB + auth + documentacion.
- Frontend (repositorio separado): UI web que consume la API.

Frontend actual: https://github.com/msantillan880/FrontendUTN_TPF

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

- Backend API-only en este repositorio.
- Se mantienen `usuario1` y `usuario2` como usuarios base para pruebas diarias.
- Los links se asocian al espacio por `idEspacio`.

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
