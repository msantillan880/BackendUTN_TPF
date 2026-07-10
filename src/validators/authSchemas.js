import { z } from 'zod';

export const registerSchema = z.object({
    nombre: z
        .string({ required_error: 'nombre es obligatorio' })
        .trim()
        .min(2, 'nombre debe tener al menos 2 caracteres')
        .max(120, 'nombre supera el maximo permitido'),
    email: z
        .string({ required_error: 'email es obligatorio' })
        .trim()
        .email('email invalido')
        .max(190, 'email supera el maximo permitido'),
    password: z
        .string({ required_error: 'password es obligatorio' })
        .min(8, 'password debe tener al menos 8 caracteres')
        .max(120, 'password supera el maximo permitido')
});

export const loginSchema = z.object({
    email: z
        .string({ required_error: 'email es obligatorio' })
        .trim()
        .email('email invalido'),
    password: z
        .string({ required_error: 'password es obligatorio' })
        .min(1, 'password es obligatorio')
});

export const forgotPasswordSchema = z.object({
    email: z
        .string({ required_error: 'email es obligatorio' })
        .trim()
        .email('email invalido')
});

export const resetPasswordSchema = z.object({
    token: z
        .string({ required_error: 'token es obligatorio' })
        .trim()
        .min(20, 'token invalido'),
    newPassword: z
        .string({ required_error: 'newPassword es obligatorio' })
        .min(8, 'newPassword debe tener al menos 8 caracteres')
        .max(120, 'newPassword supera el maximo permitido')
});
