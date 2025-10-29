import { Request, Response } from 'express';
import { Reserva, ICrearReserva } from '../models/Reserva';
import { TarjetaCredito, ITarjetaCredito } from '../models/TarjetaCredito';

/**
 * Controlador de Reservas
 */
export class ReservaController {
  /**
   * Crea una nueva reserva
   */
  static async crearReserva(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const { vuelos, pasajeros } = req.body;

      // Validaciones
      if (!vuelos || !Array.isArray(vuelos) || vuelos.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un vuelo'
        });
        return;
      }

      if (!pasajeros || !Array.isArray(pasajeros) || pasajeros.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un pasajero'
        });
        return;
      }

      // Validar datos de vuelos
      for (const vuelo of vuelos) {
        if (!vuelo.id_vuelo || !vuelo.categoria) {
          res.status(400).json({
            success: false,
            message: 'Datos de vuelo incompletos'
          });
          return;
        }

        if (!['PRIMERA', 'EJECUTIVA', 'ECONOMICA'].includes(vuelo.categoria)) {
          res.status(400).json({
            success: false,
            message: 'Categoría de asiento inválida'
          });
          return;
        }
      }

      // Validar datos de pasajeros
      for (const pasajero of pasajeros) {
        if (!pasajero.nombre || !pasajero.apellido || !pasajero.documento_identidad) {
          res.status(400).json({
            success: false,
            message: 'Datos de pasajero incompletos'
          });
          return;
        }
      }

      const datosReserva: ICrearReserva = {
        id_usuario: idUsuario,
        vuelos,
        pasajeros
      };

      const reserva = await Reserva.crear(datosReserva);

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: reserva
      });
    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear reserva'
      });
    }
  }

  /**
   * Obtiene una reserva por ID
   */
  static async obtenerReserva(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { id } = req.params;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const reserva = await Reserva.obtenerPorId(parseInt(id));

      if (!reserva) {
        res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
        return;
      }

      // Verificar que la reserva pertenece al usuario
      if (reserva.id_usuario !== idUsuario) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver esta reserva'
        });
        return;
      }

      res.json({
        success: true,
        data: reserva
      });
    } catch (error) {
      console.error('Error al obtener reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reserva'
      });
    }
  }

  /**
   * Obtiene una reserva por código
   */
  static async obtenerPorCodigo(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { codigo } = req.params;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const reserva = await Reserva.obtenerPorCodigo(codigo);

      if (!reserva) {
        res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
        return;
      }

      // Verificar que la reserva pertenece al usuario
      if (reserva.id_usuario !== idUsuario) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver esta reserva'
        });
        return;
      }

      res.json({
        success: true,
        data: reserva
      });
    } catch (error) {
      console.error('Error al obtener reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reserva'
      });
    }
  }

  /**
   * Obtiene todas las reservas del usuario autenticado
   */
  static async misReservas(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const reservas = await Reserva.obtenerPorUsuario(idUsuario);

      res.json({
        success: true,
        data: reservas,
        count: reservas.length
      });
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservas'
      });
    }
  }

  /**
   * Cancela una reserva
   */
  static async cancelarReserva(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { id } = req.params;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      await Reserva.cancelar(parseInt(id), idUsuario);

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente'
      });
    } catch (error: any) {
      console.error('Error al cancelar reserva:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cancelar reserva'
      });
    }
  }

  /**
   * Obtiene las tarjetas de crédito del usuario
   */
  static async obtenerTarjetas(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const tarjetas = await TarjetaCredito.obtenerPorUsuario(idUsuario);

      // Enmascarar números de tarjeta
      const tarjetasEnmascaradas = tarjetas.map(tarjeta => ({
        ...tarjeta,
        numero_tarjeta: TarjetaCredito.enmascararNumero(tarjeta.numero_tarjeta),
        cvv: '***'
      }));

      res.json({
        success: true,
        data: tarjetasEnmascaradas,
        count: tarjetasEnmascaradas.length
      });
    } catch (error) {
      console.error('Error al obtener tarjetas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tarjetas'
      });
    }
  }

  /**
   * Agrega una nueva tarjeta de crédito
   */
  static async agregarTarjeta(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const {
        numero_tarjeta,
        nombre_titular,
        fecha_expiracion,
        cvv,
        tipo_tarjeta,
        predeterminada
      } = req.body;

      // Validaciones
      if (!numero_tarjeta || !nombre_titular || !fecha_expiracion || !cvv || !tipo_tarjeta) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos de la tarjeta son requeridos'
        });
        return;
      }

      if (!['VISA', 'MASTERCARD', 'AMEX'].includes(tipo_tarjeta)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de tarjeta inválido'
        });
        return;
      }

      const tarjetaData: ITarjetaCredito = {
        id_usuario: idUsuario,
        numero_tarjeta,
        nombre_titular,
        fecha_expiracion,
        cvv,
        tipo_tarjeta,
        predeterminada: predeterminada || false
      };

      const tarjeta = await TarjetaCredito.agregar(tarjetaData);

      res.status(201).json({
        success: true,
        message: 'Tarjeta agregada exitosamente',
        data: {
          ...tarjeta,
          numero_tarjeta: TarjetaCredito.enmascararNumero(tarjeta.numero_tarjeta),
          cvv: '***'
        }
      });
    } catch (error) {
      console.error('Error al agregar tarjeta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar tarjeta'
      });
    }
  }

  /**
   * Elimina una tarjeta de crédito
   */
  static async eliminarTarjeta(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { id } = req.params;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      await TarjetaCredito.eliminar(parseInt(id), idUsuario);

      res.json({
        success: true,
        message: 'Tarjeta eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar tarjeta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tarjeta'
      });
    }
  }

  /**
   * Establece una tarjeta como predeterminada
   */
  static async establecerTarjetaPredeterminada(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { id } = req.params;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      await TarjetaCredito.establecerPredeterminada(parseInt(id), idUsuario);

      res.json({
        success: true,
        message: 'Tarjeta predeterminada establecida'
      });
    } catch (error) {
      console.error('Error al establecer tarjeta predeterminada:', error);
      res.status(500).json({
        success: false,
        message: 'Error al establecer tarjeta predeterminada'
      });
    }
  }
}