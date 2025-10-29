import database from '../config/database';

/**
 * Interface para Tarjeta de Crédito
 */
export interface ITarjetaCredito {
  id_tarjeta?: number;
  id_usuario: number;
  numero_tarjeta: string;
  nombre_titular: string;
  fecha_expiracion: string; // YYYY-MM-DD
  cvv: string;
  tipo_tarjeta: 'VISA' | 'MASTERCARD' | 'AMEX';
  predeterminada?: boolean;
  fecha_registro?: Date;
}

/**
 * Clase modelo TarjetaCredito
 */
export class TarjetaCredito {
  /**
   * Agrega una nueva tarjeta de crédito
   */
  static async agregar(tarjeta: ITarjetaCredito): Promise<ITarjetaCredito> {
    // Si esta tarjeta será predeterminada, quitar el flag de otras
    if (tarjeta.predeterminada) {
      await this.quitarPredeterminadas(tarjeta.id_usuario);
    }

    const query = `
      INSERT INTO tarjetas_credito 
        (id_usuario, numero_tarjeta, nombre_titular, fecha_expiracion, cvv, tipo_tarjeta, predeterminada)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      tarjeta.id_usuario,
      tarjeta.numero_tarjeta,
      tarjeta.nombre_titular,
      tarjeta.fecha_expiracion,
      tarjeta.cvv,
      tarjeta.tipo_tarjeta,
      tarjeta.predeterminada || false
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  }

  /**
   * Busca una tarjeta por ID
   */
  static async buscarPorId(id: number): Promise<ITarjetaCredito | null> {
    const query = `SELECT * FROM tarjetas_credito WHERE id_tarjeta = $1`;
    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Obtiene todas las tarjetas de un usuario
   */
  static async obtenerPorUsuario(idUsuario: number): Promise<ITarjetaCredito[]> {
    const query = `
      SELECT * FROM tarjetas_credito 
      WHERE id_usuario = $1 
      ORDER BY predeterminada DESC, fecha_registro DESC
    `;
    
    const result = await database.query(query, [idUsuario]);
    return result.rows;
  }

  /**
   * Obtiene la tarjeta predeterminada de un usuario
   */
  static async obtenerPredeterminada(idUsuario: number): Promise<ITarjetaCredito | null> {
    const query = `
      SELECT * FROM tarjetas_credito 
      WHERE id_usuario = $1 AND predeterminada = true
      LIMIT 1
    `;
    
    const result = await database.query(query, [idUsuario]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Establece una tarjeta como predeterminada
   */
  static async establecerPredeterminada(idTarjeta: number, idUsuario: number): Promise<void> {
    await database.transaction(async (client) => {
      // Quitar predeterminada de todas las tarjetas del usuario
      await client.query(
        'UPDATE tarjetas_credito SET predeterminada = false WHERE id_usuario = $1',
        [idUsuario]
      );

      // Establecer la nueva predeterminada
      await client.query(
        'UPDATE tarjetas_credito SET predeterminada = true WHERE id_tarjeta = $1 AND id_usuario = $2',
        [idTarjeta, idUsuario]
      );
    });
  }

  /**
   * Quita el flag de predeterminada de todas las tarjetas del usuario
   */
  private static async quitarPredeterminadas(idUsuario: number): Promise<void> {
    const query = `
      UPDATE tarjetas_credito 
      SET predeterminada = false 
      WHERE id_usuario = $1
    `;
    
    await database.query(query, [idUsuario]);
  }

  /**
   * Elimina una tarjeta
   */
  static async eliminar(idTarjeta: number, idUsuario: number): Promise<void> {
    const query = `
      DELETE FROM tarjetas_credito 
      WHERE id_tarjeta = $1 AND id_usuario = $2
    `;
    
    await database.query(query, [idTarjeta, idUsuario]);
  }

  /**
   * Valida que una tarjeta pertenezca a un usuario
   */
  static async validarPropiedad(idTarjeta: number, idUsuario: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM tarjetas_credito 
      WHERE id_tarjeta = $1 AND id_usuario = $2
    `;
    
    const result = await database.query(query, [idTarjeta, idUsuario]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Enmascara el número de tarjeta para mostrar solo los últimos 4 dígitos
   */
  static enmascararNumero(numero: string): string {
    return `****-****-****-${numero.slice(-4)}`;
  }
}