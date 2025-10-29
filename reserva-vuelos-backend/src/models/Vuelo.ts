import database from '../config/database';

/**
 * Interface para Vuelo
 */
export interface IVuelo {
  id_vuelo?: number;
  numero_vuelo: string;
  id_aerolinea: number;
  id_avion: number;
  id_aeropuerto_origen: number;
  id_aeropuerto_destino: number;
  fecha_salida: Date;
  fecha_llegada: Date;
  duracion_minutos: number;
  estado: 'PROGRAMADO' | 'EN_HORA' | 'RETRASADO' | 'CANCELADO' | 'COMPLETADO';
  es_directo: boolean;
  asientos_disponibles_primera: number;
  asientos_disponibles_ejecutiva: number;
  asientos_disponibles_economica: number;
  precio_base_primera?: number;
  precio_base_ejecutiva?: number;
  precio_base_economica: number;
}

/**
 * Interface para búsqueda de vuelos
 */
export interface IBusquedaVuelo {
  origen: number;
  destino: number;
  fecha?: string;
  aerolinea?: number;
  categoria?: 'PRIMERA' | 'EJECUTIVA' | 'ECONOMICA';
  solo_directos?: boolean;
  orden?: 'fecha' | 'precio' | 'duracion';
}

/**
 * Interface para información detallada del vuelo
 */
export interface IVueloDetallado extends IVuelo {
  aerolinea_nombre?: string;
  aerolinea_codigo?: string;
  origen_nombre?: string;
  origen_codigo?: string;
  origen_ciudad?: string;
  destino_nombre?: string;
  destino_codigo?: string;
  destino_ciudad?: string;
}

/**
 * Clase modelo Vuelo
 */
export class Vuelo {
  /**
   * Busca vuelos según criterios específicos
   */
  static async buscar(criterios: IBusquedaVuelo): Promise<IVueloDetallado[]> {
    let query = `
      SELECT 
        v.*,
        al.nombre as aerolinea_nombre,
        al.codigo_iata as aerolinea_codigo,
        ao.nombre as origen_nombre,
        ao.codigo_iata as origen_codigo,
        ao.ciudad as origen_ciudad,
        ad.nombre as destino_nombre,
        ad.codigo_iata as destino_codigo,
        ad.ciudad as destino_ciudad
      FROM vuelos v
      JOIN aerolineas al ON v.id_aerolinea = al.id_aerolinea
      JOIN aeropuertos ao ON v.id_aeropuerto_origen = ao.id_aeropuerto
      JOIN aeropuertos ad ON v.id_aeropuerto_destino = ad.id_aeropuerto
      WHERE v.id_aeropuerto_origen = $1 
        AND v.id_aeropuerto_destino = $2
        AND v.estado NOT IN ('CANCELADO', 'COMPLETADO')
    `;

    const params: any[] = [criterios.origen, criterios.destino];
    let paramIndex = 3;

    // Filtro por fecha
    if (criterios.fecha) {
      query += ` AND DATE(v.fecha_salida) = $${paramIndex}`;
      params.push(criterios.fecha);
      paramIndex++;
    } else {
      query += ` AND v.fecha_salida >= NOW()`;
    }

    // Filtro por aerolínea
    if (criterios.aerolinea) {
      query += ` AND v.id_aerolinea = $${paramIndex}`;
      params.push(criterios.aerolinea);
      paramIndex++;
    }

    // Filtro por vuelos directos
    if (criterios.solo_directos) {
      query += ` AND v.es_directo = true`;
    }

    // Filtro por disponibilidad según categoría
    if (criterios.categoria) {
      switch (criterios.categoria) {
        case 'PRIMERA':
          query += ` AND v.asientos_disponibles_primera > 0`;
          break;
        case 'EJECUTIVA':
          query += ` AND v.asientos_disponibles_ejecutiva > 0`;
          break;
        case 'ECONOMICA':
          query += ` AND v.asientos_disponibles_economica > 0`;
          break;
      }
    }

    // Ordenamiento
    switch (criterios.orden) {
      case 'precio':
        const precioCol = criterios.categoria 
          ? `precio_base_${criterios.categoria.toLowerCase()}`
          : 'precio_base_economica';
        query += ` ORDER BY v.${precioCol} ASC`;
        break;
      case 'duracion':
        query += ` ORDER BY v.duracion_minutos ASC`;
        break;
      case 'fecha':
      default:
        query += ` ORDER BY v.fecha_salida ASC`;
    }

    const result = await database.query(query, params);
    return result.rows;
  }

  /**
   * Busca vuelos por horario
   */
  static async buscarPorHorario(origen: number, destino: number, fecha: string): Promise<IVueloDetallado[]> {
    return this.buscar({
      origen,
      destino,
      fecha,
      orden: 'fecha'
    });
  }

  /**
   * Busca vuelos por tarifa (más económicos primero)
   */
  static async buscarPorTarifa(origen: number, destino: number, fecha?: string): Promise<IVueloDetallado[]> {
    return this.buscar({
      origen,
      destino,
      fecha,
      orden: 'precio'
    });
  }

  /**
   * Obtiene información detallada de un vuelo específico
   */
  static async obtenerPorId(id: number): Promise<IVueloDetallado | null> {
    const query = `
      SELECT 
        v.*,
        al.nombre as aerolinea_nombre,
        al.codigo_iata as aerolinea_codigo,
        ao.nombre as origen_nombre,
        ao.codigo_iata as origen_codigo,
        ao.ciudad as origen_ciudad,
        ad.nombre as destino_nombre,
        ad.codigo_iata as destino_codigo,
        ad.ciudad as destino_ciudad
      FROM vuelos v
      JOIN aerolineas al ON v.id_aerolinea = al.id_aerolinea
      JOIN aeropuertos ao ON v.id_aeropuerto_origen = ao.id_aeropuerto
      JOIN aeropuertos ad ON v.id_aeropuerto_destino = ad.id_aeropuerto
      WHERE v.id_vuelo = $1
    `;

    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Obtiene información de un vuelo por número de vuelo
   */
  static async obtenerPorNumero(numeroVuelo: string): Promise<IVueloDetallado | null> {
    const query = `
      SELECT 
        v.*,
        al.nombre as aerolinea_nombre,
        al.codigo_iata as aerolinea_codigo,
        ao.nombre as origen_nombre,
        ao.codigo_iata as origen_codigo,
        ao.ciudad as origen_ciudad,
        ad.nombre as destino_nombre,
        ad.codigo_iata as destino_codigo,
        ad.ciudad as destino_ciudad
      FROM vuelos v
      JOIN aerolineas al ON v.id_aerolinea = al.id_aerolinea
      JOIN aeropuertos ao ON v.id_aeropuerto_origen = ao.id_aeropuerto
      JOIN aeropuertos ad ON v.id_aeropuerto_destino = ad.id_aeropuerto
      WHERE v.numero_vuelo = $1
      ORDER BY v.fecha_salida DESC
      LIMIT 1
    `;

    const result = await database.query(query, [numeroVuelo]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Verifica disponibilidad de asientos en un vuelo
   */
  static async verificarDisponibilidad(
    idVuelo: number, 
    categoria: 'PRIMERA' | 'EJECUTIVA' | 'ECONOMICA',
    cantidad: number
  ): Promise<boolean> {
    const vuelo = await this.obtenerPorId(idVuelo);
    
    if (!vuelo) return false;

    switch (categoria) {
      case 'PRIMERA':
        return vuelo.asientos_disponibles_primera >= cantidad;
      case 'EJECUTIVA':
        return vuelo.asientos_disponibles_ejecutiva >= cantidad;
      case 'ECONOMICA':
        return vuelo.asientos_disponibles_economica >= cantidad;
      default:
        return false;
    }
  }

  /**
   * Actualiza la disponibilidad de asientos (decrementar al reservar)
   */
  static async actualizarDisponibilidad(
    idVuelo: number,
    categoria: 'PRIMERA' | 'EJECUTIVA' | 'ECONOMICA',
    cantidad: number,
    operacion: 'decrementar' | 'incrementar'
  ): Promise<void> {
    const campo = `asientos_disponibles_${categoria.toLowerCase()}`;
    const operador = operacion === 'decrementar' ? '-' : '+';
    
    const query = `
      UPDATE vuelos 
      SET ${campo} = ${campo} ${operador} $1
      WHERE id_vuelo = $2
    `;

    await database.query(query, [cantidad, idVuelo]);
  }

  /**
   * Actualiza el estado de un vuelo
   */
  static async actualizarEstado(
    idVuelo: number, 
    estado: 'PROGRAMADO' | 'EN_HORA' | 'RETRASADO' | 'CANCELADO' | 'COMPLETADO'
  ): Promise<void> {
    const query = `
      UPDATE vuelos 
      SET estado = $1 
      WHERE id_vuelo = $2
    `;

    await database.query(query, [estado, idVuelo]);
  }

  /**
   * Obtiene el precio según la categoría
   */
  static obtenerPrecio(vuelo: IVueloDetallado, categoria: 'PRIMERA' | 'EJECUTIVA' | 'ECONOMICA'): number {
    switch (categoria) {
      case 'PRIMERA':
        return vuelo.precio_base_primera || 0;
      case 'EJECUTIVA':
        return vuelo.precio_base_ejecutiva || 0;
      case 'ECONOMICA':
        return vuelo.precio_base_economica;
      default:
        return 0;
    }
  }
}