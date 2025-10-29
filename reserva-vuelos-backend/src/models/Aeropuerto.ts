import database from '../config/database';

/**
 * Interface para Aeropuerto
 */
export interface IAeropuerto {
  id_aeropuerto?: number;
  nombre: string;
  codigo_iata: string;
  ciudad: string;
  pais: string;
  zona_horaria?: string;
}

/**
 * Clase modelo Aeropuerto
 */
export class Aeropuerto {
  /**
   * Obtiene todos los aeropuertos
   */
  static async obtenerTodos(): Promise<IAeropuerto[]> {
    const query = `
      SELECT * FROM aeropuertos 
      ORDER BY ciudad, nombre
    `;
    
    const result = await database.query(query);
    return result.rows;
  }

  /**
   * Busca un aeropuerto por ID
   */
  static async obtenerPorId(id: number): Promise<IAeropuerto | null> {
    const query = `SELECT * FROM aeropuertos WHERE id_aeropuerto = $1`;
    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Busca aeropuertos por código IATA
   */
  static async obtenerPorCodigo(codigoIATA: string): Promise<IAeropuerto | null> {
    const query = `SELECT * FROM aeropuertos WHERE codigo_iata = $1`;
    const result = await database.query(query, [codigoIATA.toUpperCase()]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Busca aeropuertos por ciudad
   */
  static async buscarPorCiudad(ciudad: string): Promise<IAeropuerto[]> {
    const query = `
      SELECT * FROM aeropuertos 
      WHERE LOWER(ciudad) LIKE LOWER($1)
      ORDER BY ciudad, nombre
    `;
    
    const result = await database.query(query, [`%${ciudad}%`]);
    return result.rows;
  }

  /**
   * Busca aeropuertos por país
   */
  static async obtenerPorPais(pais: string): Promise<IAeropuerto[]> {
    const query = `
      SELECT * FROM aeropuertos 
      WHERE LOWER(pais) = LOWER($1)
      ORDER BY ciudad, nombre
    `;
    
    const result = await database.query(query, [pais]);
    return result.rows;
  }

  /**
   * Busca aeropuertos (búsqueda general)
   */
  static async buscar(termino: string): Promise<IAeropuerto[]> {
    const query = `
      SELECT * FROM aeropuertos 
      WHERE LOWER(nombre) LIKE LOWER($1)
         OR LOWER(ciudad) LIKE LOWER($1)
         OR LOWER(codigo_iata) LIKE LOWER($1)
      ORDER BY ciudad, nombre
      LIMIT 20
    `;
    
    const result = await database.query(query, [`%${termino}%`]);
    return result.rows;
  }
}