import apiResponse from '../Helpers/apiResponse.helper.js';
import authService from '../services/authService.js';
import { renderVerifyEmailPage, shouldRenderHtml } from '../Helpers/authVerifyPage.helper.js';

class AuthController {
    async register(request, response) {
        const { nombre, email, password } = request.body;
        const result = await authService.register(nombre, email, password);
        const message = result?.verificacionEnviada
            ? 'Registro exitoso. Revise su email para verificar la cuenta'
            : 'Registro exitoso. No se pudo enviar el email en este entorno; use verifyUrlDev para verificar la cuenta';
        return apiResponse.created(response, result, message);
    }

    async verifyEmail(request, response) {
        const wantsHtml = shouldRenderHtml(request);

        try {
            const { token = '' } = request.query;
            const result = await authService.verifyEmail(String(token));

            if (wantsHtml) {
                return response
                    .status(200)
                    .type('html')
                    .send(renderVerifyEmailPage({
                        title: 'Email verificado',
                        heading: 'Cuenta verificada',
                        message: 'Su email fue verificado con exito. Ya puede iniciar sesion en BookmarksUTN.',
                        isSuccess: true
                    }));
            }

            return apiResponse.success(response, result, 'Email verificado con exito');
        } catch (error) {
            if (wantsHtml) {
                return response
                    .status(Number(error?.statusCode || 400))
                    .type('html')
                    .send(renderVerifyEmailPage({
                        title: 'Error de verificacion',
                        heading: 'No se pudo verificar el email',
                        message: String(error?.message || 'Token invalido o expirado. Solicite un nuevo enlace.'),
                        isSuccess: false
                    }));
            }

            throw error;
        }
    }

    async login(request, response) {
        const { email, password } = request.body;
        const result = await authService.login(email, password);
        return apiResponse.success(response, result, 'Login exitoso');
    }

    async forgotPassword(request, response) {
        const { email } = request.body;
        const result = await authService.forgotPassword(email);
        return apiResponse.success(response, result, 'Solicitud procesada');
    }

    async resetPassword(request, response) {
        const { token, newPassword } = request.body;
        const result = await authService.resetPassword(token, newPassword);
        return apiResponse.success(response, result, 'Contrasena actualizada con exito');
    }

    async me(request, response) {
        return apiResponse.success(response, { user: request.user }, 'Usuario autenticado');
    }
}

const authController = new AuthController();

export default authController;
