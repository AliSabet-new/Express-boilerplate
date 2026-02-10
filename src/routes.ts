// 3rd-party lib
import { Router } from "express";

// local modules
import { healthRouter } from "@modules/health";


// Root Router
const rootRouter = Router();

// Routes
rootRouter.use("/health", healthRouter);


// Export
export default rootRouter;
