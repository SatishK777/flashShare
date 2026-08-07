// Health routes
import { Router } from "express";
import { prisma } from "../../config/database.js";
import { redis } from "../../config/redis.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

router.get("/ready", async (req, res, next) => {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis
    await redis.ping();

    res.json({
      status: "ok",
      database: "connected",
      redis: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Service Unavailable",
    });
  }
});

export default router;
