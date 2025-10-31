import { logger } from '../utils/logger';
import { config } from '../config/environment';

interface Metrics {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  activeConnections: number;
  totalErrors: number;
  bytesReceived: number;
  bytesSent: number;
  uptime: number;
  startTime: Date;
  lastMetricsReset: Date;
}

export class MetricsService {
  private static instance: MetricsService;
  private metrics: Metrics;
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.metrics = this.initializeMetrics();
    if (config.metrics.enabled) {
      this.startMetricsCollection();
    }
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private initializeMetrics(): Metrics {
    return {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      activeConnections: 0,
      totalErrors: 0,
      bytesReceived: 0,
      bytesSent: 0,
      uptime: 0,
      startTime: new Date(),
      lastMetricsReset: new Date(),
    };
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.logMetrics();
    }, config.metrics.interval);
  }

  private logMetrics(): void {
    const metrics = this.getMetrics();
    logger.info('Metrics Report:', {
      activeConnections: metrics.activeConnections,
      totalConnections: metrics.totalConnections,
      successRate: metrics.successRate,
      throughput: metrics.throughput,
    });
  }

  incrementConnections(): void {
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
  }

  decrementConnections(): void {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  incrementSuccessfulConnections(): void {
    this.metrics.successfulConnections++;
  }

  incrementErrors(): void {
    this.metrics.totalErrors++;
    this.metrics.failedConnections++;
  }

  addBytesReceived(bytes: number): void {
    this.metrics.bytesReceived += bytes;
  }

  addBytesSent(bytes: number): void {
    this.metrics.bytesSent += bytes;
  }

  getMetrics() {
    const uptime = process.uptime();
    const successRate = this.metrics.totalConnections > 0
      ? (this.metrics.successfulConnections / this.metrics.totalConnections) * 100
      : 0;
    
    const throughput = {
      received: (this.metrics.bytesReceived / uptime / 1024).toFixed(2) + ' KB/s',
      sent: (this.metrics.bytesSent / uptime / 1024).toFixed(2) + ' KB/s',
    };

    return {
      ...this.metrics,
      uptime,
      successRate: successRate.toFixed(2) + '%',
      throughput,
      memory: process.memoryUsage(),
    };
  }

  reset(): void {
    this.metrics = this.initializeMetrics();
    logger.info('Metrics reset');
  }

  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}