export function shouldRenderHtml(request) {
    const forceJson = String(request.query?.format || '').toLowerCase() === 'json';
    if (forceJson) return false;

    const accept = String(request.headers.accept || '').toLowerCase();
    const fetchDest = String(request.headers['sec-fetch-dest'] || '').toLowerCase();

    return accept.includes('text/html') || fetchDest === 'document';
}

export function renderVerifyEmailPage({ title, heading, message, isSuccess }) {
    const color = isSuccess ? '#166534' : '#991b1b';
    const bg = isSuccess ? '#f0fdf4' : '#fef2f2';
    const border = isSuccess ? '#86efac' : '#fecaca';

    return `<!doctype html>
<html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe5f1;">
                        <tr>
                            <td style="padding:24px;">
                                <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;color:#0f3f76;">BookmarksUTN</h1>
                                <div style="background:${bg};border:1px solid ${border};padding:14px;">
                                    <h2 style="margin:0 0 8px 0;font-size:22px;color:${color};">${heading}</h2>
                                    <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">${message}</p>
                                </div>
                                <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;">Ya puede cerrar esta pestaña y volver a la aplicacion.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}
