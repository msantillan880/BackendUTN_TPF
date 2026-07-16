import bcrypt from 'bcrypt';
import ServerError from '../Helpers/serverError.helper.js';
import authRepository from '../repositories/authRepository.js';
import mailService from './mailService.js';
import {
    generateAccessToken,
    generateEmailVerificationToken,
    hashEmailVerificationToken
} from '../utils/token.js';

const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? Number(process.env.BCRYPT_SALT_ROUNDS) : 10;
const EMAIL_VERIFY_TTL_HOURS = process.env.EMAIL_VERIFY_TTL_HOURS
    ? Number(process.env.EMAIL_VERIFY_TTL_HOURS)
    : 24;
const RESET_PASSWORD_TTL_MINUTES = process.env.RESET_PASSWORD_TTL_MINUTES
    ? Number(process.env.RESET_PASSWORD_TTL_MINUTES)
    : 30;

class AuthService {
    constructor(repository = authRepository) {
        this.repository = repository;
    }

    async register(nombre, email, password) {
        const normalizedEmail = String(email).trim().toLowerCase();

        const existing = await this.repository.findByEmail(normalizedEmail);
        if (existing) {
            throw new ServerError('Ya existe un usuario con ese email', 409);
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const verificationToken = generateEmailVerificationToken();
        const verificationTokenHash = hashEmailVerificationToken(verificationToken);
        const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000);

        const result = await this.repository.insertUserAuth(
            nombre,
            normalizedEmail,
            passwordHash,
            verificationTokenHash,
            expiresAt
        );

        const mailResult = await mailService.enviarVerificacionEmail(normalizedEmail, verificationToken);

        if (!mailResult?.success) {
            try {
                await this.repository.deleteUserById(result.insertId);
            } catch (_rollbackError) {
                // Si falla rollback, igualmente reportar error de envio.
            }

            throw new ServerError(
                'No se pudo enviar el email de verificacion. Intente nuevamente en unos minutos.',
                503
            );
        }

        return {
            success: true,
            idUsuario: result.insertId,
            email: normalizedEmail,
            verificacionEnviada: true,
            verifyUrlDev: mailResult?.verifyUrl,
            mailError: null
        };
    }

    async verifyEmail(token) {
        if (!token) {
            throw new ServerError('Token de verificacion requerido', 400);
        }

        const tokenHash = hashEmailVerificationToken(token);
        const user = await this.repository.findByEmailVerificationHash(tokenHash);

        if (!user) {
            throw new ServerError('Token de verificacion invalido', 400);
        }

        if (user.emailVerificado) {
            return { success: true, alreadyVerified: true };
        }

        const expires = user.emailVerificationExpiresAt ? new Date(user.emailVerificationExpiresAt) : null;
        if (!expires || Number.isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
            throw new ServerError('Token de verificacion expirado', 400);
        }

        await this.repository.markEmailVerified(user.idUsuario);

        return {
            success: true,
            idUsuario: user.idUsuario,
            email: user.email,
            emailVerificado: true
        };
    }

    async login(email, password) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await this.repository.findUserForLogin(normalizedEmail);

        if (!user) {
            throw new ServerError('Credenciales invalidas', 401);
        }

        if (!user.passwordHash) {
            throw new ServerError('Credenciales invalidas', 401);
        }

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) {
            throw new ServerError('Credenciales invalidas', 401);
        }

        if (!user.emailVerificado) {
            throw new ServerError('Debe verificar su email antes de iniciar sesion', 403);
        }

        const accessToken = generateAccessToken(user);

        return {
            success: true,
            tokenType: 'Bearer',
            accessToken,
            user: {
                idUsuario: user.idUsuario,
                nombre: user.nombre,
                email: user.email
            }
        };
    }

    async forgotPassword(email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await this.repository.findByEmail(normalizedEmail);

        // No revelar si el email existe o no.
        if (!user) {
            return {
                success: true,
                message: 'Si el email existe, se envio un enlace de recuperacion'
            };
        }

        const resetToken = generateEmailVerificationToken();
        const resetTokenHash = hashEmailVerificationToken(resetToken);
        const expiresAt = new Date(Date.now() + RESET_PASSWORD_TTL_MINUTES * 60 * 1000);

        await this.repository.setResetPasswordToken(user.idUsuario, resetTokenHash, expiresAt);
        const mailResult = await mailService.enviarResetPassword(normalizedEmail, resetToken);

        return {
            success: true,
            message: 'Si el email existe, se envio un enlace de recuperacion',
            resetUrlDev: mailResult?.resetUrl,
            recuperacionEnviada: Boolean(mailResult?.success)
        };
    }

    async resetPassword(token, newPassword) {
        if (!token) {
            throw new ServerError('Token de recuperacion requerido', 400);
        }

        const tokenHash = hashEmailVerificationToken(token);
        const user = await this.repository.findByResetPasswordHash(tokenHash);

        if (!user) {
            throw new ServerError('Token de recuperacion invalido', 400);
        }

        const expires = user.resetPasswordExpiresAt ? new Date(user.resetPasswordExpiresAt) : null;
        if (!expires || Number.isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
            throw new ServerError('Token de recuperacion expirado', 400);
        }

        const newPasswordHash = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
        await this.repository.updatePasswordByUserId(user.idUsuario, newPasswordHash);

        return {
            success: true,
            idUsuario: user.idUsuario,
            email: user.email
        };
    }
}

const authService = new AuthService();

export default authService;
