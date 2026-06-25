import express from 'express';
import { middlewareXSS } from '../middleware/xssValidation.js';
import { EspacioController } from '../controllers/espacioController.js';

const router = express.Router();

router.use(middlewareXSS);

router.get('/usuarios', async (req, res, next) => {
    try {
        const rows = await EspacioController.listarUsuarios();
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.post('/usuarios', async (req, res, next) => {
    try {
        const { nombre, email = null } = req.body;
        const result = await EspacioController.crearUsuario(nombre, email);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

router.get('/estados-solicitudes', async (req, res, next) => {
    try {
        const rows = await EspacioController.listarEstados();
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.get('/espacios', async (req, res, next) => {
    try {
        const rows = await EspacioController.listarEspacios();
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.get('/espacios/:id', async (req, res, next) => {
    try {
        const row = await EspacioController.obtenerEspacioPorId(req.params.id);
        if (!row) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }
        res.json(row);
    } catch (err) {
        next(err);
    }
});

router.post('/espacios', async (req, res, next) => {
    try {
        const { denominacion, idOwner = null, tipoEspacio = 0 } = req.body;
        const result = await EspacioController.crearEspacio(denominacion, idOwner, tipoEspacio);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

router.get('/espacios/:id/miembros', async (req, res, next) => {
    try {
        const rows = await EspacioController.listarMiembros(req.params.id);
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.post('/espacios/:id/solicitudes', async (req, res, next) => {
    try {
        const { idUsuario } = req.body;
        const result = await EspacioController.solicitarIngreso(req.params.id, idUsuario);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

router.put('/espacios/:id/solicitudes/:idUsuario/aprobar', async (req, res, next) => {
    try {
        const { aprobadoPor } = req.body;
        const result = await EspacioController.resolverSolicitud(
            req.params.id,
            req.params.idUsuario,
            aprobadoPor,
            true
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.put('/espacios/:id/solicitudes/:idUsuario/rechazar', async (req, res, next) => {
    try {
        const { aprobadoPor } = req.body;
        const result = await EspacioController.resolverSolicitud(
            req.params.id,
            req.params.idUsuario,
            aprobadoPor,
            false
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.put('/espacios/:id/usuarios/:idUsuario/expulsar', async (req, res, next) => {
    try {
        const { aprobadoPor } = req.body;
        const result = await EspacioController.expulsarUsuario(
            req.params.id,
            req.params.idUsuario,
            aprobadoPor
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
