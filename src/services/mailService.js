import nodemailer from 'nodemailer';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5000';
const SMTP_SERVICE = process.env.SMTP_SERVICE || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = String(process.env.SMTP_FROM || 'BookmarksUTN <no-reply@bookmarksutn.local>')
    .replace(/[\r\n]+/g, ' ')
    .trim();

const SMTP_CONNECTION_TIMEOUT_MS = process.env.SMTP_CONNECTION_TIMEOUT_MS
    ? Number(process.env.SMTP_CONNECTION_TIMEOUT_MS)
    : 10000;
const SMTP_GREETING_TIMEOUT_MS = process.env.SMTP_GREETING_TIMEOUT_MS
    ? Number(process.env.SMTP_GREETING_TIMEOUT_MS)
    : 10000;
const SMTP_SOCKET_TIMEOUT_MS = process.env.SMTP_SOCKET_TIMEOUT_MS
    ? Number(process.env.SMTP_SOCKET_TIMEOUT_MS)
    : 15000;

let transporter;

function buildSimpleEmailHtml({
    title,
    message,
    buttonLabel,
    buttonUrl,
    note
}) {
    return `
<!doctype html>
<html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dbe5f1;">
                        <tr>
                            <td style="padding:24px;">
                                <h2 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#0f3f76;">${title}</h2>
                                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#334155;">${message}</p>
                                <p style="margin:0 0 20px 0;">
                                    <a href="${buttonUrl}" style="display:inline-block;background:#0b63c7;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:4px;font-weight:700;">${buttonLabel}</a>
                                </p>
                                <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#475569;">Si el boton no funciona, copie y pegue este enlace en su navegador:</p>
                                <p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;word-break:break-all;">
                                    <a href="${buttonUrl}" style="color:#0b63c7;text-decoration:underline;">${buttonUrl}</a>
                                </p>
                                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">${note}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}

function getTransporter() {
    if (transporter) return transporter;

    const timeoutOptions = {
        connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
        socketTimeout: SMTP_SOCKET_TIMEOUT_MS
    };

    if (SMTP_SERVICE && SMTP_USER) {
        transporter = nodemailer.createTransport({
            service: SMTP_SERVICE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            },
            ...timeoutOptions
        });
    } else if (SMTP_HOST && SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            },
            ...timeoutOptions
        });
    } else {
        // Fallback para desarrollo local: no envia email real, pero permite probar el flujo.
        transporter = nodemailer.createTransport({
            jsonTransport: true
        });
    }

    return transporter;
}

class MailService {
    async enviarVerificacionEmail(emailDestino, verificationToken) {
        const verifyUrl = `${APP_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
        const html = buildSimpleEmailHtml({
            title: 'Activacion de cuenta',
            message: 'Bienvenido a BookmarksUTN. Para activar su cuenta, haga click en el siguiente boton.',
            buttonLabel: 'Verificar cuenta',
            buttonUrl: verifyUrl,
            note: 'Si usted no creo esta cuenta, puede ignorar este mensaje.'
        });

        try {
            const info = await getTransporter().sendMail({
                from: SMTP_FROM,
                to: emailDestino,
                subject: 'Activacion de cuenta - BookmarksUTN',
                text: `Bienvenido. Verifica tu cuenta en: ${verifyUrl}`,
                html
            });

            return {
                success: true,
                preview: info?.message || null,
                messageId: info?.messageId || null,
                verifyUrl
            };
        } catch (error) {
            console.error('No se pudo enviar email de verificacion:', error && error.message);
            return {
                success: false,
                preview: null,
                messageId: null,
                verifyUrl,
                error: String(error && error.message || 'Error SMTP')
            };
        }
    }

    async enviarResetPassword(emailDestino, resetToken) {
        const resetUrl = `${APP_BASE_URL}/public/index.html?resetToken=${encodeURIComponent(resetToken)}`;
        const html = buildSimpleEmailHtml({
            title: 'Recuperacion de contrasena',
            message: 'Recibimos una solicitud para restablecer su contrasena. Use el boton para continuar.',
            buttonLabel: 'Restablecer contrasena',
            buttonUrl: resetUrl,
            note: 'Si usted no solicito este cambio, ignore este correo.'
        });

        try {
            const info = await getTransporter().sendMail({
                from: SMTP_FROM,
                to: emailDestino,
                subject: 'Recuperacion de contrasena - BookmarksUTN',
                text: `Recibimos una solicitud para restablecer tu contrasena. Usa este enlace: ${resetUrl}`,
                html
            });

            return {
                success: true,
                preview: info?.message || null,
                messageId: info?.messageId || null,
                resetUrl
            };
        } catch (error) {
            console.error('No se pudo enviar email de recuperacion:', error && error.message);
            return {
                success: false,
                preview: null,
                messageId: null,
                resetUrl,
                error: String(error && error.message || 'Error SMTP')
            };
        }
    }
}

const mailService = new MailService();

export default mailService;
