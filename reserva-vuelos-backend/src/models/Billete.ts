import database from '../config/database';
import { Reserva } from './Reserva';
import { TarjetaCredito } from './TarjetaCredito';
import { PoolClient } from 'pg';

/**
 * Interface para Billete
 */
export interface IBillete {
  id_billete?: number;
  codigo_billete?: string;
  id_reserva: number;
  id_tarjeta: number;
  fecha_compra?: Date;
  monto_total: number;
  metodo_entrega: 'ENVIO' | 'RECOGER_AEROPUERTO';
  estado_pago?: 'PROCESANDO' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';
}

/**
 * Interface para crear un billete (compra)
 */
export interface ICrearBillete {
  id_reserva: number;
  id_usuario: number;
  id_tarjeta: number;
  metodo_entrega: 'ENVIO' | 'RECOGER_AEROPUERTO';
}

/**
 * Interface para billete completo (con información de reserva)
 */
export interface IBilleteCompleto extends IBillete {
  reserva?: any;
  tarjeta?: any;
}

/**
 * Clase modelo Billete
 */
export class Billete {
  /**
   * Compra un billete (crea billete desde una reserva)
   */
  static async comprar(datos: ICrearBillete): Promise<IBilleteCompleto> {
    return await database.transaction(async (client: PoolClient) => {
      // 1. Verificar que la reserva existe y pertenece al usuario
      const reserva = await Reserva.obtenerPorId(datos.id_reserva);
      
      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }

      if (reserva.id_usuario !== datos.id_usuario) {
        throw new Error('Esta reserva no pertenece al usuario');
      }

      if (reserva.estado !== 'ACTIVA') {
        throw new Error('La reserva no está en estado activo');
      }

      // 2. Verificar que la tarjeta pertenece al usuario
      const tarjetaValida = await TarjetaCredito.validarPropiedad(
        datos.id_tarjeta,
        datos.id_usuario
      );

      if (!tarjetaValida) {
        throw new Error('Tarjeta de crédito no válida');
      }

      // 3. Crear el billete
      const queryBillete = `
        INSERT INTO billetes 
          (id_reserva, id_tarjeta, monto_total, metodo_entrega, estado_pago)
        VALUES ($1, $2, $3, $4, 'PROCESANDO')
        RETURNING *
      `;

      const resultBillete = await client.query(queryBillete, [
        datos.id_reserva,
        datos.id_tarjeta,
        reserva.precio_total,
        datos.metodo_entrega
      ]);

      const billete = resultBillete.rows[0];

      // 4. Simular procesamiento de pago (en producción, integrar con pasarela de pago)
      const pagoExitoso = await this.procesarPago(datos.id_tarjeta, reserva.precio_total);

      if (pagoExitoso) {
        // Actualizar estado del billete
        await client.query(
          'UPDATE billetes SET estado_pago = $1 WHERE id_billete = $2',
          ['APROBADO', billete.id_billete]
        );

        // Confirmar la reserva
        await Reserva.confirmar(datos.id_reserva);

        billete.estado_pago = 'APROBADO';
      } else {
        await client.query(
          'UPDATE billetes SET estado_pago = $1 WHERE id_billete = $2',
          ['RECHAZADO', billete.id_billete]
        );
        
        throw new Error('El pago fue rechazado');
      }

      return {
        ...billete,
        reserva
      };
    });
  }

  /**
   * Simula el procesamiento de pago (en producción integrar con Stripe, PayPal, etc.)
   */
  private static async procesarPago(idTarjeta: number, monto: number): Promise<boolean> {
    // Simulación: 95% de éxito
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.05);
      }, 1000);
    });
  }

  /**
   * Obtiene un billete por ID
   */
  static async obtenerPorId(idBillete: number): Promise<IBilleteCompleto | null> {
    const query = `
      SELECT b.*, 
             r.codigo_reserva, r.numero_pasajeros, r.estado as estado_reserva,
             tc.numero_tarjeta, tc.tipo_tarjeta
      FROM billetes b
      JOIN reservas r ON b.id_reserva = r.id_reserva
      JOIN tarjetas_credito tc ON b.id_tarjeta = tc.id_tarjeta
      WHERE b.id_billete = $1
    `;

    const result = await database.query(query, [idBillete]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const billete = result.rows[0];

    // Obtener información completa de la reserva
    const reserva = await Reserva.obtenerPorId(billete.id_reserva);

    return {
      ...billete,
      reserva,
      numero_tarjeta_enmascarado: TarjetaCredito.enmascararNumero(billete.numero_tarjeta)
    };
  }

  /**
   * Obtiene un billete por código
   */
  static async obtenerPorCodigo(codigo: string): Promise<IBilleteCompleto | null> {
    const query = `
      SELECT id_billete FROM billetes WHERE codigo_billete = $1
    `;

    const result = await database.query(query, [codigo]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.obtenerPorId(result.rows[0].id_billete);
  }

  /**
   * Obtiene todos los billetes de un usuario
   */
  static async obtenerPorUsuario(idUsuario: number): Promise<IBilleteCompleto[]> {
    const query = `
      SELECT b.*
      FROM billetes b
      JOIN reservas r ON b.id_reserva = r.id_reserva
      WHERE r.id_usuario = $1
      ORDER BY b.fecha_compra DESC
    `;

    const result = await database.query(query, [idUsuario]);
    
    const billetes: IBilleteCompleto[] = [];
    for (const billete of result.rows) {
      const billeteCompleto = await this.obtenerPorId(billete.id_billete);
      if (billeteCompleto) {
        billetes.push(billeteCompleto);
      }
    }

    return billetes;
  }

  /**
   * Obtiene billetes por reserva
   */
  static async obtenerPorReserva(idReserva: number): Promise<IBillete[]> {
    const query = `
      SELECT * FROM billetes 
      WHERE id_reserva = $1 
      ORDER BY fecha_compra DESC
    `;

    const result = await database.query(query, [idReserva]);
    return result.rows;
  }

  /**
   * Solicita reembolso de un billete
   */
  static async solicitarReembolso(idBillete: number, idUsuario: number): Promise<void> {
    await database.transaction(async (client: PoolClient) => {
      // Verificar que el billete pertenece al usuario
      const query = `
        SELECT b.*, r.id_usuario 
        FROM billetes b
        JOIN reservas r ON b.id_reserva = r.id_reserva
        WHERE b.id_billete = $1 AND b.estado_pago = 'APROBADO'
      `;

      const result = await client.query(query, [idBillete]);

      if (result.rows.length === 0) {
        throw new Error('Billete no encontrado o no se puede reembolsar');
      }

      if (result.rows[0].id_usuario !== idUsuario) {
        throw new Error('Este billete no pertenece al usuario');
      }

      // Actualizar estado del billete
      await client.query(
        'UPDATE billetes SET estado_pago = $1 WHERE id_billete = $2',
        ['REEMBOLSADO', idBillete]
      );

      // Cancelar la reserva asociada
      await Reserva.cancelar(result.rows[0].id_reserva, idUsuario);
    });
  }
}