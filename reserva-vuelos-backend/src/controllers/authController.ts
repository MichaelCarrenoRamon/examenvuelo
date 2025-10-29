import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario, IUsuarioRegistro } from '../models/Usuario';

/**
 * Controlador de autenticación
 */
export class AuthController {
  /**
   * Registra un nuevo usuario
   */
  static async registrar(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, nombre, apellido, telefono } = req.body;

      // Validaciones básicas
      if (!email || !password || !nombre || !apellido) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos obligatorios deben ser proporcionados'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
        return;
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
        return;
      }

      const usuarioData: IUsuarioRegistro = {
        email,
        password,
        nombre,
        apellido,
        telefono
      };

      const usuario = await Usuario.crear(usuarioData);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id_usuario: usuario.id_usuario,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido
        }
      });
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      if (error.message === 'El email ya está registrado') {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario'
      });
    }
  }

  /**
   * Inicia sesión de un usuario
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validaciones
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
        return;
      }

      // Verificar credenciales
      const passwordValido = await Usuario.verificarPassword(email, password);

      if (!passwordValido) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
        return;
      }

      // Obtener información del usuario
      const usuario = await Usuario.buscarPorEmail(email);

      if (!usuario) {
        res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      if (!usuario.activo) {
        res.status(403).json({
          success: false,
          message: 'Usuario desactivado'
        });
        return;
      }

      // Generar JWT
      const jwtSecret = process.env.JWT_SECRET || 'secreto_por_defecto';
      
      const payload = {
        id_usuario: usuario.id_usuario,
        email: usuario.email
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          usuario: {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión'
      });
    }
  }

  /**
   * Obtiene información del perfil del usuario autenticado
   */
  static async perfil(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const usuario = await Usuario.buscarPorId(idUsuario);

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id_usuario: usuario.id_usuario,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono,
          fecha_registro: usuario.fecha_registro
        }
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil'
      });
    }
  }

  /**
   * Actualiza información del usuario
   */
  static async actualizarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      const { nombre, apellido, telefono, password } = req.body;

      const datosActualizar: Partial<IUsuarioRegistro> = {};

      if (nombre) datosActualizar.nombre = nombre;
      if (apellido) datosActualizar.apellido = apellido;
      if (telefono !== undefined) datosActualizar.telefono = telefono;
      if (password) {
        if (password.length < 6) {
          res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
          });
          return;
        }
        datosActualizar.password = password;
      }

      const usuarioActualizado = await Usuario.actualizar(idUsuario, datosActualizar);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          id_usuario: usuarioActualizado.id_usuario,
          email: usuarioActualizado.email,
          nombre: usuarioActualizado.nombre,
          apellido: usuarioActualizado.apellido,
          telefono: usuarioActualizado.telefono
        }
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil'
      });
    }
  }

  /**
   * Desactiva la cuenta del usuario
   */
  static async desactivarCuenta(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
        return;
      }

      await Usuario.desactivar(idUsuario);

      res.json({
        success: true,
        message: 'Cuenta desactivada exitosamente'
      });
    } catch (error) {
      console.error('Error al desactivar cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar cuenta'
      });
    }
  }
}