import type { ErrorRequestHandler } from "express";

import { AppError, ApiResponse, formatPrismaError } from "@/core/api/api-response";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ApiResponse.fromError(err));
    return; // Return void explicitly here
  }

  // Log the error for debugging
  console.error("Unhandled error:", err);
  console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");

  // Try to format Prisma errors
  if (err && typeof err === "object") {
    const formattedError = formatPrismaError(err);
    if (formattedError instanceof AppError) {
      res.status(formattedError.statusCode).json(ApiResponse.fromError(formattedError));
      return;
    }
  }

  res
    .status(500)
    .json(
      ApiResponse.error("خطای سرور رخ داده است. لطفاً بعداً دوباره تلاش کنید.")
    );
};
