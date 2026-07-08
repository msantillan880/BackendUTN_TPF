import express from 'express';
import linkController from '../controllers/linkController.js';
import { middlewareXSS } from '../middleware/xssValidation.js';
import asyncHandler from '../Helpers/asyncHandler.helper.js';
import { authJwt } from '../middleware/authJwt.js';

const router = express.Router();

// Aplicar middleware XSS a todas las rutas
router.use(middlewareXSS);
router.use(authJwt);

/**
 * GET /api/links - Obtener todos los links
 */
router.get('/links', asyncHandler(linkController.listarLinks.bind(linkController)));

/**
 * POST /api/links - Crear un nuevo link (REST)
 */
router.post('/links', asyncHandler(linkController.crearLink.bind(linkController)));

/**
 * GET /api/links/:id - Obtener un link por ID
 */
router.get('/links/:id', asyncHandler(linkController.obtenerLinkPorId.bind(linkController)));

/**
 * PATCH /api/links/:id - Actualizar parcialmente un link (REST)
 */
router.patch('/links/:id', asyncHandler(linkController.actualizarLink.bind(linkController)));

/**
 * DELETE /api/links/:id - Eliminar un link (REST)
 */
router.delete('/links/:id', asyncHandler(linkController.eliminarLink.bind(linkController)));

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
