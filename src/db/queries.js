/**
 * 
 * Centraliza todas las queries SQL relacionadas con links
 */
export class Consulta {
  static INSERT_LINK = `
    INSERT INTO links (categoria, nombre, comentario, direccion) 
    VALUES (?, ?, ?, ?)
  `;

  static UPDATE = `
    UPDATE links 
    SET categoria = ?, nombre = ?, comentario = ?, direccion = ? 
    WHERE link_id = ?
  `;

  static DELETE = `
    DELETE FROM links WHERE link_id = ?
  `;

  static REFRESH = `
    SELECT * FROM links ORDER BY categoria DESC
  `;

  static ORDER_HTML = `
    SELECT * FROM links ORDER BY categoria ASC
  `;

  static FIND_BY_ID = `
    SELECT * FROM links WHERE link_id = ?
  `;

  static SEARCH = `
    SELECT * FROM links 
    WHERE categoria LIKE ? 
    OR nombre LIKE ? 
    OR comentario LIKE ? 
    OR direccion LIKE ?
    ORDER BY categoria ASC
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
}
