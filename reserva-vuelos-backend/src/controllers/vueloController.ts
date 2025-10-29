// ============================================
// CORRECCIÓN: vueloController.ts
// ============================================

import { Request, Response } from 'express';
import { Vuelo, IBusquedaVuelo } from '../models/Vuelo';
import { Aeropuerto } from '../models/Aeropuerto';
import { Aerolinea } from '../models/Aerolinea';
import database from '../config/database';

export class VueloController {
  /**
   * Obtiene TODOS los vuelos disponibles
   * ⭐ VERSIÓN CORREGIDA CON MEJOR MANEJO DE ERRORES
   */
  static async obtenerTodosVuelos(req: Request, res: Response): Promise<void> {
    try {
      console.log('📡 Solicitud recibida en /api/vuelos/todos');
      
      const query = `
        SELECT 
          v.id_vuelo,
          v.numero_vuelo,
          v.id_aerolinea,
          v.id_avion,
          v.fecha_salida,
          v.fecha_llegada,
          v.duracion_minutos,
          v.estado,
          v.es_directo,
          v.asientos_disponibles_primera,
          v.asientos_disponibles_ejecutiva,
          v.asientos_disponibles_economica,
          v.precio_base_primera,
          v.precio_base_ejecutiva,
          v.precio_base_economica,
          al.nombre as aerolinea_nombre,
          al.codigo_iata as aerolinea_codigo,
          ao.nombre as origen_nombre,
          ao.codigo_iata as origen_codigo,
          ao.ciudad as origen_ciudad,
          ao.id_aeropuerto as id_aeropuerto_origen,
          ad.nombre as destino_nombre,
          ad.codigo_iata as destino_codigo,
          ad.ciudad as destino_ciudad,
          ad.id_aeropuerto as id_aeropuerto_destino
        FROM vuelos v
        JOIN aerolineas al ON v.id_aerolinea = al.id_aerolinea
        JOIN aeropuertos ao ON v.id_aeropuerto_origen = ao.id_aeropuerto
        JOIN aeropuertos ad ON v.id_aeropuerto_destino = ad.id_aeropuerto
        WHERE v.estado NOT IN ('CANCELADO', 'COMPLETADO')
          AND v.fecha_salida >= NOW()
        ORDER BY v.fecha_salida ASC
      `;

      console.log('🔍 Ejecutando query...');
      const result = await database.query(query);
      
      console.log(`✅ Query exitosa. Vuelos encontrados: ${result.rows.length}`);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      console.error('❌ Error en obtenerTodosVuelos:', error);
      console.error('📋 Stack trace:', error.stack);
      console.error('📋 Detalles:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca vuelos según criterios
   */
  static async buscarVuelos(req: Request, res: Response): Promise<void> {
    try {
      const {
        origen,
        destino,
        fecha,
        aerolinea,
        categoria,
        solo_directos,
        orden
      } = req.query;

      // Validaciones
      if (!origen || !destino) {
        res.status(400).json({
          success: false,
          message: 'Origen y destino son requeridos'
        });
        return;
      }

      const criterios: IBusquedaVuelo = {
        origen: parseInt(origen as string),
        destino: parseInt(destino as string),
        fecha: fecha as string,
        aerolinea: aerolinea ? parseInt(aerolinea as string) : undefined,
        categoria: categoria as any,
        solo_directos: solo_directos === 'true',
        orden: (orden as any) || 'fecha'
      };

      const vuelos = await Vuelo.buscar(criterios);

      res.json({
        success: true,
        data: vuelos,
        count: vuelos.length
      });
    } catch (error) {
      console.error('Error al buscar vuelos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar vuelos'
      });
    }
  }

  /**
   * Busca vuelos por horario
   */
  static async buscarPorHorario(req: Request, res: Response): Promise<void> {
    try {
      const { origen, destino, fecha } = req.query;

      if (!origen || !destino || !fecha) {
        res.status(400).json({
          success: false,
          message: 'Origen, destino y fecha son requeridos'
        });
        return;
      }

      const vuelos = await Vuelo.buscarPorHorario(
        parseInt(origen as string),
        parseInt(destino as string),
        fecha as string
      );

      res.json({
        success: true,
        data: vuelos,
        count: vuelos.length
      });
    } catch (error) {
      console.error('Error al buscar vuelos por horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar vuelos'
      });
    }
  }

  /**
   * Busca vuelos por tarifa (más baratos primero)
   */
  static async buscarPorTarifa(req: Request, res: Response): Promise<void> {
    try {
      const { origen, destino, fecha } = req.query;

      if (!origen || !destino) {
        res.status(400).json({
          success: false,
          message: 'Origen y destino son requeridos'
        });
        return;
      }

      const vuelos = await Vuelo.buscarPorTarifa(
        parseInt(origen as string),
        parseInt(destino as string),
        fecha as string
      );

      res.json({
        success: true,
        data: vuelos,
        count: vuelos.length
      });
    } catch (error) {
      console.error('Error al buscar vuelos por tarifa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar vuelos'
      });
    }
  }

  /**
   * Obtiene información detallada de un vuelo
   */
  static async obtenerVuelo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vuelo = await Vuelo.obtenerPorId(parseInt(id));

      if (!vuelo) {
        res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: vuelo
      });
    } catch (error) {
      console.error('Error al obtener vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener información del vuelo'
      });
    }
  }

  /**
   * Obtiene información de un vuelo por número de vuelo
   */
  static async obtenerPorNumero(req: Request, res: Response): Promise<void> {
    try {
      const { numero } = req.params;

      const vuelo = await Vuelo.obtenerPorNumero(numero);

      if (!vuelo) {
        res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: vuelo
      });
    } catch (error) {
      console.error('Error al obtener vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener información del vuelo'
      });
    }
  }

  /**
   * Obtiene todos los aeropuertos
   */
  static async obtenerAeropuertos(req: Request, res: Response): Promise<void> {
    try {
      console.log('📡 Solicitud recibida en /api/vuelos/aeropuertos/todos');
      const aeropuertos = await Aeropuerto.obtenerTodos();
      console.log(`✅ Aeropuertos encontrados: ${aeropuertos.length}`);

      res.json({
        success: true,
        data: aeropuertos,
        count: aeropuertos.length
      });
    } catch (error: any) {
      console.error('❌ Error al obtener aeropuertos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener aeropuertos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca aeropuertos
   */
  static async buscarAeropuertos(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || (q as string).length < 2) {
        res.status(400).json({
          success: false,
          message: 'Término de búsqueda debe tener al menos 2 caracteres'
        });
        return;
      }

      const aeropuertos = await Aeropuerto.buscar(q as string);

      res.json({
        success: true,
        data: aeropuertos,
        count: aeropuertos.length
      });
    } catch (error) {
      console.error('Error al buscar aeropuertos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar aeropuertos'
      });
    }
  }

  /**
   * Obtiene todas las aerolíneas
   */
  static async obtenerAerolineas(req: Request, res: Response): Promise<void> {
    try {
      console.log('📡 Solicitud recibida en /api/vuelos/aerolineas/todas');
      const aerolineas = await Aerolinea.obtenerTodas();
      console.log(`✅ Aerolíneas encontradas: ${aerolineas.length}`);

      res.json({
        success: true,
        data: aerolineas,
        count: aerolineas.length
      });
    } catch (error: any) {
      console.error('❌ Error al obtener aerolíneas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener aerolíneas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}