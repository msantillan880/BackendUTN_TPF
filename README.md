# BackendUTN_TPF

Backend del TP Final de Backend UTN (Node.js + Express + MySQL), con autenticacion JWT, verificacion por email, autorizacion por roles en espacios, logging y exportaciones.

## URLs publicas

- Frontend: https://bookmarksutn-tpf.onrender.com
- Backend API: https://backendutn-tpf.onrender.com
- Swagger UI: https://backendutn-tpf.onrender.com/api-docs
- OpenAPI JSON: https://backendutn-tpf.onrender.com/api-docs.json

## Stack

- Node.js + Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Email (Resend / SMTP / Brevo)
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)
- Socket.IO

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno en `.env` (ver `.env.example`).

3. Iniciar servidor:

```bash
npm start
```

Servidor por defecto: `http://localhost:5000`

## Variables de entorno (principales)

### Base de datos

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- Alternativa por URI: `MYSQL_URI` / `MYSQL_ADDON_URI` / `CLEVERCLOUD_MYSQL_ADDON_URI`

### Auth

- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES` (default `15m`)
- `BCRYPT_SALT_ROUNDS` (default `10`)

### Email

- `APP_BASE_URL`
- `MAIL_PROVIDER` (`auto`, `smtp`, `resend`, `brevo`)

Resend:

- `RESEND_API_KEY`
- `RESEND_FROM`

SMTP:

- `SMTP_SERVICE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
- `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Brevo:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

## Endpoints principales

### Auth

- `POST /api/auth/register`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Espacios y links

- `GET /api/espacios`
- `POST /api/espacios`
- `GET /api/links`
- `POST /api/links`
- `PATCH /api/links/:id`
- `DELETE /api/links/:id`

### Extras

- `POST /api/espacios/:id/generar-html`
- `POST /api/leePdf`
- `GET /api/manual-pdf`
- `GET /api/log-view`

## Repositorio frontend

UI desacoplada en:

- https://github.com/msantillan880/FrontendUTN_TPF

## Notas de entrega

- El manual de presentacion se sirve desde backend en `docs/ExplicacionTPF.pdf`.
- Las pruebas completas estan documentadas en `GUIA_PRUEBAS_ENTREGA.txt` y `RESUMEN_PROFE_PRUEBAS_RAPIDAS.txt`.
