import { Router } from 'express';
import { ReservaController } from '../controllers/reservaController';
import { verificarToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/reservas
 * @desc    Crea una nueva reserva
 * @access  Privado
 */
router.post('/', verificarToken, ReservaController.crearReserva);

/**
 * @route   GET /api/reservas/mis-reservas
 * @desc    Obtiene todas las reservas del usuario autenticado
 * @access  Privado
 */
router.get('/mis-reservas', verificarToken, ReservaController.misReservas);

/**
 * @route   GET /api/reservas/:id
 * @desc    Obtiene una reserva por ID
 * @access  Privado
 */
router.get('/:id', verificarToken, ReservaController.obtenerReserva);

/**
 * @route   GET /api/reservas/codigo/:codigo
 * @desc    Obtiene una reserva por código
 * @access  Privado
 */
router.get('/codigo/:codigo', verificarToken, ReservaController.obtenerPorCodigo);

/**
 * @route   DELETE /api/reservas/:id
 * @desc    Cancela una reserva
 * @access  Privado
 */
router.delete('/:id', verificarToken, ReservaController.cancelarReserva);

/**
 * @route   GET /api/reservas/tarjetas/mis-tarjetas
 * @desc    Obtiene las tarjetas de crédito del usuario
 * @access  Privado
 */
router.get('/tarjetas/mis-tarjetas', verificarToken, ReservaController.obtenerTarjetas);

/**
 * @route   POST /api/reservas/tarjetas
 * @desc    Agrega una nueva tarjeta de crédito
 * @access  Privado
 */
router.post('/tarjetas', verificarToken, ReservaController.agregarTarjeta);

/**
 * @route   DELETE /api/reservas/tarjetas/:id
 * @desc    Elimina una tarjeta de crédito
 * @access  Privado
 */
router.delete('/tarjetas/:id', verificarToken, ReservaController.eliminarTarjeta);

/**
 * @route   PUT /api/reservas/tarjetas/:id/predeterminada
 * @desc    Establece una tarjeta como predeterminada
 * @access  Privado
 */
router.put('/tarjetas/:id/predeterminada', verificarToken, ReservaController.establecerTarjetaPredeterminada);

export default router;