import nodemailer from 'nodemailer';

function cleanEnv(value, fallback = '') {
    if (value === undefined || value === null) return fallback;
    return String(value).replace(/[\r\n]+/g, ' ').trim();
}

function parsePositiveInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
}

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5000';
const MAIL_PROVIDER = cleanEnv(process.env.MAIL_PROVIDER, 'auto').toLowerCase();
const SMTP_SERVICE = cleanEnv(process.env.SMTP_SERVICE);
const SMTP_HOST = cleanEnv(process.env.SMTP_HOST);
const SMTP_PORT = parsePositiveInt(process.env.SMTP_PORT, 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = cleanEnv(process.env.SMTP_USER);
const SMTP_PASS = cleanEnv(process.env.SMTP_PASS);
const SMTP_FROM = cleanEnv(process.env.SMTP_FROM, 'BookmarksUTN <no-reply@bookmarksutn.local>');

const SMTP_CONNECTION_TIMEOUT_MS = parsePositiveInt(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10000);
const SMTP_GREETING_TIMEOUT_MS = parsePositiveInt(process.env.SMTP_GREETING_TIMEOUT_MS, 10000);
const SMTP_SOCKET_TIMEOUT_MS = parsePositiveInt(process.env.SMTP_SOCKET_TIMEOUT_MS, 15000);
const SMTP_FORCE_IPV4 = String(process.env.SMTP_FORCE_IPV4 || 'true').toLowerCase() === 'true';
const BREVO_API_KEY = cleanEnv(process.env.BREVO_API_KEY);
const BREVO_SENDER_EMAIL = cleanEnv(process.env.BREVO_SENDER_EMAIL);
const BREVO_SENDER_NAME = cleanEnv(process.env.BREVO_SENDER_NAME, 'BookmarksUTN');

let transporter;

function createSmtpTransport({ host, port, secure }) {
    const timeoutOptions = {
        connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
        socketTimeout: SMTP_SOCKET_TIMEOUT_MS
    };

    const networkOptions = SMTP_FORCE_IPV4 ? { family: 4 } : {};

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        ...networkOptions,
        ...timeoutOptions
    });
}

function isSmtpConfigured() {
    if (SMTP_SERVICE && SMTP_USER) return true;
    if (SMTP_HOST && SMTP_USER) return true;
    return false;
}

function canUseBrevoApi() {
    return Boolean(BREVO_API_KEY && BREVO_SENDER_EMAIL);
}

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

    if (SMTP_HOST && SMTP_USER) {
        transporter = createSmtpTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE
        });
    } else if (SMTP_SERVICE && SMTP_USER) {
        const timeoutOptions = {
            connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
            greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
            socketTimeout: SMTP_SOCKET_TIMEOUT_MS
        };
        const networkOptions = SMTP_FORCE_IPV4 ? { family: 4 } : {};

        transporter = nodemailer.createTransport({
            service: SMTP_SERVICE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            },
            ...networkOptions,
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
    async sendWithSmtp({ to, subject, text, html }) {
        const payload = {
            from: SMTP_FROM,
            to,
            subject,
            text,
            html
        };

        try {
            const info = await getTransporter().sendMail(payload);

            return {
                success: true,
                preview: info?.message || null,
                messageId: info?.messageId || null
            };
        } catch (error) {
            const msg = String(error && error.message || '').toLowerCase();
            const code = String(error && error.code || '').toUpperCase();
            const isConnTimeout = code === 'ETIMEDOUT' || msg.includes('connection timeout');
            const isGmailHost = String(SMTP_HOST || '').toLowerCase().includes('gmail.com');

            if (isConnTimeout && isGmailHost) {
                const retryPort = SMTP_PORT === 465 ? 587 : 465;
                const retrySecure = retryPort === 465;

                const retryTransporter = createSmtpTransport({
                    host: SMTP_HOST,
                    port: retryPort,
                    secure: retrySecure
                });

                const retryInfo = await retryTransporter.sendMail(payload);
                return {
                    success: true,
                    preview: retryInfo?.message || null,
                    messageId: retryInfo?.messageId || null
                };
            }

            throw error;
        }
    }

    async sendWithBrevoApi({ to, subject, text, html }) {
        if (!canUseBrevoApi()) {
            return {
                success: false,
                error: 'BREVO_API_KEY o BREVO_SENDER_EMAIL no configurado'
            };
        }

        if (typeof fetch !== 'function') {
            return {
                success: false,
                error: 'fetch no disponible en runtime para envio por API'
            };
        }

        const payload = {
            sender: {
                name: BREVO_SENDER_NAME,
                email: BREVO_SENDER_EMAIL
            },
            to: [
                { email: to }
            ],
            subject,
            htmlContent: html,
            textContent: text
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY
            },
            body: JSON.stringify(payload)
        });

        const raw = await response.text();
        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        } catch (_err) {
            parsed = null;
        }

        if (!response.ok) {
            const detail = parsed?.message || parsed?.code || raw || `HTTP ${response.status}`;
            return {
                success: false,
                error: `Brevo API error: ${detail}`
            };
        }

        return {
            success: true,
            preview: null,
            messageId: parsed?.messageId || parsed?.messageIds?.[0] || null
        };
    }

    async sendMailWithFallback({ to, subject, text, html }) {
        const wantsBrevo = MAIL_PROVIDER === 'brevo';
        const wantsSmtp = MAIL_PROVIDER === 'smtp';

        if (wantsBrevo) {
            return this.sendWithBrevoApi({ to, subject, text, html });
        }

        if (!wantsBrevo && (wantsSmtp || isSmtpConfigured())) {
            const smtpResult = await this.sendWithSmtp({ to, subject, text, html })
                .catch((error) => ({
                    success: false,
                    error: String(error && error.message || 'Error SMTP'),
                    code: String(error && error.code || ''),
                    command: String(error && error.command || '')
                }));

            if (smtpResult.success) {
                return smtpResult;
            }

            if (canUseBrevoApi() && !wantsSmtp) {
                const brevoResult = await this.sendWithBrevoApi({ to, subject, text, html });
                if (brevoResult.success) {
                    console.warn(`SMTP fallo y se uso fallback Brevo API: ${smtpResult.error}`);
                } else {
                    console.error(`SMTP fallo (${smtpResult.error}) y fallback Brevo tambien fallo: ${brevoResult.error}`);
                }
                return brevoResult;
            }

            return smtpResult;
        }

        if (canUseBrevoApi()) {
            return this.sendWithBrevoApi({ to, subject, text, html });
        }

        // Fallback local: mantiene flujo en desarrollo sin proveedor real.
        return this.sendWithSmtp({ to, subject, text, html });
    }

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
            const result = await this.sendMailWithFallback({
                to: emailDestino,
                subject: 'Activacion de cuenta - BookmarksUTN',
                text: `Bienvenido. Verifica tu cuenta en: ${verifyUrl}`,
                html
            });

            if (!result.success) {
                const debug = [result.code, result.command].filter(Boolean).join('|');
                const detail = debug ? `${result.error || 'Error SMTP'} [${debug}]` : (result.error || 'Error SMTP');
                throw new Error(detail);
            }

            return {
                success: true,
                preview: result?.preview || null,
                messageId: result?.messageId || null,
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
            const result = await this.sendMailWithFallback({
                to: emailDestino,
                subject: 'Recuperacion de contrasena - BookmarksUTN',
                text: `Recibimos una solicitud para restablecer tu contrasena. Usa este enlace: ${resetUrl}`,
                html
            });

            if (!result.success) {
                const debug = [result.code, result.command].filter(Boolean).join('|');
                const detail = debug ? `${result.error || 'Error SMTP'} [${debug}]` : (result.error || 'Error SMTP');
                throw new Error(detail);
            }

            return {
                success: true,
                preview: result?.preview || null,
                messageId: result?.messageId || null,
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
