import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import ServerError from '../Helpers/serverError.helper.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_cambiar';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';

export function generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

export function hashEmailVerificationToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.idUsuario,
            email: user.email,
            nombre: user.nombre
        },
        JWT_ACCESS_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES }
    );
}

export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (error) {
        throw new ServerError('Token invalido o expirado', 401);
    }
}
