import database from '../config/database';

/**
 * Interface para Aerolínea
 */
export interface IAerolinea {
  id_aerolinea?: number;
  nombre: string;
  codigo_iata: string;
  pais_origen?: string;
  activa?: boolean;
}

/**
 * Clase modelo Aerolínea
 */
export class Aerolinea {
  /**
   * Obtiene todas las aerolíneas activas
   */
  static async obtenerTodas(): Promise<IAerolinea[]> {
    const query = `
      SELECT * FROM aerolineas 
      WHERE activa = true
      ORDER BY nombre
    `;
    
    const result = await database.query(query);
    return result.rows;
  }

  /**
   * Busca una aerolínea por ID
   */
  static async obtenerPorId(id: number): Promise<IAerolinea | null> {
    const query = `SELECT * FROM aerolineas WHERE id_aerolinea = $1`;
    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Busca una aerolínea por código IATA
   */
  static async obtenerPorCodigo(codigoIATA: string): Promise<IAerolinea | null> {
    const query = `SELECT * FROM aerolineas WHERE codigo_iata = $1`;
    const result = await database.query(query, [codigoIATA.toUpperCase()]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}