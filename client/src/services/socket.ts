import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private serverTimeOffset: number = 0;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Update server time offset for synchronization
   */
  updateTimeOffset(serverTime: number): void {
    const clientTime = Date.now();
    this.serverTimeOffset = serverTime - clientTime;
  }

  /**
   * Get current server time (synchronized)
   */
  getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Get time offset from server
   */
  getTimeOffset(): number {
    return this.serverTimeOffset;
  }
}

export const socketService = new SocketService();
