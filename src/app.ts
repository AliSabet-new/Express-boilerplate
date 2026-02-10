// 3rd-party lib
import cors from "cors";
import morgan from "morgan";
import express, { json } from "express";

// local modules
import rootRouter from "@/routes";
import { globalErrorHandler } from "@/core/middlewares/error/global-error-handler";
import path from "path";

// app
const app = express();
app.disable("x-powered-by");

// Global middlewares
app.use(json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/storage", express.static(path.join(__dirname, "../storage")));
app.use("/api", rootRouter);

// Global Error Handler ------ Latest Middleware
app.use(globalErrorHandler);

export default app;
