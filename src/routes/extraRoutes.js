import express from 'express';
import extraController from '../controllers/extraController.js';
import { middlewareXSS } from '../middleware/xssValidation.js';
import asyncHandler from '../Helpers/asyncHandler.helper.js';
import { authJwt } from '../middleware/authJwt.js';

const router = express.Router();

router.use(middlewareXSS);

// Publico: acceso al manual sin requerir token.
router.post('/leePdf', asyncHandler(extraController.leerPdfHandler.bind(extraController)));
router.get('/manual-pdf', asyncHandler(extraController.manualPdfHandler.bind(extraController)));

// Protegido: requiere sesion para operaciones de negocio y logs.
router.use(authJwt);
router.post('/espacios/:id/generar-html', asyncHandler(extraController.generarHtmlEspacioDescargaHandler.bind(extraController)));
router.post('/leeLog', asyncHandler(extraController.leerLogHandler.bind(extraController)));
router.get('/log-view', asyncHandler(extraController.logViewHandler.bind(extraController)));

export default router;