import { catchAsync } from "@/core";

import { healthServiceInstance } from "@/modules/health/health.service";

class HealthController {
  constructor() {
    // Use the singleton instance that has prismaService properly injected
  }

  check = catchAsync(async (req, res, next) => {
    const details = healthServiceInstance.check();

    res.status(details.status === "ok" ? 200 : 503).json(details);
  });

  getDetail = catchAsync(async (req, res, next) => {
    const details = await healthServiceInstance.getDetail();

    res.status(details.statusCode).json(details.healthCheck);
  });
}

export const healthController = new HealthController();
