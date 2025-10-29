import { Router } from 'express';
import { BilleteController } from '../controllers/billeteController';
import { verificarToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/billetes/comprar
 * @desc    Compra un billete (realiza el pago de una reserva)
 * @access  Privado
 */
router.post('/comprar', verificarToken, BilleteController.comprarBillete);

/**
 * @route   GET /api/billetes/mis-billetes
 * @desc    Obtiene todos los billetes del usuario autenticado
 * @access  Privado
 */
router.get('/mis-billetes', verificarToken, BilleteController.misBilletes);

/**
 * @route   GET /api/billetes/:id
 * @desc    Obtiene un billete por ID
 * @access  Privado
 */
router.get('/:id', verificarToken, BilleteController.obtenerBillete);

/**
 * @route   GET /api/billetes/codigo/:codigo
 * @desc    Obtiene un billete por código
 * @access  Privado
 */
router.get('/codigo/:codigo', verificarToken, BilleteController.obtenerPorCodigo);

/**
 * @route   GET /api/billetes/reserva/:id_reserva
 * @desc    Obtiene billetes de una reserva específica
 * @access  Privado
 */
router.get('/reserva/:id_reserva', verificarToken, BilleteController.obtenerPorReserva);

/**
 * @route   POST /api/billetes/:id/reembolso
 * @desc    Solicita reembolso de un billete
 * @access  Privado
 */
router.post('/:id/reembolso', verificarToken, BilleteController.solicitarReembolso);

export default router;