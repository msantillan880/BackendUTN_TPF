-- Normalizacion post-import para entorno productivo (Clever Cloud)
-- Objetivo:
-- 1) Garantizar existencia de usuario2 para referencias de auditoria.
-- 2) Completar links.createdBy cuando este NULL.

START TRANSACTION;

-- Asegura usuario2 de pruebas
INSERT INTO Usuarios (nombre, email, passwordHash, emailVerificado)
VALUES (
  'usuario2',
  'prueba.usuario2.bookmarksutn@gmail.com',
  '$2b$10$Py2SNyENRfB/e4L9iqYpOOLZqfSUXyKobhEFsaKFFoTDXCIidqO0S',
  1
)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  passwordHash = VALUES(passwordHash),
  emailVerificado = VALUES(emailVerificado);

SET @u2 = (
  SELECT idUsuario
  FROM Usuarios
  WHERE email = 'prueba.usuario2.bookmarksutn@gmail.com'
  LIMIT 1
);

-- Completa autoria de links legacy sin creador asignado
UPDATE links
SET createdBy = @u2
WHERE createdBy IS NULL;

COMMIT;
