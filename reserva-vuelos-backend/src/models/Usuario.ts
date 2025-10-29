import database from '../config/database';
import bcrypt from 'bcrypt';

/**
 * Interface para el objeto Usuario
 */
export interface IUsuario {
  id_usuario?: number;
  email: string;
  password_hash?: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fecha_registro?: Date;
  activo?: boolean;
}

/**
 * Interface para registro de usuario
 */
export interface IUsuarioRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

/**
 * Clase modelo Usuario
 */
export class Usuario {
  /**
   * Crea un nuevo usuario en la base de datos
   */
  static async crear(usuario: IUsuarioRegistro): Promise<IUsuario> {
    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(usuario.password, saltRounds);

    const query = `
      INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_usuario, email, nombre, apellido, telefono, fecha_registro, activo
    `;

    const values = [
      usuario.email,
      passwordHash,
      usuario.nombre,
      usuario.apellido,
      usuario.telefono || null
    ];

    try {
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Código de error para violación de restricción única
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Busca un usuario por email
   */
  static async buscarPorEmail(email: string): Promise<IUsuario | null> {
    const query = `
      SELECT id_usuario, email, password_hash, nombre, apellido, telefono, fecha_registro, activo
      FROM usuarios
      WHERE email = $1
    `;

    const result = await database.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Busca un usuario por ID
   */
  static async buscarPorId(id: number): Promise<IUsuario | null> {
    const query = `
      SELECT id_usuario, email, nombre, apellido, telefono, fecha_registro, activo
      FROM usuarios
      WHERE id_usuario = $1
    `;

    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Verifica la contraseña de un usuario
   */
  static async verificarPassword(email: string, password: string): Promise<boolean> {
    const usuario = await this.buscarPorEmail(email);
    
    if (!usuario || !usuario.password_hash) {
      return false;
    }

    return await bcrypt.compare(password, usuario.password_hash);
  }

  /**
   * Actualiza la información de un usuario
   */
  static async actualizar(id: number, datos: Partial<IUsuarioRegistro>): Promise<IUsuario> {
    const campos: string[] = [];
    const valores: any[] = [];
    let contador = 1;

    if (datos.nombre) {
      campos.push(`nombre = $${contador++}`);
      valores.push(datos.nombre);
    }
    if (datos.apellido) {
      campos.push(`apellido = $${contador++}`);
      valores.push(datos.apellido);
    }
    if (datos.telefono !== undefined) {
      campos.push(`telefono = $${contador++}`);
      valores.push(datos.telefono);
    }
    if (datos.password) {
      const passwordHash = await bcrypt.hash(datos.password, 10);
      campos.push(`password_hash = $${contador++}`);
      valores.push(passwordHash);
    }

    valores.push(id);

    const query = `
      UPDATE usuarios
      SET ${campos.join(', ')}
      WHERE id_usuario = $${contador}
      RETURNING id_usuario, email, nombre, apellido, telefono, fecha_registro, activo
    `;

    const result = await database.query(query, valores);
    
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return result.rows[0];
  }

  /**
   * Desactiva un usuario (soft delete)
   */
  static async desactivar(id: number): Promise<void> {
    const query = `
      UPDATE usuarios
      SET activo = false
      WHERE id_usuario = $1
    `;

    await database.query(query, [id]);
  }

  /**
   * Elimina un usuario permanentemente
   */
  static async eliminar(id: number): Promise<void> {
    const query = `DELETE FROM usuarios WHERE id_usuario = $1`;
    await database.query(query, [id]);
  }

  /**
   * Obtiene todas las tarjetas de crédito de un usuario
   */
  static async obtenerTarjetas(idUsuario: number): Promise<any[]> {
    const query = `
      SELECT id_tarjeta, numero_tarjeta, nombre_titular, fecha_expiracion, 
             tipo_tarjeta, predeterminada, fecha_registro
      FROM tarjetas_credito
      WHERE id_usuario = $1
      ORDER BY predeterminada DESC, fecha_registro DESC
    `;

    const result = await database.query(query, [idUsuario]);
    return result.rows;
  }
}