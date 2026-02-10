import type { JWTPayload } from "jose";
import type { Socket } from "socket.io";

export interface GatewayUser {
  socketId: string;
  userId: string; // Stored as string for socket.io compatibility, but represents User["id"]
  connectedAt: Date;
  lastPing: Date;
}

export interface TokenPayload extends JWTPayload {
  userId: string; // Serialized from User["id"] (BigInt) to string for JWT compatibility
  role?: string;
  email?: string;
  [key: string]: any;
}

export interface GatewayAuthConfig {
  jwtSecret: string;
  tokenExtractor?: (socket: Socket) => string | null;
  payloadValidator?: (payload: TokenPayload) => boolean;
}

export interface GatewaySocketData {
  userId: string;
  role?: string;
  email?: string;
  [key: string]: any;
}
