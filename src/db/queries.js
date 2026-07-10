/**
 * 
 * Centraliza todas las queries SQL relacionadas con links
 */
export class Consulta {
  static INSERT_LINK = `
    INSERT INTO links (idEspacio, nombre, comentario, direccion) 
    VALUES (?, ?, ?, ?)
  `;

  static UPDATE = `
    UPDATE links 
    SET idEspacio = ?, nombre = ?, comentario = ?, direccion = ? 
    WHERE link_id = ?
  `;

  static DELETE = `
    DELETE FROM links WHERE link_id = ?
  `;

  static REFRESH = `
    SELECT
      l.link_id,
      l.idEspacio,
      e.denominacion AS espacio,
      l.nombre,
      l.comentario,
      l.direccion,
      l.created_at
    FROM links l
    INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
    ORDER BY e.denominacion DESC, l.link_id DESC
  `;

  static ORDER_HTML = `
    SELECT
      l.link_id,
      l.idEspacio,
      e.denominacion AS espacio,
      l.nombre,
      l.comentario,
      l.direccion,
      l.created_at
    FROM links l
    INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
    ORDER BY e.denominacion ASC, l.nombre ASC
  `;

  static FIND_BY_ID = `
    SELECT
      l.link_id,
      l.idEspacio,
      e.denominacion AS espacio,
      l.nombre,
      l.comentario,
      l.direccion,
      l.created_at
    FROM links l
    INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
    WHERE l.link_id = ?
  `;

  static SEARCH = `
    SELECT
      l.link_id,
      l.idEspacio,
      e.denominacion AS espacio,
      l.nombre,
      l.comentario,
      l.direccion,
      l.created_at
    FROM links l
    INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
    WHERE l.idEspacio = ?
      AND (
        l.nombre LIKE ?
        OR l.comentario LIKE ?
        OR l.direccion LIKE ?
      )
    ORDER BY e.denominacion ASC, l.nombre ASC
  `;
}

export class ConsultaEspacios {
  static INSERT_USUARIO = `
    INSERT INTO Usuarios (nombre, email)
    VALUES (?, ?)
  `;

  static LISTAR_USUARIOS = `
    SELECT idUsuario, nombre, email
    FROM Usuarios
    ORDER BY idUsuario ASC
  `;

  static OBTENER_USUARIO_POR_ID = `
    SELECT idUsuario, nombre, email
    FROM Usuarios
    WHERE idUsuario = ?
    LIMIT 1
  `;

  static COUNT_ESPACIOS_OWNER = `
    SELECT COUNT(*) AS total
    FROM Espacios
    WHERE idOwner = ?
  `;

  static DELETE_LINKS_DE_ESPACIOS_OWNER = `
    DELETE l
    FROM links l
    INNER JOIN Espacios e ON e.idEspacio = l.idEspacio
    WHERE e.idOwner = ?
  `;

  static DELETE_ESPACIOS_BY_OWNER = `
    DELETE FROM Espacios
    WHERE idOwner = ?
  `;

  static DELETE_USUARIO_BY_ID = `
    DELETE FROM Usuarios
    WHERE idUsuario = ?
  `;

  static LISTAR_ESTADOS = `
    SELECT idEstado, descripcion
    FROM EstadosSolicitudes
    ORDER BY idEstado ASC
  `;

  static INSERT_ESPACIO = `
    INSERT INTO Espacios (denominacion, idOwner, tipoEspacio)
    VALUES (?, ?, ?)
  `;

  static LISTAR_ESPACIOS = `
    SELECT e.idEspacio, e.denominacion, e.idOwner, e.tipoEspacio, u.nombre AS ownerNombre
    FROM Espacios e
    LEFT JOIN Usuarios u ON u.idUsuario = e.idOwner
    ORDER BY e.idEspacio ASC
  `;

  static OBTENER_ESPACIO_POR_ID = `
    SELECT e.idEspacio, e.denominacion, e.idOwner, e.tipoEspacio, u.nombre AS ownerNombre
    FROM Espacios e
    LEFT JOIN Usuarios u ON u.idUsuario = e.idOwner
    WHERE e.idEspacio = ?
  `;

  static UPSERT_SOLICITUD = `
    INSERT INTO Espacio_Usuarios (idUsuario, idEspacio, estado, f_solicitud, f_aprobacion, aprobadoPor)
    VALUES (?, ?, ?, NOW(), NULL, NULL)
    ON DUPLICATE KEY UPDATE
      estado = VALUES(estado),
      f_solicitud = NOW(),
      f_aprobacion = NULL,
      aprobadoPor = NULL
  `;

  static UPDATE_ESTADO_SOLICITUD = `
    UPDATE Espacio_Usuarios
    SET estado = ?,
        f_aprobacion = NOW(),
        aprobadoPor = ?
    WHERE idUsuario = ?
      AND idEspacio = ?
  `;

  static LISTAR_MIEMBROS_ESPACIO = `
    SELECT
      eu.idUsuario,
      u.nombre,
      u.email,
      eu.estado,
      es.descripcion AS estadoDescripcion,
      eu.f_solicitud,
      eu.f_aprobacion,
      eu.aprobadoPor
    FROM Espacio_Usuarios eu
    INNER JOIN Usuarios u ON u.idUsuario = eu.idUsuario
    LEFT JOIN EstadosSolicitudes es ON es.idEstado = eu.estado
    WHERE eu.idEspacio = ?
    ORDER BY eu.idUsuario ASC
  `;

  static IS_OWNER_ESPACIO = `
    SELECT 1
    FROM Espacios
    WHERE idEspacio = ? AND idOwner = ?
    LIMIT 1
  `;

  static OBTENER_RELACION_USUARIO_ESPACIO = `
    SELECT estado
    FROM Espacio_Usuarios
    WHERE idUsuario = ? AND idEspacio = ?
    LIMIT 1
  `;

  static LISTAR_CATEGORIAS_ACCESIBLES_USUARIO = `
    SELECT
      e.idEspacio,
      UPPER(TRIM(e.denominacion)) AS categoria
    FROM Espacios e
    LEFT JOIN Espacio_Usuarios eu
      ON eu.idEspacio = e.idEspacio
      AND eu.idUsuario = ?
    WHERE e.idOwner = ? OR eu.estado = 2
    ORDER BY e.denominacion ASC
  `;

  static OBTENER_ESPACIO_POR_CATEGORIA_NORMALIZADA = `
    SELECT idEspacio, denominacion, idOwner, tipoEspacio
    FROM Espacios
    WHERE UPPER(TRIM(denominacion)) = UPPER(TRIM(?))
    LIMIT 1
  `;
}

export class ConsultaAuth {
  static FIND_USER_BY_EMAIL = `
    SELECT
      idUsuario,
      nombre,
      email,
      passwordHash,
      emailVerificado,
      emailVerificationTokenHash,
      emailVerificationExpiresAt
    FROM Usuarios
    WHERE email = ?
    LIMIT 1
  `;

  static INSERT_USER_AUTH = `
    INSERT INTO Usuarios (
      nombre,
      email,
      passwordHash,
      emailVerificado,
      emailVerificationTokenHash,
      emailVerificationExpiresAt
    )
    VALUES (?, ?, ?, 0, ?, ?)
  `;

  static FIND_USER_BY_VERIFY_HASH = `
    SELECT
      idUsuario,
      nombre,
      email,
      emailVerificado,
      emailVerificationExpiresAt
    FROM Usuarios
    WHERE emailVerificationTokenHash = ?
    LIMIT 1
  `;

  static MARK_EMAIL_VERIFIED = `
    UPDATE Usuarios
    SET
      emailVerificado = 1,
      emailVerificationTokenHash = NULL,
      emailVerificationExpiresAt = NULL
    WHERE idUsuario = ?
  `;

  static FIND_USER_LOGIN = `
    SELECT
      idUsuario,
      nombre,
      email,
      passwordHash,
      emailVerificado
    FROM Usuarios
    WHERE email = ?
    LIMIT 1
  `;

  static SET_RESET_PASSWORD_TOKEN = `
    UPDATE Usuarios
    SET
      resetPasswordTokenHash = ?,
      resetPasswordExpiresAt = ?
    WHERE idUsuario = ?
  `;

  static FIND_USER_BY_RESET_HASH = `
    SELECT
      idUsuario,
      email,
      resetPasswordExpiresAt
    FROM Usuarios
    WHERE resetPasswordTokenHash = ?
    LIMIT 1
  `;

  static UPDATE_PASSWORD_BY_USER_ID = `
    UPDATE Usuarios
    SET
      passwordHash = ?,
      resetPasswordTokenHash = NULL,
      resetPasswordExpiresAt = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE idUsuario = ?
  `;
}
