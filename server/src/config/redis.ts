// Redis config
import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  logger.info("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  logger.error(err, "❌ Redis connection error");
});
