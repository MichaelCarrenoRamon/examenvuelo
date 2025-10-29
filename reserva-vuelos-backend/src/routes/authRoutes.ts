import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { verificarToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/registro
 * @desc    Registra un nuevo usuario
 * @access  Público
 */
router.post('/registro', AuthController.registrar);

/**
 * @route   POST /api/auth/login
 * @desc    Inicia sesión de usuario
 * @access  Público
 */
router.post('/login', AuthController.login);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtiene el perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', verificarToken, AuthController.perfil);

/**
 * @route   PUT /api/auth/perfil
 * @desc    Actualiza el perfil del usuario
 * @access  Privado
 */
router.put('/perfil', verificarToken, AuthController.actualizarPerfil);

/**
 * @route   DELETE /api/auth/cuenta
 * @desc    Desactiva la cuenta del usuario
 * @access  Privado
 */
router.delete('/cuenta', verificarToken, AuthController.desactivarCuenta);

export default router;