// local modules
import { ErrorDefinitions } from "@/common";
import { catchAsync } from "@/core/utils/catch-async";
import { AppError } from "@/core/api/api-response";
import { prismaServiceInstance, PrismaService } from "@/core/services/db/prisma.service";
import { jwtUtilInstance, type JwtUtil } from "@/core/utils/jwt/jwt.utils";

class AuthMiddleware {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtUtil: JwtUtil,
  ) {}

  authenticate = catchAsync(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(new AppError(...ErrorDefinitions.Auth.Unauthorized));
    }

    const sessionToken = authorization.split(" ")[1];

    const token = await this.jwtUtil.verifyAccess(sessionToken);

    if ("error" in token) {
      return next(new AppError(...ErrorDefinitions.Auth.TokenInvalid));
    }

    // Here Goes verification of the token

    next();
  });

  authorize = (roles: string[] | string) =>
    catchAsync(async (req, res, next) => {
      if (!req.role) return next(new AppError(...ErrorDefinitions.Auth.Unauthorized));
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(req.role)) return next(new AppError(...ErrorDefinitions.Auth.Forbidden));

      next();
    });

  optionalAuthenticate = catchAsync(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer")) {
      return next();
    } else {
      this.authenticate(req, res, next);
    }
  });
}

export const authMiddlewareInstance = new AuthMiddleware(prismaServiceInstance, jwtUtilInstance);
