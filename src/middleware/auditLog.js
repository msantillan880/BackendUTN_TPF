import observer from '../utils/observer.js';

function formatQuery(queryObj = {}) {
    const entries = Object.entries(queryObj || {})
        .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
        .map(([key, value]) => `${key}=${String(value).trim()}`);

    if (!entries.length) {
        return 'sin-query';
    }

    return entries.join('&');
}

export function auditLog(request, response, next) {
    const startMs = Date.now();

    response.on('finish', () => {
        try {
            const user = request.user || null;
            const userId = user && Number.isInteger(Number(user.idUsuario)) ? Number(user.idUsuario) : null;
            if (!userId) return;

            const userName = String(user.nombre || 'desconocido');
            const method = String(request.method || 'GET').toUpperCase();
            const route = String(request.originalUrl || request.url || '').split('?')[0];
            const query = formatQuery(request.query || {});
            const status = Number(response.statusCode || 0);
            const elapsed = Date.now() - startMs;

            observer.notificar(
                `[AUDIT] usuario:${userId}(${userName}) metodo:${method} ruta:${route} query:${query} status:${status} t_ms:${elapsed}`
            );
        } catch (_err) {
            // No romper flujo principal por auditoria.
        }
    });

    next();
}
