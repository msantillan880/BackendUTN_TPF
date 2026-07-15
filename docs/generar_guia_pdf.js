import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outputPath = path.join(process.cwd(), 'docs', 'guia_tpf_completa_auth_autorizacion.pdf');

const doc = new PDFDocument({
    size: 'A4',
    margin: 42,
    info: {
        Title: 'Guia TPF - Auth, JWT, Sesiones, Roles y Pruebas',
        Author: 'BackendUTN_TPF'
    }
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
doc.pipe(fs.createWriteStream(outputPath));

function ensurePage(minY = 760) {
    if (doc.y > minY) doc.addPage();
}

function sectionTitle(text) {
    ensurePage(735);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#0b3f77').text(text);
    doc.moveDown(0.15);
    doc.strokeColor('#a5c3e8').lineWidth(1).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
    doc.moveDown(0.4);
}

function subsectionTitle(text) {
    ensurePage(745);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#144d8f').text(text);
    doc.moveDown(0.2);
}

function paragraph(text) {
    ensurePage(755);
    doc.font('Helvetica').fontSize(10.2).fillColor('#1f2937').text(text, { align: 'left' });
    doc.moveDown(0.28);
}

function bullet(text) {
    ensurePage(758);
    doc.font('Helvetica').fontSize(10.2).fillColor('#1f2937').text(`- ${text}`, { indent: 12 });
}

function numbered(items) {
    items.forEach((item, idx) => {
        ensurePage(758);
        doc.font('Helvetica').fontSize(10.2).fillColor('#1f2937').text(`${idx + 1}. ${item}`, { indent: 8 });
    });
    doc.moveDown(0.2);
}

function codeBlock(lines) {
    ensurePage(730);
    const blockHeight = Math.max(40, lines.length * 13 + 14);
    doc.roundedRect(46, doc.y, 503, blockHeight, 4).fillAndStroke('#0f1720', '#334155');
    const startY = doc.y + 8;
    doc.fillColor('#d8f3ff').font('Courier').fontSize(9.2).text(lines.join('\n'), 54, startY, { width: 488 });
    doc.y = doc.y + blockHeight + 6;
}

function drawEvidenceImageIfExists() {
    const imagePath = path.join(process.cwd(), 'docs', 'image.png');
    if (!fs.existsSync(imagePath)) {
        paragraph('No se encontro la captura de evidencia en docs/image.png.');
        return;
    }

    ensurePage(430);
    paragraph('Evidencia visual: correo recibido en Gmail con boton de verificacion.');
    doc.image(imagePath, {
        fit: [500, 280],
        align: 'center'
    });
    doc.moveDown(0.4);
}

function drawArchitectureDiagram() {
    ensurePage(600);
    subsectionTitle('Diagrama: arquitectura por capas');

    const y = doc.y;
    const boxes = [
        { x: 50, y, w: 120, h: 40, t: 'Cliente\nWeb/Postman', c: '#eef5ff' },
        { x: 190, y, w: 120, h: 40, t: 'Routes\nMiddlewares', c: '#eaf9f0' },
        { x: 330, y, w: 120, h: 40, t: 'Controllers\nServices', c: '#fff7e8' },
        { x: 190, y: y + 72, w: 120, h: 40, t: 'Repositories', c: '#f5edff' },
        { x: 330, y: y + 72, w: 120, h: 40, t: 'MySQL', c: '#ffeef0' }
    ];

    for (const b of boxes) {
        doc.roundedRect(b.x, b.y, b.w, b.h, 6).fillAndStroke(b.c, '#789fd6');
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(9.5).text(b.t, b.x + 8, b.y + 11, {
            width: b.w - 16,
            align: 'center'
        });
    }

    doc.strokeColor('#4c74aa').lineWidth(1.2)
        .moveTo(170, y + 20).lineTo(190, y + 20).stroke()
        .moveTo(310, y + 20).lineTo(330, y + 20).stroke()
        .moveTo(390, y + 40).lineTo(390, y + 72).stroke()
        .moveTo(310, y + 92).lineTo(330, y + 92).stroke();

    doc.y = y + 125;
}

function drawAuthFlowDiagram() {
    ensurePage(560);
    subsectionTitle('Diagrama: flujo auth + JWT + reset password');

    const y = doc.y;
    const lanes = [
        { x: 70, name: 'Usuario' },
        { x: 220, name: 'API' },
        { x: 370, name: 'MySQL' },
        { x: 510, name: 'Mail' }
    ];

    lanes.forEach((l) => {
        doc.fillColor('#0f3f76').font('Helvetica-Bold').fontSize(9).text(l.name, l.x - 24, y);
        doc.strokeColor('#c7d8ef').lineWidth(1).moveTo(l.x, y + 14).lineTo(l.x, y + 225).stroke();
    });

    const arrows = [
        ['register', 70, 220, y + 34],
        ['insert hash + verify token', 220, 370, y + 56],
        ['send verification link', 220, 510, y + 78],
        ['verify token', 70, 220, y + 100],
        ['mark verified', 220, 370, y + 122],
        ['login', 70, 220, y + 144],
        ['JWT Bearer', 220, 70, y + 166],
        ['forgot password', 70, 220, y + 188],
        ['save reset hash', 220, 370, y + 210]
    ];

    arrows.forEach(([txt, from, to, ay]) => {
        doc.strokeColor('#476ea5').lineWidth(1.2).moveTo(from, ay).lineTo(to, ay).stroke();
        doc.fillColor('#334155').font('Helvetica').fontSize(8.2).text(txt, Math.min(from, to) + 4, ay - 9);
        if (to > from) {
            doc.polygon([to, ay], [to - 6, ay - 3], [to - 6, ay + 3]).fill('#476ea5');
        } else {
            doc.polygon([to, ay], [to + 6, ay - 3], [to + 6, ay + 3]).fill('#476ea5');
        }
    });

    doc.y = y + 240;
}

function drawRegistrationFlowDiagram() {
    ensurePage(560);
    subsectionTitle('Diagrama: registracion con verificacion de email');

    const y = doc.y;
    const steps = [
        { text: 'Usuario completa\nnombre + email + password', color: '#eef5ff' },
        { text: 'POST /api/auth/register', color: '#eaf9f0' },
        { text: 'INSERT Usuarios\nemailVerificado=0', color: '#fff7e8' },
        { text: 'Generar token y hash\ncon vencimiento', color: '#f3efff' },
        { text: 'Enviar mail\ncon link de activacion', color: '#ffeef0' },
        { text: 'GET /api/auth/verify-email\nsi token valido', color: '#e8f9f1' },
        { text: 'UPDATE Usuarios\nemailVerificado=1', color: '#eaf3ff' },
        { text: 'Login habilitado', color: '#e9f9ef' }
    ];

    let currentY = y;
    steps.forEach((step, idx) => {
        const x = 70 + (idx % 2) * 250;
        if (idx > 0 && idx % 2 === 0) {
            currentY += 56;
        }

        doc.roundedRect(x, currentY, 220, 40, 6).fillAndStroke(step.color, '#789fd6');
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(8.8).text(step.text, x + 8, currentY + 9, {
            width: 204,
            align: 'center'
        });

        if (idx < steps.length - 1) {
            const nextX = 70 + ((idx + 1) % 2) * 250;
            const nextY = (idx + 1) % 2 === 0 ? currentY + 56 : currentY;
            const fromX = x + (idx % 2 === 0 ? 220 : 0);
            const toX = nextX + ((idx + 1) % 2 === 0 ? 0 : 220);
            const fromY = currentY + 20;
            const toY = nextY + 20;

            doc.strokeColor('#476ea5').lineWidth(1.1).moveTo(fromX, fromY).lineTo(toX, toY).stroke();
            const arrowToRight = toX > fromX;
            if (arrowToRight) {
                doc.polygon([toX, toY], [toX - 6, toY - 3], [toX - 6, toY + 3]).fill('#476ea5');
            } else {
                doc.polygon([toX, toY], [toX + 6, toY - 3], [toX + 6, toY + 3]).fill('#476ea5');
            }
        }
    });

    doc.y = currentY + 56;
}

function drawRequestLifecycleDiagram() {
    ensurePage(600);
    subsectionTitle('Diagrama: ciclo de solicitud de ingreso');

    const y = doc.y;

    const nodes = {
        visitante: { x: 70, yy: y + 20, w: 135, h: 40, label: 'Visitante\n(sin acceso)', color: '#eef5ff' },
        pendiente: { x: 240, yy: y + 20, w: 125, h: 40, label: 'Pendiente\n(estado 1)', color: '#fff7e8' },
        aprobado: { x: 420, yy: y, w: 125, h: 40, label: 'Aprobado\n(estado 2)', color: '#eaf9f0' },
        rechazado: { x: 420, yy: y + 62, w: 125, h: 40, label: 'Rechazado\n(estado 3)', color: '#fdecec' },
        expulsado: { x: 420, yy: y + 124, w: 125, h: 40, label: 'Expulsado\n(estado 4)', color: '#ffeef0' }
    };

    Object.values(nodes).forEach((n) => {
        doc.roundedRect(n.x, n.yy, n.w, n.h, 6).fillAndStroke(n.color, '#789fd6');
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(9.2).text(n.label, n.x + 8, n.yy + 10, {
            width: n.w - 16,
            align: 'center'
        });
    });

    function arrow(x1, y1, x2, y2, label) {
        doc.strokeColor('#476ea5').lineWidth(1.2).moveTo(x1, y1).lineTo(x2, y2).stroke();
        const tx = Math.min(x1, x2) + 5;
        const ty = Math.min(y1, y2) - 10;
        doc.fillColor('#334155').font('Helvetica').fontSize(8.1).text(label, tx, ty);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const size = 6;

        doc.polygon(
            [x2, y2],
            [x2 - ux * size + px * 3, y2 - uy * size + py * 3],
            [x2 - ux * size - px * 3, y2 - uy * size - py * 3]
        ).fill('#476ea5');
    }

    arrow(205, y + 40, 240, y + 40, 'solicita ingreso');
    arrow(365, y + 32, 420, y + 20, 'owner aprueba');
    arrow(365, y + 48, 420, y + 82, 'owner rechaza');
    arrow(482, y + 40, 482, y + 124, 'owner expulsa');

    doc.y = y + 188;
}

function drawDbDiagram() {
    ensurePage(600);
    subsectionTitle('Diagrama: modelo de datos (resumen)');

    const y = doc.y;

    function table(x, yy, name, fields) {
        doc.roundedRect(x, yy, 155, 132, 5).fillAndStroke('#f8fbff', '#7fa3d7');
        doc.rect(x, yy, 155, 22).fillAndStroke('#dfeefd', '#7fa3d7');
        doc.fillColor('#0f3f76').font('Helvetica-Bold').fontSize(9.8).text(name, x + 6, yy + 6);
        doc.fillColor('#1f2937').font('Helvetica').fontSize(8.2).text(fields.join('\n'), x + 6, yy + 27);
    }

    table(42, y, 'Usuarios', [
        'idUsuario (PK)',
        'email',
        'passwordHash',
        'emailVerificado',
        'verifyTokenHash',
        'resetTokenHash'
    ]);

    table(220, y, 'Espacios', [
        'idEspacio (PK)',
        'denominacion',
        'idOwner (FK)',
        'tipoEspacio'
    ]);

    table(398, y, 'Espacio_Usuarios', [
        'idUsuario (FK)',
        'idEspacio (FK)',
        'estado',
        'f_solicitud',
        'f_aprobacion'
    ]);

    table(220, y + 150, 'links', [
        'link_id (PK)',
        'idEspacio (FK)',
        'nombre',
        'comentario',
        'direccion'
    ]);

    doc.strokeColor('#5f82b5').lineWidth(1.2)
        .moveTo(197, y + 64).lineTo(220, y + 64).stroke()
        .moveTo(375, y + 64).lineTo(398, y + 64).stroke()
        .moveTo(298, y + 132).lineTo(298, y + 150).stroke();

    doc.y = y + 292;
}

// Cover
const today = new Date().toISOString().slice(0, 10);
doc.rect(0, 0, 595, 842).fill('#f5fbff');
doc.fillColor('#0b3f77').font('Helvetica-Bold').fontSize(24).text('Guia Integral del TPF', 42, 85);
doc.fontSize(17).text('Auth, JWT, Sesiones, Roles y Pruebas', 42, 118);
doc.fillColor('#1f2937').font('Helvetica').fontSize(11.5).text('Proyecto: BackendUTN_TPF', 42, 170);
doc.text(`Fecha: ${today}`, 42, 188);
doc.moveTo(42, 220).lineTo(553, 220).stroke('#9bbde4');
doc.fontSize(10.8).fillColor('#26384f').text(
    'Documento de estudio para comprender implementacion tecnica y ejecutar pruebas completas en Postman y web.',
    42,
    242,
    { width: 500 }
);

doc.addPage();

sectionTitle('1) Definicion funcional y objetivos');
paragraph('El sistema gestiona espacios colaborativos de enlaces con dos perfiles principales: owner y visitante. Un mismo usuario puede ser owner en algunos espacios y visitante en otros.');
bullet('Owner: crea espacio, administra miembros, modifica y elimina links del espacio.');
bullet('Visitante aprobado: crea links y consulta links en espacios autorizados.');
bullet('Pendiente o no autorizado: solo solicita ingreso.');
doc.moveDown(0.4);
paragraph('Objetivo tecnico: aplicar seguridad real con JWT, bcrypt, verificacion de email y recuperacion de contrasena, manteniendo arquitectura por capas.');

sectionTitle('2) Arquitectura por capas');
paragraph('Se implementa separacion de responsabilidades: routes recibe HTTP, controllers gestionan req/res, services aplican reglas de negocio y permisos, repositories ejecutan SQL.');
paragraph('Beneficio practico: cuando una regla cambia (por ejemplo, permisos de visitante), se toca service sin romper controllers ni rutas.');
drawArchitectureDiagram();
subsectionTitle('Guia general end-to-end (como funciona todo)');
numbered([
    'Inicio: Express carga dotenv, middlewares globales, conexion MySQL y rutas.',
    'Registro: /api/auth/register guarda passwordHash bcrypt y emailVerificado=0.',
    'Verificacion: se genera token, se guarda hash en DB y se envia correo con enlace.',
    'Activacion: /api/auth/verify-email valida token y marca emailVerificado=1.',
    'Login: /api/auth/login entrega accessToken JWT con expiracion.',
    'Protegidos: Bearer token -> middleware JWT -> request.user -> service con reglas.',
    'Persistencia: repositories ejecutan SQL sobre Usuarios, Espacios, Espacio_Usuarios y links.',
    'Reset de clave: forgot/reset usa token temporal hasheado con vencimiento e invalidacion.',
    'Salida UX: frontend no expone tokens; verify-email devuelve HTML amigable en navegador.'
]);

sectionTitle('3) Autenticacion, JWT y sesion stateless');
paragraph('La sesion no vive en memoria del servidor. El cliente recibe un JWT y lo envia en cada request protegida como Bearer token.');
bullet('JWT incluye sub=idUsuario, email, nombre, iat y exp.');
bullet('La firma usa JWT_ACCESS_SECRET y se valida en authJwt middleware.');
bullet('Si el token expira, la API devuelve 401 y se requiere login nuevamente.');
bullet('En la app principal, cerrar sesion elimina el accessToken guardado en localStorage.');
paragraph('Esto simplifica escalado horizontal porque no hay estado de sesion compartido entre instancias.');
drawAuthFlowDiagram();
paragraph('Para registrar nuevos usuarios, el backend crea la cuenta con emailVerificado=0 y exige validacion desde correo antes de permitir login.');
drawRegistrationFlowDiagram();
subsectionTitle('Mensajes funcionales de login');
bullet('Usuario no registrado: "Usuario no registrado. Si es nuevo, registrate aqui" (HTTP 401).');
bullet('Usuario registrado sin validar email: "Debe verificar su email antes de iniciar sesion" (HTTP 403).');
bullet('Objetivo: guiar al usuario con accion concreta y evitar confusion en pantalla de ingreso.');

sectionTitle('4) Seguridad aplicada y buenas practicas');
bullet('Passwords hasheadas con bcrypt.');
bullet('Tokens de verificacion/reset almacenados hasheados en DB, nunca en claro.');
bullet('Validacion de payloads con Zod para evitar entradas invalidas.');
bullet('Error handler centralizado con respuestas consistentes.');
bullet('Forgot-password responde mensaje generico para no filtrar usuarios existentes.');

doc.addPage();

sectionTitle('5) Recuperacion de contrasena (paso tecnico)');
numbered([
    'POST /api/auth/forgot-password recibe email.',
    'Si existe el usuario, se genera token random de recuperacion.',
    'Se guarda hash del token + expiracion en DB (no token plano).',
    'Se envia enlace por email con el token.',
    'POST /api/auth/reset-password recibe token + newPassword.',
    'Se valida hash + expiracion y se actualiza passwordHash.',
    'Se limpia token de reset para invalidarlo.'
]);
paragraph('Resultado esperado: password vieja invalida, password nueva valida.');
paragraph('Justificacion: este enfoque mejora seguridad frente al envio de contrasenas por email. El sistema nunca guarda contrasenas ni tokens en claro, solo hashes y expiracion temporal.');
subsectionTitle('Preguntas de comprension sobre reset por token');
bullet('Por que guardar hash del token y no token plano? Para mitigar riesgo si se expone la base de datos.');
bullet('Por que responder mensaje generico en forgot? Para evitar enumeracion de usuarios por email.');
bullet('Por que invalidar el token luego del reset? Para que el enlace sea de un solo uso.');
bullet('Por que agregar vencimiento? Para acotar ventana de uso indebido del enlace.');

sectionTitle('6) Autorizacion por rol (owner vs visitante)');
subsectionTitle('Reglas en espacios');
bullet('Crear espacio: owner = usuario autenticado (request.user).');
bullet('Solicitar ingreso: idUsuario se toma del token, no del body.');
bullet('Aprobar/rechazar/expulsar: solo owner del espacio.');
bullet('Listar miembros: solo owner del espacio.');

subsectionTitle('Reglas en links');
bullet('Read/List/Search: owner o visitante aprobado.');
bullet('Create: owner o visitante aprobado.');
bullet('Update/Delete: solo owner.');
paragraph('En create/update se envia idEspacio (numero). El backend valida permisos sobre ese espacio y persiste links con FK real a Espacios.');

subsectionTitle('Mapa de endpoints (legacy -> REST)');
bullet('POST /api/crear -> POST /api/links');
bullet('PUT /api/actualizar/{id} -> PATCH /api/links/{id}');
bullet('DELETE /api/eliminar/{id} -> DELETE /api/links/{id}');
bullet('POST /api/buscar -> GET /api/links?idEspacio=...&nombre=...&comentario=...&direccion=...');
paragraph('Los endpoints legacy quedan solo por compatibilidad temporal; para nuevas integraciones usar /api/links.');

subsectionTitle('Ciclo de solicitud de ingreso (visitante)');
bullet('Visitante solicita ingreso y queda en estado pendiente (1).');
bullet('Desde pendiente, el owner puede aprobar (2) o rechazar (3).');
bullet('Si fue aprobado, el owner puede expulsar (4).');
drawRequestLifecycleDiagram();

drawDbDiagram();

doc.addPage();

sectionTitle('7) Paso a paso de pruebas en Postman (detallado)');
subsectionTitle('Preparacion');
numbered([
    'Importar postman_collection_bookmarks.json desde el repo.',
    'Variables: baseUrl, accessToken, ownerEmail, ownerPassword, ownerUserId, visitorEmail, visitorPassword, visitorUserId, espacioId, linkId, verifyToken, resetToken.',
    'Authorization global: Bearer {{accessToken}} para endpoints protegidos.',
    'Los tests de Auth guardan automaticamente verifyToken, resetToken, accessToken y user ids.'
]);
paragraph('Aclaracion practica: en login/register/verify/forgot/reset usar No Auth. Bearer solo aplica a endpoints protegidos.');
paragraph('Excepcion de alcance para pruebas: DELETE /api/usuarios/{idUsuario} se usa como cleanup y no requiere Bearer token.');

subsectionTitle('Escenario A: register -> verify -> login');
paragraph('Request A1: POST /api/auth/register (owner).');
codeBlock([
    '{',
    '  "nombre": "owner_demo",',
    '  "email": "owner_demo_x@mail.com",',
    '  "password": "12345678"',
    '}'
]);
paragraph('Esperado: 201 y verifyUrlDev. Extraer token de verifyUrlDev.');
paragraph('Request A2: GET /api/auth/verify-email?token=TOKEN_EXTRAIDO. Esperado 200.');
paragraph('Request A3: POST /api/auth/login. Esperado 200 y accessToken en variable global accessToken.');
paragraph('Repetir A1/A2/A3 para visitante y luego para owner segun el escenario de permisos.');

subsectionTitle('Escenario B: owner y visitante');
numbered([
    'Owner crea espacio privado con POST /api/espacios.',
    'Visitante solicita ingreso con POST /api/espacios/{espacioId}/solicitudes.',
    'Visitante intenta crear link y debe obtener 403 si esta pendiente.',
    'Owner aprueba solicitud con PUT /api/espacios/{espacioId}/solicitudes/{visitorUserId}/aprobar.',
    'Visitante crea link y ahora debe obtener 201.',
    'Visitante intenta modificar link y debe obtener 403.',
    'Owner modifica link y debe obtener 200.'
]);

subsectionTitle('Escenario C: forgot y reset');
numbered([
    'POST /api/auth/forgot-password con visitorEmail.',
    'El test de Postman extrae resetToken automaticamente desde resetUrlDev.',
    'POST /api/auth/reset-password con token y newPassword.',
    'Probar login con password vieja (401) y nueva (200).'
]);

subsectionTitle('Escenario D: limpieza de usuario para pruebas');
numbered([
    'Ejecutar DELETE /api/usuarios/{idUsuario} para limpieza controlada de un usuario de prueba.',
    'La API elimina usuario, espacios donde era owner y relaciones asociadas por cascada.',
    'Tambien elimina links asociados por idEspacio para mantener integridad referencial del modelo.'
]);

subsectionTitle('Escenario D: guion con 2 cuentas Gmail de demo');
paragraph('Roles del ejemplo: owner = prueba.usuario2.bookmarksutn@gmail.com, visitante = prueba.usuario1.bookmarksutn@gmail.com, password inicial = bookmarksutn.2026.');
codeBlock([
    'Credenciales rapidas para pruebas',
    'ownerEmail=prueba.usuario2.bookmarksutn@gmail.com',
    'ownerPassword=bookmarksutn.2026',
    'visitorEmail=prueba.usuario1.bookmarksutn@gmail.com',
    'visitorPassword=bookmarksutn.2026'
]);
numbered([
    'Setear variables: ownerEmail/ownerPassword y visitorEmail/visitorPassword con esas cuentas.',
    'Login owner -> crea espacio privado (se guarda espacioId).',
    'Login visitor -> solicita ingreso al espacio.',
    'Visitor intenta crear link con POST /api/links (idEspacio) y debe fallar con 403.',
    'Login owner -> aprobar solicitud con visitorUserId.',
    'Login visitor -> crear link en POST /api/links (201).',
    'Visitor intenta actualizar link en PATCH /api/links/{id} (403).',
    'Login owner -> actualizar link en PATCH /api/links/{id} (200).'
]);
paragraph('Importante: accessToken es global en la coleccion. Cada login pisa el token anterior, por eso se alterna login owner/login visitor durante la prueba.');

doc.addPage();

sectionTitle('8) Pruebas paso a paso desde web');
subsectionTitle('Opcion 1: pantalla auxiliar de pruebas');
paragraph('Abrir /auth-demo.html y seguir este orden: Register, Verify ultimo token, Login, /auth/me, Forgot, Reset.');
paragraph('La tarjeta de endpoint protegido permite probar rapidamente /api/espacios o /api/links con Bearer token.');

subsectionTitle('Opcion 2: app principal');
paragraph('Luego de validar auth, probar comportamiento funcional por rol en la app principal: owner administra y visitante aprobado opera links segun permisos.');
numbered([
    'En la parte superior derecha del panel de login, usar "Sos nuevo, registrate aqui" para alta de usuario.',
    'Completar nombre, email y password, confirmar desde el correo y luego iniciar sesion.',
    'En login, los botones Ingresar/Cancelar quedan alineados a la derecha y debajo se muestra "Recuperar contrasena".',
    'El frontend guarda accessToken y valida sesion con /api/auth/me.',
    'Con sesion activa se habilitan endpoints y acciones protegidas.',
    'Cerrar sesion elimina token local y la UI oculta datos hasta nuevo login.'
]);
bullet('Luego del registro, la UI muestra mensaje simple sin exponer token ni verifyUrlDev.');
bullet('Al abrir verify-email desde navegador se muestra pagina HTML amigable (exito/error), no JSON plano.');

sectionTitle('9) Configuracion Gmail para demo docente');
numbered([
    'Crear dos cuentas Gmail dedicadas para TP (usuario1 y usuario2).',
    'Activar 2FA en cada cuenta.',
    'Generar App Password en la cuenta emisora desde https://myaccount.google.com/apppasswords.',
    'Elegir Correo + dispositivo Otro (BackendUTN) y copiar la clave de 16 caracteres.',
    'Configurar SMTP_SERVICE=gmail, SMTP_USER, SMTP_PASS (sin espacios), SMTP_FROM con formato nombre + email.',
    'Reiniciar backend y ejecutar pruebas de email real.'
]);
drawEvidenceImageIfExists();

sectionTitle('10) Troubleshooting rapido');
bullet('401 token invalido/expirado: revisar Authorization Bearer y reloguear.');
bullet('Si se uso Cerrar sesion, es normal que no carguen espacios: el token fue eliminado y se requiere nuevo login.');
bullet('401 en login: usar No Auth, validar body email/password y revisar scope de variables activo.');
bullet('Si 401 persiste con valores hardcodeados, verificar en DB que el usuario exista, tenga passwordHash y emailVerificado=1.');
bullet('403 en links: revisar estado en Espacio_Usuarios y ownership del espacio.');
bullet('No llega email: revisar SMTP y App Password de Gmail.');
bullet('No aparece App Password: abrir https://myaccount.google.com/apppasswords y reingresar luego de activar 2FA.');
bullet('Token de verify/reset invalido: puede estar vencido o ya utilizado.');

sectionTitle('11) Variables de entorno recomendadas');
codeBlock([
    'PORT=5000',
    'MYSQL_HOST=127.0.0.1',
    'MYSQL_PORT=3306',
    'MYSQL_USER=root',
    'MYSQL_PASSWORD=',
    'MYSQL_DATABASE=bookmarks',
    'JWT_ACCESS_SECRET=CAMBIAR_ESTE_SECRETO',
    'JWT_ACCESS_EXPIRES=15m',
    'BCRYPT_SALT_ROUNDS=10',
    'EMAIL_VERIFY_TTL_HOURS=24',
    'RESET_PASSWORD_TTL_MINUTES=30',
    'APP_BASE_URL=http://localhost:5000',
    'SMTP_SERVICE=gmail',
    'SMTP_USER=prueba.usuario2.bookmarksutn@gmail.com',
    'SMTP_PASS=app_password_de_16_caracteres_sin_espacios',
    'SMTP_FROM="BookmarksUTN <prueba.usuario2.bookmarksutn@gmail.com>"'
]);

subsectionTitle('Nota de despliegue de base de datos (produccion)');
bullet('Proveedor seleccionado: Clever Cloud.');
bullet('Tipo de recurso: Add-on MySQL.');
bullet('Plan elegido para esta entrega: DEV (estimado 0.00 EUR / 30 dias).');
bullet('Nombre del add-on: bookmarksUtn.');
bullet('Region: Paris (par).');
bullet('Host: bm8teafjnsugrmlpqa9t-mysql.services.clever-cloud.com.');
bullet('Database: bm8teafjnsugrmlpqa9t.');
bullet('User: utu1eg8mc7xql6ac.');
bullet('Port: 3306.');
bullet('Password: L68spc6qZZsFVVGVF2wM.');
bullet('Connection URI: mysql://utu1eg8mc7xql6ac:L68spc6qZZsFVVGVF2wM@bm8teafjnsugrmlpqa9t-mysql.services.clever-cloud.com:3306/bm8teafjnsugrmlpqa9t.');
bullet('MySQL CLI: mysql -h bm8teafjnsugrmlpqa9t-mysql.services.clever-cloud.com -P 3306 -u utu1eg8mc7xql6ac -p bm8teafjnsugrmlpqa9t.');
paragraph('La aplicacion queda preparada para conectar con variables separadas de entorno o con URI, segun configuracion del proveedor.');

sectionTitle('12) Preguntas de oral con respuestas modelo');
subsectionTitle('Pregunta: por que JWT y no sesion en servidor?');
paragraph('Respuesta modelo: JWT permite backend stateless, simple de escalar y alineado con API REST. El token viaja en Authorization Bearer y el middleware valida firma y expiracion.');

subsectionTitle('Pregunta: como proteges contrasenas?');
paragraph('Respuesta modelo: no se guardan en claro, solo hash bcrypt. En login se usa bcrypt.compare para validar.');

subsectionTitle('Pregunta: como implementaste olvido de contrasena?');
paragraph('Respuesta modelo: forgot genera token temporal, guarda hash+expiracion, envia enlace por email y reset valida token antes de actualizar passwordHash e invalidar el token.');

subsectionTitle('Pregunta: por que no envias la nueva contrasena por email?');
paragraph('Respuesta modelo: porque es mas seguro enviar enlace temporal con token. Asi el usuario elige su nueva clave y no circula una contrasena definitiva por correo.');

subsectionTitle('Pregunta: como evitas filtrado de cuentas existentes?');
paragraph('Respuesta modelo: forgot-password siempre devuelve mensaje generico, exista o no el email, evitando user enumeration.');

subsectionTitle('Pregunta: que pasa si roban un token viejo?');
paragraph('Respuesta modelo: no sirve si ya expiro o si ya fue utilizado, porque se limpia de DB al reset exitoso.');

subsectionTitle('Pregunta: diferencia entre autenticacion y autorizacion?');
paragraph('Respuesta modelo: autenticacion define quien sos (token valido). Autorizacion define que podes hacer (owner/aprobado/pendiente segun espacio).');

subsectionTitle('Pregunta: como demostras permisos en vivo?');
paragraph('Respuesta modelo: visitante pendiente intenta crear link y recibe 403; owner aprueba solicitud; visitante crea link; visitante no puede modificar; owner si puede.');

subsectionTitle('Mini bloque: preguntas trampa (respuesta corta)');
bullet('Si cambian idUsuario en body, pueden operar como otro? No, la identidad sale de request.user (JWT).');
bullet('Si roban un JWT, se rompe toda la seguridad? No: hay expiracion corta; mejora: refresh con revocacion.');
bullet('Por que bcrypt y no sha256 para password? Porque bcrypt tiene sal y costo adaptable.');
bullet('Si filtran DB, pueden resetear igual? No directo: se guarda hash del token, no token plano.');
bullet('El frontend define seguridad? No: la autorizacion real se decide en backend.');

sectionTitle('13) Cierre y siguientes mejoras');
paragraph('Estado actual: autenticacion, autorizacion por roles, JWT, verificacion de email y olvido de contrasena funcionando.');
bullet('Mejora sugerida: refresh token con revocacion.');
bullet('Mejora sugerida: tests de integracion automatizados.');
bullet('La migracion de links a idEspacio como FK real ya esta implementada.');
paragraph('Fin de la guia.');

doc.end();
console.log(`PDF generado en: ${outputPath}`);
