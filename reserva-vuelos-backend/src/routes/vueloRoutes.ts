import { Router } from 'express';
import { VueloController } from '../controllers/vueloController';
import { verificarTokenOpcional } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/vuelos/todos
 * @desc    Obtiene TODOS los vuelos disponibles
 * @access  Público
 * ⭐ NUEVA RUTA - Agregar ANTES de la ruta '/:id'
 */
router.get('/todos', verificarTokenOpcional, VueloController.obtenerTodosVuelos);

/**
 * @route   GET /api/vuelos/buscar
 * @desc    Busca vuelos según criterios
 * @access  Público
 */
router.get('/buscar', verificarTokenOpcional, VueloController.buscarVuelos);

/**
 * @route   GET /api/vuelos/horarios
 * @desc    Busca vuelos por horario
 * @access  Público
 */
router.get('/horarios', verificarTokenOpcional, VueloController.buscarPorHorario);

/**
 * @route   GET /api/vuelos/tarifas
 * @desc    Busca vuelos por tarifa (más baratos primero)
 * @access  Público
 */
router.get('/tarifas', verificarTokenOpcional, VueloController.buscarPorTarifa);

/**
 * @route   GET /api/vuelos/aeropuertos/todos
 * @desc    Obtiene todos los aeropuertos
 * @access  Público
 */
router.get('/aeropuertos/todos', VueloController.obtenerAeropuertos);

/**
 * @route   GET /api/vuelos/aeropuertos/buscar
 * @desc    Busca aeropuertos
 * @access  Público
 */
router.get('/aeropuertos/buscar', VueloController.buscarAeropuertos);

/**
 * @route   GET /api/vuelos/aerolineas/todas
 * @desc    Obtiene todas las aerolíneas
 * @access  Público
 */
router.get('/aerolineas/todas', VueloController.obtenerAerolineas);

/**
 * @route   GET /api/vuelos/:id
 * @desc    Obtiene información detallada de un vuelo
 * @access  Público
 * ⚠️ IMPORTANTE: Esta ruta debe ir DESPUÉS de las rutas específicas
 */
router.get('/:id', verificarTokenOpcional, VueloController.obtenerVuelo);

/**
 * @route   GET /api/vuelos/numero/:numero
 * @desc    Obtiene información de un vuelo por número
 * @access  Público
 */
router.get('/numero/:numero', verificarTokenOpcional, VueloController.obtenerPorNumero);

export default router;