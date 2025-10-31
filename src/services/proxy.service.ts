import net from 'net';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { MetricsService } from './metrics.service';
import { config } from '../config/environment';

export class ProxyServer extends EventEmitter {
  private server: net.Server | null = null;
  private activeConnections = new Set<net.Socket>();
  private metrics: MetricsService;

  constructor(
    private port: number,
    private targetHost: string,
    private targetPort: number
  ) {
    super();
    this.metrics = MetricsService.getInstance();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((clientSocket) => {
        this.handleConnection(clientSocket);
      });

      this.server.on('error', (error) => {
        logger.error('Proxy server error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        logger.info(`Proxy server listening on port ${this.port}`);
        logger.info(`Forwarding to ${this.targetHost}:${this.targetPort}`);
        resolve();
      });
    });
  }

  private handleConnection(clientSocket: net.Socket): void {
    const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
    logger.debug(`New connection from ${clientId}`);
    
    this.metrics.incrementConnections();
    this.activeConnections.add(clientSocket);
    const serverSocket = net.connect(
      {
        host: this.targetHost,
        port: this.targetPort,
        family: 6,
      },
      () => {
        logger.debug(`Connected to target for client ${clientId}`);
        this.metrics.incrementSuccessfulConnections();
      }
    );
    clientSocket.setTimeout(config.connection.idleTimeout);
    serverSocket.setTimeout(config.connection.idleTimeout);
    clientSocket.on('error', (err) => {
      logger.error(`Client error (${clientId}):`, err.message);
      this.metrics.incrementErrors();
      this.cleanup(clientSocket, serverSocket);
    });

    serverSocket.on('error', (err) => {
      logger.error(`Server error (${clientId}):`, err.message);
      this.metrics.incrementErrors();
      this.cleanup(clientSocket, serverSocket);
    });
    clientSocket.on('timeout', () => {
      logger.debug(`Client timeout (${clientId})`);
      this.cleanup(clientSocket, serverSocket);
    });

    serverSocket.on('timeout', () => {
      logger.debug(`Server timeout (${clientId})`);
      this.cleanup(clientSocket, serverSocket);
    });
    clientSocket.pipe(serverSocket);
    serverSocket.pipe(clientSocket);
    let bytesReceived = 0;
    let bytesSent = 0;

    clientSocket.on('data', (chunk) => {
      bytesReceived += chunk.length;
      this.metrics.addBytesReceived(chunk.length);
    });

    serverSocket.on('data', (chunk) => {
      bytesSent += chunk.length;
      this.metrics.addBytesSent(chunk.length);
    });

    // Connection close
    clientSocket.on('close', () => {
      logger.debug(`Client disconnected (${clientId}), bytes: ${bytesReceived}/${bytesSent}`);
      this.cleanup(clientSocket, serverSocket);
    });

    serverSocket.on('close', () => {
      logger.debug(`Server disconnected (${clientId})`);
      this.cleanup(clientSocket, serverSocket);
    });
  }

  private cleanup(clientSocket: net.Socket, serverSocket: net.Socket): void {
    this.activeConnections.delete(clientSocket);
    this.metrics.decrementConnections();
    
    if (!clientSocket.destroyed) clientSocket.destroy();
    if (!serverSocket.destroyed) serverSocket.destroy();
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      logger.info('Closing proxy server...');
      this.activeConnections.forEach(socket => {
        socket.destroy();
      });
      
      this.server.close(() => {
        logger.info('Proxy server closed');
        resolve();
      });
    });
  }

  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }
}