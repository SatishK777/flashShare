// Database config
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

// Ensure BigInts are stringified as JSON natively
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

prisma.$on("error", (e: { message: string; target: string }) => {
  logger.error(e, "Prisma Error");
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected successfully");
  } catch (error: unknown) {
    logger.error(error, "❌ Database connection failed");
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info("Database disconnected");
};
