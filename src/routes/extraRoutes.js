import express from 'express';
import extraController from '../controllers/extraController.js';
import { middlewareXSS } from '../middleware/xssValidation.js';
import asyncHandler from '../Helpers/asyncHandler.helper.js';

const router = express.Router();

router.use(middlewareXSS);

router.post('/espacios/:id/generar-html', asyncHandler(extraController.generarHtmlEspacioDescargaHandler.bind(extraController)));
router.post('/leePdf', asyncHandler(extraController.leerPdfHandler.bind(extraController)));
router.post('/leeLog', asyncHandler(extraController.leerLogHandler.bind(extraController)));
router.get('/log-view', asyncHandler(extraController.logViewHandler.bind(extraController)));

export default router;