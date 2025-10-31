import { logger } from './logger';
import { MetricsService } from '../services/metrics.service';

interface ShutdownAware {
  stop(): Promise<void>;
}

export function gracefulShutdown(servers: ShutdownAware[]): void {
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown...`);

    try {
      MetricsService.getInstance().stop();
      await Promise.all(servers.map(server => server.stop()));

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}