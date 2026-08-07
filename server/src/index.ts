// Entry point
import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { redis } from "./config/redis.js";
import { logger } from "./utils/logger.js";
import { initializeSocket } from "./socket/index.js";

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    const io = initializeSocket(httpServer);

    // Make io accessible globally if needed, or pass it down via req
    app.set("io", io);

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      httpServer.close(() => {
        logger.info("HTTP server closed");
      });
      await disconnectDB();
      redis.disconnect();
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
};

startServer();
