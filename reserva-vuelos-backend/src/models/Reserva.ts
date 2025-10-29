import database from '../config/database';
import { Vuelo } from './Vuelo';
import { PoolClient } from 'pg';

/**
 * Interface para Reserva
 */
export interface IReserva {
  id_reserva?: number;
  codigo_reserva?: string;
  id_usuario: number;
  fecha_reserva?: Date;
  estado?: 'ACTIVA' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  precio_total: number;
  numero_pasajeros: number;
}

/**
 * Interface para Detalle de Reserva
 */
export interface IDetalleReserva {
  id_detalle_reserva?: number;
  id_reserva: number;
  id_vuelo: number;
  categoria_asiento: 'PRIMERA' | 'EJECUTIVA' | 'ECONOMICA';
  precio_unitario: number;
  orden_itinerario: number;
}

/**
 * Interface para Pasajero
 */
export interface IPasajero {
  id_pasajero_reserva?: number;
  id_reserva?: number;
  nombre: string;
  apellido: string;
  documento_identidad: string;
  fecha_nacimiento?: string;
  nacionalidad?: string;
}

/**
 * Interface para crear una reserva
 */
export interface ICrearReserva {
  id_usuario: number;
  vuelos: {
    id_vuelo: number;
    categoria: 'PRIMERA' | 'EJECUTIVA' | 'ECONOMICA';
  }[];
  pasajeros: IPasajero[];
}

/**
 * Interface para reserva completa (con detalles)
 */
export interface IReservaCompleta extends IReserva {
  vuelos?: any[];
  pasajeros?: IPasajero[];
}

/**
 * Clase modelo Reserva
 */
export class Reserva {
  /**
   * Crea una nueva reserva con todos sus detalles
   */
  static async crear(datos: ICrearReserva): Promise<IReservaCompleta> {
    return await database.transaction(async (client: PoolClient) => {
      // 1. Verificar disponibilidad de todos los vuelos
      for (const vuelo of datos.vuelos) {
        const disponible = await Vuelo.verificarDisponibilidad(
          vuelo.id_vuelo,
          vuelo.categoria,
          datos.pasajeros.length
        );

        if (!disponible) {
          throw new Error(`No hay suficientes asientos disponibles en el vuelo ${vuelo.id_vuelo}`);
        }
      }

      // 2. Calcular precio total
      let precioTotal = 0;
      for (const vuelo of datos.vuelos) {
        const vueloInfo = await Vuelo.obtenerPorId(vuelo.id_vuelo);
        if (!vueloInfo) {
          throw new Error(`Vuelo ${vuelo.id_vuelo} no encontrado`);
        }
        const precioUnitario = Vuelo.obtenerPrecio(vueloInfo, vuelo.categoria);
        precioTotal += precioUnitario * datos.pasajeros.length;
      }

      // 3. Crear la reserva principal
      const queryReserva = `
        INSERT INTO reservas (id_usuario, precio_total, numero_pasajeros, estado)
        VALUES ($1, $2, $3, 'ACTIVA')
        RETURNING *
      `;

      const resultReserva = await client.query(queryReserva, [
        datos.id_usuario,
        precioTotal,
        datos.pasajeros.length
      ]);

      const reserva = resultReserva.rows[0];

      // 4. Crear detalles de reserva (vuelos)
      const detallesVuelos = [];
      for (let i = 0; i < datos.vuelos.length; i++) {
        const vuelo = datos.vuelos[i];
        const vueloInfo = await Vuelo.obtenerPorId(vuelo.id_vuelo);
        const precioUnitario = Vuelo.obtenerPrecio(vueloInfo!, vuelo.categoria);

        const queryDetalle = `
          INSERT INTO detalles_reserva 
            (id_reserva, id_vuelo, categoria_asiento, precio_unitario, orden_itinerario)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const resultDetalle = await client.query(queryDetalle, [
          reserva.id_reserva,
          vuelo.id_vuelo,
          vuelo.categoria,
          precioUnitario,
          i + 1
        ]);

        detallesVuelos.push(resultDetalle.rows[0]);

        // Actualizar disponibilidad de asientos
        await Vuelo.actualizarDisponibilidad(
          vuelo.id_vuelo,
          vuelo.categoria,
          datos.pasajeros.length,
          'decrementar'
        );
      }

      // 5. Crear pasajeros
      const pasajerosCreados = [];
      for (const pasajero of datos.pasajeros) {
        const queryPasajero = `
          INSERT INTO pasajeros_reserva 
            (id_reserva, nombre, apellido, documento_identidad, fecha_nacimiento, nacionalidad)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const resultPasajero = await client.query(queryPasajero, [
          reserva.id_reserva,
          pasajero.nombre,
          pasajero.apellido,
          pasajero.documento_identidad,
          pasajero.fecha_nacimiento || null,
          pasajero.nacionalidad || null
        ]);

        pasajerosCreados.push(resultPasajero.rows[0]);
      }

      return {
        ...reserva,
        vuelos: detallesVuelos,
        pasajeros: pasajerosCreados
      };
    });
  }

  /**
   * Obtiene una reserva por ID con todos sus detalles
   */
  static async obtenerPorId(idReserva: number): Promise<IReservaCompleta | null> {
    const query = `
      SELECT * FROM reservas WHERE id_reserva = $1
    `;

    const result = await database.query(query, [idReserva]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const reserva = result.rows[0];

    // Obtener vuelos de la reserva
    const queryVuelos = `
      SELECT 
        dr.*,
        v.numero_vuelo,
        v.fecha_salida,
        v.fecha_llegada,
        ao.ciudad as origen_ciudad,
        ao.codigo_iata as origen_codigo,
        ad.ciudad as destino_ciudad,
        ad.codigo_iata as destino_codigo,
        al.nombre as aerolinea_nombre
      FROM detalles_reserva dr
      JOIN vuelos v ON dr.id_vuelo = v.id_vuelo
      JOIN aeropuertos ao ON v.id_aeropuerto_origen = ao.id_aeropuerto
      JOIN aeropuertos ad ON v.id_aeropuerto_destino = ad.id_aeropuerto
      JOIN aerolineas al ON v.id_aerolinea = al.id_aerolinea
      WHERE dr.id_reserva = $1
      ORDER BY dr.orden_itinerario
    `;

    const resultVuelos = await database.query(queryVuelos, [idReserva]);

    // Obtener pasajeros
    const queryPasajeros = `
      SELECT * FROM pasajeros_reserva WHERE id_reserva = $1
    `;

    const resultPasajeros = await database.query(queryPasajeros, [idReserva]);

    return {
      ...reserva,
      vuelos: resultVuelos.rows,
      pasajeros: resultPasajeros.rows
    };
  }

  /**
   * Obtiene una reserva por código
   */
  static async obtenerPorCodigo(codigo: string): Promise<IReservaCompleta | null> {
    const query = `
      SELECT * FROM reservas WHERE codigo_reserva = $1
    `;

    const result = await database.query(query, [codigo]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.obtenerPorId(result.rows[0].id_reserva);
  }

  /**
   * Obtiene todas las reservas de un usuario
   */
  static async obtenerPorUsuario(idUsuario: number): Promise<IReservaCompleta[]> {
    const query = `
      SELECT * FROM reservas 
      WHERE id_usuario = $1 
      ORDER BY fecha_reserva DESC
    `;

    const result = await database.query(query, [idUsuario]);
    
    const reservas: IReservaCompleta[] = [];
    for (const reserva of result.rows) {
      const reservaCompleta = await this.obtenerPorId(reserva.id_reserva);
      if (reservaCompleta) {
        reservas.push(reservaCompleta);
      }
    }

    return reservas;
  }

  /**
   * Cancela una reserva
   */
  static async cancelar(idReserva: number, idUsuario: number): Promise<void> {
    await database.transaction(async (client: PoolClient) => {
      // Verificar que la reserva pertenece al usuario
      const queryVerificar = `
        SELECT * FROM reservas 
        WHERE id_reserva = $1 AND id_usuario = $2 AND estado = 'ACTIVA'
      `;

      const resultVerificar = await client.query(queryVerificar, [idReserva, idUsuario]);

      if (resultVerificar.rows.length === 0) {
        throw new Error('Reserva no encontrada o no se puede cancelar');
      }

      // Obtener detalles de la reserva para liberar asientos
      const queryDetalles = `
        SELECT id_vuelo, categoria_asiento 
        FROM detalles_reserva 
        WHERE id_reserva = $1
      `;

      const resultDetalles = await client.query(queryDetalles, [idReserva]);
      const numeroPasajeros = resultVerificar.rows[0].numero_pasajeros;

      // Liberar asientos de cada vuelo
      for (const detalle of resultDetalles.rows) {
        await Vuelo.actualizarDisponibilidad(
          detalle.id_vuelo,
          detalle.categoria_asiento,
          numeroPasajeros,
          'incrementar'
        );
      }

      // Actualizar estado de la reserva
      const queryCancelar = `
        UPDATE reservas 
        SET estado = 'CANCELADA' 
        WHERE id_reserva = $1
      `;

      await client.query(queryCancelar, [idReserva]);
    });
  }

  /**
   * Confirma una reserva (cuando se realiza el pago)
   */
  static async confirmar(idReserva: number): Promise<void> {
    const query = `
      UPDATE reservas 
      SET estado = 'CONFIRMADA' 
      WHERE id_reserva = $1
    `;

    await database.query(query, [idReserva]);
  }
}