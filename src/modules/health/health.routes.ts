import { Router } from "express";

import { healthController } from "@modules/health/health.controller";

const router = Router();

router.get("/check", healthController.check);
router.get("/detail", healthController.getDetail);

export default router;
