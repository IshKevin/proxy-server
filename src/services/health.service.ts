import express, { Application } from 'express';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';
import { errorMiddleware } from '../middleware/error.middleware';
import { loggingMiddleware } from '../middleware/logging.middleware';
import { corsMiddleware } from '../middleware/cors.middleware';
import { APP_NAME, APP_VERSION, HEALTH_CHECK_PATHS, HTTP_STATUS } from '../config/constants';

export class HealthServer {
  private app: Application;
  private server: Server | null = null;
  private metrics: MetricsService;

  constructor(private port: number) {
    this.app = express();
    this.metrics = MetricsService.getInstance();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(corsMiddleware);
    this.app.use(express.json());
    this.app.use(loggingMiddleware);
  }

  private setupRoutes(): void {
    this.app.get(HEALTH_CHECK_PATHS.ROOT, (req, res) => {
      res.json({
        service: APP_NAME,
        version: APP_VERSION,
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get(HEALTH_CHECK_PATHS.HEALTH, (req, res) => {
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
      };
      res.json(health);
    });

    this.app.get(HEALTH_CHECK_PATHS.READY, (req, res) => {
      res.status(HTTP_STATUS.OK).json({ ready: true });
    });

    this.app.get(HEALTH_CHECK_PATHS.LIVE, (req, res) => {
      res.status(HTTP_STATUS.OK).json({ alive: true });
    });

    this.app.get(HEALTH_CHECK_PATHS.METRICS, (req, res) => {
      const metrics = this.metrics.getMetrics();
      res.json(metrics);
    });
    this.app.use(errorMiddleware);
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`Health check server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      logger.info('Closing health check server...');
      this.server.close(() => {
        logger.info('Health check server closed');
        resolve();
      });
    });
  }
}