import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Interface para el payload del JWT
 */
export interface IJwtPayload {
  id_usuario: number;
  email: string;
}

/**
 * Extender la interface Request de Express para incluir usuario
 */
declare global {
  namespace Express {
    interface Request {
      usuario?: IJwtPayload;
    }
  }
}

/**
 * Middleware para verificar autenticación con JWT
 */
export const verificarToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
      return;
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar el token
    const jwtSecret = process.env.JWT_SECRET || 'secreto_por_defecto';
    const decoded = jwt.verify(token, jwtSecret) as IJwtPayload;

    // Agregar información del usuario al request
    req.usuario = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export const verificarTokenOpcional = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'secreto_por_defecto';
      const decoded = jwt.verify(token, jwtSecret) as IJwtPayload;
      req.usuario = decoded;
    }

    next();
  } catch (error) {
    // Si hay error, simplemente continuar sin usuario
    next();
  }
};