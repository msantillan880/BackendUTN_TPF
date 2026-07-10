import express from 'express';
import authController from '../controllers/authController.js';
import asyncHandler from '../Helpers/asyncHandler.helper.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema
} from '../validators/authSchemas.js';
import { authJwt } from '../middleware/authJwt.js';

const router = express.Router();

router.post('/auth/register', validateRequest(registerSchema), asyncHandler(authController.register.bind(authController)));
router.get('/auth/verify-email', asyncHandler(authController.verifyEmail.bind(authController)));
router.post('/auth/login', validateRequest(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/auth/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(authController.forgotPassword.bind(authController)));
router.post('/auth/reset-password', validateRequest(resetPasswordSchema), asyncHandler(authController.resetPassword.bind(authController)));
router.get('/auth/me', authJwt, asyncHandler(authController.me.bind(authController)));

export default router;
