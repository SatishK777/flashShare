// Rate limiter
import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";

const transferChunkPath = /^\/api\/shares\/[^/]+\/files\/[^/]+\/chunks(?:\/[^/?]+)?/;

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === "development" ? Math.max(env.RATE_LIMIT_MAX, 1000) : env.RATE_LIMIT_MAX,
  skip: (req) => req.method === "OPTIONS" || transferChunkPath.test(req.path),
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
