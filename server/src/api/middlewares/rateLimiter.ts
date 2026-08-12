// Rate limiter
import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";

const skipPaths = /^\/api\/(?:dashboard|shares\/batch|shares\/[^/]+\/files\/[^/]+\/chunks(?:\/[^/?]+)?)/;

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.NODE_ENV === "development" ? 5000 : 500,
  skip: (req) => req.method === "OPTIONS" || skipPaths.test(req.path),
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
