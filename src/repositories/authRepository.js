import db from '../config/db.js';
import { ConsultaAuth } from '../db/queries.js';

function queryOne(sql, params = []) {
    return db.execute(sql, params).then(([rows]) => (rows && rows[0]) || null);
}

function queryRun(sql, params = []) {
    return db.execute(sql, params).then(([result]) => result);
}

class AuthRepository {
    async findByEmail(email) {
        return queryOne(ConsultaAuth.FIND_USER_BY_EMAIL, [email]);
    }

    async insertUserAuth(nombre, email, passwordHash, tokenHash, expiresAt) {
        return queryRun(ConsultaAuth.INSERT_USER_AUTH, [
            nombre,
            email,
            passwordHash,
            tokenHash,
            expiresAt
        ]);
    }

    async findByEmailVerificationHash(tokenHash) {
        return queryOne(ConsultaAuth.FIND_USER_BY_VERIFY_HASH, [tokenHash]);
    }

    async markEmailVerified(idUsuario) {
        return queryRun(ConsultaAuth.MARK_EMAIL_VERIFIED, [idUsuario]);
    }

    async findUserForLogin(email) {
        return queryOne(ConsultaAuth.FIND_USER_LOGIN, [email]);
    }

    async setResetPasswordToken(idUsuario, tokenHash, expiresAt) {
        return queryRun(ConsultaAuth.SET_RESET_PASSWORD_TOKEN, [
            tokenHash,
            expiresAt,
            idUsuario
        ]);
    }

    async findByResetPasswordHash(tokenHash) {
        return queryOne(ConsultaAuth.FIND_USER_BY_RESET_HASH, [tokenHash]);
    }

    async updatePasswordByUserId(idUsuario, passwordHash) {
        return queryRun(ConsultaAuth.UPDATE_PASSWORD_BY_USER_ID, [
            passwordHash,
            idUsuario
        ]);
    }
}

const authRepository = new AuthRepository();

export default authRepository;
