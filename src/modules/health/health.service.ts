import { EventEmitterService, eventEmitterServiceInstance, PrismaService, prismaServiceInstance } from "@/core";

export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  public check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  public async getDetail() {
    const healthCheck = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: "unknown",
      },
    };

    try {
      // Check database connection - using $queryRawUnsafe for MySQL/MariaDB compatibility
      // This is more reliable than template literal syntax with the MariaDB adapter
      await this.prismaService.client.$queryRawUnsafe("SELECT 1");
      healthCheck.services.database = "ok";
    } catch (error: any) {
      healthCheck.status = "degraded";
      healthCheck.services.database = "error";
      // Log the error for debugging
      console.error("Health check database error:", error?.message || error);
      if (error?.code) {
        console.error("Error code:", error.code);
      }
    }

    const statusCode = healthCheck.status === "ok" ? 200 : 503;
    return {
      statusCode,
      healthCheck,
    };
  }
}

export const healthServiceInstance = new HealthService(prismaServiceInstance);
