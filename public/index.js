// Función para actualizar la tabla
function updateTable() {
    fetch("/api/links")
        .then((response) => response.json())
        .then((data) => {
            console.log("Datos obtenidos:", data);
            const tableBody = document.getElementsByTagName("tbody")[0];
            tableBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

            data.forEach((link) => {
                const row = tableBody.insertRow();

                // Insertar id en la primera celda (se ocultará vía CSS)
                row.insertCell(0).textContent = link.link_id;
                row.insertCell(1).textContent = link.categoria;
                row.insertCell(2).textContent = link.nombre;
                row.insertCell(3).textContent = link.comentario;
                // Crear link clicable en la columna Direccion
                const cell4 = row.insertCell(4);
                const a = document.createElement('a');
                a.href = link.direccion;
                a.textContent = link.direccion;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                // Evitar que el click en el enlace dispare el evento de seleccion de fila
                a.addEventListener('click', function (e) { e.stopPropagation(); });
                cell4.appendChild(a);
            });

            // Llamar a la función para agregar los eventos de clic a las filas después de actualizar la tabla
            agregarEventosTabla();
        })
        .catch((error) => console.error("Error al obtener los datos:", error));
}

// Actualizar la tabla cuando la página se cargue
function inicializarEventos() {
    updateTable();
}

window.onload = inicializarEventos;

// Socket.IO: disparar registro de sesión en servidor
const socket = io();

socket.on('connect', () => {
    const userAgent = navigator.userAgent;
    socket.emit('registrar_link', {
        user_agent: userAgent
    });
});

socket.on('respuesta_registro', function (data) {
    console.log('Servidor respondió:', data);
});

// Id del registro seleccionado en la tabla (null si no hay selección)
var selectedId = null;

function crear() {
    // Función para crear nuevo registro
    // Obtener los valores de los campos
    var categoria = document.getElementById("categoria").value;
    var nombre = document.getElementById("nombre").value;
    var comentario = document.getElementById("comentario").value;
    var direccion = document.getElementById("direccion").value;

    // Enviar los datos al servidor usando fetch
    fetch("api/crear", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            categoria: categoria,
            nombre: nombre,
            comentario: comentario,
            direccion: direccion,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.success) {
                console.log("Registro exitoso creado");
                limpiar();
                updateTable();
            } else {
                alert("Error al registrar");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function modificar() {
    // Modificar registro seleccionado
    if (!selectedId) {
        alert("Seleccione primero una fila de la tabla para modificar");
        return;
    }

    var categoria = document.getElementById("categoria").value;
    var nombre = document.getElementById("nombre").value;
    var comentario = document.getElementById("comentario").value;
    var direccion = document.getElementById("direccion").value;

    fetch("api/actualizar/" + selectedId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            categoria: categoria,
            nombre: nombre,
            comentario: comentario,
            direccion: direccion,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.success) {
                console.log("Registro actualizado");
                limpiar();
                updateTable();
            } else {
                alert("Error al actualizar");
            }
        })
        .catch((error) => console.error("Error:", error));
}

function borrar() {
    // Borrar registro seleccionado
    if (!selectedId) {
        alert("Seleccione primero una fila de la tabla para borrar");
        return;
    }

    if (!confirm("¿Confirma que desea eliminar el registro seleccionado?")) {
        return;
    }

    fetch("api/eliminar/" + selectedId, { method: "DELETE" })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.success) {
                console.log("Registro eliminado");
                limpiar();
                updateTable();
            } else {
                alert("Error al eliminar");
            }
        })
        .catch((error) => console.error("Error:", error));
}

function buscar() {
    // Buscar registros por los campos del formulario
    var categoria = document.getElementById("categoria").value;
    var nombre = document.getElementById("nombre").value;
    var comentario = document.getElementById("comentario").value;
    var direccion = document.getElementById("direccion").value;
    fetch("api/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            categoria: categoria,
            nombre: nombre,
            comentario: comentario,
            direccion: direccion,
        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                // intentar leer mensaje del servidor
                let errData = {};
                try {
                    errData = await response.json();
                } catch (e) {
                    errData.error = response.statusText || 'Error en la búsqueda';
                }
                alert(errData.error || 'Error en la búsqueda');
                return null;
            }
            return response.json();
        })
        .then((data) => {
            if (!data) return;
            const tableBody = document.getElementsByTagName("tbody")[0];
            tableBody.innerHTML = "";
            data.forEach((link) => {
                const row = tableBody.insertRow();

                row.insertCell(0).textContent = link.link_id;
                row.insertCell(1).textContent = link.categoria;
                row.insertCell(2).textContent = link.nombre;
                row.insertCell(3).textContent = link.comentario;
                const cell4 = row.insertCell(4);
                const a = document.createElement('a');
                a.href = link.direccion;
                a.textContent = link.direccion;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.addEventListener('click', function (e) { e.stopPropagation(); });
                cell4.appendChild(a);
            });

            // Reiniciar selección y agregar eventos
            selectedId = null;
            agregarEventosTabla();
        })
        .catch((error) => {
            console.error("Error al buscar:", error);
            alert('Error conectando con el servidor');
        });
}

function limpiar() {
    // Función para limpiar el formulario
    document.getElementById("categoria").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("comentario").value = "";
    document.getElementById("direccion").value = "";
    // Limpiar selección
    selectedId = null;
    document.querySelectorAll("table tbody tr").forEach(r => r.classList.remove('selected'));
}

function publicar() {
    fetch("/api/generar-html", {
        method: "POST"
    })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "bookmarks.html";

            document.body.appendChild(a);
            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);
        })
        .catch(err => console.log(err));
}

function info() {
    // Función para mostrar información
    window.open("/ExplicacionTPF.pdf", "_blank");
}

function docs() {
    // Función para mostrar información
    fetch("/api/leeDocs", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `leeDocs ok`,
    })
        .then((data) => {
            if (data.error) {
                "Error: " + data.error;
            }
        })
        .catch((error) => {
            console.log("Error:", error);
        });
}

function log() {
    window.open('/api/log-view', '_blank');
}

function salir() {
    // Función para salir
}

// Función que se ejecuta cuando se hace click en una fila de la tabla
function llenarFormulario(fila) {
    // Obtener las celdas de la fila
    let celdas = fila.getElementsByTagName("td");

    // Rellenar los campos del formulario con los valores de la fila
    document.getElementById("categoria").value = celdas[1].innerText;
    document.getElementById("nombre").value = celdas[2].innerText;
    document.getElementById("comentario").value = celdas[3].innerText;
    document.getElementById("direccion").value = celdas[4].innerText;
    // Guardar id seleccionado y resaltar la fila
    selectedId = celdas[0].innerText;

    // Quitar clase selected de otras filas
    document.querySelectorAll("table tbody tr").forEach(r => r.classList.remove('selected'));
    fila.classList.add('selected');
    console.log("id de la fila: ", celdas[0].innerText);
}

// Añadir el evento de click a las filas de la tabla
function agregarEventosTabla() {
    let filas = document.querySelectorAll("table tbody tr");
    filas.forEach(fila => {
        fila.addEventListener("click", function () {
            llenarFormulario(fila);
        });
    });
}

// Alterna la clase 'expanded' en el contenedor del formulario
function toggleForm() {
    const container = document.querySelector('.form-container');
    if (!container) {
        console.warn('toggleForm: .form-container no encontrado');
        return;
    }
    container.classList.toggle('expanded');
}
