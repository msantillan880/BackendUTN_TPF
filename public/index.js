const USE_MULTIUSER_MOCK = true;

const DEFAULT_MOCK_MEMBERSHIPS = [
    { userId: 1, spaceId: 1, estado: 'aprobado' },
    { userId: 1, spaceId: 2, estado: 'pendiente' },
    { userId: 3, spaceId: 1, estado: 'aprobado' },
    { userId: 4, spaceId: 1, estado: 'pendiente' },
    { userId: 3, spaceId: 3, estado: 'aprobado' }
];

const mockState = {
    currentUserId: 1,
    users: [
        { id: 1, nombre: 'usuario1', email: 'usuario1@mail.com' },
        { id: 2, nombre: 'usuario2', email: 'usuario2@mail.com' },
        { id: 3, nombre: 'usuario3', email: 'usuario3@mail.com' },
        { id: 4, nombre: 'usuario4', email: 'usuario4@mail.com' }
    ],
    spaces: [
        { id: 1, nombre: 'Astronomia', ownerId: 2, tipo: 'publico' },
        { id: 2, nombre: 'Ciberseguridad', ownerId: 2, tipo: 'publico' },
        { id: 3, nombre: 'Node.js', ownerId: 2, tipo: 'publico' }
    ],
    memberships: DEFAULT_MOCK_MEMBERSHIPS.map(m => ({ ...m })),
    linksBySpace: {
        1: [
            { nombre: 'NASA', comentario: 'Novedades del espacio', direccion: 'https://www.nasa.gov' },
            { nombre: 'ESA', comentario: 'Agencia Espacial Europea', direccion: 'https://www.esa.int' },
            { nombre: 'Sky & Telescope', comentario: 'Astronomia para aficionados', direccion: 'https://skyandtelescope.org' }
        ],
        2: [
            { nombre: 'OWASP', comentario: 'Buenas practicas de seguridad', direccion: 'https://owasp.org' },
            { nombre: 'CISA', comentario: 'Alertas y guias', direccion: 'https://www.cisa.gov' },
            { nombre: 'HackerOne Blog', comentario: 'Vulnerabilidades y reportes', direccion: 'https://www.hackerone.com/blog' }
        ],
        3: [
            { nombre: 'Node.js Docs', comentario: 'Documentacion oficial', direccion: 'https://nodejs.org/en/docs' },
            { nombre: 'Express', comentario: 'Framework web', direccion: 'https://expressjs.com' },
            { nombre: 'Socket.IO', comentario: 'Tiempo real en web', direccion: 'https://socket.io/docs/v4' }
        ]
    },
    selectedSpaceId: null
};

function getCurrentUser() {
    return mockState.users.find(u => u.id === mockState.currentUserId) || null;
}

function getOwner(space) {
    return mockState.users.find(u => u.id === space.ownerId) || { nombre: '-' };
}

function getMembership(userId, spaceId) {
    return mockState.memberships.find(m => m.userId === userId && m.spaceId === spaceId) || null;
}

function getSpaceByCategory(categoryName) {
    return mockState.spaces.find(s => s.nombre.toUpperCase() === String(categoryName || '').toUpperCase()) || null;
}

function getAccessState(space) {
    if (space.ownerId === mockState.currentUserId) return 'owner';
    const membership = getMembership(mockState.currentUserId, space.id);
    if (!membership) return 'solicitar';
    if (membership.estado === 'aprobado') return 'autorizado';
    if (membership.estado === 'pendiente') return 'pendiente';
    return 'solicitar';
}

function getStateMeta(state) {
    if (state === 'owner') return { label: 'Autorizado (Owner)', css: 'owner' };
    if (state === 'autorizado') return { label: 'Autorizado', css: 'ok' };
    if (state === 'pendiente') return { label: 'Pendiente', css: 'pending' };
    return { label: 'Solicitar autorizacion', css: 'request' };
}

function canViewSpaceInfo(space) {
    const state = getAccessState(space);
    return state === 'owner' || state === 'autorizado';
}

function canListSpace(space) {
    if (!space) return false;
    if (space.ownerId === mockState.currentUserId) return true;
    const membership = getMembership(mockState.currentUserId, space.id);
    if (membership && membership.estado !== 'expulsado') return true;
    return space.tipo === 'publico';
}

function getMainLinksTbody() {
    return document.querySelector('.table-container tbody');
}

function clearLinkFields() {
    const nombre = document.getElementById('nombre');
    const comentario = document.getElementById('comentario');
    const direccion = document.getElementById('direccion');

    if (nombre) nombre.value = '';
    if (comentario) comentario.value = '';
    if (direccion) direccion.value = '';

    selectedId = null;
    document.querySelectorAll('table tbody tr').forEach(r => r.classList.remove('selected'));
}

function getSelectedSpace() {
    return mockState.spaces.find(s => s.id === mockState.selectedSpaceId) || null;
}

function updateActionButtonsVisibility() {
    const buttonIds = {
        agregar: 'btnAgregar',
        modificar: 'btnModificar',
        borrar: 'btnBorrar',
        buscar: 'btnBuscar',
        limpiar: 'btnLimpiar',
        html: 'btnHtml',
        manual: 'btnManual',
        espacio: 'btnEspacio',
        log: 'btnLog',
        salir: 'btnSalir'
    };

    const selectedSpace = getSelectedSpace();
    const state = selectedSpace ? getAccessState(selectedSpace) : 'solicitar';

    let visibles = ['agregar', 'buscar', 'limpiar', 'html', 'manual', 'salir'];

    // Owner puede ver opciones de gestión adicionales.
    if (state === 'owner') {
        visibles = ['agregar', 'modificar', 'borrar', 'buscar', 'limpiar', 'html', 'manual', 'espacio', 'log', 'salir'];
    }

    Object.entries(buttonIds).forEach(([key, id]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.style.display = visibles.includes(key) ? '' : 'none';
    });
}

function renderLoggedUser() {
    const link = document.getElementById('loggedUserLink');
    const user = getCurrentUser();
    if (!link || !user) return;
    link.textContent = user.nombre;
    link.title = `Usuario simulado: ${user.email}`;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`Usuario simulado: ${user.nombre}\nSin login real en esta etapa.`);
    });

    const btnUser1 = document.getElementById('btnUser1');
    const btnUser2 = document.getElementById('btnUser2');
    if (btnUser1) btnUser1.classList.toggle('active', mockState.currentUserId === 1);
    if (btnUser2) btnUser2.classList.toggle('active', mockState.currentUserId === 2);
}

function switchMockUser(userId) {
    mockState.currentUserId = userId;
    mockState.selectedSpaceId = null;
    // Escenario base fijo para demo.
    mockState.memberships = DEFAULT_MOCK_MEMBERSHIPS.map(m => ({ ...m }));
    renderLoggedUser();
    renderSpaceOptions();
    renderSelectedSpaceStatus();
    renderSelectedSpaceLinksInMainTable();
    updateActionButtonsVisibility();
    hideOwnerSpacePanel();
}

function setMainFormVisible(visible) {
    document.body.classList.toggle('space-mode', !visible);
}

function hideOwnerSpacePanel() {
    const panel = document.getElementById('ownerSpacePanel');
    if (panel) panel.classList.add('hidden');
    setMainFormVisible(true);
}

function toggleUserAuthorization(userId, spaceId) {
    const membership = getMembership(userId, spaceId);

    if (membership && membership.estado === 'aprobado') {
        membership.estado = 'expulsado';
        return;
    }

    if (membership) {
        membership.estado = 'aprobado';
        return;
    }

    mockState.memberships.push({ userId, spaceId, estado: 'aprobado' });
}

function setupOwnerPanelActions() {
    const btnSave = document.getElementById('ownerPanelSaveBtn');
    const btnCancel = document.getElementById('ownerPanelCancelBtn');

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const space = getSelectedSpace();
            if (!space) return;

            const newName = (document.getElementById('ownerPanelSpaceName').value || '').trim();
            const newType = document.getElementById('ownerPanelSpaceType').value;

            if (!newName) {
                alert('El nombre del espacio es obligatorio.');
                return;
            }

            space.nombre = newName;
            space.tipo = newType;

            hideOwnerSpacePanel();
            renderSpaceOptions();
            renderSelectedSpaceStatus();
            renderSelectedSpaceLinksInMainTable();
            updateActionButtonsVisibility();
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            hideOwnerSpacePanel();
            renderSpaceOptions();
            renderSelectedSpaceStatus();
            renderSelectedSpaceLinksInMainTable();
            updateActionButtonsVisibility();
        });
    }
}

function renderOwnerSpacePanel() {
    const panel = document.getElementById('ownerSpacePanel');
    const ownerEmail = document.getElementById('ownerPanelEmail');
    const ownerName = document.getElementById('ownerPanelName');
    const spaceName = document.getElementById('ownerPanelSpaceName');
    const spaceType = document.getElementById('ownerPanelSpaceType');
    const saveBtn = document.getElementById('ownerPanelSaveBtn');
    const tbody = document.getElementById('ownerUsersTableBody');
    const usersTableWrap = panel ? panel.querySelector('.owner-users-table-wrap') : null;
    const privateMessage = document.getElementById('ownerPrivateMessage');
    if (!panel || !ownerEmail || !ownerName || !spaceName || !spaceType || !saveBtn || !tbody) return;

    const space = getSelectedSpace();
    const current = getCurrentUser();
    if (!space || !current) {
        alert('Seleccione un espacio para gestionar.');
        return;
    }

    if (space.ownerId !== mockState.currentUserId) {
        alert('Solo el owner puede ver este panel.');
        return;
    }

    const owner = getOwner(space);
    ownerEmail.value = owner.email || '';
    ownerName.value = owner.nombre || '';
    spaceName.value = space.nombre || '';
    spaceType.value = space.tipo || 'publico';
    saveBtn.textContent = 'Modificar';

    tbody.innerHTML = '';

    const isPrivateSpace = String(space.tipo || '').toLowerCase() === 'privado';
    if (usersTableWrap) {
        usersTableWrap.style.display = isPrivateSpace ? 'none' : '';
    }
    if (privateMessage) {
        privateMessage.classList.toggle('hidden', !isPrivateSpace);
    }

    if (isPrivateSpace) {
        panel.classList.remove('hidden');
        const spaceFormContainer = document.getElementById('spaceFormContainer');
        if (spaceFormContainer) spaceFormContainer.classList.add('hidden');
        setMainFormVisible(false);
        return;
    }

    const users = mockState.users.filter(u => u.id !== space.ownerId).sort((a, b) => a.id - b.id);
    users.forEach((u) => {
        const membership = getMembership(u.id, space.id);
        const status = membership ? membership.estado : 'pendiente';
        const row = document.createElement('tr');

        row.insertCell(0).textContent = u.nombre;
        row.insertCell(1).textContent = status;

        const actionCell = row.insertCell(2);
        const btn = document.createElement('button');
        const isApproved = status === 'aprobado';
        btn.className = `owner-action-btn${isApproved ? ' desauth' : ''}`;
        btn.textContent = isApproved ? 'Expulsar' : 'Aprobar';
        btn.addEventListener('click', () => {
            toggleUserAuthorization(u.id, space.id);
            renderOwnerSpacePanel();
            renderSpaceOptions();
            renderSelectedSpaceStatus();
            renderSelectedSpaceLinksInMainTable();
            updateActionButtonsVisibility();
        });
        actionCell.appendChild(btn);

        tbody.appendChild(row);
    });

    panel.classList.remove('hidden');
    const spaceFormContainer = document.getElementById('spaceFormContainer');
    if (spaceFormContainer) spaceFormContainer.classList.add('hidden');
    setMainFormVisible(false);
}

function setupMockUserSwitcher() {
    const btnUser1 = document.getElementById('btnUser1');
    const btnUser2 = document.getElementById('btnUser2');

    if (btnUser1) {
        btnUser1.addEventListener('click', () => switchMockUser(1));
    }
    if (btnUser2) {
        btnUser2.addEventListener('click', () => switchMockUser(2));
    }
}

function renderSpaceOptions() {
    const select = document.getElementById('categoria');
    if (!select) return;

    select.innerHTML = '';

    const orderedSpaces = [...mockState.spaces].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

    const visibleSpaces = orderedSpaces.filter(canListSpace);

    visibleSpaces.forEach((space) => {
        const owner = getOwner(space);
        const state = getAccessState(space);
        const meta = getStateMeta(state);

        const option = document.createElement('option');
        option.value = space.nombre.toUpperCase();
        option.dataset.spaceId = String(space.id);
        option.textContent = `${space.nombre} | owner: ${owner.nombre} | ${meta.label}`;
        select.appendChild(option);
    });

    if (mockState.selectedSpaceId) {
        const selectedSpace = visibleSpaces.find(s => s.id === mockState.selectedSpaceId);
        if (selectedSpace) {
            select.value = selectedSpace.nombre.toUpperCase();
        } else {
            mockState.selectedSpaceId = null;
        }
    }

    // Sincronizar el estado interno con lo que realmente queda seleccionado en el combo.
    if (!mockState.selectedSpaceId && select.value) {
        const selected = getSpaceByCategory(select.value);
        if (selected && canListSpace(selected)) {
            mockState.selectedSpaceId = selected.id;
        }
    }

    if (!mockState.selectedSpaceId) {
        if (visibleSpaces.length) {
            mockState.selectedSpaceId = visibleSpaces[0].id;
            select.value = visibleSpaces[0].nombre.toUpperCase();
        } else {
            mockState.selectedSpaceId = null;
            select.value = '';
        }
    }

    document.getElementById('categoria').onchange = () => {
        const selected = getSpaceByCategory(select.value);
        mockState.selectedSpaceId = selected ? selected.id : null;
        renderSelectedSpaceStatus();
        renderSelectedSpaceLinksInMainTable();
        updateActionButtonsVisibility();
    };
}

function renderSelectedSpaceStatus() {
    const actionNode = document.getElementById('spaceSelectionAction');
    if (!actionNode) return;

    const space = mockState.spaces.find(s => s.id === mockState.selectedSpaceId);
    if (!space) {
        actionNode.textContent = '-';
        return;
    }

    const state = getAccessState(space);

    if (state === 'solicitar') {
        actionNode.innerHTML = '';
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'action-link';
        link.textContent = 'Solicitar autorizacion';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            solicitarAutorizacion(space.id);
        });
        actionNode.appendChild(link);
    } else {
        actionNode.textContent = state === 'owner' ? 'Owner autorizado' : 'Sin accion';
    }
}

function solicitarAutorizacion(spaceId) {
    const space = mockState.spaces.find(s => s.id === spaceId);
    alert(`Solicitud simulada para ${space ? space.nombre : 'el espacio seleccionado'}.\nEn este mock no se cambia estado.`);
}

function renderSelectedSpaceLinksInMainTable() {
    const tbody = getMainLinksTbody();
    if (!tbody) return;

    tbody.innerHTML = '';
    clearLinkFields();

    const space = getSelectedSpace();
    if (!space) {
        return;
    }

    if (!canViewSpaceInfo(space)) {
        return;
    }

    const links = mockState.linksBySpace[space.id] || [];

    links.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.insertCell(0).textContent = idx + 1;
        row.insertCell(1).textContent = space.nombre.toUpperCase();
        row.insertCell(2).textContent = item.nombre;
        row.insertCell(3).textContent = item.comentario;

        const linkCell = row.insertCell(4);
        const a = document.createElement('a');
        a.href = item.direccion;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = item.direccion;
        linkCell.appendChild(a);

        tbody.appendChild(row);
    });

    agregarEventosTabla();

    // Para owner, dejar cargado por defecto el primer registro si existe.
    const firstRow = tbody.querySelector('tr');
    if (firstRow) {
        llenarFormulario(firstRow);
    }
}

function fillOwnerDefaults() {
    const current = getCurrentUser();
    const email = document.getElementById('ownerEmail');
    const name = document.getElementById('ownerName');
    if (!current || !email || !name) return;
    email.value = current.email;
    name.value = current.nombre;
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    let data = null;

    try {
        data = await response.json();
    } catch (err) {
        data = null;
    }

    if (!response.ok) {
        const message = (data && data.error) || `Error ${response.status}`;
        throw new Error(message);
    }

    return data;
}

async function ensureOwnerInDatabase(nombre, email) {
    if (USE_MULTIUSER_MOCK) {
        const existingMock = (mockState.users || []).find(u =>
            String(u.email || '').toLowerCase() === String(email || '').toLowerCase()
        );

        if (existingMock) {
            return {
                idUsuario: existingMock.id,
                nombre: existingMock.nombre,
                email: existingMock.email
            };
        }

        const nextUserId = (Math.max(...mockState.users.map(u => Number(u.id) || 0), 0) + 1);
        const createdMock = { id: nextUserId, nombre, email };
        mockState.users.push(createdMock);

        return {
            idUsuario: createdMock.id,
            nombre: createdMock.nombre,
            email: createdMock.email
        };
    }

    const users = await requestJson('/api/usuarios');
    const existing = (users || []).find(u =>
        String(u.email || '').toLowerCase() === String(email || '').toLowerCase()
    );

    if (existing) return existing;

    const created = await requestJson('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email })
    });

    return {
        idUsuario: created.idUsuario,
        nombre,
        email
    };
}

async function createSpaceInDatabase(denominacion, idOwner, tipoEspacio) {
    if (USE_MULTIUSER_MOCK) {
        const nextSpaceId = (Math.max(...mockState.spaces.map(s => Number(s.id) || 0), 0) + 1);
        return nextSpaceId;
    }

    const created = await requestJson('/api/espacios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ denominacion, idOwner, tipoEspacio })
    });

    return created && created.idEspacio ? Number(created.idEspacio) : null;
}

function setupSpaceForm() {
    const container = document.getElementById('spaceFormContainer');
    const btnOpen = document.getElementById('btnToggleSpaceForm');
    const btnCancel = document.getElementById('btnCancelSpaceForm');
    const form = document.getElementById('spaceForm');

    if (!container || !btnOpen || !btnCancel || !form) return;

    btnOpen.addEventListener('click', () => {
        const ownerPanel = document.getElementById('ownerSpacePanel');
        if (ownerPanel) ownerPanel.classList.add('hidden');
        container.classList.remove('hidden');
        setMainFormVisible(false);
        fillOwnerDefaults();
    });

    btnCancel.addEventListener('click', () => {
        container.classList.add('hidden');
        setMainFormVisible(true);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ownerEmail = document.getElementById('ownerEmail').value.trim();
        const spaceName = document.getElementById('spaceName').value.trim();
        const ownerName = document.getElementById('ownerName').value.trim();
        const spaceType = document.getElementById('spaceType').value;

        if (!ownerEmail || !spaceName || !ownerName) {
            alert('Complete email owner, nombre espacio y nombre owner.');
            return;
        }

        let ownerDb = null;
        let persistedSpaceId = null;
        try {
            ownerDb = await ensureOwnerInDatabase(ownerName, ownerEmail);
            persistedSpaceId = await createSpaceInDatabase(
                spaceName,
                Number(ownerDb.idUsuario),
                spaceType
            );
        } catch (err) {
            alert(`No se pudo guardar en base de datos: ${err.message}`);
            return;
        }

        let owner = mockState.users.find(u => u.email.toLowerCase() === ownerEmail.toLowerCase());
        if (!owner) {
            const nextUserId = Number(ownerDb && ownerDb.idUsuario) || (Math.max(...mockState.users.map(u => u.id)) + 1);
            owner = { id: nextUserId, nombre: ownerName, email: ownerEmail };
            mockState.users.push(owner);
        }

        const nextSpaceId = persistedSpaceId || (Math.max(...mockState.spaces.map(s => s.id)) + 1);
        const newSpace = {
            id: nextSpaceId,
            nombre: spaceName,
            ownerId: owner.id,
            tipo: spaceType
        };

        mockState.spaces.push(newSpace);
        mockState.linksBySpace[nextSpaceId] = [
            { nombre: `${spaceName} - Link 1`, comentario: 'Demo', direccion: 'https://example.com/1' },
            { nombre: `${spaceName} - Link 2`, comentario: 'Demo', direccion: 'https://example.com/2' },
            { nombre: `${spaceName} - Link 3`, comentario: 'Demo', direccion: 'https://example.com/3' }
        ];

        // Si el espacio lo crea el usuario actual, se considera acceso owner inmediato.
        if (owner.id === mockState.currentUserId) {
            mockState.selectedSpaceId = nextSpaceId;
        }

        form.reset();
        container.classList.add('hidden');
        setMainFormVisible(true);
        renderLoggedUser();
        renderSpaceOptions();
        renderSelectedSpaceStatus();
        renderSelectedSpaceLinksInMainTable();
        updateActionButtonsVisibility();
    });
}

function initMultiuserMock() {
    setupMockUserSwitcher();
    setupOwnerPanelActions();
    renderLoggedUser();
    setupSpaceForm();
    renderSpaceOptions();
    renderSelectedSpaceStatus();
    renderSelectedSpaceLinksInMainTable();
    updateActionButtonsVisibility();
}

// Función para actualizar la tabla
function updateTable() {
    fetch("/api/links")
        .then((response) => response.json())
        .then((data) => {
            console.log("Datos obtenidos:", data);
            const tableBody = document.querySelector(".table-container tbody");
            if (!tableBody) return;
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
    if (USE_MULTIUSER_MOCK) {
        initMultiuserMock();
        return;
    }

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
    if (USE_MULTIUSER_MOCK) {
        const space = getSelectedSpace();
        if (!space || !canViewSpaceInfo(space)) {
            alert('Sin autorizacion para agregar links en este espacio.');
            return;
        }

        const nombre = document.getElementById("nombre").value;
        const comentario = document.getElementById("comentario").value;
        const direccion = document.getElementById("direccion").value;

        if (!nombre || !direccion) {
            alert('Complete al menos nombre y direccion.');
            return;
        }

        if (!mockState.linksBySpace[space.id]) {
            mockState.linksBySpace[space.id] = [];
        }

        mockState.linksBySpace[space.id].push({ nombre, comentario, direccion });
        renderSelectedSpaceLinksInMainTable();
        return;
    }

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
    if (USE_MULTIUSER_MOCK) {
        const space = getSelectedSpace();
        if (!space || !canViewSpaceInfo(space)) {
            alert('Sin autorizacion para modificar links en este espacio.');
            return;
        }

        if (!selectedId) {
            alert("Seleccione primero una fila de la tabla para modificar");
            return;
        }

        const idx = Number(selectedId) - 1;
        const list = mockState.linksBySpace[space.id] || [];
        if (!list[idx]) {
            alert('Link no encontrado.');
            return;
        }

        list[idx] = {
            nombre: document.getElementById("nombre").value,
            comentario: document.getElementById("comentario").value,
            direccion: document.getElementById("direccion").value
        };

        renderSelectedSpaceLinksInMainTable();
        return;
    }

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
    if (USE_MULTIUSER_MOCK) {
        const space = getSelectedSpace();
        if (!space || !canViewSpaceInfo(space)) {
            alert('Sin autorizacion para eliminar links en este espacio.');
            return;
        }

        if (!selectedId) {
            alert("Seleccione primero una fila de la tabla para borrar");
            return;
        }

        if (!confirm("¿Confirma que desea eliminar el registro seleccionado?")) {
            return;
        }

        const idx = Number(selectedId) - 1;
        const list = mockState.linksBySpace[space.id] || [];
        if (idx >= 0 && idx < list.length) {
            list.splice(idx, 1);
        }

        renderSelectedSpaceLinksInMainTable();
        return;
    }

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
    if (USE_MULTIUSER_MOCK) {
        const space = getSelectedSpace();
        if (!space || !canViewSpaceInfo(space)) {
            alert('Sin autorizacion para buscar en este espacio.');
            return;
        }

        const nombre = String(document.getElementById("nombre").value || '').toLowerCase();
        const comentario = String(document.getElementById("comentario").value || '').toLowerCase();
        const direccion = String(document.getElementById("direccion").value || '').toLowerCase();
        const categoria = String(document.getElementById("categoria").value || '').toLowerCase();

        const list = (mockState.linksBySpace[space.id] || []).filter((item) => {
            const byNombre = !nombre || String(item.nombre || '').toLowerCase().includes(nombre);
            const byComentario = !comentario || String(item.comentario || '').toLowerCase().includes(comentario);
            const byDireccion = !direccion || String(item.direccion || '').toLowerCase().includes(direccion);
            const byCategoria = !categoria || String(space.nombre || '').toLowerCase().includes(categoria);
            return byNombre && byComentario && byDireccion && byCategoria;
        });

        const tableBody = document.querySelector(".table-container tbody");
        if (!tableBody) return;
        tableBody.innerHTML = '';

        list.forEach((item, idx) => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = idx + 1;
            row.insertCell(1).textContent = space.nombre.toUpperCase();
            row.insertCell(2).textContent = item.nombre;
            row.insertCell(3).textContent = item.comentario;
            const linkCell = row.insertCell(4);
            const a = document.createElement('a');
            a.href = item.direccion;
            a.textContent = item.direccion;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.addEventListener('click', function (e) { e.stopPropagation(); });
            linkCell.appendChild(a);
        });

        selectedId = null;
        agregarEventosTabla();
        return;
    }

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
            const tableBody = document.querySelector(".table-container tbody");
            if (!tableBody) return;
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

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildHtmlDocument(title, spaceName, links, backgroundImageUrl = '', noticeMessage = '') {
    const safeTitle = escapeHtml(title || 'Bookmarks');
    const safeSpace = escapeHtml((spaceName || '').toUpperCase());
    const safeBackground = escapeHtml(backgroundImageUrl || '');
    const safeNotice = escapeHtml(noticeMessage || '');
    const rows = (links || [])
        .map((item) => {
            const name = escapeHtml(item.nombre || '');
            const url = escapeHtml(item.direccion || '');
            const comment = escapeHtml(item.comentario || '');
            return `
                <tr>
                    <td class="small">${safeSpace}</td>
                    <td>${name}</td>
                    <td>${comment}</td>
                    <td><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></td>
                </tr>`;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${safeTitle}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 24px;
            background: #f2f4f8;
            ${safeBackground ? `background-image: url('${safeBackground}');` : ''}
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            font-size: 18px;
        }
        .container { max-width: 1200px; margin: 0 auto; background: rgba(255,255,255,0.96); padding: 24px; border-radius: 8px; box-shadow: 0 0 14px rgba(0,0,0,0.08); }
        h2 { text-align: center; color: #222; margin: 0 0 16px 0; font-size: 28px; }
        .notice { margin: 0 0 12px 0; padding: 10px 12px; border: 1px solid #f0c36d; background: #fff8e8; color: #7a4f01; font-size: 15px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 16px; }
        th, td { padding: 12px 14px; border: 1px solid #ddd; text-align: left; vertical-align: top; }
        th { background: #0033cc; color: #fff; font-weight: 700; }
        tr:nth-child(even) td { background: #f9f9f9; }
        a { color: #0033cc; text-decoration: none; word-break: break-word; }
        a:hover { text-decoration: underline; }
        .small { font-size: 0.95em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>${safeTitle}</h2>
        ${safeNotice ? `<p class="notice">${safeNotice}</p>` : ''}
        <table>
            <colgroup>
                <col style="width:10%">
                <col style="width:20%">
                <col style="width:40%">
                <col style="width:30%">
            </colgroup>
            <thead>
                <tr>
                    <th>Carpeta</th>
                    <th>Nombre</th>
                    <th>Comentario</th>
                    <th>Dirección</th>
                </tr>
            </thead>
            <tbody>${rows}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

function downloadHtmlContent(filename, htmlContent) {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

async function getBackgroundImageDataUrl() {
    try {
        const response = await fetch('/images/imagenX.jpg');
        if (!response.ok) return '';

        const blob = await response.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        return '';
    }
}

async function publicar() {
    if (USE_MULTIUSER_MOCK) {
        const backgroundImageUrl = await getBackgroundImageDataUrl();
        const space = getSelectedSpace();
        if (!space || !canViewSpaceInfo(space)) {
            const notice = space
                ? `Sin autorizacion para visualizar links de ${space.nombre}.`
                : 'Sin autorizacion para visualizar links de este espacio.';
            const emptyHtml = buildHtmlDocument('Bookmarks', space ? space.nombre : '', [], backgroundImageUrl, notice);
            downloadHtmlContent('bookmarks.html', emptyHtml);
            return;
        }

        const links = mockState.linksBySpace[space.id] || [];
        const html = buildHtmlDocument(`Bookmarks - ${space.nombre}`, space.nombre, links, backgroundImageUrl);
        downloadHtmlContent(`bookmarks-${space.nombre}.html`, html);
        return;
    }

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
    if (USE_MULTIUSER_MOCK) {
        renderOwnerSpacePanel();
        return;
    }

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
    if (USE_MULTIUSER_MOCK) {
        hideOwnerSpacePanel();
        return;
    }
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
