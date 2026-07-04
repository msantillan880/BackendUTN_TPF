import express from 'express';
import linkController from '../controllers/linkController.js';
import { middlewareXSS } from '../middleware/xssValidation.js';
import asyncHandler from '../Helpers/asyncHandler.helper.js';

const router = express.Router();

// Aplicar middleware XSS a todas las rutas
router.use(middlewareXSS);

/**
 * GET /api/links - Obtener todos los links
 */
router.get('/links', asyncHandler(linkController.listarLinks.bind(linkController)));

/**
 * GET /api/links/:id - Obtener un link por ID
 */
router.get('/links/:id', asyncHandler(linkController.obtenerLinkPorId.bind(linkController)));

/**
 * POST /api/crear - Crear un nuevo link
 */
router.post('/crear', asyncHandler(linkController.crearLink.bind(linkController)));

/**
 * PUT /api/actualizar/:id - Actualizar un link
 */
router.put('/actualizar/:id', asyncHandler(linkController.actualizarLink.bind(linkController)));

/**
 * DELETE /api/eliminar/:id - Eliminar un link
 */
router.delete('/eliminar/:id', asyncHandler(linkController.eliminarLink.bind(linkController)));

/**
 * POST /api/buscar - Buscar links
 */
router.post('/buscar', asyncHandler(linkController.buscarLinks.bind(linkController)));

export default router;
