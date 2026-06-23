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
