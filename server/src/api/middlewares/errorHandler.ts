// Error handler
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";

export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public code?: string) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error",
        details: err.errors,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Database Error",
        code: (err as any).code,
      },
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
};
