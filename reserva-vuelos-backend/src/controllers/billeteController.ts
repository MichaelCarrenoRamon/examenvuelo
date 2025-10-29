import { Request, Response } from 'express';
import { Billete, ICrearBillete } from '../models/Billete';

/**
 * Controlador de Billetes
 */
export class BilleteController {
  /**
   * Compra un billete (realiza el pago de una reserva)
   */
  static async comprarBillete(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const { id_reserva, id_tarjeta, metodo_entrega } = req.body;

      // Validaciones
      if (!id_reserva || !id_tarjeta || !metodo_entrega) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
        return;
      }

      if (!['ENVIO', 'RECOGER_AEROPUERTO'].includes(metodo_entrega)) {
        res.status(400).json({
          success: false,
          message: 'Método de entrega inválido'
        });
        return;
      }

      const datosCompra: ICrearBillete = {
        id_reserva,
        id_usuario: idUsuario,
        id_tarjeta,
        metodo_entrega
      };

      const billete = await Billete.comprar(datosCompra);

      res.status(201).json({
        success: true,
        message: 'Billete comprado exitosamente',
        data: billete
      });
    } catch (error: any) {
      console.error('Error al comprar billete:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al comprar billete'
      });
    }
  }

  /**
   * Obtiene un billete por ID
   */
  static async obtenerBillete(req: Request, res: Response): Promise<void> {
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

      const billete = await Billete.obtenerPorId(parseInt(id));

      if (!billete) {
        res.status(404).json({
          success: false,
          message: 'Billete no encontrado'
        });
        return;
      }

      // Verificar que el billete pertenece al usuario
      if (billete.reserva?.id_usuario !== idUsuario) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver este billete'
        });
        return;
      }

      res.json({
        success: true,
        data: billete
      });
    } catch (error) {
      console.error('Error al obtener billete:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener billete'
      });
    }
  }

  /**
   * Obtiene un billete por código
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

      const billete = await Billete.obtenerPorCodigo(codigo);

      if (!billete) {
        res.status(404).json({
          success: false,
          message: 'Billete no encontrado'
        });
        return;
      }

      // Verificar que el billete pertenece al usuario
      if (billete.reserva?.id_usuario !== idUsuario) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver este billete'
        });
        return;
      }

      res.json({
        success: true,
        data: billete
      });
    } catch (error) {
      console.error('Error al obtener billete:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener billete'
      });
    }
  }

  /**
   * Obtiene todos los billetes del usuario autenticado
   */
  static async misBilletes(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const billetes = await Billete.obtenerPorUsuario(idUsuario);

      res.json({
        success: true,
        data: billetes,
        count: billetes.length
      });
    } catch (error) {
      console.error('Error al obtener billetes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener billetes'
      });
    }
  }

  /**
   * Obtiene billetes de una reserva específica
   */
  static async obtenerPorReserva(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      const { id_reserva } = req.params;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const billetes = await Billete.obtenerPorReserva(parseInt(id_reserva));

      res.json({
        success: true,
        data: billetes,
        count: billetes.length
      });
    } catch (error) {
      console.error('Error al obtener billetes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener billetes'
      });
    }
  }

  /**
   * Solicita reembolso de un billete
   */
  static async solicitarReembolso(req: Request, res: Response): Promise<void> {
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

      await Billete.solicitarReembolso(parseInt(id), idUsuario);

      res.json({
        success: true,
        message: 'Reembolso solicitado exitosamente'
      });
    } catch (error: any) {
      console.error('Error al solicitar reembolso:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al solicitar reembolso'
      });
    }
  }
}