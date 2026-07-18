import ServerError from '../Helpers/serverError.helper.js';
import { verifyAccessToken } from '../utils/token.js';

export function authJwt(request, _response, next) {
    const method = String(request.method || '').toUpperCase();
    const path = String(request.path || '').toLowerCase();
    const isPublicManualRoute =
        (method === 'GET' && path === '/manual-pdf') ||
        (method === 'POST' && path === '/leepdf');

    if (isPublicManualRoute) {
        return next();
    }

    const authHeader = request.headers.authorization || '';
    const tokenFromQuery = String(request.query?.token || '').trim();
    const isLogViewRoute = path === '/log-view';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice('Bearer '.length).trim();
    } else if (isLogViewRoute && tokenFromQuery) {
        token = tokenFromQuery;
    }

    if (!token) {
        return next(new ServerError('Falta token Bearer en Authorization', 401));
    }

    const payload = verifyAccessToken(token);

    request.user = {
        idUsuario: Number(payload.sub),
        email: payload.email,
        nombre: payload.nombre
    };

    return next();
}
