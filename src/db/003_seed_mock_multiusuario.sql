-- Seed mock multiusuario para demo UI (sin login real)
-- Escenario esperado para usuario1:
-- - Astronomia: autorizado
-- - Ciberseguridad: pendiente
-- - Node.js: solicitar autorizacion

START TRANSACTION;

-- 1) Usuarios base
INSERT INTO Usuarios (nombre, email)
VALUES
  ('usuario1', 'usuario1@mail.com'),
  ('usuario2', 'usuario2@mail.com')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre);

-- Variables de usuarios
SET @u1 = (SELECT idUsuario FROM Usuarios WHERE email = 'usuario1@mail.com' LIMIT 1);
SET @u2 = (SELECT idUsuario FROM Usuarios WHERE email = 'usuario2@mail.com' LIMIT 1);

-- 2) Limpiar espacios demo previos (y sus relaciones por FK ON DELETE CASCADE)
DELETE FROM Espacios WHERE denominacion IN ('Astronomia', 'Ciberseguridad', 'Node.js');

-- 3) Crear 3 espacios (owner = usuario2)
INSERT INTO Espacios (denominacion, idOwner, tipoEspacio)
VALUES
  ('Astronomia', @u2, 'publico'),
  ('Ciberseguridad', @u2, 'privado'),
  ('Node.js', @u2, 'publico');

-- Variables de espacios
SET @e1 = (SELECT idEspacio FROM Espacios WHERE denominacion = 'Astronomia' ORDER BY idEspacio DESC LIMIT 1);
SET @e2 = (SELECT idEspacio FROM Espacios WHERE denominacion = 'Ciberseguridad' ORDER BY idEspacio DESC LIMIT 1);
SET @e3 = (SELECT idEspacio FROM Espacios WHERE denominacion = 'Node.js' ORDER BY idEspacio DESC LIMIT 1);

-- 4) Estado usuario1 vs espacios
-- EstadosSolicitudes: 1=pendiente, 2=aprobado, 3=rechazado, 4=expulsado
INSERT INTO Espacio_Usuarios (idUsuario, idEspacio, estado, f_solicitud, f_aprobacion, aprobadoPor)
VALUES
  (@u1, @e1, 2, NOW(), NOW(), @u2),
  (@u1, @e2, 1, NOW(), NULL, NULL)
ON DUPLICATE KEY UPDATE
  estado = VALUES(estado),
  f_solicitud = VALUES(f_solicitud),
  f_aprobacion = VALUES(f_aprobacion),
  aprobadoPor = VALUES(aprobadoPor);

-- 5) Links demo (3 por espacio/categoria)
DELETE FROM links WHERE categoria IN ('ASTRONOMIA', 'CIBERSEGURIDAD', 'NODE.JS');

INSERT INTO links (categoria, nombre, comentario, direccion) VALUES
  ('ASTRONOMIA', 'NASA', 'Novedades del espacio', 'https://www.nasa.gov'),
  ('ASTRONOMIA', 'ESA', 'Agencia Espacial Europea', 'https://www.esa.int'),
  ('ASTRONOMIA', 'Sky & Telescope', 'Astronomia para aficionados', 'https://skyandtelescope.org'),

  ('CIBERSEGURIDAD', 'OWASP', 'Buenas practicas de seguridad', 'https://owasp.org'),
  ('CIBERSEGURIDAD', 'CISA', 'Alertas y guias', 'https://www.cisa.gov'),
  ('CIBERSEGURIDAD', 'HackerOne Blog', 'Vulnerabilidades y reportes', 'https://www.hackerone.com/blog'),

  ('NODE.JS', 'Node.js Docs', 'Documentacion oficial', 'https://nodejs.org/en/docs'),
  ('NODE.JS', 'Express', 'Framework web', 'https://expressjs.com'),
  ('NODE.JS', 'Socket.IO', 'Tiempo real en web', 'https://socket.io/docs/v4');

COMMIT;
