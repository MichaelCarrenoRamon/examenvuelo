import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Clase para gestionar la conexión y operaciones con PostgreSQL
 */
class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'reservavuelos',
      user: process.env.DB_USER || 'michaelcarrenoramon',
      password: process.env.DB_PASSWORD || '',
      max: 20, // Máximo de conexiones en el pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Manejo de errores del pool
    this.pool.on('error', (err: Error) => {
      console.error('Error inesperado en el pool de base de datos:', err);
    });

    this.testConnection();
  }

  /**
   * Patrón Singleton para obtener la instancia única
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Prueba la conexión a la base de datos
   */
  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('✓ Conexión exitosa a PostgreSQL');
      client.release();
    } catch (error) {
      console.error('✗ Error al conectar con PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Ejecuta una consulta SQL
   */
  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query ejecutada:', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Error en query:', { text, error });
      throw error;
    }
  }

  /**
   * Obtiene un cliente del pool para transacciones
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Ejecuta una transacción
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en transacción, ROLLBACK ejecutado:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cierra todas las conexiones del pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Pool de conexiones cerrado');
  }

  /**
   * Obtiene el pool (para casos especiales)
   */
  public getPool(): Pool {
    return this.pool;
  }
}

export default Database.getInstance();