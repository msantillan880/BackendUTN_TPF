import express from 'express';
import { middlewareXSS } from '../middleware/xssValidation.js';
import espacioController from '../controllers/espacioController.js';
import asyncHandler from '../Helpers/asyncHandler.helper.js';
import { authJwt } from '../middleware/authJwt.js';

const router = express.Router();

router.use(middlewareXSS);

// Endpoint de cleanup para pruebas: sin auth por alcance del TP (solo owner/visitante).
router.delete('/usuarios/:id', asyncHandler(espacioController.eliminarUsuario.bind(espacioController)));

router.use(authJwt);

router.get('/usuarios', asyncHandler(espacioController.listarUsuarios.bind(espacioController)));
router.post('/usuarios', asyncHandler(espacioController.crearUsuario.bind(espacioController)));
router.get('/estados-solicitudes', asyncHandler(espacioController.listarEstados.bind(espacioController)));
router.get('/espacios', asyncHandler(espacioController.listarEspacios.bind(espacioController)));
router.get('/espacios/:id', asyncHandler(espacioController.obtenerEspacioPorId.bind(espacioController)));
router.get('/espacios/:id/mi-estado', asyncHandler(espacioController.obtenerMiEstado.bind(espacioController)));
router.post('/espacios', asyncHandler(espacioController.crearEspacio.bind(espacioController)));
router.get('/espacios/:id/miembros', asyncHandler(espacioController.listarMiembros.bind(espacioController)));
router.post('/espacios/:id/solicitudes', asyncHandler(espacioController.solicitarIngreso.bind(espacioController)));
router.put('/espacios/:id/solicitudes/:idUsuario/aprobar', asyncHandler(espacioController.aprobarSolicitud.bind(espacioController)));
router.put('/espacios/:id/solicitudes/:idUsuario/rechazar', asyncHandler(espacioController.rechazarSolicitud.bind(espacioController)));
router.put('/espacios/:id/usuarios/:idUsuario/expulsar', asyncHandler(espacioController.expulsarUsuario.bind(espacioController)));

export default router;
