import ServerError from '../Helpers/serverError.helper.js';
import { verifyAccessToken } from '../utils/token.js';

export function authJwt(request, _response, next) {
    const authHeader = request.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return next(new ServerError('Falta token Bearer en Authorization', 401));
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
        return next(new ServerError('Token vacio', 401));
    }

    const payload = verifyAccessToken(token);

    request.user = {
        idUsuario: Number(payload.sub),
        email: payload.email,
        nombre: payload.nombre
    };

    return next();
}
