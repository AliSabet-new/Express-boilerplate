import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

import { JWT_SECRET } from "@/common";
import { GatewayAuth } from "@/gateway/gateway.auth";
import type { GatewayUser } from "@/gateway/types";

export class WebSocketGateway {
  private io: Server | null = null;
  private connectedUsers: Map<string, GatewayUser> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private gatewayAuth: GatewayAuth;
  private readonly STALE_CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  constructor() {
    const jwtSecret = JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is required for WebSocket gateway. Set it in your environment variables.");
    }

    this.gatewayAuth = new GatewayAuth({ jwtSecret });
  }

  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use(this.gatewayAuth.createMiddleware());

    this.setupEventHandlers();
    this.startCleanupTask();
    console.log("✓ WebSocket gateway initialized with authentication");
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      const userId = socket.data.userId as string;

      console.log(`✓ Client connected: ${socket.id} - User: ${userId}`);

      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        userId: userId,
        connectedAt: new Date(),
        lastPing: new Date(),
      });

      socket.join(`user:${userId}`);
      console.log(`✓ User ${userId} auto-joined room on socket ${socket.id}`);

      socket.onAny(() => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.lastPing = new Date();
        }
      });

      socket.on("join-room", (room: string) => {
        socket.join(room);
        console.log(`✓ Socket ${socket.id} joined room: ${room}`);
      });

      socket.on("leave-room", (room: string) => {
        socket.leave(room);
        console.log(`✓ Socket ${socket.id} left room: ${room}`);
      });

      socket.on("disconnect", (reason: string) => {
        this.handleDisconnect(socket.id, reason);
      });

      socket.on("error", (error: Error) => {
        console.error(`✗ Socket error for ${socket.id}:`, error);
        this.handleDisconnect(socket.id, "error");
      });
    });

    this.io.engine.on("connection_error", (err: any) => {
      console.error("✗ Connection error:", err);
    });
  }

  private handleDisconnect(socketId: string, reason: string): void {
    const user = this.connectedUsers.get(socketId);
    const deleted = this.connectedUsers.delete(socketId);

    if (deleted) {
      console.log(
        `✗ Client disconnected: ${socketId} (reason: ${reason})${user?.userId ? ` - User: ${user.userId}` : ""}`,
      );
    } else {
      console.warn(`⚠ Attempted to disconnect non-existent socket: ${socketId}`);
    }
  }

  private startCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, this.CLEANUP_INTERVAL);

    console.log(`✓ Gateway cleanup task started (runs every ${this.CLEANUP_INTERVAL / 1000}s)`);
  }

  private async cleanupStaleConnections(): Promise<void> {
    if (!this.io) return;

    const now = Date.now();
    const staleSocketIds: string[] = [];

    for (const [socketId, user] of this.connectedUsers.entries()) {
      const lastActivity = user.lastPing?.getTime() || user.connectedAt.getTime();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > this.STALE_CONNECTION_TIMEOUT) {
        staleSocketIds.push(socketId);
      }
    }

    if (staleSocketIds.length > 0) {
      const actualSockets = await this.io.fetchSockets();
      const actualSocketIds = new Set(actualSockets.map((s) => s.id));

      let cleanedCount = 0;

      for (const socketId of staleSocketIds) {
        if (!actualSocketIds.has(socketId)) {
          this.connectedUsers.delete(socketId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} stale connection(s) from gateway`);
      }
    }

    const actualSockets = await this.io.fetchSockets();
    const actualSocketIds = new Set(actualSockets.map((s) => s.id));
    let orphanedCount = 0;

    for (const socketId of this.connectedUsers.keys()) {
      if (!actualSocketIds.has(socketId)) {
        this.connectedUsers.delete(socketId);
        orphanedCount++;
      }
    }

    if (orphanedCount > 0) {
      console.log(`🧹 Removed ${orphanedCount} orphaned socket(s) from gateway`);
    }
  }

  server(): Server {
    if (!this.io) {
      throw new Error("WebSocket gateway not initialized. Call initialize() first.");
    }
    return this.io;
  }

  emit(event: string, data: unknown): void {
    this.ensureInitialized();
    this.io!.emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.ensureInitialized();
    this.io!.to(room).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.emitToRoom(`user:${userId}`, event, data);
  }

  emitToSocket(socketId: string, event: string, data: unknown): void {
    this.ensureInitialized();
    this.io!.to(socketId).emit(event, data);
  }

  async connectedSockets(): Promise<string[]> {
    this.ensureInitialized();
    const sockets = await this.io!.fetchSockets();
    return sockets.map((s) => s.id);
  }

  async socketsInRoom(room: string): Promise<string[]> {
    this.ensureInitialized();
    const sockets = await this.io!.in(room).fetchSockets();
    return sockets.map((s) => s.id);
  }

  connectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  connectedUsersList(): GatewayUser[] {
    return Array.from(this.connectedUsers.values());
  }

  isUserOnline(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some((user) => user.userId === userId);
  }

  userSockets(userId: string): string[] {
    return Array.from(this.connectedUsers.entries())
      .filter(([_, user]) => user.userId === userId)
      .map(([socketId]) => socketId);
  }

  disconnectSocket(socketId: string): void {
    this.ensureInitialized();
    const socket = this.io!.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      this.connectedUsers.delete(socketId);
    }
  }

  disconnectUser(userId: string): void {
    this.ensureInitialized();

    const userSocketIds = this.userSockets(userId);

    this.io!.in(`user:${userId}`).disconnectSockets(true);

    userSocketIds.forEach((socketId) => {
      this.connectedUsers.delete(socketId);
    });
  }

  private ensureInitialized(): void {
    if (!this.io) {
      throw new Error("WebSocket gateway not initialized. Call initialize() first.");
    }
  }

  async shutdown(): Promise<void> {
    console.log("🔌 Shutting down WebSocket gateway...");

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("✓ Cleanup task stopped");
    }

    if (this.io) {
      const sockets = await this.io.fetchSockets();
      console.log(`✓ Disconnecting ${sockets.length} active socket(s)...`);

      for (const socket of sockets) {
        socket.disconnect(true);
      }

      this.io.close();
      console.log("✓ WebSocket gateway closed");
    }

    this.connectedUsers.clear();
    console.log("✓ Gateway users map cleared");

    this.io = null;
  }

  memoryStats(): {
    connectedUsersInMap: number;
    actualConnectedSockets: number;
    mapSizeBytes: number;
  } {
    const mapSizeBytes = JSON.stringify(Array.from(this.connectedUsers.entries())).length;

    return {
      connectedUsersInMap: this.connectedUsers.size,
      actualConnectedSockets: this.io?.sockets.sockets.size || 0,
      mapSizeBytes,
    };
  }

  auth(): GatewayAuth {
    return this.gatewayAuth;
  }
}

export const webSocketGatewayInstance = new WebSocketGateway();
