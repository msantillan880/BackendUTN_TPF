/**
 * Clase Mensaje - Centraliza mensajes de la aplicación
 * 
 */
export class Mensaje {
  static BBDD_VALIDO = "Se conectó exitosamente a la base de datos";
  static BBDD_INVALIDO = "Error al conectarse a la base de datos";
  static CREATE_INVALIDO = "Por favor complete todos los campos obligatorios!";
  static CREATE_ERROR = "Error al crear un registro";
  static BUSCAR_INVALIDO = "Por favor complete alguno de los campos para una búsqueda";
  static UPDATE_INVALIDO = "Por favor complete todos los campos obligatorios!";
  static BORRAR_VALIDO = "¿Elimina el registro?";
  static HTML_MSG = "Se publicó la página HTML";
  static GRAL_EXCEPTION = "Ocurrió un error, lo siento!";
}
