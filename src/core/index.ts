// src/core/index.ts

// Base Service Class
export { BaseService } from "@/core/base-service";

// Middlewares (that don't depend on modules)
export { globalErrorHandler } from "@/core/middlewares/error/global-error-handler";
export { validate } from "@/core/middlewares/validate/request-validate";
export type {
  ValidateOptions,
  RequestHandlerValidate,
} from "@/core/middlewares/validate/request-validate-types";
export { default as uploadMiddlewareInstance } from "@/core/middlewares/upload/ulpload.middleware";
export { authMiddlewareInstance } from "@/core/middlewares/auth/auth.middleware";

// Services (that don't depend on modules)
export {
  prismaServiceInstance,
  PrismaService,
} from "@/core/services/db/prisma.service";
export {
  EventEmitterService,
  eventEmitterServiceInstance,
} from "@/core/services/event-emitter/event-emitter.service";
export type { Listener } from "@/core/services/event-emitter/event-emitter.service";
export type { AppEventMap } from "@/core/services/event-emitter/event-emitter.types";
// ⚠️ prisma is NOT exported here - import directly to avoid circular deps

// Utils (utilities and helpers)
export { catchAsync } from "@/core/utils/catch-async";

// JWT Utils
export { JwtUtil, jwtUtilInstance } from "@/core/utils/jwt/jwt.utils";
export type {
  Payload,
  SessionPayload,
  TokenKind,
  AccessPayload,
  RefreshPayload,
  OtpPayload,
  AnyPayload,
  OtpPurpose,
} from "@/core/utils/jwt/jwt.types";

// Api
export {
  ApiResponse,
  AppError,
  formatPrismaError,
} from "@/core/api/api-response";
