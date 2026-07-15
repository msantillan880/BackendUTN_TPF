import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import linkController from './linkController.js';
import espacioService from '../services/espacioService.js';
import ServerError from '../Helpers/serverError.helper.js';
import apiResponse from '../Helpers/apiResponse.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ExtraController {

    filtrarLineasDeNegocio(lineas = []) {
        const tagsPermitidos = ['[CREAR]', '[MODIFICAR]', '[BORRAR]', '[BUSCAR]', '[APROBAR]', '[RECHAZAR]', '[EXPULSAR]', '[EXPULSAR-LINKS]'];
        return (lineas || []).filter((linea) => tagsPermitidos.some((tag) => String(linea || '').includes(tag)));
    }


    // =========================
    // LEER PDF
    // =========================
    async leerPdf() {
        return {
            url: "/ExplicacionTPF.pdf"
        };
    }

    // =========================
    // LEER LOG
    // =========================
    async leerLog() {
        const filePath = path.join(process.cwd(), "/src/logs/registro_logs.log");

        const content = fs.readFileSync(filePath, "utf-8");

        return {
            log: content
        };
    }

    // =========================
    // GENERAR HTML BOOKMARKS POR ESPACIO
    // =========================
    async generarHTMLPorEspacio(idEspacio, idUsuarioActor) {
        const espacio = await espacioService.obtenerEspacioPorId(idEspacio);
        if (!espacio) {
            throw new ServerError('Espacio no encontrado', 404);
        }

        const nombreEspacio = String(espacio.denominacion || '').trim();
        const rows = await linkController.buscar(String(idEspacio), '', '', '', idUsuarioActor);
        const rowsOrdenados = [...rows].sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));

        let bgImage = "imagenX.jpg";
        try {
            const imgPath = path.join(__dirname, '..', '..', 'public', 'images', 'imagenX.jpg');
            if (fs.existsSync(imgPath)) {
                const ext = path.extname(imgPath).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
                const data = fs.readFileSync(imgPath).toString('base64');
                bgImage = `data:${mime};base64,${data}`;
            }
        } catch (err) {
            console.warn('No se pudo leer imagen de fondo para incrustar:', err && err.message);
        }

        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BookmarksUTN - ${nombreEspacio}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background-image: url('${bgImage}'); background-size: cover; background-position: center; background-attachment: fixed; font-size: 18px; }
        .container { max-width: 1200px; margin: 0 auto; background: rgba(255,255,255,0.95); padding: 24px; border-radius: 8px; box-shadow: 0 0 14px rgba(0,0,0,0.08); }
        h2 { text-align: center; color: #222; margin: 0 0 16px 0; font-size: 28px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 16px; }
        th, td { padding: 12px 14px; border: 1px solid #ddd; text-align: left; vertical-align: top; }
        th { background: #0033cc; color: #fff; font-weight: 700; }
        tr:nth-child(even) td { background: #f9f9f9; }
        a { color: #0033cc; text-decoration: none; word-break: break-word; }
        a:hover { text-decoration: underline; }
        .small { font-size: 0.95em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>BookmarksUTN - ${nombreEspacio}</h2>
        <table>
            <colgroup>
                <col style="width:25%">
                <col style="width:35%">
                <col style="width:40%">
            </colgroup>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Comentario</th>
                    <th>Direccion</th>
                </tr>
            </thead>
            <tbody>`;

        for (const r of rowsOrdenados) {
            html += `
                <tr>
                    <td>${r.nombre || ''}</td>
                    <td>${r.comentario || ''}</td>
                    <td><a href="${r.direccion || '#'}" target="_blank" rel="noopener noreferrer">${r.direccion || ''}</a></td>
                </tr>`;
        }

        html += `
            </tbody>
        </table>
    </div>
</body>
</html>`;

        return {
            html,
            nombreEspacio
        };
    }

    // =========================
    // HTTP HANDLERS
    // =========================
    async leerPdfHandler(request, response) {
        const result = await this.leerPdf();
        return apiResponse.success(response, result, 'PDF obtenido');
    }

    async leerLogHandler(request, response) {
        const result = await this.leerLog();
        return apiResponse.success(response, result, 'Log obtenido');
    }

    async generarHtmlEspacioDescargaHandler(request, response) {
        const { html, nombreEspacio } = await this.generarHTMLPorEspacio(
            request.params.id,
            request.user.idUsuario
        );
        const safeNombre = String(nombreEspacio || 'espacio').replace(/[^a-zA-Z0-9_-]+/g, '_');
        response.setHeader('Content-Type', 'text/html');
        response.setHeader('Content-Disposition', `attachment; filename=bookmarksUTN-${safeNombre}.html`);
        response.send(html);
    }

    async logViewHandler(request, response) {
        response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', '0');

        const filePath = path.join(__dirname, '../logs/registro_logs.log');

        if (!fs.existsSync(filePath)) {
            return response.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Registro de Logs</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: #f4f4f4;
                    }

                    h1 {
                        color: #333;
                    }

                    .box {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #ccc;
                    }
                </style>
            </head>
            <body>
                <h1>Registro de Logs</h1>
                <div class="box">No hay archivo de logs disponible en este entorno de ejecucion.</div>
            </body>
            </html>
        `);
        }

        const contenido = fs.readFileSync(filePath, 'utf8');
        const lineas = contenido.split('\n').filter(l => l.trim() !== '');
        const lineasFiltradas = this.filtrarLineasDeNegocio(lineas);
        const lineasParaMostrar = lineasFiltradas.length ? lineasFiltradas : lineas;

        function parseTimestampPrefix(line) {
            const part = (line || '').split(' - ')[0] || '';
            const t = Date.parse(part);
            if (!isNaN(t)) return t;
            const alt = new Date(part);
            return isNaN(alt.getTime()) ? 0 : alt.getTime();
        }

        lineasParaMostrar.sort((a, b) => {
            const ta = parseTimestampPrefix(a);
            const tb = parseTimestampPrefix(b);
            return tb - ta;
        });

        const contenidoOrdenado = lineasParaMostrar.join('\n');

        response.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Registro de Logs</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: #f4f4f4;
                    }

                    h1 {
                        color: #333;
                    }

                    pre {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #ccc;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        max-height: 80vh;
                        overflow-y: auto;
                    }
                </style>
            </head>
            <body>
                <h1>Registro de Logs (mas recientes arriba)</h1>
                <pre>${contenidoOrdenado}</pre>
            </body>
            </html>
        `);
    }
}

const extraController = new ExtraController();

export default extraController;