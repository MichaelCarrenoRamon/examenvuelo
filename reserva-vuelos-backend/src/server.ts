import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import database from './config/database';

// Importar rutas
import authRoutes from './routes/authRoutes';
import vueloRoutes from './routes/vueloRoutes';
import reservaRoutes from './routes/reservaRoutes';
import billeteRoutes from './routes/billeteRoutes';

// Cargar variables de entorno
dotenv.config();

/**
 * Clase principal del servidor
 */
class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Inicializa los middlewares
   */
  private initializeMiddlewares(): void {
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logger simple
    this.app.use((req: Request, res: Response, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Inicializa las rutas
   */
  private initializeRoutes(): void {
    // Ruta de prueba
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'API de Reserva de Vuelos - Sistema funcionando correctamente',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          vuelos: '/api/vuelos',
          reservas: '/api/reservas',
          billetes: '/api/billetes'
        }
      });
    });

    // Rutas de la API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/vuelos', vueloRoutes);
    this.app.use('/api/reservas', reservaRoutes);
    this.app.use('/api/billetes', billeteRoutes);

    // Ruta 404 - Debe ser la última
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
      });
    });
  }

  /**
   * Manejo global de errores
   */
  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('Error no manejado:', err);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }

  /**
   * Inicia el servidor
   */
  public start(): void {
    this.app.listen(this.port, () => {
      console.log('='.repeat(50));
      console.log('🚀 SERVIDOR INICIADO');
      console.log('='.repeat(50));
      console.log(`📍 Puerto: ${this.port}`);
      console.log(`🌐 URL: http://localhost:${this.port}`);
      console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Cierra el servidor de manera controlada
   */
  private async shutdown(): Promise<void> {
    console.log('\n🛑 Cerrando servidor...');
    
    try {
      await database.close();
      console.log('✓ Conexiones de base de datos cerradas');
      process.exit(0);
    } catch (error) {
      console.error('✗ Error al cerrar servidor:', error);
      process.exit(1);
    }
  }
}

// Crear e iniciar el servidor
const server = new Server();
server.start();