// src/index.ts
import { config } from './config/environment';
import { logger } from './utils/logger';
import { ProxyServer } from './services/proxy.service';
import { HealthServer } from './services/health.service';
import { MetricsService } from './services/metrics.service';
import { gracefulShutdown } from './utils/shutdown';

async function bootstrap() {
  try {
    logger.info('Starting PostgreSQL Proxy Server...');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Target: ${config.supabase.host}:${config.supabase.port}`);
    const metrics = MetricsService.getInstance();
    const healthServer = new HealthServer(config.http.port);
    await healthServer.start();
    const proxyServer = new ProxyServer(
      config.proxy.port,
      config.supabase.host,
      config.supabase.port
    );
    await proxyServer.start();
    logger.info('All services started successfully');
    gracefulShutdown([healthServer, proxyServer]);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();