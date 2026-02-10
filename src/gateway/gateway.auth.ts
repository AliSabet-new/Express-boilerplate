import type { Socket } from "socket.io";
import { jwtVerify } from "jose";

import type {
  GatewayAuthConfig,
  TokenPayload,
} from "@/gateway/types";

export class GatewayAuth {
  private jwtSecret: string;
  private tokenExtractor: (socket: Socket) => string | null;
  private payloadValidator: (payload: TokenPayload) => boolean;

  constructor(config: GatewayAuthConfig) {
    if (!config.jwtSecret) {
      throw new Error(
        "JWT_SECRET is required for WebSocket gateway authentication. Set it in your environment variables."
      );
    }

    this.jwtSecret = config.jwtSecret;
    this.tokenExtractor =
      config.tokenExtractor || this.defaultTokenExtractor.bind(this);
    this.payloadValidator =
      config.payloadValidator || this.defaultPayloadValidator.bind(this);
  }

  private defaultTokenExtractor(socket: Socket): string | null {
    if (socket.handshake.auth?.token) {
      return socket.handshake.auth.token;
    }

    const authHeader = socket.handshake.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    if (socket.handshake.query?.token) {
      return socket.handshake.query.token as string;
    }

    return null;
  }

  private defaultPayloadValidator(payload: TokenPayload): boolean {
    return !!payload.userId;
  }

  private async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const secret = new TextEncoder().encode(this.jwtSecret);
      const { payload } = await jwtVerify(token, secret);

      return payload as TokenPayload;
    } catch (error) {
      throw new Error("توکن نامعتبر یا منقضی شده است.");
    }
  }

  createMiddleware() {
    return async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = this.tokenExtractor(socket);

        if (!token) {
          return next(
            new Error("احراز هویت الزامی است. لطفاً توکن خود را ارسال کنید.")
          );
        }

        const payload = await this.verifyToken(token);

        if (!this.payloadValidator(payload)) {
          return next(new Error("اطلاعات توکن نامعتبر است."));
        }

        socket.data.userId = payload.userId;
        socket.data.role = payload.role;
        socket.data.email = payload.email;

        Object.keys(payload).forEach((key) => {
          if (!["userId", "role", "email", "iat", "exp", "nbf"].includes(key)) {
            socket.data[key] = payload[key];
          }
        });

        console.log(
          `✓ WebSocket authenticated: ${socket.id} - User: ${payload.userId}`
        );

        next();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "خطا در احراز هویت رخ داده است.";
        console.error(`✗ WebSocket authentication failed: ${socket.id}`, message);
        next(new Error(message));
      }
    };
  }

  requireAuth(
    handler: (socket: Socket, ...args: any[]) => void | Promise<void>
  ) {
    return async (socket: Socket, ...args: any[]) => {
      if (!socket.data.userId) {
        socket.emit("error", {
          message: "برای انجام این عملیات باید احراز هویت شوید.",
        });
        return;
      }

      return handler(socket, ...args);
    };
  }

  requireRole(
    roles: string[],
    handler: (socket: Socket, ...args: any[]) => void | Promise<void>
  ) {
    return async (socket: Socket, ...args: any[]) => {
      if (!socket.data.userId) {
        socket.emit("error", {
          message: "برای انجام این عملیات باید احراز هویت شوید.",
        });
        return;
      }

      if (!socket.data.role || !roles.includes(socket.data.role)) {
        socket.emit("error", {
          message: "شما اجازه انجام این عملیات را ندارید.",
        });
        return;
      }

      return handler(socket, ...args);
    };
  }
}
